"use server";

import { api, ApiError, type TrackResult } from "@/lib/api";

export async function sendTrackingCode(phone: string): Promise<{ ok?: boolean; error?: string }> {
  if (!phone.trim()) return { error: "Enter your phone number." };
  try {
    await api.track.request(phone.trim());
    return { ok: true };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not send a code. Please try again." };
  }
}

export async function verifyTrackingCode(
  phone: string,
  code: string,
): Promise<{ result?: TrackResult; error?: string }> {
  if (!/^\d{6}$/.test(code.trim())) return { error: "Enter the 6-digit code." };
  try {
    const result = await api.track.verify(phone.trim(), code.trim());
    return { result };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "That code is invalid or has expired." };
  }
}
