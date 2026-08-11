import type { BillTo, Invoice, Payment } from "@/lib/api";
import {
  BillingDocument,
  fmtDate,
  fmtLongDate,
  money,
  type BillingModel,
  type BillingSubRow,
} from "./billing-document";

/**
 * Invoice / receipt for a standalone invoice — billing raised directly against a client rather
 * than through a work package (infrastructure renewals above all).
 *
 * All the drawing lives in billing-document.tsx: this file only says what a standalone invoice
 * means in billing terms, so what the client receives is the same document a package invoice
 * produces, down to the letterhead and the verify stamp.
 */

/** How a payment reached us, in words the client recognises ("mobile_money" → "Mobile money"). */
function methodLabel(p: Payment) {
  const method = p.method?.trim().replace(/[_-]+/g, " ");
  if (method) return method.charAt(0).toUpperCase() + method.slice(1);
  return p.paystackReference ? "Card / mobile money" : "Payment";
}

/** Overdue is worth saying plainly — it is the whole reason a second copy gets sent. */
function dueLine(dueDate: string | null, due: number, code: string): string {
  if (due <= 0) return "";
  if (!dueDate) return `${money(due, code)} due on receipt`;

  const deadline = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return deadline < today
    ? `${money(due, code)} overdue since ${fmtLongDate(dueDate)}`
    : `${money(due, code)} due by ${fmtLongDate(dueDate)}`;
}

