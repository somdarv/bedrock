import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DeliverableType } from "@/lib/api/types";

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an amount of Ghana cedis for display, e.g. "₵1,234.56". */
export function formatCedis(amount: number) {
  const value = new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `₵${value}`;
}

/**
 * Base origin for public, client-facing links (the portal). Uses the configured
 * production URL when set, otherwise the current origin in the browser.
 */
export function publicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"];
const VIDEO_EXT = ["mp4", "mov", "webm", "avi", "mkv", "m4v"];

/** Infer the deliverable type from a filename, or null if unsupported. */
export function deliverableTypeFromName(filename: string): DeliverableType | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (VIDEO_EXT.includes(ext)) return "video";
  return null;
}
