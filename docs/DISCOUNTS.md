# Discounts

> Charging the list price and visibly taking something off it, on both work packages and
> standalone invoices. Read alongside [INVOICES.md](./INVOICES.md) and
> [DEFERRED-BILLING.md](./DEFERRED-BILLING.md). **Date:** 2026-08-13.

## Why

A price quietly reduced before it is quoted teaches a client nothing. They never learn what the
work is worth, they have no idea they were given anything, and the next quote at full rate reads
as a rise rather than a return to normal. The discount is spent and buys nothing.

So prices are stored at list and the reduction is stored beside them. Every document a client
receives prints both: what the work costs, and what they are paying for it.

## Two levels, independent

Either, both, or neither may be set on any document.

| Level | Lives on | Answers |
| --- | --- | --- |
| Line | `invoice_items`, `line_items` | "this item is cheaper for you" |
| Document | `invoices`, `work_packages` | "this job is cheaper for you" |

Both carry the same two columns:

- `discount_type` — `null` (none), `percent`, or `amount`
- `discount_value` — read against the type: a percentage of the gross, or a flat sum in the
  document's currency

Document level adds `discount_label`: what the client reads on the totals row, e.g. "Launch
offer", "Partner rate". A discount with a reason is a favour with a shelf life; a bare "Discount"
is a hint that the price was never real. The composer nudges toward naming it but does not insist.

## The ladder

```
gross subtotal        every line at list price
  less item discounts what the per-line reductions take off
= subtotal            the lines at what they actually cost
  less discount       the document-wide reduction
= total               what is being charged
```

`total()` stays the single figure everything downstream prices off — the balance, the receipt,
Receivables, the Paystack charge, the verification page's money line. None of them know a
discount happened, which is the point: a discount that reaches the printed document but not the
balance is how a client pays their bill in full and stays in Receivables forever.

Worked example (the one in the tests):

| | |
| --- | --- |
| Website redesign, 6,000.00 less 15% | 5,100.00 |
| Hosting (12 months) | 900.00 |
| **Subtotal** | **6,000.00** |
| Launch offer (10%) | - 600.00 |
| **Total** | **5,400.00** |

## Rules the arithmetic keeps

All of it lives in one place per repo — `App\Support\Discount` (PHP) and `discountOn` in
`src/lib/api/types.ts` (TS). Four records carry these columns, and four slightly different
implementations of "10% off" is how a printed document ends up disagreeing with the balance it
is chased on. **Change one, change the other.**

- A discount never exceeds the thing it reduces. Overshoot is bad input, not money owed back to
  the client, and letting it through would put a negative line on an invoice.
- A percent above 100 is **refused, not clamped**, at both levels. It is a typo, and quietly
  billing a different number from the one that was typed is worse than saying so.
- A type with no value is not a discount. Both collapse to none, so a half-filled form saves as
  "no discount" rather than as a silent zero-percent row.
- Rounded to 2dp at every step, identically in both languages.

## What each surface does with it

**The PDF** (`lib/pdf/billing-document.tsx`, the one layout for every invoice and receipt):
the Amount column shows the line **net** of its own discount, so the column always sums to the
Subtotal row and a reader can check it by hand. Underneath the description sits the note that
explains it — `6,000.00 less 15% (-900.00)` — which is where the list price appears. The
document-level discount gets its own row between Subtotal and Total. A single line under the
ladder states the whole saving, because the per-line reductions are otherwise only visible by
adding them up.

With no discount anywhere, the document is byte-identical to what it produced before this
existed: Subtotal and Total, no extra rows.

**The client portal and pay page** mirror the same ladder in HTML.

**The admin composer** prices it live, so nothing about the discount is a surprise at the moment
the PDF is generated.

## Traps that are already handled

- **Fixed-price packages.** Their line items are scope, not money, so line discounts on them are
  ignored entirely; only the package discount applies, to `total_override`.
- **Package → invoice.** Billing a package copies its line discounts and its package-level
  discount onto the invoice. Copying the lines at list price and dropping the reductions would
  bill a client more than they agreed to. On the single-line fallback (used once part of the
  package has been paid) that line is already net, so no discount travels with it.
- **Infrastructure charge lines** carry no line discount: a supplier's price passed through at
  cost has no margin to give away. The document-level discount still reaches them through the
  subtotal, which is the operator's call to make deliberately.
- **Partial package updates.** `PUT /packages/{id}` **preserves** the discount when the request
  does not mention it, the same way `total_override` behaves. Several callers PATCH one setting
  (pricing mode, delivery mode, billing mode) by reading the package and sending it back, and a
  discount cleared as a side effect of switching delivery mode would silently re-bill the client
  at full price. Sending `discountType: null` explicitly is how a discount is removed.
- **Issued invoices stay frozen.** A discount is part of what the document says, so changing one
  after issue means void and reissue, exactly like changing a line.

## Files

| Repo | File |
| --- | --- |
| bedrock-api | `app/Support/Discount.php` — the arithmetic |
| bedrock-api | `database/migrations/2026_08_13_000100_add_discounts.php` |
| bedrock-api | `app/Models/{Invoice,InvoiceItem,WorkPackage,LineItem}.php` — the ladder |
| bedrock-api | `tests/Feature/DiscountTest.php` |
| bedrock | `src/lib/api/types.ts` — the mirrored arithmetic and accessors |
| bedrock | `src/lib/pdf/billing-document.tsx` — the printed ladder |
| bedrock | `src/components/admin/invoice-composer.tsx`, `line-item-modal.tsx`, `package-detail.tsx` |
