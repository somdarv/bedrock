import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { errorResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/**
 * Relay one part to storage, as the file browser does until the bucket lets browsers send parts
 * straight to it. A part is at most 10 MB, so holding it in memory is fine.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; uploadId: string; partNumber: string }> },
) {
  const { token, uploadId, partNumber } = await params;
  const n = Number(partNumber);
  if (!Number.isInteger(n) || n < 1 || n > 10000) {
    return Response.json({ message: "Bad part number." }, { status: 400 });
  }

  try {
    const urls = await api.briefs.signUploadParts(token, uploadId, [n]);
    const body = await req.arrayBuffer();
    const res = await fetch(urls[String(n)], { method: "PUT", body, cache: "no-store" });
    if (!res.ok) {
      return Response.json({ message: `Storage refused part ${n} (${res.status}).` }, { status: 502 });
    }
    return Response.json({ etag: res.headers.get("etag") ?? "" });
  } catch (e) {
    return errorResponse(e, `Part ${n} of the file did not go through.`);
  }
}
