import type { Invoice } from "@/lib/api";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

/**
 * How an invoice reads at a glance. Overdue is derived rather than stored: an invoice is issued
 * until it is paid, and whether it is *late* is a question about today's date, not about state
 * the API should be keeping in step.
 */
export function invoiceStatusMeta(invoice: Invoice): { label: string; variant: BadgeVariant } {
  if (invoice.status === "void") return { label: "Void", variant: "danger" };
  if (invoice.status === "paid") return { label: "Paid", variant: "success" };
  if (invoice.status === "draft") return { label: "Draft", variant: "default" };

  if (invoice.paid > 0) return { label: "Part paid", variant: "warning" };
  if (invoice.dueDate && new Date(invoice.dueDate) < startOfToday()) {
    return { label: "Overdue", variant: "danger" };
  }
  return { label: "Issued", variant: "warning" };
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ------------------------------------------------------------------ cedis
 * A dollar invoice is still paid in cedis, out of a cedi bank account. So every dollar figure
 * we show an operator carries its cedi counterpart: the money that moved, or the money we are
 * waiting on. Never one without the other, and never a dollar figure wearing a ₵ sign.
 */

/**
 * What a dollar figure on this invoice is worth in cedis, at the rate locked when it was issued —
 * the same rate printed on the client's copy, so the two documents agree.
 *
 * Null when the invoice is priced in cedis already, or when no rate was ever locked.
 */
export function cedisFor(invoice: Invoice, amount: number): number | null {
  if (invoice.currency !== "USD" || !invoice.fxRateLocked) return null;
  return Math.round(amount * invoice.fxRateLocked * 100) / 100;
}

/**
 * An invoice's outstanding balance in cedis, whatever it is priced in.
 *
 * Totals across a mixed list have to be struck in one currency or they are meaningless — adding
 * $20 to ₵600 gives a number that is neither. Cedis is the honest denominator: it is what leaves
 * the client's account either way.
 */
export function outstandingCedis(invoice: Invoice): number {
  const owed = Math.max(0, invoice.balance);
  if (invoice.currency !== "USD") return owed;
  // balanceGhs is the API's own conversion at the locked rate; fall back for older rows.
  return invoice.balanceGhs !== null ? Math.max(0, invoice.balanceGhs) : (cedisFor(invoice, owed) ?? 0);
}
