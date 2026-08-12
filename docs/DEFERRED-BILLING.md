# Deferred billing — work first, invoice after

## Why

The gated model assumes one shape of job: quote, take a 40% deposit to start, take the balance,
release the files. That is right for a client we have no history with. It is wrong for an account
we already work with continuously, where the work is done first and billed after, on terms, and
where holding a file hostage over an unpaid balance would be absurd — the relationship is the
security, not the download gate.

Before this, the only way to run such a job was to price the package at zero so nothing locked,
then raise a standalone invoice with no connection to it. That left the package showing GHS 0 with
no record of what was owed, and the invoice floating free of the work it billed.

## The two halves

**1. `work_packages.billing_mode`** — `gated` (the default, today's behaviour unchanged) or
`deferred`.

A deferred package:

- uploads deliverables **unlocked**. There is no download gate to open.
- reports both gates open in the admin, because that is the truth about the files.
- **skips the waiting-for-money states**: `sent → in_progress → review → delivered`, with no
  `awaiting_deposit` or `awaiting_final_payment` in between. The waiting states still lead forward,
  so a package switched to deferred while parked in one is not stranded.
- is left out of scheduled payment reminders. It is chased through its invoice, not the package —
  nagging a client for money we have not billed them for yet is how you lose the account.

New packages for a client whose `account_type` is `ongoing` default to `deferred`. Explicit input
still wins: an ongoing client can want one big job gated.

Switching an existing package between modes follows through on files **already uploaded**, not just
the next one. Otherwise flipping the switch would leave the old deliverables locked and the operator
would have to re-upload them to hand the work over.

**2. `invoices.work_package_id`** — the invoice raised for a package's work.

This is the half that makes the money add up. Without it a deferred package could be billed but
never settled: the invoice's payments would credit the invoice alone, leaving the package owing its
full value forever, with Receivables chasing the same cedis in two buckets.

## How the money flows back

`WorkPackage::balance()` reads **through** its invoices:

```
balance = effectiveTotal − direct payments − invoicedPaid
```

- **`invoicedPaid`** — cedis received on invoices raised for this package. Counted whatever the
  invoice's own status: a voided invoice is a withdrawn demand, not a refund, so money that actually
  arrived stays credited to the work it paid for.
- **`invoicedOutstanding`** — cedis still owed on **issued** invoices for this package. Already
  inside the balance; Receivables subtracts it so the same money is never chased both as unbilled
  work and as an outstanding invoice.

Always the cedi figure, even on a dollar invoice: a package is priced in cedis, and adding dollars
to it would overstate what has been paid thirteenfold.

Both accessors are mirrored in `lib/api/types.ts` (`balance()`, `unbilled()`), the same way
`effectiveTotal` already is. Keep them in step — drift here shows up as a package that reads as paid
on one screen and owing on another.

## Raising the invoice

`POST /admin/packages/{package}/bill` (the **Raise invoice** button on the package's Payments
section). It produces a **draft** invoice, linked back, carrying the package's lines. Nothing
reaches the client: the draft is editable exactly like any other, and only issuing it mints the
Document ID and makes it a demand.

Rules it enforces:

- a `draft` package cannot be billed — that is not agreed work yet
- **one live invoice at a time** (draft or issued). Two documents for the same work would make the
  package's outstanding figure anyone's guess
- it bills the **outstanding** amount, not the contract value
- it copies the package's own line items only while they still describe the whole amount due. Once
  part of it has been paid, itemised lines summing past the balance would be a demand for money
  already received, so it falls back to a single `Balance on <title>` line

## Settling it

Paying a linked invoice runs `PaymentGates::applyAfterInvoicePayment()` — from
`InvoiceController::recordPayment` and from the Paystack webhook, so both routes leave identical
state behind. It advances the package's status if it was still waiting to start, and on a cleared
balance unlocks the deliverables and settles any pending milestones.

It is deliberately **silent**: the invoice has already sent the client its own receipt, and a second
"payment complete" for the same cedis would read as a second payment.

## Receivables

`unbilled(pkg)` = `balance − invoicedOutstanding` is what the project buckets count. Once a
package's work is invoiced it drops out of "Outstanding on work underway" and appears under
"Issued & unpaid" instead — counted once, in the bucket that says what to do about it.

## Files

| Where | What |
| --- | --- |
| `bedrock-api/database/migrations/2026_08_12_000100_add_deferred_billing.php` | both columns |
| `bedrock-api/app/Models/WorkPackage.php` | `billingDeferred()`, `invoicedPaid()`, `invoicedOutstanding()`, `balance()` |
| `bedrock-api/app/Http/Controllers/Admin/PackageController.php` | `bill()`, `DEFERRED_TRANSITIONS`, upload lock, mode switch |
| `bedrock-api/app/Services/Payments/PaymentGates.php` | `applyAfterInvoicePayment()` |
| `bedrock-api/tests/Feature/DeferredBillingTest.php` | the whole flow |
| `bedrock/src/lib/payments.ts` | `gatesApply()`, gate accessors, `paidTotal()` |
| `bedrock/src/lib/api/types.ts` | `BillingMode`, `balance()`, `unbilled()` |
| `bedrock/src/components/admin/payments-section.tsx` | the Raise invoice button and billing state |
