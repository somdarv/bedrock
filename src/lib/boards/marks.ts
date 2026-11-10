import type { BoardMark, BoardMarkInput, BoardMarkKind } from "@/lib/api";

/**
 * Drawings on a board (docs/BOARDS.md): what each tool makes, how a drawing is found under the
 * pointer, and how it moves and resizes. Everything here is in board pixels.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "start" | "end";

/** Kinds drawn as a line through points rather than as a box. */
export const LINE_KINDS: BoardMarkKind[] = ["pencil", "pen", "arrow", "line"];
export const isLine = (k: BoardMarkKind) => LINE_KINDS.includes(k);

/** Stroke colours, as a canvas offers them: ink first, then the colours that read on a design. */
export const INKS = ["#1e1e1e", "#868e96", "#e03131", "#f08c00", "#2f9e44", "#1971c2", "#7048e8", "#c2255c"];
/** Note colours: pale, so dark text reads on them. */
export const NOTE_FILLS = ["#ffec99", "#ffd8a8", "#b2f2bb", "#a5d8ff", "#d0bfff", "#fcc2d7", "#e9ecef"];

/** A 26 letter id in the server's alphabet, made here so a drawing can move before it is saved. */
export function newMarkId(): string {
  const alphabet = "0123456789abcdefghjkmnpqrstvwxyz";
  let time = Date.now();
  let head = "";
  for (let i = 0; i < 10; i++) {
    head = alphabet[time % 32] + head;
    time = Math.floor(time / 32);
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let tail = "";
  for (let i = 0; i < 16; i++) tail += alphabet[bytes[i] % 32];
  return head + tail;
}

export function toInput(m: BoardMark): BoardMarkInput {
  return {
    page: m.page,
    kind: m.kind,
    x: m.x,
    y: m.y,
    w: m.w,
    h: m.h,
    points: m.points,
    color: m.color,
    stroke: m.stroke,
    fontSize: m.fontSize,
    text: m.text,
    z: m.z,
  };
}

/** A line's points made absolute, as [x, y] pairs. */
export function absPoints(m: Pick<BoardMark, "x" | "y" | "points">): [number, number][] {
  const p = m.points ?? [];
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < p.length; i += 2) out.push([m.x + p[i], m.y + p[i + 1]]);
  return out;
}

/** Turn absolute points into a drawing's box and its points from the box's corner. */
export function fromPoints(pts: [number, number][]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const points: number[] = [];
  for (const [x, y] of pts) points.push(round(x - minX), round(y - minY));
  return { x: round(minX), y: round(minY), w: round(maxX - minX), h: round(maxY - minY), points };
}

const round = (n: number) => Math.round(n * 10) / 10;

/** The box a drawing takes, its stroke included. */
export function boxOf(m: BoardMark): Rect {
  const pad = isLine(m.kind) ? (m.stroke ?? 2) / 2 + (m.kind === "arrow" ? arrowHead(m) : 0) : 0;
  return { x: m.x - pad, y: m.y - pad, w: m.w + pad * 2, h: m.h + pad * 2 };
}

export function arrowHead(m: Pick<BoardMark, "stroke">) {
  return Math.max(10, (m.stroke ?? 2) * 4);
}

/** The drawing under a board point, the one drawn last first. `tol` is in board pixels. */
export function markAt(marks: BoardMark[], x: number, y: number, tol: number): BoardMark | null {
  for (let i = marks.length - 1; i >= 0; i--) {
    if (hits(marks[i], x, y, tol)) return marks[i];
  }
  return null;
}

function hits(m: BoardMark, x: number, y: number, tol: number): boolean {
  if (isLine(m.kind)) {
    const pts = absPoints(m);
    const reach = tol + (m.stroke ?? 2) / 2;
    for (let i = 0; i + 1 < pts.length; i++) {
      if (toSegment(x, y, pts[i], pts[i + 1]) <= reach) return true;
    }
    return pts.length === 1 && Math.hypot(x - pts[0][0], y - pts[0][1]) <= reach;
  }
  if (m.kind === "oval") {
    const rx = m.w / 2 + tol;
    const ry = m.h / 2 + tol;
    const dx = x - (m.x + m.w / 2);
    const dy = y - (m.y + m.h / 2);
    return rx > 0 && ry > 0 && (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
  }
  if (m.kind === "frame") {
    // A frame is picked by its edge or its title, so what is drawn inside it stays easy to reach.
    const inside = x >= m.x - tol && x <= m.x + m.w + tol && y >= m.y - tol && y <= m.y + m.h + tol;
    const deep = x > m.x + tol * 2 && x < m.x + m.w - tol * 2 && y > m.y + tol * 2 && y < m.y + m.h - tol * 2;
    return inside && !deep;
  }
  return x >= m.x - tol && x <= m.x + m.w + tol && y >= m.y - tol && y <= m.y + m.h + tol;
}

function toSegment(px: number, py: number, a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / len));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

