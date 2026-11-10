import { cache } from "react";
import { BoardView } from "@/components/boards/board-view";
import { api, ApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

// The title and the page both need the board; ask the API once per request.
const open = cache((token: string) => api.boards.open(token));

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const board = await open(token).catch(() => null);
  return {
    // Absolute: the person looking is a client, not an operator, so no "Bedrock" in the tab.
    title: { absolute: `${board?.title ?? "Board"} · SaharaBase` },
    // Private by being unguessable: keep it out of search engines and out of the Referer header.
    robots: { index: false, follow: false },
    referrer: "no-referrer" as const,
  };
}

/** A board: drawings to comment on, from a private link (docs/BOARDS.md). */
export default async function BoardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let board;
  try {
    board = await open(token);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return <LinkClosed />;
    throw e;
  }

  return <BoardView side={{ kind: "client", token }} initial={board} />;
}

function LinkClosed() {
  return (
    <section className="mx-auto my-24 max-w-xl px-6 text-center">
      <h1 className="font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.025em]">
        This link is not active
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">Ask the person who sent it for a new one.</p>
    </section>
  );
}
