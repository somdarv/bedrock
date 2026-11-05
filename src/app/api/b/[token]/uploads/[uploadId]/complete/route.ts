import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { errorResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/** Join the parts into the finished file. Answers with the whole list. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; uploadId: string }> },
) {
  const { token, uploadId } = await params;
  const { parts } = (await req.json()) as { parts: { partNumber: number; etag: string }[] };
  try {
    return Response.json(await api.briefs.completeUpload(token, uploadId, parts));
  } catch (e) {
    return errorResponse(e, "The file did not finish. Please add it again.");
  }
}
