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
function dueLine(dueDate: string | null, due: number): string {
  if (due <= 0) return "";
  if (!dueDate) return `${money(due)} due on receipt`;

  const deadline = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return deadline < today
    ? `${money(due)} overdue since ${fmtLongDate(dueDate)}`
    : `${money(due)} due by ${fmtLongDate(dueDate)}`;
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

  const subTable: BillingModel["subTable"] =
    isReceipt && settledPayments.length > 0
      ? {
          heading: "Payment history",
          columns: ["Payment method", "Date", "Amount paid"],
          rows: settledPayments.map<BillingSubRow>((p) => ({
            id: p.id,
            label: methodLabel(p),
            sub: p.paystackReference ? `Reference ${p.paystackReference}` : null,
            middle: fmtDate(p.paidAt),
            amount: p.amount,
          })),
        }
      : null;

  const memo = isReceipt
    ? "Thank you. This receipt confirms the payments listed below, and settles the invoice it refers to in full."
    : due > 0
      ? invoice.memo?.trim() ||
        "Pay by card or mobile money using the button above. If you would rather pay another way, reply to this message and we will send you the details."
      : "This invoice is settled in full. Nothing further is owed on it.";

  return {
    variant,
    number,
    meta,
    billTo: billTo ?? null,
    headline: isReceipt
      ? settledPayments.length === 0
        ? "No payments recorded yet"
        : `${money(invoice.paid)} paid on ${fmtLongDate(lastPayment.paidAt)}`
      : due <= 0
        ? `${money(invoice.total)} paid in full`
        : dueLine(invoice.dueDate, due),
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
