"use client";

import * as React from "react";
import type { BoardAnchor, BoardFrame, BoardMark, BoardMarkKind, BoardNote, BoardPin } from "@/lib/api";
import { blockAt } from "@/lib/boards/inspect";
import {
  between,
  boxOf,
  fromPoints,
  handlePoint,
  handlesOf,
  markAt,
  moveBy,
  newMarkId,
  overlaps,
  resize,
  thin,
  unionBox,
  type Handle,
  type Rect,
} from "@/lib/boards/marks";
import { bounds, clamp, readingOrder } from "@/lib/boards/view";
import { cn } from "@/lib/utils";
import { MarkView } from "./board-marks";
import { PinBubble } from "./board-panel";

/**
 * The canvas, as the Claude design canvas works (docs/BOARDS.md).
 *
 * - Moving round it: Space and drag, the wheel button, the hand, or two fingers on a trackpad.
 *   Pinch, or Ctrl and the wheel, zooms. A plain drag never moves the canvas, except a finger on
 *   a phone, which has no Space or wheel button.
 * - Select: a click picks a drawing or the outermost block of a design (a double click goes one
 *   level in); a drag draws a box that picks every drawing it touches, or the area of the design
 *   under it; Shift and a click adds or takes away a drawing. Dragging what is selected moves it.
 * - Comment: a click drops the comment on what is under it; a drag puts it on the area dragged.
 * - The drawing tools make text, frames, notes, pencil and pen lines, rectangles, ovals, arrows
 *   and lines.
 */

export type Tool =
  | "select"
  | "hand"
  | "comment"
  | "text"
  | "frame"
  | "note"
  | "pencil"
  | "pen"
  | "rect"
  | "oval"
  | "arrow"
  | "line";

export type Selection =
  | { kind: "mark"; id: string }
  | { kind: "marks"; ids: string[] }
  | { kind: "frame"; frameId: string }
  | {
      kind: "element";
      frameId: string;
      rect: Rect;
      path: string;
      label: string;
      depth: number;
      /** Where it was picked, on the frame, so a double click can go one level in from there. */
      at: { x: number; y: number };
    }
  /** An area dragged out: on a design in its pixels, or on the board. */
  | { kind: "area"; frameId: string | null; rect: Rect }
  | null;

export const selectedIds = (s: Selection): string[] => (s?.kind === "mark" ? [s.id] : s?.kind === "marks" ? s.ids : []);

/** Where a new comment goes and what it is about. */
export type Spot = { frameId: string | null; page: string | null; x: number; y: number; anchor: BoardAnchor | null };

/** A comment's pin with its place on the board. */
export type PinPlace = { pin: BoardPin; x: number; y: number };

export type ToScreen = (x: number, y: number) => { x: number; y: number };

export interface CanvasHandle {
  fit(): void;
  fitRect(r: Rect): void;
  zoomBy(factor: number): void;
  zoomTo(z: number): void;
  zoom(): number;
}

/** What the drawing tools start with: an ink, a note colour and a line width in screen pixels. */
export type DrawStyle = { ink: string; noteFill: string; strokePx: number };

export interface ZoomMenuActions {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoomToSelection: () => void;
}

interface Props {
  frames: BoardFrame[];
  marks: BoardMark[];
  notes: BoardNote[];
  page: string | null;
  fitKey: string;
  tool: Tool;
  style: DrawStyle;
  selection: Selection;
  onSelect: (s: Selection) => void;
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onEdited: (mark: BoardMark, text: string, height: number, fontSize: number) => void;
  onCreate: (mark: BoardMark, edit: boolean) => void;
  /** Drawings moved or resized: as they were, and as they are now, in the same order. */
  onCommit: (before: BoardMark[], after: BoardMark[]) => void;
  pins: PinPlace[];
  selectedPinId: string | null;
  /** A box to show while a comment is open: the block, area or drawing it is about. Board pixels. */
  highlight: Rect | null;
  draft: Spot | null;
  onSelectPin: (id: string) => void;
  onComment: (spot: Spot) => void;
  onBackground: () => void;
  insetRight: number;
  src: (frame: BoardFrame) => string;
  author: { name: string; side: "client" | "us" };
  zoomMenu: ZoomMenuActions;
  overlay?: (toScreen: ToScreen, size: { w: number; h: number }, zoom: number) => React.ReactNode;
  selectionBar?: (rect: Rect, zoom: number) => React.ReactNode;
  /** The bar over a text or note while its words are being typed. */
  editBar?: (rect: Rect, mark: BoardMark, zoom: number) => React.ReactNode;
}

const MIN_Z = 0.02;
const MAX_Z = 8;
const PAD = 56;

const BOX_KINDS: Partial<Record<Tool, BoardMarkKind>> = { rect: "rect", oval: "oval", frame: "frame", note: "note", text: "text" };

/** The comment cursor: a speech bubble whose point is the spot. */
const COMMENT_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M3 25V14a11 11 0 1 1 11 11z' fill='%23111' stroke='white' stroke-width='2'/%3E%3C/svg%3E\") 3 25, crosshair";

