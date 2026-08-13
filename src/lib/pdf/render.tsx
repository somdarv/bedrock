import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type {
  BillTo,
  ClientAsset,
  ClientType,
  InfrastructureOverview,
  Invoice,
  Payment,
  WorkPackage,
} from "@/lib/api";
import { packageDocumentRefs } from "@/lib/documents/package-refs";
import { VERIFY_BASE_URL } from "@/lib/documents/registry";
import { logoDataUri, registerBrandFonts } from "./brand";
import { InfraReportDocument } from "./infra-report-document";
import { InvoiceDocument } from "./invoice-document";
import { PackageDocument } from "./package-document";
import { StatementDocument } from "./statement-document";

/** The scan-to-verify stamp's QR: always /verify/{reference} on the public verify host. */
async function verifyQrFor(reference: string): Promise<string> {
  return QRCode.toDataURL(`${VERIFY_BASE_URL}/verify/${reference}`, {
    margin: 0,
    width: 220,
    errorCorrectionLevel: "H",
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });
}

/** Render a package invoice/receipt to a PDF buffer (Node only — no headless browser). */
export async function renderPackagePdf(
  pkg: WorkPackage,
  variant: "invoice" | "receipt",
): Promise<Buffer> {
  registerBrandFonts();

  // Scan-to-verify stamp: the QR resolves to /verify/{reference}, which the API answers from
  // live package data, so a doctored PDF disagrees with the page it points at.
  const refs = packageDocumentRefs(pkg.publicSlug, variant);
  const verifyQr = await verifyQrFor(refs.reference);

  return renderToBuffer(
    <PackageDocument
      pkg={pkg}
      variant={variant}
      logo={logoDataUri()}
      verify={{ ...refs, qr: verifyQr }}
    />,
  );
}

/**
 * Render a standalone invoice or its receipt to a PDF buffer.
 *
 * Unlike a package document, the verification identity is not derived here — the API mints it
 * when the invoice is issued and registers it in the `documents` table, so this renders whatever
 * the invoice is actually carrying. A draft has none, which is why it cannot be sent.
 */
export async function renderInvoicePdf(
  invoice: Invoice,
  variant: "invoice" | "receipt",
  opts: { billTo?: BillTo | null; payUrl?: string | null; payment?: Payment | null } = {},
): Promise<Buffer> {
  registerBrandFonts();

  // A receipt for one payment verifies as its OWN document: the payment carries the identity,
  // because each payment is receipted separately and they cannot share a reference.
  const payment = variant === "receipt" ? (opts.payment ?? null) : null;
  const reference =
    (variant === "receipt"
      ? (payment?.receiptDocumentId ?? invoice.receiptDocumentId)
      : invoice.documentId) ?? "";
  const serial =
    (variant === "receipt"
      ? (payment?.receiptSerial ?? invoice.receiptSerial)
      : invoice.serial) ?? "Pending issue";
  const verifyQr = await verifyQrFor(reference);

  return renderToBuffer(
    <InvoiceDocument
      invoice={invoice}
      variant={variant}
      payment={payment}
      billTo={opts.billTo}
      payUrl={opts.payUrl}
      logo={logoDataUri()}
      verify={{ reference: reference || "Pending issue", serial, qr: verifyQr }}
    />,
  );
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

  const verifyQr = await verifyQrFor(opts.reference);

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
