import { notFound } from "next/navigation";
import { BoardView } from "@/components/boards/board-view";
import { api, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await api.boards.get(id).catch(() => null);
  return { title: board?.title ?? "Board" };
}

/** A board, our side: the same screen as the link, plus closing pins and turning the link off. */
export default async function AdminBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSession();

  let board;
  try {
    board = await api.boards.get(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <BoardView
      side={{ kind: "us", id: board.id, token: board.token, userName: user.name || "SaharaBase", closedAt: board.closedAt }}
      initial={board}
    />
  );
}
