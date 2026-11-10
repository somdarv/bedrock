import { api, ApiError } from "@/lib/api";
import { frameMissing, framePage } from "@/lib/boards/frame-response";

export const dynamic = "force-dynamic";

/** One frame's page, for the board behind a private link. Served with scripts off. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; frameId: string }> }) {
  const { token, frameId } = await params;
  try {
    const { html } = await api.boards.openFrame(token, frameId);
    return framePage(html);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return frameMissing();
    throw e;
  }
}
