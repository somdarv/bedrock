import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { errorResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/** Signed addresses for a batch of parts, so the browser can send them straight to storage. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; uploadId: string }> },
) {
  const { token, uploadId } = await params;
  const { parts } = (await req.json()) as { parts: number[] };
  try {
    return Response.json({ urls: await api.briefs.signUploadParts(token, uploadId, parts) });
  } catch (e) {
    return errorResponse(e, "The file could not continue. Try again.");
  }
}
