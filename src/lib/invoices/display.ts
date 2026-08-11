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
