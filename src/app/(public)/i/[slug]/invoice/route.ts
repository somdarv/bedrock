import { invoicePdfResponse } from "@/lib/pdf/invoice-pdf-response";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return invoicePdfResponse(slug, "invoice");
}
