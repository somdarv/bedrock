import {
  balanceAfter,
  discountRate,
  settledBy,
  settledInOrder,
  type BillTo,
  type Invoice,
  type Payment,
} from "@/lib/api";
import {
  BillingDocument,
  discountRowLabel,
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
 * It has to give a client a number they can act on. Most pay by mobile money or bank transfer,
 * and "the amount is confirmed when you pay" gives them nothing to type into a MoMo prompt — so
 * the cedi figure is fixed at issue and printed here with the date it holds until.
 *
 * It also answers, before the reader asks it, why the rate is 13 when the internet says 11.60.
 * A client who finds that gap themselves reads it as a markup slipped past them; a client told
 * about it up front reads it as a price.
 *
 * Deliberately "the settlement rate", not "our" — this is what converting a dollar bill from
 * Ghana costs through the banks, not a number we invented. And deliberately not an "exchange
 * rate": that word invites comparison with the published mid-market figure, which is an
 * interbank midpoint nobody actually transacts at.
 *
 * The mid-market figure itself is never printed. Publishing it would turn the margin into the
 * thing clients negotiate, and it goes stale the moment the document is filed.
 */
function fxNoteFor(invoice: Invoice, due: number): string | null {
  if (invoice.currency !== "USD" || !invoice.fxRateLocked) return null;

  const rate = invoice.fxRateLocked;
  const ghs = nf2.format(Math.round(due * rate * 100) / 100);
  const until = invoice.fxValidUntil ? fmtDate(invoice.fxValidUntil) : null;

  return (
    `Priced in US dollars, payable in Ghana cedis. Pay GHS ${ghs} at the settlement rate of ` +
    `${rateFmt.format(rate)}. Rates quoted online are interbank figures no card or bank ` +
    `converts at. ` +
    (until
      ? `This cedi amount holds until ${until}; after that please ask us for an updated invoice.`
      : `The cedi amount is confirmed when you pay.`)
  );
}

export function invoiceBillingModel({
  invoice,
  variant,
  payment,
  billTo,
  payUrl,
  verify,
}: {
  invoice: Invoice;
  variant: "invoice" | "receipt";
  /**
   * The payment this receipt is FOR. A receipt acknowledges one payment, so with this set the
   * document states what that payment did and what it left outstanding — which is the only way
   * a part payment can be receipted at all.
   *
   * Omitted for the invoice variant, and for a settled invoice's canonical receipt, which
   * speaks for the whole invoice as it always has.
   */
  payment?: Payment | null;
  billTo?: BillTo | null;
  /** The invoice's public page — where the Pay button lands. */
  payUrl?: string | null;
  verify: { reference: string; serial: string; qr: string };
}): BillingModel {
  const isReceipt = variant === "receipt";
  const code = invoice.currency ?? "GHS";
  const isUsd = code === "USD";
  const settledPayments = settledInOrder(invoice);
  const lastPayment = settledPayments[settledPayments.length - 1];

  // A receipt for one payment reports THAT payment: what it settled, and what was still owed
  // the moment it landed. Both figures are frozen at that point in the sequence rather than
  // read live, so a reprint of an old receipt still matches the copy the client filed.
  const receiptFor = isReceipt ? (payment ?? null) : null;
  const receiptPaid = receiptFor ? settledBy(invoice, receiptFor) : invoice.paid;
  const receiptDue = receiptFor ? balanceAfter(invoice, receiptFor) : Math.max(0, invoice.balance);
  const receiptDate = receiptFor?.paidAt ?? lastPayment?.paidAt ?? invoice.paidAt;
  const due = isReceipt ? receiptDue : Math.max(0, invoice.balance);

  const receiptNumber = receiptFor?.receiptReference ?? invoice.receiptReference;
  const number = (isReceipt ? receiptNumber : invoice.reference) ?? "Draft";

  const meta: BillingModel["meta"] = [];
  if (isReceipt && receiptNumber) {
    meta.push({ label: "Receipt number", value: receiptNumber });
  }
  meta.push({ label: "Invoice number", value: invoice.reference ?? "Draft" });
  if (isReceipt) {
    if (receiptDate) meta.push({ label: "Date paid", value: fmtDate(receiptDate) });
  } else {
    meta.push({ label: "Date of issue", value: fmtDate(invoice.issueDate ?? invoice.createdAt) });
    if (invoice.dueDate) meta.push({ label: "Payment due", value: fmtDate(invoice.dueDate) });
  }

  // Always itemised: these invoices are a list of things being renewed, and the client is
  // entitled to see the unit price of each one rather than a single lump figure.
  //
  // `item.amount` is net of the line's own discount, and the Discount column says what came off,
  // so the whole sum reads across one line: qty x unit price, less the discount, equals amount.
  const lines = invoice.items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountAmount: item.discountAmount,
    discountRate: discountRate(item.discountType, item.discountValue),
    amount: item.amount,
  }));

  // On a dollar invoice the history is stated in dollars settled (matching the totals ladder),
  // with the cedis actually sent and the rate applied on the line beneath — the client needs to
  // recognise the figure that left their account.
  //
  // A receipt for one payment lists only that payment: it is the record of a single transaction,
  // and reprinting the client's whole payment history on it would restate money already
  // receipted elsewhere.
  const historyRows = receiptFor ? [receiptFor] : settledPayments;
  const subTable: BillingModel["subTable"] =
    isReceipt && historyRows.length > 0
      ? {
          heading: receiptFor ? "This payment" : "Payment history",
          columns: ["Payment method", "Date", isUsd ? "Settled (USD)" : "Amount paid"],
          rows: historyRows.map<BillingSubRow>((p) => ({
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

  const receivedGhs = (receiptFor ? [receiptFor] : settledPayments).reduce((sum, p) => sum + p.amount, 0);

  // What the client most needs to read on a receipt is whether the bill is now closed. Saying
  // "settles it in full" on a part payment would be a plain untruth, and saying nothing leaves
  // them to work it out from the totals ladder.
  const stillOwed = `${money(receiptDue, code)} remains outstanding on invoice ${invoice.reference ?? ""}`.trim();
  const memo = isReceipt
    ? isUsd
      ? receiptDue > 0
        ? `Thank you. GHS ${nf2.format(receivedGhs)} was received, settling ${money(receiptPaid, "USD")}. ${stillOwed}.`
        : `Thank you. GHS ${nf2.format(receivedGhs)} was received, settling ${money(receiptPaid, "USD")} on this invoice in full.`
      : receiptDue > 0
        ? `Thank you. This receipt confirms the payment below. ${stillOwed}.`
        : receiptFor
          ? "Thank you. This receipt confirms the payment below, and settles the invoice it refers to in full."
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
    // The cedi figure sits directly under the dollar total, because that is the number the
    // client types into a MoMo prompt or hands to a bank teller.
    settledSub:
      !isReceipt && isUsd && due > 0 && invoice.fxRateLocked
        ? `GHS ${nf2.format(Math.round(due * invoice.fxRateLocked * 100) / 100)}`
        : null,
    meta,
    billTo: billTo ?? null,
    headline: isReceipt
      ? settledPayments.length === 0
        ? "No payments recorded yet"
        : `${money(receiptPaid, code)} received on ${fmtLongDate(receiptDate)}`
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
    subtotal: invoice.subtotal,
    discount:
      invoice.discountAmount > 0
        ? {
            label: discountRowLabel(invoice.discountLabel, invoice.discountType, invoice.discountValue),
            amount: invoice.discountAmount,
          }
        : null,
    savings: invoice.itemDiscountTotal + invoice.discountAmount,
    total: invoice.total,
    // On a payment receipt this is what THAT payment settled, so the "Amount paid" line and the
    // "Balance remaining" above it describe the same moment.
    paid: isReceipt ? receiptPaid : invoice.paid,
    due,
    subTable,
    issuedDate: isReceipt ? (receiptDate ?? invoice.paidAt) : (invoice.issueDate ?? invoice.createdAt),
    verify,
  };
}

export function InvoiceDocument({
  invoice,
  variant,
  payment,
  billTo,
  payUrl,
  logo,
  verify,
}: {
  invoice: Invoice;
  variant: "invoice" | "receipt";
  /** The payment this receipt acknowledges. See invoiceBillingModel. */
  payment?: Payment | null;
  billTo?: BillTo | null;
  payUrl?: string | null;
  /** SaharaBase wordmark as a data URI (from brand.logoDataUri()). */
  logo: string;
  /** Registered verification identity + QR (minted by the API at issue; built in render.tsx). */
  verify: { reference: string; serial: string; qr: string };
}) {
  return (
    <BillingDocument
      model={invoiceBillingModel({ invoice, variant, payment, billTo, payUrl, verify })}
      logo={logo}
    />
  );
}