const nf2 = new Intl.NumberFormat("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rateFmt = new Intl.NumberFormat("en-GH", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

/**
 * The settlement note on a dollar-denominated invoice.
 *
 * This block exists to answer one question before the reader asks it: *the rate online says 11.60,
 * so how is this 13?* A client who finds that gap themselves reads it as a markup slipped past
 * them; a client who is told about it first reads it as a price. So the note names the gap, says
 * where it comes from, and says there is nothing added on top of it.
 *
 * Deliberately NOT called an "exchange rate" — that word invites a comparison with the published
 * mid-market figure, which is an interbank midpoint nobody can actually transact at. "Settlement
 * rate" describes what it really is: the rate at which we can settle a dollar bill from Ghana.
 *
 * The mid-market figure itself is never printed. Publishing it would turn the margin into the
 * thing clients negotiate, and it goes stale the moment the document is filed.
 */
function fxNoteFor(invoice: Invoice, due: number): string | null {
  if (invoice.currency !== "USD" || !invoice.fxRateIndicative) return null;

  const rate = invoice.fxRateIndicative;
  const asOf = invoice.fxRateIndicativeAt ? fmtDate(invoice.fxRateIndicativeAt) : null;
  const ghs = nf2.format(Math.round(due * rate * 100) / 100);

  return (
    `Priced in US dollars, payable in Ghana cedis. ${money(due, "USD")} is about GHS ${ghs} ` +
    `at our settlement rate of ${rateFmt.format(rate)}${asOf ? ` (${asOf})` : ""}. ` +
    `Rates quoted online are interbank figures no card or bank converts at. ` +
    `Ours includes all bank and card charges, nothing added. Confirmed when you pay.`
  );
}

export function invoiceBillingModel({
  invoice,
  variant,
  billTo,
  payUrl,
  verify,
}: {
  invoice: Invoice;
  variant: "invoice" | "receipt";
  billTo?: BillTo | null;
  /** The invoice's public page — where the Pay button lands. */
  payUrl?: string | null;
  verify: { reference: string; serial: string; qr: string };
}): BillingModel {
  const isReceipt = variant === "receipt";
  const code = invoice.currency ?? "GHS";
  const isUsd = code === "USD";
  const settledPayments = invoice.payments.filter((p) => p.status === "success");
  const lastPayment = settledPayments[settledPayments.length - 1];
  const due = Math.max(0, invoice.balance);

  const number = (isReceipt ? invoice.receiptReference : invoice.reference) ?? "Draft";

  const meta: BillingModel["meta"] = [];
  if (isReceipt && invoice.receiptReference) {
    meta.push({ label: "Receipt number", value: invoice.receiptReference });
  }
  meta.push({ label: "Invoice number", value: invoice.reference ?? "Draft" });
  if (isReceipt) {
    if (lastPayment) meta.push({ label: "Date paid", value: fmtDate(lastPayment.paidAt) });
  } else {
    meta.push({ label: "Date of issue", value: fmtDate(invoice.issueDate ?? invoice.createdAt) });
    if (invoice.dueDate) meta.push({ label: "Payment due", value: fmtDate(invoice.dueDate) });
  }

  // Always itemised: these invoices are a list of things being renewed, and the client is
  // entitled to see the unit price of each one rather than a single lump figure.
  const lines = invoice.items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: item.amount,
  }));

  // On a dollar invoice the history is stated in dollars settled (matching the totals ladder),
  // with the cedis actually sent and the rate applied on the line beneath — the client needs to
  // recognise the figure that left their account.
  const subTable: BillingModel["subTable"] =
    isReceipt && settledPayments.length > 0
      ? {
          heading: "Payment history",
          columns: ["Payment method", "Date", isUsd ? "Settled (USD)" : "Amount paid"],
          rows: settledPayments.map<BillingSubRow>((p) => ({
            id: p.id,
            label: methodLabel(p),
            sub: isUsd
              ? `GHS ${nf2.format(p.amount)} received${p.fxRate ? ` at ${rateFmt.format(p.fxRate)}` : ""}`
              : p.paystackReference
                ? `Reference ${p.paystackReference}`
                : null,
            middle: fmtDate(p.paidAt),
            amount: isUsd ? (p.amountUsd ?? 0) : p.amount,
          })),
        }
      : null;

  const receivedGhs = settledPayments.reduce((sum, p) => sum + p.amount, 0);

  const memo = isReceipt
    ? isUsd
      ? `Thank you. GHS ${nf2.format(receivedGhs)} was received, settling ${money(invoice.paid, "USD")} on this invoice in full.`
      : "Thank you. This receipt confirms the payments listed below, and settles the invoice it refers to in full."
    : due > 0
      ? invoice.memo?.trim() ||
        "Pay by card or mobile money using the button above. If you would rather pay another way, reply to this message and we will send you the details."
      : "This invoice is settled in full. Nothing further is owed on it.";

  return {
    variant,
    number,
    currency: code,
    fxNote: isReceipt ? null : fxNoteFor(invoice, due),
    meta,
    billTo: billTo ?? null,
    headline: isReceipt
      ? settledPayments.length === 0
        ? "No payments recorded yet"
        : `${money(invoice.paid, code)} paid on ${fmtLongDate(lastPayment.paidAt)}`
      : due <= 0
        ? `${money(invoice.total, code)} paid in full`
        : dueLine(invoice.dueDate, due, code),
    headlineSub: !isReceipt && due > 0 ? invoice.title : null,
    memo,
    // Only a live, unsettled invoice gets a button. A receipt or a settled copy must not
    // invite a second payment.
    payUrl: !isReceipt && due > 0 ? (payUrl ?? null) : null,
    itemised: true,
    lines,
    total: invoice.total,
    paid: invoice.paid,
    due,
    subTable,
    issuedDate: isReceipt ? (lastPayment?.paidAt ?? invoice.paidAt) : (invoice.issueDate ?? invoice.createdAt),
    verify,
  };
}

export function InvoiceDocument({
  invoice,
  variant,
  billTo,
  payUrl,
  logo,
  verify,
}: {
  invoice: Invoice;
  variant: "invoice" | "receipt";
  billTo?: BillTo | null;
  payUrl?: string | null;
  /** SaharaBase wordmark as a data URI (from brand.logoDataUri()). */
  logo: string;
  /** Registered verification identity + QR (minted by the API at issue; built in render.tsx). */
  verify: { reference: string; serial: string; qr: string };
}) {
  return (
    <BillingDocument
      model={invoiceBillingModel({ invoice, variant, billTo, payUrl, verify })}
      logo={logo}
    />
  );
}