/** A frame (drawn) inside which a point sits, for clicks that pass through its middle. */
export function frameMarkAt(marks: BoardMark[], x: number, y: number): BoardMark | null {
  for (let i = marks.length - 1; i >= 0; i--) {
    const m = marks[i];
    if (m.kind === "frame" && x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h) return m;
  }
  return null;
}

export function moveBy(m: BoardMark, dx: number, dy: number): BoardMark {
  return { ...m, x: round(m.x + dx), y: round(m.y + dy) };
}

/** The handles a drawing offers: two ends for a straight line, eight around anything else. */
export function handlesOf(m: BoardMark): Handle[] {
  if (m.kind === "arrow" || m.kind === "line") return ["start", "end"];
  if (m.kind === "text") return ["w", "e"];
  return ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
}

/** Where a handle sits, in board pixels. */
export function handlePoint(m: BoardMark, h: Handle): [number, number] {
  if (h === "start" || h === "end") {
    const pts = absPoints(m);
    return h === "start" ? pts[0] : pts[pts.length - 1];
  }
  const cx = m.x + m.w / 2;
  const cy = m.y + m.h / 2;
  const x = h.includes("w") ? m.x : h.includes("e") ? m.x + m.w : cx;
  const y = h.startsWith("n") ? m.y : h.startsWith("s") ? m.y + m.h : cy;
  return [x, y];
}

/**
 * Drag a handle of the drawing as it was at the start (`from`) to a board point. A box keeps its
 * opposite side still; a pencil line scales with its box; a straight line moves one end.
 */
export function resize(from: BoardMark, h: Handle, x: number, y: number, keepRatio: boolean): BoardMark {
  if (h === "start" || h === "end") {
    const pts = absPoints(from);
    if (h === "start") pts[0] = [x, y];
    else pts[pts.length - 1] = [x, y];
    return { ...from, ...fromPoints(pts) };
  }
  let left = from.x;
  let top = from.y;
  let right = from.x + from.w;
  let bottom = from.y + from.h;
  if (h.includes("w")) left = x;
  if (h.includes("e")) right = x;
  if (h.startsWith("n")) top = y;
  if (h.startsWith("s")) bottom = y;
  let w = Math.max(4, Math.abs(right - left));
  let hgt = Math.max(4, Math.abs(bottom - top));
  if (keepRatio && from.w > 0 && from.h > 0 && h.length === 2) {
    const ratio = from.w / from.h;
    if (w / hgt > ratio) hgt = w / ratio;
    else w = hgt * ratio;
    if (h.includes("w")) left = right - w;
    if (h.startsWith("n")) top = bottom - hgt;
  }
  const nx = Math.min(left, right);
  const ny = Math.min(top, bottom);
  const next: BoardMark = { ...from, x: round(nx), y: round(ny), w: round(w), h: round(from.kind === "text" ? from.h : hgt) };
  if ((from.kind === "pencil" || from.kind === "pen") && from.points && from.w > 0 && from.h > 0) {
    const sx = w / from.w;
    const sy = hgt / from.h;
    next.points = from.points.map((v, i) => round(v * (i % 2 === 0 ? sx : sy)));
  }
  return next;
}

/** A smooth path through a pencil line's points: the midpoints joined by curves. */
export function smoothPath(pts: [number, number][]): string {
  if (pts.length === 0) return "";
  if (pts.length < 3) return `M${pts.map((p) => p.join(" ")).join(" L")}`;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0]} ${pts[i][1]} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last[0]} ${last[1]}`;
}

/** Drop points closer than `min` to the last kept one, so a slow stroke is not thousands long. */
export function thin(pts: [number, number][], min: number): [number, number][] {
  if (pts.length < 3) return pts;
  const out: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [lx, ly] = out[out.length - 1];
    if (Math.hypot(pts[i][0] - lx, pts[i][1] - ly) >= min) out.push(pts[i]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** A short name for a drawing, for the comment it carries and for screen readers. */
export function markName(m: BoardMark): string {
  const names: Record<BoardMarkKind, string> = {
    text: "Text",
    note: "Note",
    frame: "Frame",
    pencil: "Pencil line",
    pen: "Pen line",
    rect: "Rectangle",
    oval: "Oval",
    arrow: "Arrow",
    line: "Line",
  };
  const words = m.text?.trim().replace(/\s+/g, " ").slice(0, 40);
  return words ? `${names[m.kind]}: ${words}` : names[m.kind];
}
