import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Admin deliverable preview proxy. The browser can't carry the httpOnly Sanctum cookie to the
 * Laravel API cross-origin, so this server-side route reads the token and forwards it, then
 * streams the clean original back inline for the admin's own preview. Never exposed publicly —
 * the upstream endpoint is behind auth:sanctum.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ packageId: string; deliverableId: string }> },
) {
  const { packageId, deliverableId } = await params;
  const token = (await cookies()).get("bedrock_token")?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  try {
    const upstream = await fetch(
      `${BASE_URL}/api/admin/packages/${packageId}/deliverables/${deliverableId}/original`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "*/*" }, cache: "no-store" },
    );

    if (!upstream.ok || !upstream.body) {
      return new Response("Preview unavailable", { status: upstream.status || 502 });
    }

    const buf = await upstream.arrayBuffer();
    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    headers.set("content-disposition", "inline");
    headers.set("cache-control", "private, no-store");

    return new Response(buf, { status: 200, headers });
  } catch (e) {
    return new Response(`Proxy error: ${e instanceof Error ? e.message : "unknown"}`, {
      status: 502,
    });
  }
}
