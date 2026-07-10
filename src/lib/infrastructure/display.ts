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

/** The one-line "what to know" for an asset: expiry countdown, else storage, else a dash. */
export function assetSummary(row: Pick<ClientAsset, "expiryDate" | "daysUntilExpiry" | "metrics">): string {
  return expiryLabel(row) ?? diskLabel(row.metrics) ?? "—";
}
