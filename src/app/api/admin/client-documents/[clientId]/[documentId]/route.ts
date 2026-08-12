import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Admin proxy for a document we sent a client (invoice, receipt, statement, uploaded proposal).
 *
 * The browser cannot carry the httpOnly Sanctum cookie to the Laravel API cross-origin, so this
 * server-side route reads the token and forwards it, then streams the file back. Same shape as
 * the deliverable preview proxy. Never exposed publicly — the upstream is behind auth:sanctum,
 * and it is scoped to the client so one client's id cannot reach another's file.
 *
 * `?download=1` saves the file; otherwise a PDF opens inline in a new tab.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; documentId: string }> },
) {
  const { clientId, documentId } = await params;
  const token = (await cookies()).get("bedrock_token")?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const wantsDownload = req.nextUrl.searchParams.get("download") === "1";

  try {
    const upstream = await fetch(
      `${BASE_URL}/api/admin/clients/${clientId}/documents/${documentId}/download${
        wantsDownload ? "?download=1" : ""
      }`,
      // Follows the redirect to R2's signed URL in production; streams directly in dev.
      { headers: { Authorization: `Bearer ${token}`, Accept: "*/*" }, cache: "no-store" },
    );

    if (!upstream.ok || !upstream.body) {
      return new Response("That document is unavailable.", { status: upstream.status || 502 });
    }

    const buf = await upstream.arrayBuffer();
    const headers = new Headers();
    headers.set("content-type", upstream.headers.get("content-type") ?? "application/pdf");
    // Keep upstream's filename when it sent one, so a saved file is not named after the route.
    const disposition = upstream.headers.get("content-disposition");
    headers.set(
      "content-disposition",
      disposition ?? (wantsDownload ? "attachment" : "inline"),
    );
    headers.set("cache-control", "private, no-store");

    return new Response(buf, { status: 200, headers });
  } catch (e) {
    return new Response(`Proxy error: ${e instanceof Error ? e.message : "unknown"}`, {
      status: 502,
    });
  }
}
