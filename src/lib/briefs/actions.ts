"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError, type BriefAnswers, type PublicBrief, type WorkPackage } from "@/lib/api";
import { briefForm, trackedParts } from "@/lib/briefs/forms";

/**
 * A brief, saved from its link. Whoever holds the link may change the answers; the API checks
 * the token and the shape of what arrives, so nothing here needs to.
 */
export type BriefResult = { ok: true; brief: PublicBrief } | { ok: false; error: string };

async function run(fallback: string, call: () => Promise<PublicBrief>): Promise<BriefResult> {
  try {
    return { ok: true, brief: await call() };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError && e.message ? e.message : fallback };
  }
}

export async function saveBrief(token: string, answers: BriefAnswers) {
  return run("Your last answers did not save. Check your internet.", () => api.briefs.save(token, answers));
}

export async function sendBrief(token: string, answers: BriefAnswers) {
  return run("Your answers did not send. Check your internet and try again.", () =>
    api.briefs.send(token, answers),
  );
}

/** One part of a needs list is ready. Its answers go with it, so nothing typed is left behind. */
export async function sendBriefPart(token: string, part: string, answers: BriefAnswers) {
  return run("This part did not send. Check your internet and try again.", () =>
    api.briefs.sendPart(token, part, answers),
  );
}

export async function removeBriefFile(token: string, fileId: string) {
  return run("The file was not removed. Check your internet and try again.", () =>
    api.briefs.removeFile(token, fileId),
  );
}

/**
 * Our side: make a project's needs list, or add the form's new parts to its plan. The parts come
 * from the form here, in the hub, because the questions live in code; the API only keeps them.
 */
export async function makeNeedsList(
  packageId: string,
  formKey: string,
  name: string,
): Promise<{ ok: true; pkg: WorkPackage } | { ok: false; error: string }> {
  const form = briefForm(formKey);
  if (!form || form.layout !== "parts") return { ok: false, error: "That list is not in this build." };
  try {
    const pkg = await api.briefs.forPackage(packageId, {
      form: form.key,
      name: name.trim() || "Client",
      parts: trackedParts(form),
    });
    revalidatePath(`/admin/packages/${packageId}`);
    revalidatePath("/admin/briefs");
    return { ok: true, pkg };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError && e.message ? e.message : "Could not make the list." };
  }
}
