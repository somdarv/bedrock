import "server-only";
import { revalidatePath } from "next/cache";
import { ApiError, type FileManifest } from "@/lib/api";
import { zipLength, zipStream, type ZipEntrySource } from "./zip";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** The admin pages that show a package's files. */
export function revalidateFiles(packageId: string) {
  revalidatePath(`/admin/packages/${packageId}`);
  revalidatePath(`/admin/packages/${packageId}/files`);
  revalidatePath("/admin/files", "layout");
}

/** `attachment; filename="..."; filename*=UTF-8''...`, safe for any name. */
export function attachment(filename: string) {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/** A JSON error the browser-side upload code can show as it is. */
export function errorResponse(e: unknown, fallback: string) {
  if (e instanceof ApiError) {
    return Response.json({ message: e.message || fallback }, { status: e.status || 500 });
  }
  return Response.json({ message: fallback }, { status: 502 });
}

/**
 * Stream a ZIP of the manifest's files. Each file is fetched from storage (a signed URL) or
 * through the API (local disk), and passed straight into the archive.
 *
 * The bearer token only ever goes to our own API. A signed storage URL carries its own
 * authority, and sending a session token to a third-party host would leak it.
 */
export function zipResponse(manifest: FileManifest, token: string | null): Response {
  if (manifest.files.length === 0) {
    return new Response("There is nothing to download here.", { status: 404 });
  }

  const entries: ZipEntrySource[] = manifest.files.map((f) => ({
    path: f.path,
    size: f.size,
    modifiedAt: f.modifiedAt,
    open: () => openSource(f.url ?? `${API_BASE}${f.apiPath}`, f.url ? null : token),
  }));

  const headers = new Headers({
    "Content-Type": "application/zip",
    "Content-Disposition": attachment(`${manifest.name}.zip`),
    "Cache-Control": "private, no-store",
    // Without this nginx buffers the archive before passing it on, and a large folder looks
    // stalled for minutes before the first byte.
    "X-Accel-Buffering": "no",
  });
  const length = zipLength(entries);
  if (length !== null) headers.set("Content-Length", String(length));

  return new Response(zipStream(entries), { headers });
}

/** Open one file, retrying twice: storage hiccups happen, and a retry here costs nothing yet. */
async function openSource(url: string, token: string | null): Promise<ReadableStream<Uint8Array>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}`, Accept: "*/*" } : undefined,
        cache: "no-store",
      });
      if (res.ok && res.body) return res.body;
      lastError = new Error(`Storage answered ${res.status}`);
      await res.body?.cancel();
    } catch (e) {
      lastError = e;
    }
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("Could not read a file.");
}
