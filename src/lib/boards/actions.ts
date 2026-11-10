"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError, type AdminBoard, type BoardPinInput, type PublicBoard } from "@/lib/api";

/**
 * Boards (docs/BOARDS.md). The link's side writes under the name the person typed; ours under
 * the admin's session. The API checks the token, the session and the shape of what arrives, so
 * nothing here needs to.
 */
export type BoardResult<T> = { ok: true; board: T } | { ok: false; error: string };

async function run<T>(fallback: string, call: () => Promise<T>): Promise<BoardResult<T>> {
  try {
    return { ok: true, board: await call() };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError && e.message && e.status < 500 ? e.message : fallback };
  }
}

/* ------------------------------------------------------------------ the link */

export async function loadPublicBoard(token: string) {
  return run<PublicBoard>("The board did not load. Check your internet.", () => api.boards.open(token));
}

export async function dropPublicPin(token: string, input: BoardPinInput & { name: string }) {
  return run<PublicBoard>("Your comment did not send. Check your internet and try again.", () =>
    api.boards.publicPin(token, input),
  );
}

export async function replyPublic(token: string, pinId: string, input: { body: string; name: string }) {
  return run<PublicBoard>("Your reply did not send. Check your internet and try again.", () =>
    api.boards.publicReply(token, pinId, input),
  );
}

/* ------------------------------------------------------------------ our side */

export async function loadAdminBoard(id: string) {
  return run<AdminBoard>("The board did not load. Check your internet.", () => api.boards.get(id));
}

export async function dropAdminPin(id: string, input: BoardPinInput) {
  return run<AdminBoard>("Your comment did not send. Try again.", () => api.boards.pin(id, input));
}

export async function replyAdmin(id: string, pinId: string, body: string) {
  return run<AdminBoard>("Your reply did not send. Try again.", () => api.boards.reply(id, pinId, body));
}

export async function setPinDone(id: string, pinId: string, done: boolean) {
  return run<AdminBoard>(done ? "The pin was not closed. Try again." : "The pin was not opened. Try again.", () =>
    api.boards.setDone(id, pinId, done),
  );
}

export async function setBoardClosed(id: string, closed: boolean) {
  const result = await run<AdminBoard>("The link did not change. Try again.", () => api.boards.setClosed(id, closed));
  revalidatePath("/admin/boards");
  return result;
}
