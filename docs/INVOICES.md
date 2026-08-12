# Standalone invoices

> Billing raised directly against a client, outside the work-package flow. Read alongside
> [RECEIVABLES-MILESTONES.md](./RECEIVABLES-MILESTONES.md) (Phase 6) and
> [DOCUMENT-CODES.md](./DOCUMENT-CODES.md). **Date:** 2026-08-11.

## Why

Infrastructure fees do not belong to a project. They recur per asset, on their own calendar, and
a client may owe them with no work package open at all. `InfraCharge` already tracked *that* money,
but a charge is a ledger row, not a document: there was no way to actually ask a client to pay one,
and no receipt to close it with.

A work package raises its invoice on the fly from the package itself. These are composed by hand,
issued once, and then live as their own record.

## The lifecycle

```
draft  ──issue──▶  issued  ──payment clears──▶  paid
  │                   │
  └──delete           └──void
```

- **draft** — freely editable. No reference is minted and nothing has been sent.
- **issued** — the identity is minted and the lines are frozen: the client is holding a numbered
  document, so changing what it says is not an edit, it is a different invoice. Void and reissue.
- **paid** — the balance reached zero. This also closes the infrastructure charges the invoice
  bills and mints the receipt.
- **void** — revoked. The registry row follows, so the QR now reads "void", and any charges it
  claimed go back to outstanding.

## Pricing in dollars

Infrastructure is bought in dollars (registrars, hosting, certificates) but clients pay in cedis,
and the cedi moves daily. A fixed cedi quote means the gap between invoicing and payment comes out
of our margin. So an invoice can be **denominated in USD**: the dollar total is the binding amount,
and the cedi figure is worked out at the rate on the day the client actually pays.

### The rate

```
billed rate = live mid-market rate x (1 + margin%)
```

The margin defaults to **11.5%** and covers what settling a dollar bill from Ghana actually costs
us: our card issuer's FX markup, the international transaction fee, and the spread.

**That margin is ONE number, deliberately.** The card cost *is* the gap between mid-market and what
we really get. Charging an FX margin and a separate card fee would bill the same cost twice and put
roughly 24% on a client's invoice instead of 11.5%. It is not a surcharge on how the client pays —
they may pay by bank transfer and we still have to buy the dollars.

Mid-market comes from a free, key-less daily feed (`open.er-api.com`; the ECB feeds do not carry
GHS). It is cached on every successful fetch, and **the cache is used indefinitely when the feed is
unreachable** — a rate a few days stale beats a checkout that will not open. A manual override is
available in Settings for when the feed is wrong or a bank rate is preferred.

### Where the rate is applied

| Moment | Rate | Stored as |
|---|---|---|
| Issue | today's | `invoices.fx_rate_indicative` — what the PDF prints as indicative |
| Viewing the pay page | today's | not stored; recomputed on every read |
| Opening checkout | today's | `payments.fx_rate` + `payments.amount_usd` on the pending row |
| Webhook credits | the one quoted at checkout | unchanged unless the payment came up short |
| Manual payment | operator's, defaulting to today's | `payments.fx_rate` |

### Money on a USD invoice

`payments.amount` is **always the cedis that moved**. `amount_usd` is what those cedis bought.

`balance()` works in dollars: `total() - sum(amount_usd)`. Summing cedis against a dollar total
would compare two different things, and a client who paid in full when the cedi was strong would
still look like a debtor. `receivedGhs()` reports the cedis for the record.

This is what makes a part payment across a moving rate come out right: pay $50 worth at 13.00 and
the remaining $88 at 20.00, and the invoice settles exactly, having received GHS 2,415.99.

### Cedis on every screen

A dollar invoice is still paid out of a cedi bank account, so no dollar figure is ever shown on
its own in the admin: it carries the cedi counterpart underneath. **Settled invoices show the
cedis that actually arrived** (`receivedGhs`) — the figure that reconciles against the bank —
while live ones show the cedis still to pay at the locked rate.

Aggregates (the Invoices tiles, the Receivables invoice total) are struck **in cedis**, converting
each dollar balance at its own locked rate: a list mixing currencies has no other common
denominator, and adding `$20` to `₵600` produces a number that is neither. `outstandingCedis()`
and `cedisFor()` in `lib/invoices/display.ts` are the only places that conversion happens.

Two rules follow, and both were once broken on the invoices list: **never print a dollar amount
with a `₵` sign** (`formatMoney(x, invoice.currency)`, not `formatCedis(x)`), and never sum a
`balance` column across invoices without converting first.

A balance can also land **past zero** — cedis are sent in round numbers and a dollar total rarely
is, so ₵270.00 against a $20.00 invoice settles $20.58. Owed and overpaid are different facts:
the balance shows `$0.00` with the surplus stated beside it, rather than a negative debt, and a
settled invoice stops quoting a cedi figure to pay at all.

