import { api, ApiError } from "@/lib/api";
import { renderInfraReportPdf } from "@/lib/pdf/render";

/**
 * Admin-only: the whole-estate Infrastructure Status Report as a PDF — every monitored asset
 * across every client plus Sahara's own infra, generated on demand for internal review before
 * anything client-facing goes out. Auth rides the admin bearer forwarded by the server-side api
 * client; an unauthenticated request surfaces here as 401.
 */
export async function GET() {
  try {
    const overview = await api.infrastructure.overview();
    const pdf = await renderInfraReportPdf(overview);
    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="infrastructure-status-${stamp}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return new Response("Unauthorized", { status: 401 });
    }
    throw e;
  }
}
