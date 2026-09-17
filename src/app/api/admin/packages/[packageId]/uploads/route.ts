import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { errorResponse, revalidateFiles } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/** Open an upload. The answer tells the browser how to send the bytes (docs/FILES.md). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> },
) {
  if (!(await getToken())) return Response.json({ message: "Sign in again." }, { status: 401 });
  const { packageId } = await params;
  const body = (await req.json()) as {
    filename: string;
    size: number;
    mime: string | null;
    folderId: string | null;
  };

  try {
    const plan = await api.packages.startUpload(packageId, body);
    if (plan.strategy === "done") revalidateFiles(packageId);
    return Response.json(plan);
  } catch (e) {
    return errorResponse(e, "Could not start the upload.");
  }
}
