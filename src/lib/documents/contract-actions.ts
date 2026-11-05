"use server";

import { headers } from "next/headers";
import { api, ApiError } from "@/lib/api";
import type { DocumentAcceptance } from "./registry";

export type AcceptResult =
  | { ok: true; acceptance: DocumentAcceptance }
  | { ok: false; error: string };

/**
 * One person accepts a contract from its private link. The token is the only key, and the API
 * checks it. The hub calls the API for the signer, so it passes on the address and browser it saw,
 * which we keep as proof of who pressed the button.
 */
export async function acceptContract(
  token: string,
  input: { name: string; phone: string; agreed: boolean },
): Promise<AcceptResult> {
  const sent = await headers();
  const clientIp =
    sent.get("x-forwarded-for")?.split(",")[0]?.trim() || sent.get("x-real-ip") || null;

  try {
    const record = await api.contracts.accept(token, {
      ...input,
      clientIp,
      clientAgent: sent.get("user-agent"),
    });
    if (record.acceptance) return { ok: true, acceptance: record.acceptance };
  } catch (e) {
    // Someone has already signed it, perhaps this person in another tab. Show who.
    if (e instanceof ApiError && e.status === 409) {
      const record = await api.contracts.open(token).catch(() => null);
      if (record?.acceptance) return { ok: true, acceptance: record.acceptance };
    }
    if (e instanceof ApiError && e.message) return { ok: false, error: e.message };
  }

  return { ok: false, error: "This did not go through. Check your internet and try again." };
}
