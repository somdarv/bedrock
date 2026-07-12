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

export async function renderCuratedStatement(
  clientId: string,
  input: CuratedStatementInput,
): Promise<{ clientName: string; pdf: Buffer }> {
  const [client, assets] = await Promise.all([
    api.clients.get(clientId),
    api.infrastructure.listAssets(clientId),
  ]);
  const curated = curateAssets(assets, input.items);
  const pdf = await renderStatementPdf(client.name, curated, {
    summary: input.summary,
    closingNote: input.closingNote,
  });
  return { clientName: client.name, pdf };
}
