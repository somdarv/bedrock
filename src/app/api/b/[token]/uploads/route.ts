import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { errorResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/**
 * A client opens an upload from their needs list. No sign-in: the link's token is the key, and
 * the API checks it and the part on every step (docs/FILES.md).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await req.json()) as {
    filename: string;
    size: number;
    mime: string | null;
    part: string;
    question: string;
  };

  try {
    return Response.json(await api.briefs.startUpload(token, body));
  } catch (e) {
    return errorResponse(e, "The file could not start. Check your internet and try again.");
  }
}
