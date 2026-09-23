"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError, type PlanItemInput, type WorkPackage } from "@/lib/api";

/**
 * The plan's writes (docs/PLAN.md). Admin actions need the session; the client ones below carry
 * only what the project link already grants. Each answers with the whole package so the screen
 * swaps its copy in one step.
 */
export type PlanResult = { ok: true; pkg: WorkPackage } | { ok: false; error: string };

function revalidatePlan(packageId: string) {
  revalidatePath(`/admin/packages/${packageId}`);
  revalidatePath(`/admin/packages/${packageId}/plan`);
  revalidatePath("/admin/packages");
}

async function run(
  packageId: string,
  fallback: string,
  call: () => Promise<WorkPackage>,
): Promise<PlanResult> {
  try {
    const pkg = await call();
    revalidatePlan(packageId);
    return { ok: true, pkg };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError && e.message ? e.message : fallback };
  }
}

export async function addPlanItem(packageId: string, title: string, input: PlanItemInput = {}) {
  return run(packageId, "Could not add that.", () =>
    api.packages.createPlanItem(packageId, { ...input, title }),
  );
}

export async function editPlanItem(packageId: string, itemId: string, input: PlanItemInput) {
  return run(packageId, "Could not save that.", () =>
    api.packages.updatePlanItem(packageId, itemId, input),
  );
}

export async function deletePlanItem(packageId: string, itemId: string) {
  return run(packageId, "Could not remove that.", () =>
    api.packages.removePlanItem(packageId, itemId),
  );
}

export async function reorderPlan(packageId: string, ids: string[]) {
  return run(packageId, "Could not reorder the plan.", () =>
    api.packages.reorderPlan(packageId, ids),
  );
}

export async function commentOnPlanItem(packageId: string, itemId: string, body: string) {
  return run(packageId, "Could not post that.", () =>
    api.packages.commentOnPlan(packageId, itemId, body),
  );
}
