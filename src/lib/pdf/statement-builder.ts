import "server-only";
import type { ClientAsset } from "@/lib/api";
import { api } from "@/lib/api";
import { renderStatementPdf } from "./render";

/**
 * Shared server-side builder for a curated Infrastructure Status Statement. Both the preview route
 * and the "prepare & send" action pull the client's live assets, apply the operator's curation
 * (which items, in order, with any recommendation overrides), and render one PDF — so preview and
 * the sent document are always byte-identical for the same input.
 */
export interface CuratedStatementInput {
  summary?: string;
  closingNote?: string;
  items?: { assetId: string; recommendation?: string }[];
}

/** Order + filter to the chosen assets, applying recommendation overrides. Empty selection → all. */
export function curateAssets(
  assets: ClientAsset[],
  items?: CuratedStatementInput["items"],
): ClientAsset[] {
  const byId = new Map(assets.map((a) => [a.id, a]));
  const chosen = (items ?? [])
    .map((item) => {
      const asset = byId.get(item.assetId);
      if (!asset) return null;
      const rec = item.recommendation?.trim();
      // Only override when the field was sent; empty string clears the recommendation.
      return rec !== undefined ? { ...asset, recommendation: rec || null } : asset;
    })
    .filter((a): a is ClientAsset => a !== null);
  return chosen.length > 0 ? chosen : assets;
}

/** Verification identity of an issued statement. Absent fields → a specimen (preview). */
export interface StatementIssue {
  /** Registered verification reference; minted here as a specimen when omitted. */
  reference?: string;
  /** Verification serial; when present the document renders as issued (no SPECIMEN mark). */
  serial?: string;
  preparedBy?: { name: string; phone?: string };
}

/** e.g. SB-INF-20260712-K3Q9 — the public verification reference for a statement. */
export function mintStatementReference(date = new Date()): string {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SB-INF-${ymd}-${rand}`;
}

/** e.g. SAH-INF-2026-9F3A1C — minted when a statement is issued. */
export function mintStatementSerial(date = new Date()): string {
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `SAH-INF-${date.getFullYear()}-${rand}`;
}

export async function renderCuratedStatement(
  clientId: string,
  input: CuratedStatementInput,
  issue: StatementIssue = {},
): Promise<{ clientName: string; pdf: Buffer; reference: string }> {
  const [client, assets] = await Promise.all([
    api.clients.get(clientId),
    api.infrastructure.listAssets(clientId),
  ]);
  const curated = curateAssets(assets, input.items);
  const reference = issue.reference ?? mintStatementReference();
  const pdf = await renderStatementPdf(client.name, curated, {
    summary: input.summary,
    closingNote: input.closingNote,
    reference,
    serial: issue.serial,
    preparedBy: issue.preparedBy,
    // No serial → this is a preview: mark it SPECIMEN so it can't pass as issued.
    specimen: !issue.serial,
  });
  return { clientName: client.name, pdf, reference };
}
