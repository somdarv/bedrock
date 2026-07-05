/**
 * Documents data layer. Reads from the live bedrock-api when configured, else falls
 * back to the local registry fixtures — the same mock/live split Bedrock uses for its
 * main API, but on an independent switch so documents can go live while clients /
 * packages stay on the mock.
 *
 *   NEXT_PUBLIC_DOCS_SOURCE = "live" | "mock" (default "mock")
 *   NEXT_PUBLIC_API_BASE_URL = origin of bedrock-api, e.g. http://127.0.0.1:8001
 */

import {
  getDocument as mockGet,
  listDocuments as mockList,
  listDocumentsByCategory as mockListByCategory,
  verifyDocument as mockVerify,
  type DocumentCategory,
  type DocumentRecord,
} from "./registry";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const LIVE = process.env.NEXT_PUBLIC_DOCS_SOURCE === "live" && BASE_URL !== "";

export interface PreparedDocument {
  documentId: string;
  serial: string;
  preparedAt: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...init?.headers },
    // Documents change on prepare; never serve a stale cache to server components.
    cache: "no-store",
  });
  if (!res.ok) {
    const err = new Error(`Documents API ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

function is404(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { status?: number }).status === 404;
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  if (!LIVE) return mockList();
  const json = await apiFetch<{ data: DocumentRecord[] }>("/documents");
  return json.data;
}

export async function listDocumentsByCategory(
  category: DocumentCategory,
): Promise<DocumentRecord[]> {
  if (!LIVE) return mockListByCategory(category);
  const json = await apiFetch<{ data: DocumentRecord[] }>(
    `/documents?category=${encodeURIComponent(category)}`,
  );
  return json.data;
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  if (!LIVE) return mockGet(id) ?? null;
  try {
    const json = await apiFetch<{ data: DocumentRecord }>(`/documents/${encodeURIComponent(id)}`);
    return json.data;
  } catch (e) {
    if (is404(e)) return null;
    throw e;
  }
}

/** Public verification lookup — what /verify/{ref} resolves against. */
export async function verifyDocument(ref: string): Promise<DocumentRecord | null> {
  if (!LIVE) return mockVerify(ref);
  try {
    const json = await apiFetch<{ data: DocumentRecord }>(`/verify/${encodeURIComponent(ref)}`);
    return json.data;
  } catch (e) {
    if (is404(e)) return null;
    throw e;
  }
}

/**
 * Prepare (issue) the document — mint its serial + timestamp. Live: the backend
 * persists them so /verify matches. Mock: minted locally.
 */
export async function prepareDocument(id: string): Promise<PreparedDocument> {
  if (!LIVE) {
    const rand = () =>
      Math.floor(Math.random() * 0xffff)
        .toString(16)
        .toUpperCase()
        .padStart(4, "0");
    return { documentId: id, serial: `G-${rand()}-${rand()}`, preparedAt: new Date().toISOString() };
  }
  const json = await apiFetch<{ data: DocumentRecord }>(
    `/documents/${encodeURIComponent(id)}/prepare`,
    { method: "POST" },
  );
  return {
    documentId: json.data.id,
    serial: json.data.serial ?? "",
    preparedAt: json.data.preparedAt ?? new Date().toISOString(),
  };
}
