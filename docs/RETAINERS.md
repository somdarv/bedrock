# Retainers

> Where recurring service revenue fits in the money model. Read alongside
> [RECEIVABLES-MILESTONES.md](./RECEIVABLES-MILESTONES.md) and [INVOICES.md](./INVOICES.md).
> **Status:** design, nothing built. **Date:** 2026-08-12.

## The gap

Bedrock can bill two things: **project work** (a work package, priced once, finished once) and
**infrastructure** (a fee attached to a client asset, recurring on that asset's expiry date).

A retainer is neither. It is a fixed fee for our continued availability: support, maintenance,
content updates, being on the end of the phone. It recurs on **the calendar**, not on a project
plan and not on a domain's expiry. It never completes, so it has no total and no balance that
reaches zero.

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
2. Advance `next_bill_on` by the interval.
3. Stop at `ends_on`, and set the retainer `ended`.

Idempotent per period, so a missed day catches up and a double run does nothing. Same shape as
`BillInfraRenewals`, which is deliberate: two generators, one contract.

### One client, one month, one invoice

This is why a retainer raises a **charge** rather than an invoice directly. A client on a care plan
who also has a domain coming up for renewal should receive one document for the month, not two.
The charge layer is what makes that possible: charges accumulate, the operator (or the auto-issue
path) sweeps everything outstanding for a client onto a single invoice, and `InvoiceController`
already composes exactly that way from `chargeIds`.

Going straight from retainer to invoice would be fewer moving parts and would quietly guarantee
that every client with a retainer gets two invoices in any month they also owe for hosting.

### Auto-issue defaults to off

A retainer's value is that it does not need thinking about, so monthly manual invoicing defeats
much of the point. But money documents that issue and send themselves are exactly the documents
nobody reads before the client does. So it is opt-in per retainer, and staged:

- **off** (default): the charge appears on Receivables, the operator raises the invoice.
- **auto_issue**: a draft invoice is composed and issued, waiting to be sent.
- **auto_send**: it goes out over WhatsApp and email on the same run.

Turn it on per client once a retainer has run clean for a couple of cycles.

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

- **Hours and scope tracking.** There is no time tracking in Bedrock, and building it is a
  different product. A retainer bills a fee for availability. If a month's work needs deliverables,
  gates or a portal, that is a work package, and it can reference the retainer later.
- **Paystack subscriptions** (stored card, auto-charged). Clients here pay by transfer and mobile
  money as often as by card, and auto-charging a saved card is a trust and compliance step of its
  own. An invoice per period with the existing pay page collects the same money through machinery
  that already works. Revisit once the book is big enough that collection is the bottleneck.
- **A client-facing retainer page.** Each period's invoice already has one at `/i/{slug}`.

## Phases

1. **Rename** `infra_charges` to `charges` with `kind`, no behaviour change.
2. **Model + CRUD**: migration, `Retainer`, controller, admin list and detail. Charges raised by
   hand from the retainer, to prove the shape before automating it.
3. **The clock**: `retainers:bill`, scheduled, `--dry-run` first.
4. **Recurring revenue** on Receivables and the dashboard.
5. **Auto-issue**, then **auto-send**, opt-in per retainer.

## Open questions for the operator

1. **Billed in advance or in arrears?** The design assumes **advance** (the charge is raised
   `bill_lead_days` before the period starts, so payment lands near the start of the month it
   covers). Arrears would only move `next_bill_on`.
2. **What does a retainer entitle a client to, in writing?** Whatever the answer, it belongs in
   `memo` and prints on every invoice, because it is what stops "I thought that was covered".
3. **What happens to unpaid periods?** A retainer that has not paid for two months is either a
   collections problem or a cancelled client, and the system should say which. Simplest rule that
   works: after N unpaid periods it auto-pauses and alerts the admin lane.
