import { api, ApiError } from "@/lib/api";
import { frameMissing, framePage } from "@/lib/boards/frame-response";

export const dynamic = "force-dynamic";

/**
 * One frame's page, read with the admin's session, so a board whose link is off still shows.
 * The session cookie is forwarded by the API client; without one the API answers 401.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; frameId: string }> }) {
  const { id, frameId } = await params;
  try {
    const { html } = await api.boards.frame(id, frameId);
    return framePage(html);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 401)) return frameMissing();
    throw e;
  }
}
