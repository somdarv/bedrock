"use server";

import { api, ApiError, type BriefAnswers, type PublicBrief } from "@/lib/api";

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
