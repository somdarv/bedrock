import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { WorkPackage } from "@/lib/api";
import { PackageDocument } from "./package-document";

/** Render a package invoice/receipt to a PDF buffer (Node only — no headless browser). */
export async function renderPackagePdf(
  pkg: WorkPackage,
  variant: "invoice" | "receipt",
): Promise<Buffer> {
  return renderToBuffer(<PackageDocument pkg={pkg} variant={variant} />);
}
