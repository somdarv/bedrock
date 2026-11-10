import type { BoardFrame, BoardPin, PublicBoard } from "@/lib/api";

/**
 * Small helpers for the board screen (docs/BOARDS.md). Browser storage only keeps conveniences
 * on this device: the name typed once, and a comment not yet sent. A private window or a
 * blocked store simply forgets them.
 */
export const store = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null || value === "") window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch {
      // Storage refused: the text stays on screen, it just will not outlive the tab.
    }
  },
};

/** The name a person typed on any board, kept on their device. */
export const NAME_KEY = "board-name";

export const draftKey = (board: string, pinId: string | null) =>
  pinId ? `board:${board}:reply:${pinId}` : `board:${board}:new`;

export function clamp(value: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, value));
}

/** The page a frame sits on. A frame naming no page, or a board without pages, is on the first. */
export function pageOf(board: PublicBoard, frame: BoardFrame): string | null {
  if (board.pages.length === 0) return null;
  const known = board.pages.some((p) => p.id === frame.page);
  return known ? frame.page : board.pages[0].id;
}

export function framesOn(board: PublicBoard, page: string | null): BoardFrame[] {
  return board.frames.filter((f) => pageOf(board, f) === page);
}

/** Reading order on a phone: row by row, top to bottom, then left to right. */
export function readingOrder(frames: BoardFrame[]): BoardFrame[] {
  return [...frames].sort((a, b) => (Math.abs(a.y - b.y) > 40 ? a.y - b.y : a.x - b.x));
}

/** Open pins first, by number; then the ones marked done. */
export function pinOrder(pins: BoardPin[]): { open: BoardPin[]; done: BoardPin[] } {
  const byNumber = [...pins].sort((a, b) => a.number - b.number);
  return { open: byNumber.filter((p) => !p.doneAt), done: byNumber.filter((p) => p.doneAt) };
}

/** Ghana keeps UTC all year, so one fixed zone reads the same on the server and the phone. */
export function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Accra",
  });
}

/** The box that holds every frame and title on a page, in board pixels. */
export function bounds(frames: BoardFrame[], notes: { x: number; y: number }[]) {
  if (frames.length === 0) return { x: 0, y: 0, w: 1280, h: 800 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const f of frames) {
    minX = Math.min(minX, f.x);
    minY = Math.min(minY, f.y - 48);
    maxX = Math.max(maxX, f.x + f.w);
    maxY = Math.max(maxY, f.y + f.h);
  }
  for (const n of notes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** One letter for an avatar: the first letter of the name, or a dot when there is none. */
export function initial(name: string) {
  const letter = name.trim().match(/\p{L}|\p{N}/u)?.[0];
  return letter ? letter.toLocaleUpperCase("en-GB") : "•";
}

/** "now", "41m", "3h", "2d", then the date. Read on the device, after the first paint. */
export function ago(iso: string, now = Date.now()) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / (60 * 24))}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Accra" });
}

/** The people on a pin, first speaker first, each once. */
export function speakers(pin: { comments: { author: string; side: "client" | "us" }[] }) {
  const seen = new Map<string, "client" | "us">();
  for (const c of pin.comments) if (!seen.has(c.author)) seen.set(c.author, c.side);
  return [...seen.entries()].map(([author, side]) => ({ author, side }));
}
