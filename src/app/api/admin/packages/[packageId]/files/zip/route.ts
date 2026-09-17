import type { NextRequest } from "next/server";
import { api, type FileSelection } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { errorResponse, zipResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ packageId: string }> };

/**
 * Download a selection as one ZIP. POST carries the selection as form fields, so a hidden form
 * can start the download and the browser's own download manager shows the progress. GET takes
 * short `files` / `folders` lists for plain links. Nothing chosen means the whole package.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const form = await req.formData();
  return download((await params).packageId, {
    fileIds: form.getAll("fileIds").map(String).filter(Boolean),
    folderIds: form.getAll("folderIds").map(String).filter(Boolean),
  });
}

export async function GET(req: NextRequest, { params }: Params) {
  const list = (key: string) =>
    (req.nextUrl.searchParams.get(key) ?? "").split(",").filter(Boolean);
  return download((await params).packageId, { fileIds: list("files"), folderIds: list("folders") });
}

async function download(packageId: string, selection: FileSelection) {
  const token = await getToken();
  if (!token) return new Response("Sign in to download files.", { status: 401 });

  try {
    const manifest = await api.packages.fileManifest(packageId, selection);
    return zipResponse(manifest, token);
  } catch (e) {
    return errorResponse(e, "Could not prepare the download.");
  }
}
