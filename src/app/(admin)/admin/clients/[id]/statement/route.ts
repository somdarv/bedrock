import { ApiError } from "@/lib/api";
import {
  renderCuratedStatement,
  type CuratedStatementInput,
} from "@/lib/pdf/statement-builder";

function pdfResponse(pdf: Buffer, clientName: string) {
  const safeName = clientName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="status-statement-${safeName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function handleError(e: unknown): Response {
  if (e instanceof ApiError && e.status === 404) return new Response("Not found", { status: 404 });
  if (e instanceof ApiError && e.status === 401) return new Response("Unauthorized", { status: 401 });
  throw e;
}

/**
 * Admin-only: the client's Infrastructure Status Statement as a PDF. Auth rides the admin
 * bearer forwarded by the server-side api client (from the session cookie) — an unauthenticated
 * request is rejected by the Laravel API and surfaces here as 401.
 *
 * GET  → the auto statement (every asset, auto-recommendations, generated summary).
 * POST → a curated statement: the composer sends the included assets (ordered, with any
 *        recommendation overrides) plus an edited summary / closing note.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { clientName, pdf } = await renderCuratedStatement(id, {});
    return pdfResponse(pdf, clientName);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = (await req.json()) as CuratedStatementInput;
    const { clientName, pdf } = await renderCuratedStatement(id, body);
    return pdfResponse(pdf, clientName);
  } catch (e) {
    return handleError(e);
  }
}
