import type { Deliverable, DeliverableFolder, DeliverableType } from "@/lib/api/types";

/**
 * Pure helpers over a package's folder tree. The tree is small (tens of folders), so every
 * question is answered by walking the whole list; nothing here is worth indexing.
 */

export function childFolders(folders: DeliverableFolder[], parentId: string | null) {
  return folders.filter((f) => f.parentId === parentId);
}

export function filesIn(files: Deliverable[], folderId: string | null) {
  return files.filter((f) => f.folderId === folderId);
}

/** The folders from the root down to (and including) `id`. Empty for the root. */
export function pathTo(folders: DeliverableFolder[], id: string | null): DeliverableFolder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const path: DeliverableFolder[] = [];
  const seen = new Set<string>();
  let current = id ? byId.get(id) : undefined;
  while (current && !seen.has(current.id)) {
    path.unshift(current);
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

/** True when `candidate` is `folderId` itself or anywhere beneath it. */
export function isWithin(
  folders: DeliverableFolder[],
  candidate: string | null,
  folderId: string,
): boolean {
  return pathTo(folders, candidate).some((f) => f.id === folderId);
}

/** The given folders plus every folder beneath them. */
export function withDescendants(folders: DeliverableFolder[], ids: string[]): Set<string> {
  const found = new Set(ids);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of folders) {
      if (f.parentId && found.has(f.parentId) && !found.has(f.id)) {
        found.add(f.id);
        grew = true;
      }
    }
  }
  return found;
}

/** Everything inside a folder, at any depth: how many files and how many bytes. */
export function folderStats(
  folders: DeliverableFolder[],
  files: Deliverable[],
  folderId: string,
): { files: number; bytes: number; locked: number } {
  const inside = withDescendants(folders, [folderId]);
  let count = 0;
  let bytes = 0;
  let locked = 0;
  for (const f of files) {
    if (f.folderId && inside.has(f.folderId)) {
      count++;
      bytes += f.size ?? 0;
      if (f.locked) locked++;
    }
  }
  return { files: count, bytes, locked };
}

export function totalBytes(files: Deliverable[]) {
  return files.reduce((sum, f) => sum + (f.size ?? 0), 0);
}

const UNITS = ["B", "KB", "MB", "GB", "TB"];

/** "4.2 MB". One decimal below 10 of a unit, none above, so a column of sizes reads evenly. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${UNITS[unit]}`;
}

export function extensionOf(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

/** The name without its extension: what a rename field selects, as Drive and Finder do. */
export function baseName(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(0, dot) : filename;
}

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"];
const VIDEO_EXT = ["mp4", "mov", "webm", "avi", "mkv", "m4v"];

/** Mirrors Deliverable::typeFor in the API. */
export function typeFromName(filename: string): DeliverableType {
  const ext = extensionOf(filename);
  if (IMAGE_EXT.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (VIDEO_EXT.includes(ext)) return "video";
  return "file";
}

/** "3 files", "1 folder". */
export function plural(n: number, word: string) {
  return `${n.toLocaleString("en-GH")} ${word}${n === 1 ? "" : "s"}`;
}

/** "12 Sep 2026", or "14:05" for today. Short enough for a list column on a phone. */
export function shortDate(iso: string | null | undefined, now = new Date()) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}
