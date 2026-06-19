import type { WorkPackageStatus } from "@/lib/api";

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
