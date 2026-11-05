import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { errorResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/** Stop an upload part of the way. Storage throws away the parts already sent. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; uploadId: string }> },
) {
  const { token, uploadId } = await params;
  try {
    await api.briefs.abortUpload(token, uploadId);
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e, "Could not stop the upload.");
  }
}
