import { formatCedis } from "@/lib/utils";

/**
 * What a payment of this size holds back at the given rate.
 *
 * Mirrors App\Models\SetAside::sliceOf and the mock's accrueSetAside, so the figure shown the
 * moment money is recorded is the same one the ledger accrued a breath earlier. This computes
 * nothing and stores nothing — it only restates what the API already did.
 */
export function setAsideOf(received: number, ratePercent: number): number {
  if (!(received > 0) || !(ratePercent > 0)) return 0;
  return Math.round(received * (ratePercent / 100) * 100) / 100;
}

/**
 * The confirmation line after money is recorded. Null when nothing accrued, so a workspace with
 * savings switched off never sees the feature at all.
 */
export function setAsideNotice(received: number, ratePercent: number): string | null {
  const amount = setAsideOf(received, ratePercent);
  if (amount <= 0) return null;

  return `Payment recorded. Set aside ${formatCedis(amount)} (${ratePercent}%).`;
}
