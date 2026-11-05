import type { NextRequest } from "next/server";
import { api } from "@/lib/api";
import { errorResponse } from "@/lib/files/server";

export const dynamic = "force-dynamic";

/**
 * The whole file in one request, where storage cannot take parts (the local disk in dev). A route
 * handler rather than a server action, so the browser can show progress.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const form = await req.formData();
  const file = form.get("file");
  const part = form.get("part");
  const question = form.get("question");
  if (!(file instanceof File) || typeof part !== "string" || typeof question !== "string") {
    return Response.json({ message: "Choose a file to add." }, { status: 422 });
  }

  try {
    return Response.json(await api.briefs.addFile(token, file, part, question));
  } catch (e) {
    return errorResponse(e, "The file did not go through. Check your internet and try again.");
  }
}
