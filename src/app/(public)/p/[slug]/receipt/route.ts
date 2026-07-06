import { packagePdfResponse } from "@/lib/pdf/package-pdf-response";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return packagePdfResponse(slug, "receipt");
}
