import { invoicePdfResponse } from "@/lib/pdf/invoice-pdf-response";

/**
 * The receipt for ONE payment on an invoice.
 *
 * A receipt acknowledges a single payment, so each one is its own document with its own
 * verifiable reference. `/i/{slug}/receipt` without a payment still resolves to the canonical
 * receipt of a settled invoice, which is what every link issued before this existed points at.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; paymentId: string }> },
) {
  const { slug, paymentId } = await params;
  return invoicePdfResponse(slug, "receipt", paymentId);
}