type Gesture =
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number; moved: boolean }
  | { kind: "pinch"; dist: number; z: number; mx: number; my: number; vx: number; vy: number }
  | { kind: "band"; mode: "select" | "comment"; sx: number; sy: number; bx: number; by: number; moved: boolean }
  | { kind: "move"; from: BoardMark[]; bx: number; by: number; moved: boolean; click: BoardMark }
  | { kind: "resize"; from: BoardMark; handle: Handle }
  | { kind: "box"; mark: BoardMark; bx: number; by: number }
  | { kind: "line"; mark: BoardMark; bx: number; by: number }
  | { kind: "draw"; mark: BoardMark; pts: [number, number][] };

type Hover = { kind: "mark"; id: string } | { kind: "frame"; frameId: string; block: Rect | null } | null;

export const BoardCanvas = React.forwardRef<CanvasHandle, Props>(function BoardCanvas(props, ref) {
  const {
    frames,
    marks,
    notes,
    page,
    fitKey,
    tool,
    style,
    selection,
    onSelect,
    editingId,
    onEdited,
    onCreate,
    onEdit,
    onCommit,
    pins,
    selectedPinId,
    highlight,
    draft,
    onSelectPin,
    onComment,
    onBackground,
    insetRight,
    src,
    author,
    zoomMenu,
    overlay,
    selectionBar,
    editBar,
  } = props;

  const box = React.useRef<HTMLDivElement>(null);
  const [view, setView] = React.useState({ x: 0, y: 0, z: 0.2 });
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const viewRef = React.useRef(view);
  viewRef.current = view;

  // Drawings being made, moved or resized, shown before they are saved.
  const [live, setLive] = React.useState<BoardMark[]>([]);
  const liveRef = React.useRef<BoardMark[]>([]);
  const show = (ms: BoardMark[]) => {
    liveRef.current = ms;
    setLive(ms);
  };
  const [band, setBand] = React.useState<Rect | null>(null);
  const [hover, setHover] = React.useState<Hover>(null);
  const [pen, setPen] = React.useState<{ pts: [number, number][]; at: [number, number] | null } | null>(null);
  const [space, setSpace] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const gesture = React.useRef<Gesture | null>(null);
  const lastTap = React.useRef({ t: 0, x: 0, y: 0 });

  /* ---------------------------------------------------------------- size and zoom */

  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    read();
    const watch = new ResizeObserver(read);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  const fitBox = React.useCallback(
    (b: Rect, top: number, maxZ: number) => {
      const el = box.current;
      if (!el) return;
      const w = el.clientWidth - insetRight;
      const h = el.clientHeight;
      const z = clamp(Math.min((w - PAD * 2) / Math.max(b.w, 1), (h - top - PAD) / Math.max(b.h, 1)), MIN_Z, maxZ);
      setView({ z, x: (w - b.w * z) / 2 - b.x * z, y: Math.max(top, (h - b.h * z) / 2) - b.y * z });
    },
    [insetRight],
  );

  const pageBounds = React.useCallback((): Rect => {
    if (frames.length === 0 && marks.length === 0) return bounds(frames, notes);
    const parts: Rect[] = [];
    if (frames.length) parts.push(bounds(frames, notes));
    const drawn = unionBox(marks);
    if (drawn) parts.push(drawn);
    const x = Math.min(...parts.map((p) => p.x));
    const y = Math.min(...parts.map((p) => p.y));
    const r = Math.max(...parts.map((p) => p.x + p.w));
    const b = Math.max(...parts.map((p) => p.y + p.h));
    return { x, y, w: r - x, h: b - y };
  }, [frames, notes, marks]);

  const fit = React.useCallback(() => fitBox(pageBounds(), 88, 1), [fitBox, pageBounds]);

  const zoomAt = React.useCallback((px: number, py: number, nextZ: number) => {
    setView((v) => {
      const z = clamp(nextZ, MIN_Z, MAX_Z);
      return { z, x: px - ((px - v.x) / v.z) * z, y: py - ((py - v.y) / v.z) * z };
    });
  }, []);

  React.useImperativeHandle(
    ref,
    () => ({
      fit,
      fitRect: (r) => fitBox({ x: r.x, y: r.y - 32, w: r.w, h: r.h + 32 }, 72, 2),
      zoomBy: (f) => {
        const el = box.current;
        if (el) zoomAt(el.clientWidth / 2, el.clientHeight / 2, viewRef.current.z * f);
      },
      zoomTo: (z) => {
        const el = box.current;
        if (el) zoomAt(el.clientWidth / 2, el.clientHeight / 2, z);
      },
      zoom: () => viewRef.current.z,
    }),
    [fit, fitBox, zoomAt],
  );

  // A new page, or the first paint: show everything on it. A phone opens on the first design
  // instead, since a whole page at phone width is too small to read.
  React.useLayoutEffect(() => {
    const first = readingOrder(frames)[0];
    if (first && (box.current?.clientWidth ?? 0) < 768) fitBox({ x: first.x, y: first.y - 32, w: first.w, h: first.h + 32 }, 72, 2);
    else fit();
    // Only when the page changes, never on a new drawing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // Two fingers on a trackpad move the canvas; a pinch, or Ctrl with the wheel, zooms.
  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-float]") && !e.ctrlKey) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      const rect = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        const dy = clamp(e.deltaY * unit, -60, 60);
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, viewRef.current.z * Math.exp(-dy * 0.012));
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX * unit, y: v.y - e.deltaY * unit }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // Space held is the hand, for as long as it is down. A pen line ends with Enter or Escape.
  React.useEffect(() => {
    const typing = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpace(true);
      }
      if (pen && (e.key === "Enter" || e.key === "Escape")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        finishPen(false);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpace(false);
    };
    const lost = () => setSpace(false);
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", lost);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", lost);
    };
  });

  // A new tool drops a pen line half made, and any outline from the last one.
  React.useEffect(() => {
    if (tool !== "pen") setPen(null);
    setHover(null);
  }, [tool]);

  /* ---------------------------------------------------------------- what is where */

  const shown = React.useMemo(() => {
    if (live.length === 0) return marks;
    const ids = new Set(live.map((m) => m.id));
    return [...marks.filter((m) => !ids.has(m.id)), ...live];
  }, [marks, live]);
  const ordered = React.useMemo(() => [...shown].sort((a, b) => a.z - b.z || a.id.localeCompare(b.id)), [shown]);
  const behind = ordered.filter((m) => m.kind === "frame");
  const above = ordered.filter((m) => m.kind !== "frame");

  const toBoard = (sx: number, sy: number) => {
    const v = viewRef.current;
    return { x: (sx - v.x) / v.z, y: (sy - v.y) / v.z };
  };
  const toScreen: ToScreen = (x, y) => ({ x: view.x + x * view.z, y: view.y + y * view.z });
  const local = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const frameAt = (x: number, y: number) => {
    for (let i = frames.length - 1; i >= 0; i--) {
      const f = frames[i];
      if (x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h) return f;
    }
    return null;
  };
  const tol = () => 6 / viewRef.current.z;
  const activeTool: Tool = space ? "hand" : tool;

  /** The drawing under a point that a press should take: a drawn frame only by its edge, and never through a design. */
  const takeMark = (x: number, y: number) => {
    const hit = markAt(shown, x, y, tol());
    return hit && !(hit.kind === "frame" && frameAt(x, y)) ? hit : null;
  };

  const chosen = selectedIds(selection);
  const chosenMarks = shown.filter((m) => chosen.includes(m.id));
  const single = chosenMarks.length === 1 ? chosenMarks[0] : null;

  const handleAt = (sx: number, sy: number): Handle | null => {
    if (!single || editingId) return null;
    for (const h of handlesOf(single)) {
      const [hx, hy] = handlePoint(single, h);
      const p = toScreen(hx, hy);
      if (Math.abs(p.x - sx) <= 10 && Math.abs(p.y - sy) <= 10) return h;
    }
    return null;
  };

  /** A block of a design under a board point, at a depth, or the whole design. */
  const pickInFrame = (f: BoardFrame, bx: number, by: number, depth: number): Selection => {
    const fx = bx - f.x;
    const fy = by - f.y;
    const found = blockAt(f, fx, fy, depth);
    return found
      ? { kind: "element", frameId: f.id, ...found.block, depth: found.depth, at: { x: fx, y: fy } }
      : { kind: "frame", frameId: f.id };
  };

  /** An area dragged out: kept to the design it started on, in that design's pixels. */
  const areaOf = (r: Rect, startX: number, startY: number): { frameId: string | null; rect: Rect } => {
    const f = frameAt(startX, startY);
    if (!f) return { frameId: null, rect: r };
    const x = clamp(r.x, f.x, f.x + f.w);
    const y = clamp(r.y, f.y, f.y + f.h);
    const right = clamp(r.x + r.w, f.x, f.x + f.w);
    const bottom = clamp(r.y + r.h, f.y, f.y + f.h);
    return { frameId: f.id, rect: { x: round2(x - f.x), y: round2(y - f.y), w: round2(right - x), h: round2(bottom - y) } };
  };

  const newMark = (kind: BoardMarkKind, x: number, y: number): BoardMark => {
    const z = viewRef.current.z;
    return {
      id: newMarkId(),
      page,
      kind,
      x: round2(x),
      y: round2(y),
      w: 0,
      h: 0,
      points: kind === "arrow" || kind === "line" ? [0, 0, 0, 0] : null,
      color: kind === "note" ? style.noteFill : kind === "frame" ? "#ffffff" : style.ink,
      stroke: kind === "frame" ? round2(2 / z) : round2(style.strokePx / z),
      fontSize: kind === "text" ? round2(20 / z) : kind === "note" ? round2(18 / z) : null,
      text: kind === "frame" ? "Frame" : kind === "text" || kind === "note" ? "" : null,
      z: Date.now(),
      author: author.name,
      side: author.side,
      updatedAt: null,
    };
  };

  /* ---------------------------------------------------------------- pointer */

  const begin = (g: Gesture | null) => {
    gesture.current = g;
    setBusy(g !== null && g.kind !== "pan");
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest("[data-float]")) return;
    if (e.pointerType === "mouse" && e.button === 2) return;
    // Words being typed are read back first, before this press does anything else.
    if (editingId) (document.activeElement as HTMLElement | null)?.blur?.();
    box.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    const v = viewRef.current;

    if (pointers.current.size === 2) {
      // A second finger: whatever the first was doing becomes a pinch.
      show([]);
      setBand(null);
      const [a, b] = [...pointers.current.values()];
      begin({
        kind: "pinch",
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        z: v.z,
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
        vx: v.x,
        vy: v.y,
      });
      return;
    }
    if (pointers.current.size > 2) return;

    const s = local(e);
    const p = toBoard(s.x, s.y);
    const pan: Gesture = { kind: "pan", sx: s.x, sy: s.y, vx: v.x, vy: v.y, moved: false };
    const touch = e.pointerType === "touch";

    if (e.pointerType === "mouse" && e.button === 1) {
      e.preventDefault();
      begin({ ...pan, moved: true });
      return;
    }

    switch (activeTool) {
      case "hand":
        begin(pan);
        return;
      case "comment":
        begin({ kind: "band", mode: "comment", sx: s.x, sy: s.y, bx: p.x, by: p.y, moved: false });
        return;
      case "select": {
        const handle = handleAt(s.x, s.y);
        if (handle && single) {
          begin({ kind: "resize", from: single, handle });
          return;
        }
        const hit = takeMark(p.x, p.y);
        if (hit) {
          if (e.shiftKey) {
            // Shift and a click adds a drawing to what is selected, or takes it away.
            const next = chosen.includes(hit.id) ? chosen.filter((id) => id !== hit.id) : [...chosen, hit.id];
            onSelect(next.length === 0 ? null : next.length === 1 ? { kind: "mark", id: next[0] } : { kind: "marks", ids: next });
            begin(null);
            return;
          }
          const group = chosen.includes(hit.id) ? chosenMarks : [hit];
          if (!chosen.includes(hit.id)) onSelect({ kind: "mark", id: hit.id });
          begin({ kind: "move", from: group, bx: p.x, by: p.y, moved: false, click: hit });
          return;
        }
        // A finger moves the canvas; a mouse or a pen draws a box to select with.
        begin(touch ? pan : { kind: "band", mode: "select", sx: s.x, sy: s.y, bx: p.x, by: p.y, moved: false });
        return;
      }
      case "pencil": {
        const mark = newMark("pencil", p.x, p.y);
        begin({ kind: "draw", mark, pts: [[p.x, p.y]] });
        show([{ ...mark, points: [0, 0] }]);
        return;
      }
      case "pen":
        setPen((cur) => (cur ? { pts: [...cur.pts, [p.x, p.y]], at: [p.x, p.y] } : { pts: [[p.x, p.y]], at: [p.x, p.y] }));
        begin(pan);
        return;
      case "arrow":
      case "line":
        begin({ kind: "line", mark: newMark(activeTool, p.x, p.y), bx: p.x, by: p.y });
        return;
      default: {
        const kind = BOX_KINDS[activeTool];
        if (kind) begin({ kind: "box", mark: newMark(kind, p.x, p.y), bx: p.x, by: p.y });
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = local(e);
    if (!pointers.current.has(e.pointerId)) {
      if (e.pointerType === "mouse") hoverAt(s.x, s.y);
      return;
    }
    pointers.current.set(e.pointerId, s);
    const g = gesture.current;
    if (!g) return;
    const p = toBoard(s.x, s.y);

    switch (g.kind) {
      case "pinch": {
        if (pointers.current.size < 2) return;
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const z = clamp((g.z * dist) / g.dist, MIN_Z, MAX_Z);
        setView({ z, x: mx - ((g.mx - g.vx) / g.z) * z, y: my - ((g.my - g.vy) / g.z) * z });
        return;
      }
      case "pan": {
        const dx = s.x - g.sx;
        const dy = s.y - g.sy;
        if (!g.moved && Math.hypot(dx, dy) < 5) return;
        g.moved = true;
        setView((v) => ({ ...v, x: g.vx + dx, y: g.vy + dy }));
        return;
      }
      case "band": {
        if (!g.moved && Math.hypot(s.x - g.sx, s.y - g.sy) < 5) return;
        g.moved = true;
        setBand(between(g.sx, g.sy, s.x, s.y));
        return;
      }
      case "move": {
        const dx = p.x - g.bx;
        const dy = p.y - g.by;
        if (!g.moved && Math.hypot(dx, dy) * viewRef.current.z < 4) return;
        g.moved = true;
        show(g.from.map((m) => moveBy(m, dx, dy)));
        return;
      }
      case "resize":
        show([resize(g.from, g.handle, p.x, p.y, e.shiftKey)]);
        return;
      case "box": {
        let w = p.x - g.bx;
        let h = p.y - g.by;
        if (e.shiftKey || g.mark.kind === "note") {
          const side = Math.max(Math.abs(w), Math.abs(h));
          w = Math.sign(w || 1) * side;
          h = Math.sign(h || 1) * side;
        }
        show([
          {
            ...g.mark,
            x: round2(Math.min(g.bx, g.bx + w)),
            y: round2(Math.min(g.by, g.by + h)),
            w: round2(Math.abs(w)),
            h: round2(g.mark.kind === "text" ? 30 / viewRef.current.z : Math.abs(h)),
          },
        ]);
        return;
      }
      case "line": {
        let ex = p.x;
        let ey = p.y;
        if (e.shiftKey) {
          // Shift keeps the line to steps of 45 degrees.
          const ang = Math.round(Math.atan2(ey - g.by, ex - g.bx) / (Math.PI / 4)) * (Math.PI / 4);
          const len = Math.hypot(ex - g.bx, ey - g.by);
          ex = g.bx + Math.cos(ang) * len;
          ey = g.by + Math.sin(ang) * len;
        }
        show([{ ...g.mark, ...fromPoints([[g.bx, g.by], [ex, ey]]) }]);
        return;
      }
      case "draw":
        g.pts.push([p.x, p.y]);
        show([{ ...g.mark, ...fromPoints(g.pts) }]);
        return;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const s = local(e);
    const had = pointers.current.has(e.pointerId);
    pointers.current.delete(e.pointerId);
    const g = gesture.current;

    if (g?.kind === "pinch") {
      if (pointers.current.size === 1) {
        // One finger left after a pinch: carry on as a drag from where it is, without a jump.
        const rest = [...pointers.current.values()][0];
        const v = viewRef.current;
        begin({ kind: "pan", sx: rest.x, sy: rest.y, vx: v.x, vy: v.y, moved: true });
      } else if (pointers.current.size === 0) begin(null);
      return;
    }
    if (pointers.current.size > 0 || !had || !g) return;
    begin(null);
    setBand(null);

    const now = performance.now();
    const double = now - lastTap.current.t < 320 && Math.hypot(s.x - lastTap.current.x, s.y - lastTap.current.y) < 8;
    const p = toBoard(s.x, s.y);
    const z = viewRef.current.z;
    const made = liveRef.current;
    show([]);

    const tapped = () => {
      lastTap.current = { t: double ? 0 : now, x: s.x, y: s.y };
    };

    switch (g.kind) {
      case "pan":
        if (g.moved) return;
        tapped();
        click(p.x, p.y, double);
        return;
      case "band": {
        if (!g.moved) {
          tapped();
          click(p.x, p.y, double);
          return;
        }
        const r = between(g.bx, g.by, p.x, p.y);
        const area = areaOf(r, g.bx, g.by);
        if (g.mode === "comment") {
          const { frameId, rect } = area;
          onComment({ frameId, page, x: rect.x + rect.w, y: rect.y, anchor: { kind: "area", rect } });
          return;
        }
        // A drawn frame is taken only when the box holds all of it, so a box inside one picks what is in it.
        const hits = shown.filter((m) => {
          const b = boxOf(m);
          if (m.kind !== "frame") return overlaps(b, r);
          return b.x >= r.x && b.y >= r.y && b.x + b.w <= r.x + r.w && b.y + b.h <= r.y + r.h;
        });
        if (hits.length === 1) onSelect({ kind: "mark", id: hits[0].id });
        else if (hits.length > 1) onSelect({ kind: "marks", ids: hits.map((m) => m.id) });
        else onSelect({ kind: "area", ...area });
        return;
      }
      case "move":
        if (g.moved && made.length) {
          const byId = new Map(made.map((m) => [m.id, m]));
          onCommit(g.from, g.from.map((m) => byId.get(m.id) ?? m));
          return;
        }
        tapped();
        if (double && (g.click.kind === "text" || g.click.kind === "note")) onEdit(g.click.id);
        else if (!double && chosen.length > 1) onSelect({ kind: "mark", id: g.click.id });
        return;
      case "resize":
        if (made[0]) onCommit([g.from], [made[0]]);
        return;
      case "box": {
        const drawn = made[0];
        const mark = drawn && drawn.id === g.mark.id && drawn.w * z >= 6 ? drawn : defaultBox(g.mark, z);
        onCreate(mark, mark.kind === "text" || mark.kind === "note");
        return;
      }
      case "line": {
        const drawn = made[0];
        if (drawn && drawn.id === g.mark.id && Math.hypot(drawn.w, drawn.h) * z >= 6) onCreate(drawn, false);
        else onCreate({ ...g.mark, ...fromPoints([[g.bx, g.by], [g.bx + 160 / z, g.by]]) }, false);
        return;
      }
      case "draw": {
        const pts = thin(g.pts, 1.5 / z);
        if (pts.length === 1) pts.push([pts[0][0] + 0.5 / z, pts[0][1] + 0.5 / z]);
        onCreate({ ...g.mark, ...fromPoints(pts) }, false);
        return;
      }
    }
  };

  /** A press that did not move: select, comment, or end a pen line, as the tool says. */
  function click(x: number, y: number, double: boolean) {
    if (activeTool === "pen") {
      if (double) finishPen(true);
      return;
    }
    const f = frameAt(x, y);
    const hit = takeMark(x, y);

    if (activeTool === "comment") {
      if (hit) {
        onComment({ frameId: null, page, x, y, anchor: { kind: "mark", markId: hit.id } });
      } else if (f) {
        const picked = pickInFrame(f, x, y, 0);
        onComment({
          frameId: f.id,
          page: f.page,
          x: x - f.x,
          y: y - f.y,
          anchor:
            picked?.kind === "element"
              ? { kind: "element", rect: picked.rect, path: picked.path, label: picked.label }
              : { kind: "frame" },
        });
      } else {
        onComment({ frameId: null, page, x, y, anchor: null });
      }
      return;
    }
    if (activeTool !== "select") return;

    if (f) {
      const deeper = double && selection?.kind === "element" && selection.frameId === f.id ? selection.depth + 1 : 0;
      onSelect(pickInFrame(f, x, y, deeper));
      return;
    }
    if (hit) {
      onSelect({ kind: "mark", id: hit.id });
      return;
    }
    onSelect(null);
    onBackground();
  }

  function finishPen(fromDouble: boolean) {
    const cur = pen;
    setPen(null);
    if (!cur) return;
    // A double click lands its point twice; drop the copy before making the line.
    const pts = fromDouble ? cur.pts.slice(0, -1) : cur.pts;
    if (pts.length >= 2) onCreate({ ...newMark("pen", pts[0][0], pts[0][1]), ...fromPoints(pts) }, false);
  }

  /** What the pointer is over, for the outline the select tool and comment mode draw. */
  const hoverFrame = React.useRef(0);
  function hoverAt(sx: number, sy: number) {
    if (activeTool === "pen" && pen) {
      const p = toBoard(sx, sy);
      setPen((cur) => (cur ? { ...cur, at: [p.x, p.y] } : cur));
    }
    if (activeTool !== "select" && activeTool !== "comment") return;
    cancelAnimationFrame(hoverFrame.current);
    hoverFrame.current = requestAnimationFrame(() => {
      const p = toBoard(sx, sy);
      const hit = takeMark(p.x, p.y);
      if (hit) {
        setHover((h) => (h?.kind === "mark" && h.id === hit.id ? h : { kind: "mark", id: hit.id }));
        return;
      }
      const f = frameAt(p.x, p.y);
      if (f) {
        const depth = selection?.kind === "element" && selection.frameId === f.id && activeTool === "select" ? selection.depth : 0;
        const picked = pickInFrame(f, p.x, p.y, depth);
        setHover({ kind: "frame", frameId: f.id, block: picked?.kind === "element" ? picked.rect : null });
        return;
      }
      setHover(null);
    });
  }

  /* ---------------------------------------------------------------- drawing it */

  const designs = React.useMemo(
    () =>
      frames.map((f) => (
        <div key={f.id} className="absolute bg-white" style={{ left: f.x, top: f.y, width: f.w, height: f.h }}>
          {/* Scripts off: the page can be read and looked at, never run. */}
          <iframe
            data-frame={f.id}
            src={src(f)}
            title={f.title}
            sandbox="allow-same-origin"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 border-0"
            style={{ width: f.w, height: f.h }}
          />
        </div>
      )),
    [frames, src],
  );

  const screenRect = (r: Rect): Rect => {
    const a = toScreen(r.x, r.y);
    return { x: a.x, y: a.y, w: r.w * view.z, h: r.h * view.z };
  };
  const onFrame = (frameId: string | null, r: Rect): Rect | null => {
    if (!frameId) return r;
    const f = frames.find((x) => x.id === frameId);
    return f ? { x: f.x + r.x, y: f.y + r.y, w: r.w, h: r.h } : null;
  };

  let selRect: Rect | null = null;
  if (chosenMarks.length) {
    const u = unionBox(chosenMarks);
    if (u) selRect = screenRect(u);
  } else if (selection?.kind === "frame") {
    const f = frames.find((x) => x.id === selection.frameId);
    if (f) selRect = screenRect(f);
  } else if (selection?.kind === "element" || selection?.kind === "area") {
    const r = onFrame(selection.kind === "element" ? selection.frameId : selection.frameId, selection.rect);
    if (r) selRect = screenRect(r);
  }

  const hoverRects: { r: Rect; tone: "select" | "comment" }[] = [];
  if (hover && !busy && !band) {
    const tone = activeTool === "comment" ? "comment" : "select";
    if (hover.kind === "mark" && !chosen.includes(hover.id)) {
      const m = shown.find((x) => x.id === hover.id);
      if (m) hoverRects.push({ r: screenRect(boxOf(m)), tone });
    } else if (hover.kind === "frame") {
      const f = frames.find((x) => x.id === hover.frameId);
      if (f && tone === "comment") hoverRects.push({ r: screenRect(f), tone });
      if (f && hover.block) {
        hoverRects.push({ r: screenRect({ x: f.x + hover.block.x, y: f.y + hover.block.y, w: hover.block.w, h: hover.block.h }), tone });
      }
    }
  }

  const draftAt = (() => {
    if (!draft) return null;
    const f = draft.frameId ? frames.find((x) => x.id === draft.frameId) : null;
    return f ? toScreen(f.x + draft.x, f.y + draft.y) : toScreen(draft.x, draft.y);
  })();

  const highlightRect = highlight ? screenRect(highlight) : null;
  const editing = editingId ? shown.find((m) => m.id === editingId) : undefined;

  const cursor =
    activeTool === "comment" ? COMMENT_CURSOR : activeTool === "hand" ? undefined : activeTool === "select" ? "default" : "crosshair";

  const strips = [
    ...frames.map((f) => ({ id: f.id, title: f.title, r: f as Rect, design: true })),
    ...behind.map((m) => ({ id: m.id, title: m.text || "Frame", r: m as Rect, design: false })),
  ];

  return (
    // overflow-clip, not hidden: the browser must never scroll the canvas to show something.
    <div className="absolute inset-0 overflow-clip bg-[#ebebea]">
      <div
        ref={box}
        className={cn("absolute inset-0 overflow-clip touch-none select-none outline-none", activeTool === "hand" && "cursor-grab active:cursor-grabbing")}
        style={cursor ? { cursor } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setHover(null)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, transformOrigin: "0 0" }}
        >
          {notes.map((n, i) =>
            n.kind === "sticky" ? (
              <div
                key={i}
                className="absolute whitespace-pre-wrap break-words rounded-[12px] bg-[#e9e8e4] text-foreground"
                style={{ left: n.x, top: n.y, width: n.w ?? 400, fontSize: n.size ?? 24, lineHeight: 1.4, padding: (n.size ?? 24) * 0.9 }}
              >
                {n.text}
              </div>
            ) : (
              <div
                key={i}
                className="absolute whitespace-nowrap font-display text-[72px] font-semibold leading-none tracking-[-0.02em] text-foreground"
                style={{ left: n.x, top: n.y }}
              >
                {n.text}
              </div>
            ),
          )}
          {behind.map((m) => (
            <MarkView key={m.id} mark={m} editing={false} onEdited={NOOP} />
          ))}
          {designs}
          {above.map((m) => (
            <MarkView
              key={m.id}
              mark={m}
              editing={m.id === editingId}
              onEdited={m.id === editingId ? (text, height, fontSize) => onEdited(m, text, height, fontSize) : NOOP}
            />
          ))}
          {pen ? (
            <svg className="absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden>
              <polyline
                points={[...pen.pts, ...(pen.at ? [pen.at] : [])].map((q) => q.join(",")).join(" ")}
                fill="none"
                stroke={style.ink}
                strokeWidth={style.strokePx / view.z}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </div>

        {/* Name strips over designs and drawn frames sit in screen space, readable at any zoom. */}
        {strips.map(({ id, title, r, design }) => {
          const at = toScreen(r.x, r.y);
          const width = r.w * view.z;
          if (width < 48 || at.x > size.w || at.x + width < 0 || at.y < -4 || at.y > size.h + 40) return null;
          return (
            <div key={id} className="pointer-events-none absolute flex items-center gap-2" style={{ left: at.x, top: at.y - 26, width }}>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#6b6a66]">{title}</span>
              {design && width > 140 ? (
                <button
                  type="button"
                  data-float
                  aria-label={`Zoom to ${title}`}
                  title={`Zoom to ${title}`}
                  onClick={() => fitBox({ x: r.x, y: r.y - 32, w: r.w, h: r.h + 32 }, 72, 2)}
                  className="pointer-events-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#6b6a66] hover:bg-black/5 hover:text-foreground"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
                  </svg>
                </button>
              ) : null}
            </div>
          );
        })}

        {hoverRects.map(({ r, tone }, i) => (
          <div
            key={i}
            className={cn(
              "pointer-events-none absolute",
              tone === "comment" ? "outline outline-2 outline-[#c2741c]" : "outline outline-1 outline-[#2f6fdf]",
            )}
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
          />
        ))}

        {highlightRect ? (
          <div
            className="pointer-events-none absolute rounded-[2px] bg-[#2f6fdf]/[0.06] outline outline-2 outline-[#2f6fdf]"
            style={{ left: highlightRect.x, top: highlightRect.y, width: highlightRect.w, height: highlightRect.h }}
          />
        ) : null}

        {band ? (
          <div
            className={cn(
              "pointer-events-none absolute border",
              gesture.current?.kind === "band" && gesture.current.mode === "comment"
                ? "border-[#c2741c] bg-[#c2741c]/[0.08]"
                : "border-[#2f6fdf] bg-[#2f6fdf]/[0.08]",
            )}
            style={{ left: band.x, top: band.y, width: band.w, height: band.h }}
          />
        ) : null}

        {selRect && !editingId ? (
          <>
            {chosenMarks.length > 1
              ? chosenMarks.map((m) => {
                  const r = screenRect(boxOf(m));
                  return (
                    <div
                      key={m.id}
                      className="pointer-events-none absolute outline outline-1 outline-[#2f6fdf]/60"
                      style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
                    />
                  );
                })
              : null}
            <div
              className={cn(
                "pointer-events-none absolute outline outline-[1.5px] outline-[#2f6fdf]",
                selection?.kind === "area" && "bg-[#2f6fdf]/[0.05] outline-dashed",
              )}
              style={{ left: selRect.x, top: selRect.y, width: selRect.w, height: selRect.h }}
            />
            {single
              ? handlesOf(single).map((h) => {
                  const [hx, hy] = handlePoint(single, h);
                  const p = toScreen(hx, hy);
                  return (
                    <span
                      key={h}
                      className={cn(
                        "pointer-events-none absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 border-[1.5px] border-[#2f6fdf] bg-white",
                        (h === "start" || h === "end") && "rounded-full",
                      )}
                      style={{ left: p.x, top: p.y }}
                    />
                  );
                })
              : null}
            {selectionBar && !busy ? selectionBar(selRect, view.z) : null}
          </>
        ) : null}

        {editing && editBar ? editBar(screenRect(boxOf(editing)), editing, view.z) : null}

        {pins.map(({ pin, x, y }) => {
          const p = toScreen(x, y);
          if (p.x < -40 || p.y < -40 || p.x > size.w + 40 || p.y > size.h + 40) return null;
          return (
            <div key={pin.id} data-float className="absolute" style={{ left: p.x, top: p.y }}>
              <div className="-translate-y-full">
                <PinBubble pin={pin} selected={pin.id === selectedPinId} onClick={() => onSelectPin(pin.id)} />
              </div>
            </div>
          );
        })}

        {draftAt ? (
          <div className="pointer-events-none absolute" style={{ left: draftAt.x, top: draftAt.y }}>
            <span className="block h-8 w-8 -translate-y-full rounded-full rounded-bl-none border-2 border-white bg-foreground shadow-[0_1px_4px_rgba(0,0,0,0.3)]" />
          </div>
        ) : null}

        {overlay ? overlay(toScreen, size, view.z) : null}
      </div>

      <ZoomMenu
        zoom={view.z}
        onFit={fit}
        onZoom={(f) => zoomAt(size.w / 2, size.h / 2, view.z * f)}
        onTo={(z) => zoomAt(size.w / 2, size.h / 2, z)}
        menu={zoomMenu}
        hasSelection={Boolean(selRect)}
      />
    </div>
  );
});

const NOOP = () => {};
const round2 = (n: number) => Math.round(n * 100) / 100;

/** What a click with a drawing tool makes when it is not dragged: a sensible size on screen. */
function defaultBox(m: BoardMark, z: number): BoardMark {
  const sizes: Partial<Record<BoardMarkKind, [number, number]>> = {
    rect: [200, 140],
    oval: [160, 160],
    frame: [600, 400],
    note: [200, 200],
    text: [240, 30],
  };
  const [w, h] = sizes[m.kind] ?? [160, 120];
  return { ...m, w: round2(w / z), h: round2(h / z) };
}

/* ------------------------------------------------------------------ the zoom menu */

function ZoomMenu({
  zoom,
  onFit,
  onZoom,
  onTo,
  menu,
  hasSelection,
}: {
  zoom: number;
  onFit: () => void;
  onZoom: (factor: number) => void;
  onTo: (z: number) => void;
  menu: ZoomMenuActions;
  hasSelection: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const item = (label: string, keys: string, run: () => void, disabled = false) => (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        run();
        setOpen(false);
      }}
      className="flex h-9 w-full items-center justify-between gap-6 rounded-md px-3 text-left text-sm hover:bg-muted disabled:text-subtle disabled:hover:bg-transparent"
    >
      {label}
      <span className="text-xs text-subtle">{keys}</span>
    </button>
  );
  const rule = <div className="my-1 h-px bg-border" />;

  return (
    <div ref={wrap} data-float className="absolute right-3 top-3 z-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-1 rounded-xl border border-black/10 bg-surface px-3 text-sm tabular-nums shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:bg-muted"
      >
        {Math.round(zoom * 100)}%
        <Caret />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 max-h-[70vh] w-60 overflow-y-auto rounded-xl border border-black/10 bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          {item("Zoom in", "Ctrl +", () => onZoom(1.25))}
          {item("Zoom out", "Ctrl -", () => onZoom(0.8))}
          {item("Fit artboards", "Shift 1", onFit)}
          {item("Zoom to selection", "Shift 2", menu.zoomToSelection, !hasSelection)}
          {rule}
          <p className="px-3 py-1.5 text-xs text-subtle">Now {Math.round(zoom * 100)}%</p>
          {[0.25, 0.5, 0.75, 1, 1.5, 2].map((z) => (
            <React.Fragment key={z}>{item(`${z * 100}%`, z === 1 ? "Shift 0" : "", () => onTo(z))}</React.Fragment>
          ))}
          {rule}
          {item("Undo", "Ctrl Z", menu.onUndo, !menu.canUndo)}
          {item("Redo", "Ctrl Shift Z", menu.onRedo, !menu.canRedo)}
        </div>
      ) : null}
    </div>
  );
}

export function Caret({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5 text-subtle", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 10l5 5 5-5" />
    </svg>
  );
}
