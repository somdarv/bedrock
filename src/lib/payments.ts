import { balance, effectiveTotal, type WorkPackage } from "@/lib/api";

/** Job-size rule: at or below this is paid 100% upfront; above it splits 40/60. */
export const SMALL_JOB_CEILING = 500;
export const DEPOSIT_RATE = 0.4;

const round2 = (n: number) => Math.round(n * 100) / 100;

export type PaymentRule = "full" | "split";

export interface PaymentPlan {
  rule: PaymentRule;
  /** Amount needed to open the start gate (full total for small jobs). */
  depositDue: number;
  /** Remaining after the deposit (0 for small jobs). */
  finalDue: number;
  total: number;
}

export function computePaymentPlan(total: number): PaymentPlan {
  if (total <= SMALL_JOB_CEILING) {
    return { rule: "full", depositDue: total, finalDue: 0, total };
  }
  const depositDue = round2(total * DEPOSIT_RATE);
  return { rule: "split", depositDue, finalDue: round2(total - depositDue), total };
}

/**
 * Payment methods offered when recording a payment manually. `paystack` is reserved for
 * payments that came through the online Paystack flow (recorded by the webhook, not by hand).
 */
export const PAYMENT_METHODS = [
  { value: "momo", label: "Mobile money (MoMo)" },
  { value: "bank", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "paystack", label: "Paystack (online)" },
  { value: "other", label: "Other" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

/** Human label for a stored payment method value; falls back to the raw value, then a dash. */
export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "—";
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

export function paidTotal(pkg: Pick<WorkPackage, "payments">): number {
  return pkg.payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);
}

/** Start gate: opens once the deposit (or full small-job payment) has landed. */
export function startGateOpen(pkg: WorkPackage): boolean {
  const plan = computePaymentPlan(effectiveTotal(pkg));
  return plan.depositDue > 0 && paidTotal(pkg) >= plan.depositDue;
}

/** Download gate: opens only when the outstanding balance reaches zero. */
export function downloadGateOpen(pkg: WorkPackage): boolean {
  return effectiveTotal(pkg) > 0 && balance(pkg) <= 0;
}
