import { api, ApiError } from "@/lib/api";
import { publicBaseUrl } from "@/lib/utils";
import { VERIFY_BASE_URL } from "@/lib/documents/registry";
import { renderInvoicePdf } from "./render";

/**
 * Build the HTTP response for a standalone invoice's PDF (invoice or receipt). Public (read by
 * unguessable slug) so Meta can fetch it as a WhatsApp document header and the client can
 * download it — the same contract the package invoice route works under.
 */
export async function invoicePdfResponse(slug: string, variant: "invoice" | "receipt") {
  let invoice;
  try {
    invoice = await api.invoices.getBySlug(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return new Response("Not found", { status: 404 });
    }
    throw e;
  }

  // A receipt only exists once the invoice has actually been settled.
  if (variant === "receipt" && !invoice.receiptDocumentId) {
    return new Response("Not found", { status: 404 });
  }

  // NEXT_PUBLIC_APP_URL is not set everywhere; the verify origin is the same host and always is.
  const base = publicBaseUrl() || VERIFY_BASE_URL;

  const pdf = await renderInvoicePdf(invoice, variant, {
    billTo: invoice.billTo,
    payUrl: base ? `${base}/i/${invoice.publicSlug}` : null,
  });

  const name = invoice.reference?.toLowerCase() ?? slug;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${variant}-${name}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
