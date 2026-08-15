# Savings — a slice of every payment, held back

## Why

Money that arrives is money that gets spent. Everything Bedrock tracked until now pointed one
direction: what clients owe, what is stuck where, who to chase. Nothing pointed at what the
business owes itself, so a percentage set aside "in principle" only ever existed as an intention
somebody had to remember at the moment cash landed, which is exactly the moment it is easiest to
forget.

So the rule is applied where the money actually is, automatically, and the only manual step left
is the one a computer genuinely cannot do: moving the cedis.

## The shape

**One rate**, in Settings, as a percentage of every payment received. `0` (the default) means the
feature is off and nothing accrues, so an existing workspace sees no change until it opts in.

**One ledger row per payment**, created the instant a payment reaches `success`. Each row records
what came in, the rate applied, the slice, and whether the money has actually been moved.

**One page** — `/admin/savings` — showing three figures that matter in this order: still to move,
already moved, saved in total. The first is the one with any teeth; the other two are context.

## Where accrual happens, and why there

`App\Observers\PaymentObserver`, on the `Payment` model. Not in the controllers.

Money reaches Bedrock five ways: a manual package payment, a milestone payment, a manual invoice
payment, and two Paystack webhook routes (package and invoice). A savings rule enforced on four of
those five is not a rule — it is a rule with a hole in it, and the hole is invisible until the
month the numbers do not add up. Putting the accrual on the model means every path is covered by
construction, including any path added later.

The observer hooks both `created` and `updated`:

- money recorded by hand is born `success` → `created` fires;
- an online payment is born `pending` and flipped by the verified webhook → `updated` fires, and
  only on the transition into `success`.

The webhook rewrites `amount` to what actually cleared in the same update that sets the status, so
reading the amount at `updated` time gives the real figure rather than what the checkout was opened
for. A short payment saves a slice of what arrived, not of what was asked for.

**Idempotency** comes from the unique index on `set_asides.payment_id`. A replayed webhook — which
Paystack does send — finds the row already there and does nothing.

**Failures are swallowed and logged.** The money landing is the important event. A missing ledger
row is a bookkeeping problem the operator can fix by hand; an exception thrown from the observer
would roll back a real payment and leave a client charged with nothing recorded.

## The rate is frozen onto the row

`set_asides.rate_percent` is copied at accrual time and never read back from settings.

Changing the rate is a decision about future money. Recomputing history would rewrite what you
already decided to save, and — worse — an entry you have already transferred against would stop
matching your bank statement. The savings page shows each row's own rate next to its amount for
exactly this reason: two rows accrued at different rates are not a bug.

This is the same principle receipts follow (see `docs/DOCUMENT-CODES.md`): a figure that was acted
on is a snapshot, not a live calculation.

## Accrued vs moved

The app can observe that money arrived. It cannot observe that you moved cedis between accounts.
So `status` carries the only fact it does not know:

- `pending` — accrued, still sitting in the operating account.
- `moved` — transferred, ticked off by the operator.

**Still to move** is therefore the honest headline: not "you have saved this much" but "this much
is owed to savings and has not gone anywhere". `Mark all moved` covers the usual case of one
transfer clearing everything outstanding, and `Undo` exists because transfers bounce.

Nothing here reconciles against a real bank account, and nothing pretends to. The ledger is a
record of a decision, not a statement.

## Surfaces

| Where | What it does |
|-------|--------------|
| `/admin/settings` → Savings set-aside | Sets the rate. Shows what is outstanding without leaving the page. |
| `/admin/savings` | The ledger, the three totals, and the move/undo actions. |
| Record payment modal (package + invoice) | Previews the slice against what is being typed, before it is written. |
| Toast after recording a payment | "Payment recorded. Set aside ₵X (Y%)." — said at the moment the operator can act on it. |

The prompt reads the rate the page was rendered with and restates what the API already did; it
never computes the authoritative figure. `lib/savings/display.ts` mirrors `SetAside::sliceOf` so
the two agree.

When the rate is `0`, none of the prompts render at all and the toast falls back to the plain
"Payment recorded." — a workspace with savings off never sees the feature.

## API

| Method & path | Purpose |
|---------------|---------|
| `GET /api/admin/savings` | The rate, the three totals, and up to 200 entries (pending first). |
| `PUT /api/admin/savings/rate` | Set the rate. Capped at 50%: a slice larger than half of income is far likelier to be a typo than an intention. |
| `POST /api/admin/savings/{id}/move` | Tick one entry off as transferred. |
| `POST /api/admin/savings/{id}/unmove` | Undo. |
| `POST /api/admin/savings/move-all` | One transfer covering everything outstanding. |

All behind Sanctum, like the rest of the money surface.

## Deliberately not built

- **Per-client rates.** One number is the whole appeal. Per-client rates turn a rule you can hold
  in your head into a table you have to maintain.
- **Reconciliation against a bank feed.** There is no feed to reconcile against.
- **Withdrawals from the pot.** The ledger records what went in. What savings is later spent on is
  a different question and would need its own model to answer honestly.
- **Retroactive accrual.** Setting a rate does not reach back over payments already received. The
  rule starts when you start it.

## Tests

`bedrock-api/tests/Feature/SavingsTest.php` walks each route money actually arrives by, rather than
just the convenient one, since coverage is the property that matters most here. It also pins the
two rules above: a replayed webhook accrues once, and changing the rate leaves earlier entries
alone.
