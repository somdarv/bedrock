import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { errorResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/** Presigned URLs for a batch of parts, so the browser can send them straight to storage. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string; uploadId: string }> },
) {
  if (!(await getToken())) return Response.json({ message: "Sign in again." }, { status: 401 });
  const { packageId, uploadId } = await params;
  const { parts } = (await req.json()) as { parts: number[] };
  try {
    return Response.json({ urls: await api.packages.signUploadParts(packageId, uploadId, parts) });
  } catch (e) {
    return errorResponse(e, "Could not prepare the upload.");
  }
}
