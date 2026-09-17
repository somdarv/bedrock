import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { errorResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/** Cancel an upload in flight. Storage throws away the parts already sent. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ packageId: string; uploadId: string }> },
) {
  if (!(await getToken())) return Response.json({ message: "Sign in again." }, { status: 401 });
  const { packageId, uploadId } = await params;
  try {
    await api.packages.abortUpload(packageId, uploadId);
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e, "Could not cancel the upload.");
  }
}
