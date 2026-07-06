import { api, ApiError } from "@/lib/api";
import { renderPackagePdf } from "./render";

/**
 * Build the HTTP response for a package invoice/receipt PDF. Public (read by unguessable
 * slug) so Meta can fetch it as a WhatsApp document header and the client can download it.
 */
export async function packagePdfResponse(slug: string, variant: "invoice" | "receipt") {
  let pkg;
  try {
    pkg = await api.packages.getBySlug(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return new Response("Not found", { status: 404 });
    }
    throw e;
  }

  const pdf = await renderPackagePdf(pkg, variant);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${variant}-${slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