### Charges carry a currency too

`infra_charges.currency` exists because a charge is billed by becoming an invoice line. A charge
recorded as "GHS 600" appended to a USD invoice would read as "USD 600" — a thirteenfold overcharge,
silently. A charge can only be billed on an invoice of the same currency; the API refuses the rest
rather than converting behind the operator's back.

## Data model (bedrock-api)

```
settings
  key                  string pk            -- fx.margin_percent, fx.manual_rate, fx.last_mid_rate
  value                json

invoices
  id                   ulid pk
  client_id            ulid fk -> clients (cascade)
  public_slug          uuid unique          -- the capability URL: /i/{slug}
  title, memo
  currency             string default 'GHS' -- GHS | USD
  fx_margin_percent    decimal null         -- snapshot at issue
  fx_rate_indicative   decimal null         -- printed on the PDF; not what is charged
  fx_rate_indicative_at timestamp null
  document_id          string unique null   -- SAH-FIN-20260811-INV-GIGCOT-07
  reference            string null          -- INV-GIGCOT-07 (printed in the letterhead)
  serial               string null          -- G-1CBA-C796 (per generation run)
  receipt_document_id / receipt_reference / receipt_serial   -- minted on settlement
  issue_date, due_date, status, issued_at, paid_at

invoice_items
  id, invoice_id, position, description, quantity, unit_price

infra_charges
  + invoice_id   ulid fk -> invoices nullable   -- the charges this invoice bills
  + currency     string default 'GHS'           -- must match the invoice billing it

payments
  + invoice_id       ulid fk -> invoices nullable
  + fx_rate          decimal null   -- the rate this payment was credited at
  + amount_usd       decimal null   -- the dollars `amount` cedis bought
  ~ work_package_id  now nullable
```

**Money is derived, never stored.** `total()` from the lines, `paid()` from successful payments,
`balance()` from the difference — the same rule work packages follow. `status` is a lifecycle
marker, not the source of truth for what is owed.

**Payments reuse the `payments` table** rather than forking. A payment settles exactly one of a
work package or an invoice, so the whole Paystack path (initialize → webhook → verify) is shared,
and `paystack_reference` stays globally unique across both.

## Verification

A package invoice derives its reference from the package slug and is answered live by
`VerifyController`. A standalone invoice is instead a **registry** document: issuing it writes a row
into `documents`, which `/verify/{id}` already resolves. No new verification path, and no chance of
colliding with the `SAH-INV-{slughead}` package scheme.

The registry row carries an `amount_line` ("GHS 850.00 outstanding of GHS 1,850.00"). It is
**recomputed on every payment** (`InvoiceIssuer::refreshRegistry`) — the printed PDF is a snapshot,
but the page its QR points at has to be the live record, or a settled invoice would still verify as
outstanding.

## Paying

The invoice PDF carries a real **Pay button** — a filled box with a link annotation over it, not a
text link, because the document is usually read on a phone. It opens `/i/{slug}`, the client-facing
invoice page, which starts a Paystack checkout the same way the portal does.

Only a live, unsettled invoice gets one. A receipt, a settled copy or a void invoice must never
invite a second payment.

As ever: **only the verified webhook credits money.** The return from checkout is cosmetic.

## No double counting

Both an infrastructure charge and an invoice can be outstanding, and it is the same money. The
split is by *whether the client has been asked yet*:

- `InfraChargeController::outstanding()` — pending charges **not** billed on an issued invoice.
- `InvoiceController::outstanding()` — issued invoices with a balance.

A charge on a still-*draft* invoice has not been asked for, so it stays in the charge bucket. The
Receivables dashboard shows both sections.

## The document itself

`lib/pdf/billing-document.tsx` is the one layout every invoice and receipt we issue is drawn in.
Both `package-document.tsx` and `invoice-document.tsx` are thin adapters that build a `BillingModel`
and hand it over, so a package invoice and a standalone invoice cannot drift into looking like
documents from different companies. Change the layout in one place only.

## Sending

Nothing goes out unseen. The public PDF routes — `/i/{slug}/invoice` and `/i/{slug}/receipt` —
render from the live invoice record on every request, so they *are* the document that gets sent,
not a preview of it. The admin screen links to both (**Invoice PDF** / **Receipt PDF**), and the
send dialog carries the same link for whichever variant is being sent. Because the render is live,
this works on every invoice already issued and every payment already recorded: no re-issue, no
stored copy to regenerate.

`sendInvoice` renders the PDF server-side and posts it to the existing client-documents endpoint,
which stores it for audit/re-send and fans it out over WhatsApp + email. It deliberately does **not**
pass `reference`/`serial`: that parameter makes the documents endpoint write a *statement* row into
the verification registry, and an invoice already has its own row from when it was issued.
