import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { KeyboardEvent } from "react";
import type { DeliverableType } from "@/lib/api/types";

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Run an action when Enter is pressed in a field.
 *
 * A field inside a real form with a submit button should already do this by itself. It is not
 * dependable on `type="password"`: a browser password manager showing its own dropdown can
 * swallow the keypress before the form sees it. Calling preventDefault first means the manual
 * path and the implicit one can never both fire, so this is safe to add to a field that already
 * submits.
 */
export function onEnter(action: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    action();
  };
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
    process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")
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
