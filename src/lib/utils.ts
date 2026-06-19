import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DeliverableType } from "@/lib/api/types";

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an amount of Ghana cedis for display. */
export function formatCedis(amount: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(amount);
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
