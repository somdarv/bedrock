import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { ClientAsset, ClientType, InfrastructureOverview, WorkPackage } from "@/lib/api";
import { VERIFY_BASE_URL } from "@/lib/documents/registry";
import { logoDataUri, registerBrandFonts } from "./brand";
import { InfraReportDocument } from "./infra-report-document";
import { PackageDocument } from "./package-document";
import { StatementDocument } from "./statement-document";

/** Render a package invoice/receipt to a PDF buffer (Node only — no headless browser). */
export async function renderPackagePdf(
  pkg: WorkPackage,
  variant: "invoice" | "receipt",
): Promise<Buffer> {
  registerBrandFonts();

  return renderToBuffer(<PackageDocument pkg={pkg} variant={variant} logo={logoDataUri()} />);
}

export interface StatementRenderOpts {
  summary?: string;
  closingNote?: string;
  clientType?: ClientType;
  /** Verification reference the QR resolves to (…/verify/{reference}). */
  reference: string;
  /** Verification serial — present only on an issued (not preview) statement. */
  serial?: string;
  preparedBy?: { name: string; phone?: string };
  /** True on a preview → SPECIMEN watermark + "pending issue" serial. */
  specimen?: boolean;
  issuedDate?: string;
}

/** Render a client's infrastructure status statement (branded, with a verify QR) to a PDF buffer. */
export async function renderStatementPdf(
  clientName: string,
  assets: ClientAsset[],
  opts: StatementRenderOpts,
): Promise<Buffer> {
  registerBrandFonts();

  const verifyUrl = `${VERIFY_BASE_URL}/verify/${opts.reference}`;
  const verifyQr = await QRCode.toDataURL(verifyUrl, {
    margin: 0,
    width: 220,
    errorCorrectionLevel: "H",
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });

  return renderToBuffer(
    <StatementDocument
      clientName={clientName}
      clientType={opts.clientType}
      assets={assets}
      summary={opts.summary}
      closingNote={opts.closingNote}
      logo={logoDataUri()}
      meta={{
        reference: opts.reference,
        serial: opts.serial,
        verifyQr,
        issuedDate: opts.issuedDate,
        preparedBy: opts.preparedBy,
        specimen: opts.specimen,
      }}
    />,
  );
}

/** Render the whole-estate infrastructure status report (every client + our own infra). */
export async function renderInfraReportPdf(overview: InfrastructureOverview): Promise<Buffer> {
  return renderToBuffer(<InfraReportDocument overview={overview} />);
}
