import type { NextRequest } from "next/server";
import { api, ApiError } from "@/lib/api";
import { zipResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/**
 * "Download all" and "Download this folder" on a share link. The API decides what the link may
 * hand over; this only streams what it lists. `?folder=` narrows it to one folder.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const manifest = await api.shares.manifest(token, req.nextUrl.searchParams.get("folder"));
    return zipResponse(manifest, null);
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 502;
    const message =
      status === 403 || status === 404 || status === 410
        ? (e as ApiError).message || "There is nothing to download here."
        : "The download could not start. Please try again.";
    return new Response(message, {
      status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
