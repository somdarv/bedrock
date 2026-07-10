import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ClientAsset, WorkPackage } from "@/lib/api";
import { PackageDocument } from "./package-document";
import { StatementDocument } from "./statement-document";

/** Render a package invoice/receipt to a PDF buffer (Node only — no headless browser). */
export async function renderPackagePdf(
  pkg: WorkPackage,
  variant: "invoice" | "receipt",
): Promise<Buffer> {
  return renderToBuffer(<PackageDocument pkg={pkg} variant={variant} />);
}

/** Render a client's infrastructure status statement to a PDF buffer. */
export async function renderStatementPdf(
  clientName: string,
  assets: ClientAsset[],
): Promise<Buffer> {
  return renderToBuffer(<StatementDocument clientName={clientName} assets={assets} />);
}
