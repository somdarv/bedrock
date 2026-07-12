import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ClientAsset, InfrastructureOverview, WorkPackage } from "@/lib/api";
import { InfraReportDocument } from "./infra-report-document";
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
  opts?: { summary?: string; closingNote?: string },
): Promise<Buffer> {
  return renderToBuffer(
    <StatementDocument
      clientName={clientName}
      assets={assets}
      summary={opts?.summary}
      closingNote={opts?.closingNote}
    />,
  );
}

/** Render the whole-estate infrastructure status report (every client + our own infra). */
export async function renderInfraReportPdf(overview: InfrastructureOverview): Promise<Buffer> {
  return renderToBuffer(<InfraReportDocument overview={overview} />);
}
