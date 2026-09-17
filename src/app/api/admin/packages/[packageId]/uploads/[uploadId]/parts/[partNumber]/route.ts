import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { errorResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/**
 * Relay one part to storage. Used until the bucket allows the browser to upload directly
 * (a CORS rule, docs/FILES.md), and as the fallback when a direct send is refused.
 *
 * A part is at most 10 MB, so holding it in memory is fine. Storage needs a Content-Length on
 * every part, which a streamed body cannot give.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string; uploadId: string; partNumber: string }> },
) {
  if (!(await getToken())) return Response.json({ message: "Sign in again." }, { status: 401 });
  const { packageId, uploadId, partNumber } = await params;
  const n = Number(partNumber);
  if (!Number.isInteger(n) || n < 1 || n > 10000) {
    return Response.json({ message: "Bad part number." }, { status: 400 });
  }

  try {
    const urls = await api.packages.signUploadParts(packageId, uploadId, [n]);
    const body = await req.arrayBuffer();
    const res = await fetch(urls[String(n)], { method: "PUT", body, cache: "no-store" });
    if (!res.ok) {
      return Response.json(
        { message: `Storage refused part ${n} (${res.status}).` },
        { status: 502 },
      );
    }
    return Response.json({ etag: res.headers.get("etag") ?? "" });
  } catch (e) {
    return errorResponse(e, `Could not send part ${n}.`);
  }
}
