"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError, type PlanRequestInput, type WorkPackage } from "@/lib/api";

/**
 * The plan from a client's link. Whoever holds the link may approve what we finished, ask for
 * something, and talk on a shared item, which is the same trust the file gate already places in
 * it. The name travels with the action as what it is: what they typed, not a verified identity.
 *
 * The API refuses anything internal, so nothing here needs to know about visibility.
 */
export type PortalPlanResult = { ok: true; pkg: WorkPackage } | { ok: false; error: string };

async function run(slug: string, fallback: string, call: () => Promise<WorkPackage>) {
  try {
    const pkg = await call();
    revalidatePath(`/p/${slug}`);
    return { ok: true as const, pkg };
  } catch (e) {
    return { ok: false as const, error: e instanceof ApiError && e.message ? e.message : fallback };
  }
}

export async function approvePlanItem(slug: string, itemId: string, name: string | null) {
  return run(slug, "Could not record that approval.", () =>
    api.packages.approvePlanItem(slug, itemId, name),
  );
}

export async function requestPlanItem(slug: string, input: PlanRequestInput) {
  return run(slug, "Could not send that request.", () => api.packages.requestPlanItem(slug, input));
}

export async function commentAsClient(
  slug: string,
  itemId: string,
  body: string,
  name: string | null,
) {
  return run(slug, "Could not post that.", () =>
    api.packages.clientCommentOnPlan(slug, itemId, body, name),
  );
}
