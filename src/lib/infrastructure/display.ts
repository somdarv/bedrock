import type { AssetMetrics, AssetStatus, AssetType, ClientAsset } from "@/lib/api";

/** Shared presentation helpers for infrastructure assets (used by server pages + the client view). */

export type StatusBadgeVariant = "success" | "warning" | "danger" | "default";

export const STATUS_VARIANT: Record<AssetStatus, StatusBadgeVariant> = {
  ok: "success",
  warn: "warning",
  critical: "danger",
  down: "danger",
  unknown: "default",
};

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  domain: "Domain",
  ssl: "SSL",
  hosting: "Hosting",
  site: "Site",
};

export function formatBytes(n?: number): string | null {
  if (!n || n <= 0) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export function expiryLabel(row: {
  expiryDate: string | null;
  daysUntilExpiry: number | null;
}): string | null {
  if (!row.expiryDate) return null;
  const d = row.daysUntilExpiry;
  if (d === null) return row.expiryDate;
  if (d < 0) return `expired ${-d}d ago`;
  return `in ${d}d`;
}

export function diskLabel(metrics: AssetMetrics | null): string | null {
  const used = formatBytes(metrics?.diskUsed);
  if (!used) return null;
  const limit = formatBytes(metrics?.diskLimit);
  return limit ? `${used} / ${limit}` : used;
}

/** Short countdown chip text: "210d", "exp", or "—". */
function daysShort(days: number | null | undefined): string {
  if (days === null || days === undefined) return "—";
  return days < 0 ? "exp" : `${days}d`;
}

export interface WebsiteFacet {
  key: "Domain" | "SSL" | "Site";
  status: AssetStatus;
  label: string;
}

/** The three health facets of a website (domain) asset, for the row's chips. */
export function websiteFacets(
  a: Pick<ClientAsset, "daysUntilExpiry" | "metrics">,
): WebsiteFacet[] {
  const m = a.metrics ?? {};
  return [
    { key: "Domain", status: m.regStatus ?? "unknown", label: daysShort(a.daysUntilExpiry) },
    { key: "SSL", status: m.sslStatus ?? "unknown", label: daysShort(m.sslDays) },
    {
      key: "Site",
      status: m.siteStatus ?? "unknown",
      label: m.siteUp === 1 ? "up" : m.siteUp === 0 ? "down" : "—",
    },
  ];
}

/** The one-line "what to know" for an asset: website facets, expiry countdown, storage, or a dash. */
export function assetSummary(
  row: Pick<ClientAsset, "type" | "expiryDate" | "daysUntilExpiry" | "metrics">,
): string {
  if (row.type === "domain") {
    return websiteFacets(row)
      .map((f) => `${f.key} ${f.label}`)
      .join(" · ");
  }
  return expiryLabel(row) ?? diskLabel(row.metrics) ?? "—";
}
