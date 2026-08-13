import { api, ApiError } from "@/lib/api";
import { publicBaseUrl } from "@/lib/utils";
import { VERIFY_BASE_URL } from "@/lib/documents/registry";
import { renderInvoicePdf } from "./render";

/**
 * Build the HTTP response for a standalone invoice's PDF (invoice or receipt). Public (read by
 * unguessable slug) so Meta can fetch it as a WhatsApp document header and the client can
 * download it — the same contract the package invoice route works under.
 */
export async function invoicePdfResponse(
  slug: string,
  variant: "invoice" | "receipt",
  /** Renders the receipt for ONE payment. Omitted gives the invoice's canonical receipt. */
  paymentId?: string,
) {
  let invoice;
  try {
    invoice = await api.invoices.getBySlug(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return new Response("Not found", { status: 404 });
    }
    throw e;
  }

  // A receipt exists once the money it acknowledges does. Per payment that means the payment
  // must be on this invoice and carry its own minted receipt; without a payment it means the
  // invoice has been settled and has its canonical one.
  const payment = paymentId ? invoice.payments.find((p) => p.id === paymentId) : null;
  if (variant === "receipt") {
    if (paymentId && !payment?.receiptDocumentId) {
      return new Response("Not found", { status: 404 });
    }
    if (!paymentId && !invoice.receiptDocumentId) {
      return new Response("Not found", { status: 404 });
    }
  }

  // NEXT_PUBLIC_APP_URL is not set everywhere; the verify origin is the same host and always is.
  const base = publicBaseUrl() || VERIFY_BASE_URL;

  const pdf = await renderInvoicePdf(invoice, variant, {
    billTo: invoice.billTo,
    payUrl: base ? `${base}/i/${invoice.publicSlug}` : null,
    payment,
  });

  const name = (payment?.receiptReference ?? invoice.reference)?.toLowerCase() ?? slug;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${variant}-${name}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
