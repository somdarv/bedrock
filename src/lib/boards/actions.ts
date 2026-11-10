"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError, type AdminBoard, type BoardMark, type BoardMarkInput, type BoardPinInput, type PublicBoard } from "@/lib/api";

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

/** Mark the owner's inbox read up to the newest thing it showed. */
export async function markInboxRead(until: string | null) {
  try {
    await api.boards.inboxSeen(until);
    revalidatePath("/admin/boards");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "The inbox was not marked read. Try again." };
  }
}

/* ------------------------------------------------------------------ drawings */

export type MarkResult = { ok: true; mark: BoardMark | null } | { ok: false; error: string };

async function runMark(fallback: string, call: () => Promise<BoardMark | void>): Promise<MarkResult> {
  try {
    return { ok: true, mark: (await call()) ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError && e.message && e.status < 500 ? e.message : fallback };
  }
}

const NOT_SAVED = "That drawing did not save. Check your internet.";

/** Save a drawing from the link, under the name typed there, or from our side. */
export async function saveMark(
  side: { kind: "client"; token: string; name: string } | { kind: "us"; id: string },
  markId: string,
  input: BoardMarkInput,
) {
  return runMark(NOT_SAVED, () =>
    side.kind === "us"
      ? api.boards.saveMark(side.id, markId, input)
      : api.boards.publicSaveMark(side.token, markId, { ...input, name: side.name }),
  );
}

export async function removeMark(side: { kind: "client"; token: string } | { kind: "us"; id: string }, markId: string) {
  return runMark("That drawing was not removed. Check your internet.", () =>
    side.kind === "us" ? api.boards.removeMark(side.id, markId) : api.boards.publicRemoveMark(side.token, markId),
  );
}

export async function restoreMark(side: { kind: "client"; token: string } | { kind: "us"; id: string }, markId: string) {
  return runMark("That drawing did not come back. Check your internet.", () =>
    side.kind === "us" ? api.boards.restoreMark(side.id, markId) : api.boards.publicRestoreMark(side.token, markId),
  );
}
