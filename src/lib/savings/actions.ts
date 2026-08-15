"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";

export interface SavingsActionState {
  ok?: boolean;
  error?: string;
}

const fail = (e: unknown, fallback: string): SavingsActionState => ({
  error: e instanceof ApiError ? e.message : fallback,
});

function revalidateSavings() {
  revalidatePath("/admin/savings");
  revalidatePath("/admin/settings");
}

/**
 * Set the percentage of every payment received to hold back.
 *
 * Applies to money that arrives from now on. Entries already in the ledger keep the rate they
 * accrued at, so a change here never rewrites a figure you have already moved cedis against.
 */
export async function setSavingsRate(ratePercent: number): Promise<SavingsActionState> {
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 50) {
    return { error: "Enter a rate between 0 and 50 percent." };
  }
  try {
    await api.savings.setRate(ratePercent);
  } catch (e) {
    return fail(e, "Could not save the savings rate.");
  }
  revalidateSavings();
  return { ok: true };
}

/** Tick one entry off as actually transferred out of the operating account. */
export async function markSetAsideMoved(
  id: string,
  note?: string | null,
): Promise<SavingsActionState> {
  try {
    await api.savings.move(id, note);
  } catch (e) {
    return fail(e, "Could not mark that set-aside as moved.");
  }
  revalidateSavings();
  return { ok: true };
}

export async function markSetAsidePending(id: string): Promise<SavingsActionState> {
  try {
    await api.savings.unmove(id);
  } catch (e) {
    return fail(e, "Could not reopen that set-aside.");
  }
  revalidateSavings();
  return { ok: true };
}

/** One transfer covering every outstanding slice, which is how the money usually moves. */
export async function markAllSetAsidesMoved(): Promise<SavingsActionState> {
  try {
    await api.savings.moveAll();
  } catch (e) {
    return fail(e, "Could not mark the outstanding set-asides as moved.");
  }
  revalidateSavings();
  return { ok: true };
}
