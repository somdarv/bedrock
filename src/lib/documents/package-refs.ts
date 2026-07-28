import "server-only";
import { createHash } from "node:crypto";

/**
 * Verification identity for a package billing document (invoice / receipt).
 *
 * These documents are rendered on the fly from a work package, so they have no row in the
 * document registry. Instead the reference encodes the package itself, and the API answers it
 * from live package data (VerifyController::packageDocument) — the printed document and the
 * verification page can only agree if both came from the same package.
 *
 * The derivation is mirrored in bedrock-api's VerifyController (same scheme, same hash).
 * Change one and you must change the other, or every printed QR stops verifying.
 */

export type PackageDocumentVariant = "invoice" | "receipt";

export interface PackageDocumentRefs {
  /** Verification reference the QR resolves to, e.g. "SAH-INV-8F1C2A90". */
  reference: string;
  /** Short reference printed as the document number, e.g. "SB-8F1C-2A90". */
  number: string;
  /** Verification serial printed on the document, e.g. "A1B2-C3D4-E5F6". */
  serial: string;
}

/** The first 8 hex characters of the slug — a UUID's first group. */
function slugHead(slug: string): string {
  return slug.replace(/-/g, "").slice(0, 8).toUpperCase().padEnd(8, "0");
}

export function packageDocumentRefs(
  slug: string,
  variant: PackageDocumentVariant,
): PackageDocumentRefs {
  const head = slugHead(slug);
  const digest = createHash("sha256").update(`${slug}:${variant}`).digest("hex").slice(0, 12).toUpperCase();

  return {
    reference: `SAH-${variant === "receipt" ? "RCT" : "INV"}-${head}`,
    number: `SB-${head.slice(0, 4)}-${head.slice(4)}`,
    serial: `${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}`,
  };
}
