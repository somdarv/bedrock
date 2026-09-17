import type { NextRequest } from "next/server";
import { api, ApiError } from "@/lib/api";
import { zipResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/**
 * The client's "Download all" and "Download folder". The API decides what is unlocked; this
 * only streams what it lists. `?folder=` narrows it to one folder.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const manifest = await api.packages.portalManifest(
      slug,
      req.nextUrl.searchParams.get("folder"),
    );
    return zipResponse(manifest, null);
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 502;
    const message =
      status === 403
        ? "These files unlock when the balance is paid."
        : status === 404
          ? "There is nothing to download here yet."
          : "The download could not start. Please try again.";
    return new Response(message, {
      status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
