import { api, ApiError } from "@/lib/api";
import { renderStatementPdf } from "@/lib/pdf/render";

/**
 * Admin-only: the client's Infrastructure Status Statement as a PDF. Auth rides the admin
 * bearer forwarded by the server-side api client (from the session cookie) — an unauthenticated
 * request is rejected by the Laravel API and surfaces here as 401.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [client, assets] = await Promise.all([
      api.clients.get(id),
      api.infrastructure.listAssets(id),
    ]);

    const pdf = await renderStatementPdf(client.name, assets);
    const safeName = client.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="status-statement-${safeName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return new Response("Not found", { status: 404 });
    if (e instanceof ApiError && e.status === 401) {
      return new Response("Unauthorized", { status: 401 });
    }
    throw e;
  }
}
