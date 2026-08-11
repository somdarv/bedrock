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

## Data model (bedrock-api)

```
invoices
  id                   ulid pk
  client_id            ulid fk -> clients (cascade)
  public_slug          uuid unique          -- the capability URL: /i/{slug}
  title, memo
  document_id          string unique null   -- SAH-FIN-20260811-INV-GIGCOT-07
  reference            string null          -- INV-GIGCOT-07 (printed in the letterhead)
  serial               string null          -- G-1CBA-C796 (per generation run)
  receipt_document_id / receipt_reference / receipt_serial   -- minted on settlement
  issue_date, due_date, status, issued_at, paid_at

invoice_items
  id, invoice_id, position, description, quantity, unit_price

infra_charges
  + invoice_id   ulid fk -> invoices nullable   -- the charges this invoice bills

payments
  + invoice_id       ulid fk -> invoices nullable
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

`sendInvoice` renders the PDF server-side and posts it to the existing client-documents endpoint,
which stores it for audit/re-send and fans it out over WhatsApp + email. It deliberately does **not**
pass `reference`/`serial`: that parameter makes the documents endpoint write a *statement* row into
the verification registry, and an invoice already has its own row from when it was issued.
