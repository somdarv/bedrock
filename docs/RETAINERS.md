# Retainers

> Where recurring service revenue fits in the money model. Read alongside
> [RECEIVABLES-MILESTONES.md](./RECEIVABLES-MILESTONES.md) and [INVOICES.md](./INVOICES.md).
> **Status:** design, nothing built. **Date:** 2026-08-12.

## The gap

Bedrock can bill two things: **project work** (a work package, priced once, finished once) and
**infrastructure** (a fee attached to a client asset, recurring on that asset's expiry date).

A retainer is neither. In the operator's words: **they pay us to keep us working for them.** It
buys our ongoing attention, not a named deliverable and not a specific asset. It recurs on **the
calendar**, not on a project plan and not on a domain's expiry. It never completes, so it has no
total and no balance that reaches zero.

That definition is deliberately broad, and it decides two things later in this document: the
invoice line describes a period of retained service rather than itemising what was done in it,
and there is nothing to meter, so nothing meters it.

It is also the only revenue in the business that is knowable in advance, and that number appears
nowhere in the system today.

## Where it fits

The money model already has three layers, and they are cleanly separated:

| Layer | What it answers | Today |
|---|---|---|
| **1. Source** | Why money is owed | `WorkPackage` (a project) · `ClientAsset` (a renewal) |
| **2. Obligation** | Owed, not yet asked for | `infra_charges` |
| **3. The ask** | The document, pay page, receipt | `Invoice` |

Layers 2 and 3 are already generic. An `InfraCharge` is not really an infrastructure concept: it
is "a thing this client owes that has not been put on a document yet". An `Invoice` cares only
about lines, a currency and a client. Neither knows or needs to know what produced it.

**So a retainer is a new source at layer 1, feeding the layers that already exist.** It is a
clock. It generates a charge per period, and from that point the existing pipeline carries it:
charge to invoice to pay page to Paystack to receipt to the verification registry. None of that
is rebuilt.

```
WorkPackage ─┐
ClientAsset ─┼─▶  charge  ─▶  Invoice  ─▶  pay page ─▶ payment ─▶ receipt
Retainer   ─┘   (owed, not         (asked)
                 yet asked)
```

### Why not a work package with a "retainer" delivery mode

Tempting, because packages already hold money, a client and a payment history. It breaks on the
lifecycle. A package runs `Draft → Sent → AwaitingDeposit → InProgress → Review →
AwaitingFinalPayment → Closed`, it has two gates, deliverables, an effective total and a balance
that trends to zero. A retainer has no deposit, no delivery, no final payment and no end.

Modelling it as a package would mean a job that is permanently "in progress" and permanently
owing money. That corrupts the Receivables buckets (a retainer would sit in "work underway"
forever, inflating the committed total every month) and the portal narrative with it. The
lifecycle is the spine of a package, and a retainer has no use for any of it.

### Why not a client asset with a renewal fee

Closer, and it is where the recurrence engine already lives, but assets are **monitored things**:
a domain, a certificate, a site, disk on a host. Their expiry comes from RDAP, a TLS handshake or
a control panel, and `renewal_fee` means "what it costs to renew this object". A retainer has
nothing to probe and renews nothing. It would be a fake asset carrying a real fee, permanently
`unknown` on the infrastructure dashboard.

## The model

```
retainers
  id               ulid pk
  client_id        ulid fk -> clients (cascade)
  title            string          -- "Website care plan"
  memo             text null       -- what it entitles them to; prints on the invoice
  amount           decimal(12,2)
  currency         string          -- GHS | USD (reuses the invoice FX machinery as-is)
  interval         string          -- monthly | quarterly | yearly
  starts_on        date
  ends_on          date null       -- null = open-ended
  status           string          -- active | paused | ended
  paused_reason    string null     -- set to 'unpaid' by the auto-pause rule, so the alert
                                   --   and the resume button can explain themselves
  bill_lead_days   int default 7   -- raise the charge this far before the period starts
  next_bill_on     date            -- the cursor: the next period start to bill
  auto_issue       bool default false
  auto_send        bool default false
  timestamps
```

And on the obligation layer, two columns:

```
charges  (today's infra_charges)
  + retainer_id    ulid fk -> retainers, nullable
  + kind           string  -- infrastructure | retainer
```

`billed_for_date` already exists and is already the right idempotency key. For infrastructure it
holds the expiry being renewed; for a retainer it holds **the period being billed**. The fact that
the existing column means the correct thing without being touched is the strongest evidence that
this layer generalises rather than being stretched.

### Rename infra_charges to charges

The table stops being about infrastructure the moment retainers write to it. `InfraCharge` becomes
`Charge` with a `kind`, and the controller, the outstanding endpoint and the frontend types follow.
It is roughly ten files and a `Schema::rename`, on a table holding a handful of rows. Do it as the
first commit of the work, before there are two names for one idea and a permanent explanation to
maintain.

## The clock

`retainers:bill`, daily, beside `infra:bill` in `routes/console.php`. For every `active` retainer
where `next_bill_on - bill_lead_days <= today`:

1. Raise a charge for the period, `billed_for_date = next_bill_on`, skipping it if one exists.
2. Compose a draft invoice from that charge, sweeping in anything else the client already owes.
3. Advance `next_bill_on` by the interval.
4. Stop at `ends_on`, and set the retainer `ended`.

Then, whatever it billed: any active retainer carrying **two periods still unpaid** is set
`paused` with `paused_reason = 'unpaid'` and raises an admin-lane alert. The clock stops rather
than piling up a third document nobody is reading.

Idempotent per period, so a missed day catches up and a double run does nothing. Same shape as
`BillInfraRenewals`, which is deliberate: two generators, one contract.

**Cycle dates are per retainer**, anchored on `starts_on`, with no proration. A client who should
bill on the 1st is a retainer that starts on the 1st. Everything raised lands in the same drafts
queue regardless, so the operator's month is one review session either way, and the alternative
(a house billing day plus part-month arithmetic) buys nothing at this size.

### One client, one month, one invoice

This is why a retainer raises a **charge** rather than an invoice directly. A client on a care plan
who also has a domain coming up for renewal should receive one document for the month, not two.
The charge layer is what makes that possible: charges accumulate, the operator (or the auto-issue
path) sweeps everything outstanding for a client onto a single invoice, and `InvoiceController`
already composes exactly that way from `chargeIds`.

Going straight from retainer to invoice would be fewer moving parts and would quietly guarantee
that every client with a retainer gets two invoices in any month they also owe for hosting.

### How much of this is automated

Yes, the invoicing automates, but the run stops one step short of the client.

A retainer's whole value is that it does not need thinking about, so composing the same invoice by
hand twelve times a year defeats most of the point. But an invoice that issues *and sends* itself
is the one document nobody reads before the client does. The split is therefore between composing
and sending, not between doing it and not:

| Step | Who | Why |
|---|---|---|
| Raise the charge for the period | automatic | An internal ledger row. Nothing has left the building. |
| Compose the **draft** invoice | automatic | All of the toil, none of the risk. Drafts are freely editable and mint no reference. |
| Send it | **operator** | The only step a mistake reaches a client through. |

So each cycle the operator finds a finished draft waiting, previews the PDF (see
[INVOICES.md](./INVOICES.md)) and sends it. That is a few seconds per client per month, against a
few minutes of composing, and it keeps a human between our records and their inbox.

**Draft rather than issued, specifically.** Issuing mints the reference and freezes the lines, so
an invoice issued on the 1st cannot absorb the domain renewal charge that lands on the 12th
without being voided and reissued. Leaving it in draft is what keeps the one-client-one-invoice
batching above actually possible.

`auto_issue` and `auto_send` stay in the model as per-retainer opt-ins, off by default. Turn them
on for a client whose retainer has run clean for a few cycles and whose invoice never changes.

## The number this unlocks

Receivables answers "where is my money stuck". Retainers answer a different question, and it needs
its own surface rather than another bucket in the pipeline: **what comes in every month regardless**.

- **MRR** across active retainers, normalised to a month (quarterly ÷ 3, yearly ÷ 12) and struck in
  cedis so dollar and cedi retainers total to something meaningful. See the cedi rules in
  [INVOICES.md](./INVOICES.md).
- **Scheduled next 30 days**: what is about to be raised, before it is raised.
- **Churn**: paused and ended this quarter, which is the only early warning a retainer book gives.

Placement: a **Recurring revenue** section on Receivables, and the MRR figure on the dashboard.
`/admin/retainers` for the list and per-retainer detail (schedule, periods billed, pause / resume /
end), plus a Retainers section on the client detail page beside packages and invoices.

## Deliberately out

- **Hours and scope tracking.** Settled by the operator: a retainer buys ongoing service, not an
  allowance, so there is nothing to meter and no "included versus billable" line to police. If a
  month's work needs deliverables, gates or a portal, that is a work package raised alongside the
  retainer at its own price.
- **Paystack subscriptions** (stored card, auto-charged). Clients here pay by transfer and mobile
  money as often as by card, and auto-charging a saved card is a trust and compliance step of its
  own. An invoice per period with the existing pay page collects the same money through machinery
  that already works. Revisit once the book is big enough that collection is the bottleneck.
- **A client-facing retainer page.** Each period's invoice already has one at `/i/{slug}`.

## Phases

1. **Rename** `infra_charges` to `charges` with `kind`, no behaviour change.
2. **Model + CRUD**: migration, `Retainer`, controller, admin list and detail. Charges raised by
   hand from the retainer, to prove the shape before automating it.
3. **The clock**: `retainers:bill`, scheduled, `--dry-run` first. Raises the charge, composes the
   draft invoice, advances the cursor, and applies the two-unpaid-periods pause.
4. **Recurring revenue** on Receivables and the dashboard.
5. **Auto-issue**, then **auto-send**, opt-in per retainer, once cycles have run clean.

## Decisions (from the operator)

- **Billed in advance.** The charge is raised `bill_lead_days` before the period starts, so the
  money lands near the beginning of the month it covers. We are paid to be available, and being
  paid afterwards for availability nobody drew on is a harder conversation every time.
- **A retainer buys ongoing service, not a scope.** "They pay us to keep us working for them."
  So the invoice line reads as a period of retained service (`Ongoing services retainer, August
  2026`), and `memo` carries the plain-language version of the arrangement rather than a list of
  entitlements. There is no allowance to itemise against, and therefore nothing to argue about
  having used up.
- **Two unpaid periods auto-pauses the retainer and alerts the admin lane.** Pausing stops the
  clock without ending the arrangement, so nothing further is raised while the position is
  unclear, and the alert goes to us first rather than becoming a third invoice the client ignores.
  Resuming is a button, not a re-setup.

### What follows from "no scope"

No time tracking, no hours ledger, no allowance drawdown, no "included versus billable" split.
If a month's work is big enough to need a scope, it is a work package with its own price, raised
alongside the retainer and not against it.
