import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { errorResponse, revalidateFiles } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/**
 * Single-request upload, for storage that cannot take parts (the local disk in dev, and the
 * mock). A route handler rather than a server action so the browser can report progress.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> },
) {
  if (!(await getToken())) return Response.json({ message: "Sign in again." }, { status: 401 });
  const { packageId } = await params;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ message: "Choose a file to upload." }, { status: 422 });
  }

  try {
    const pkg = await api.packages.addDeliverable(
      packageId,
      file,
      (form.get("folderId") as string | null) || null,
    );
    revalidateFiles(packageId);
    return Response.json(pkg);
  } catch (e) {
    return errorResponse(e, "Upload failed.");
  }
}
