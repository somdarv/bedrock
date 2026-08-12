import type { BillingMode, WorkPackageStatus } from "@/lib/api";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface StatusMeta {
  label: string;
  variant: BadgeVariant;
}

export const STATUS_META: Record<WorkPackageStatus, StatusMeta> = {
  draft: { label: "Draft", variant: "default" },
  sent: { label: "Sent", variant: "info" },
  awaiting_deposit: { label: "Awaiting deposit", variant: "warning" },
  in_progress: { label: "In progress", variant: "info" },
  review: { label: "Review", variant: "info" },
  awaiting_final_payment: { label: "Awaiting final payment", variant: "warning" },
  delivered: { label: "Delivered", variant: "success" },
  closed: { label: "Closed", variant: "default" },
};

export function statusMeta(status: WorkPackageStatus): StatusMeta {
  return STATUS_META[status];
}

/**
 * Allowed forward transitions. Leaving `draft` happens only via the "send invoice"
 * action (which also fires notifications), so it is not listed as a manual move.
 */
export const ALLOWED_TRANSITIONS: Record<WorkPackageStatus, WorkPackageStatus[]> = {
  draft: [],
  sent: ["awaiting_deposit"],
  awaiting_deposit: ["in_progress"],
  in_progress: ["review"],
  review: ["awaiting_final_payment"],
  awaiting_final_payment: ["delivered"],
  delivered: ["closed"],
  closed: [],
};

/**
 * Deferred billing skips the two states that exist only to wait for money — the work is
 * invoiced after it is done. The waiting states still lead forward so a package switched to
 * deferred while parked in one is not stranded there. Mirrors the backend's own table.
 */
export const DEFERRED_TRANSITIONS: Record<WorkPackageStatus, WorkPackageStatus[]> = {
  draft: [],
  sent: ["in_progress"],
  awaiting_deposit: ["in_progress"],
  in_progress: ["review"],
  review: ["delivered"],
  awaiting_final_payment: ["delivered"],
  delivered: ["closed"],
  closed: [],
};

export function nextTransitions(
  status: WorkPackageStatus,
  billingMode: BillingMode = "gated",
): WorkPackageStatus[] {
  return (billingMode === "deferred" ? DEFERRED_TRANSITIONS : ALLOWED_TRANSITIONS)[status];
}
