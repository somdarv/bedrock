import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { errorResponse, revalidateFiles } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/** Join the parts into the finished file. Answers with the whole package. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string; uploadId: string }> },
) {
  if (!(await getToken())) return Response.json({ message: "Sign in again." }, { status: 401 });
  const { packageId, uploadId } = await params;
  const { parts } = (await req.json()) as { parts: { partNumber: number; etag: string }[] };
  try {
    const pkg = await api.packages.completeUpload(packageId, uploadId, parts);
    revalidateFiles(packageId);
    return Response.json(pkg);
  } catch (e) {
    return errorResponse(e, "Could not finish the upload.");
  }
}
