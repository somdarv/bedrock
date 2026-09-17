import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Admin access to a clean original, for viewing (`inline`) or saving (`?download=1`).
 *
 * The browser can't carry the httpOnly Sanctum cookie to the Laravel API cross-origin, so this
 * route reads the token and asks the API on the browser's behalf. The API answers with a
 * short-lived signed storage URL, and that redirect is passed straight back: the file then
 * travels from R2 to the browser without passing through this server. (It used to be fetched
 * and held here in full, which for a 2 GB video meant 2 GB of memory per view.)
 *
 * On the local disk (dev) there is no signed URL, so the API streams the file and this route
 * streams it on without buffering.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string; deliverableId: string }> },
) {
  const { packageId, deliverableId } = await params;
  const token = (await cookies()).get("bedrock_token")?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const download = req.nextUrl.searchParams.get("download") === "1";

  try {
    const upstream = await fetch(
      `${BASE_URL}/api/admin/packages/${packageId}/deliverables/${deliverableId}/original${download ? "?download=1" : ""}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
        cache: "no-store",
        redirect: "manual",
      },
    );

    const location = upstream.headers.get("location");
    if (upstream.status >= 300 && upstream.status < 400 && location) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: location,
          // The signed URL lives for 30 minutes; let the browser reuse this hop for a while.
          "Cache-Control": download ? "no-store" : "private, max-age=600",
        },
      });
    }

    if (!upstream.ok || !upstream.body) {
      return new Response("File unavailable", { status: upstream.status || 502 });
    }

    const headers = new Headers({ "Cache-Control": "private, no-store" });
    for (const name of ["content-type", "content-length", "content-disposition"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: 200, headers });
  } catch (e) {
    return new Response(`Proxy error: ${e instanceof Error ? e.message : "unknown"}`, {
      status: 502,
    });
  }
}
