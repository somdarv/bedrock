"use client";

import * as React from "react";
import type { BoardFrame, BoardNote, BoardPin } from "@/lib/api";
import { bounds, clamp, readingOrder } from "@/lib/boards/view";
import { cn } from "@/lib/utils";
import { PinBubble } from "./board-panel";

/**
 * The drawings on a canvas, as the Claude design canvas lays them out (docs/BOARDS.md): a grey
 * ground, each frame with its name strip above it, moved with a drag or two fingers and zoomed
 * with a pinch, Ctrl and the wheel, or the zoom menu. A phone uses the same canvas.
 */

export type Spot = { frameId: string; x: number; y: number };
export type Tool = "select" | "hand" | "comment";
export type ToScreen = (x: number, y: number) => { x: number; y: number };

export interface CanvasHandle {
  fit(): void;
  /** Zoom so one frame fills the space, and centre it. */
  fitFrame(frame: BoardFrame): void;
  /** Zoom to 100% around the middle. */
  actual(): void;
}

interface Props {
  frames: BoardFrame[];
  notes: BoardNote[];
  /** Changes when the page changes; the canvas then shows the whole page. */
  fitKey: string;
  tool: Tool;
  pins: BoardPin[];
  selectedId: string | null;
  draft: Spot | null;
  /** Room taken on the right by a floating panel, kept clear when fitting. */
  insetRight: number;
  onSpot: (spot: Spot) => void;
  onSelectPin: (id: string) => void;
  /** A press on the ground or on a frame, with nothing to place: close what is open. */
  onBackground: () => void;
  src: (frame: BoardFrame) => string;
  /** Things that float over the canvas at a board position, such as a thread beside its pin. */
  overlay?: (toScreen: ToScreen, size: { w: number; h: number }, zoom: number) => React.ReactNode;
}

const MIN_Z = 0.03;
const MAX_Z = 4;
const PAD = 56;

/** The comment cursor: a speech bubble whose point is the spot. */
const COMMENT_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M3 25V14a11 11 0 1 1 11 11z' fill='%23111' stroke='white' stroke-width='2'/%3E%3C/svg%3E\") 3 25, crosshair";

export const BoardCanvas = React.forwardRef<CanvasHandle, Props>(function BoardCanvas(
  { frames, notes, fitKey, tool, pins, selectedId, draft, insetRight, onSpot, onSelectPin, onBackground, src, overlay },
  ref,
) {
  const box = React.useRef<HTMLDivElement>(null);
  const [view, setView] = React.useState({ x: 0, y: 0, z: 0.2 });
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const viewRef = React.useRef(view);
  viewRef.current = view;

  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const gesture = React.useRef<
    | { kind: "pan"; sx: number; sy: number; vx: number; vy: number; moved: boolean }
    | { kind: "pinch"; dist: number; z: number; mx: number; my: number; vx: number; vy: number }
    | null
  >(null);
  // A drag ends in a click on whatever is under the pointer; this swallows it.
  const dragged = React.useRef(false);

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
    (b: { x: number; y: number; w: number; h: number }, top: number, maxZ: number) => {
      const el = box.current;
      if (!el) return;
      const w = el.clientWidth - insetRight;
      const h = el.clientHeight;
      const z = clamp(Math.min((w - PAD * 2) / b.w, (h - top - PAD) / b.h), MIN_Z, maxZ);
      setView({ z, x: (w - b.w * z) / 2 - b.x * z, y: Math.max(top, (h - b.h * z) / 2) - b.y * z });
    },
    [insetRight],
  );

  const fit = React.useCallback(() => fitBox(bounds(frames, notes), 88, 1), [fitBox, frames, notes]);

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
      fitFrame: (f) => fitBox({ x: f.x, y: f.y - 32, w: f.w, h: f.h + 32 }, 72, 2),
      actual: () => {
        const el = box.current;
        if (el) zoomAt(el.clientWidth / 2, el.clientHeight / 2, 1);
      },
    }),
    [fit, fitBox, zoomAt],
  );

  // A new page, or the first paint: show everything on it. A phone opens on the first frame
  // instead, since a whole page at phone width is too small to read.
  React.useLayoutEffect(() => {
    const first = readingOrder(frames)[0];
    if (first && (box.current?.clientWidth ?? 0) < 768) fitBox({ x: first.x, y: first.y - 32, w: first.w, h: first.h + 32 }, 72, 2);
    else fit();
    // Only when the page changes, never on a new pin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);


  // Two fingers on a trackpad move the canvas; a pinch, or Ctrl with the wheel, zooms.
  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // A thread floating over the canvas scrolls itself.
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

  const local = (e: { clientX: number; clientY: number }) => {
    const rect = box.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as Element).closest("[data-float]")) return;
    pointers.current.set(e.pointerId, local(e));
    const v = viewRef.current;
    if (pointers.current.size === 1) {
      const p = local(e);
      dragged.current = false;
      gesture.current = { kind: "pan", sx: p.x, sy: p.y, vx: v.x, vy: v.y, moved: false };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        kind: "pinch",
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        z: v.z,
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
        vx: v.x,
        vy: v.y,
      };
      dragged.current = true;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pan") {
      const dx = p.x - g.sx;
      const dy = p.y - g.sy;
      if (!g.moved && Math.hypot(dx, dy) < 5) return;
      if (!g.moved) {
        g.moved = true;
        dragged.current = true;
        // Hold the pointer only once it is a drag, so a plain press still reaches a pin or a frame.
        box.current?.setPointerCapture(e.pointerId);
      }
      setView((v) => ({ ...v, x: g.vx + dx, y: g.vy + dy }));
    } else if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const z = clamp((g.z * dist) / g.dist, MIN_Z, MAX_Z);
      setView({ z, x: mx - ((g.mx - g.vx) / g.z) * z, y: my - ((g.my - g.vy) / g.z) * z });
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
    } else if (gesture.current?.kind === "pinch") {
      // One finger left after a pinch: carry on as a drag from where it is, without a jump.
      const p = [...pointers.current.values()][0];
      const v = viewRef.current;
      gesture.current = { kind: "pan", sx: p.x, sy: p.y, vx: v.x, vy: v.y, moved: true };
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (dragged.current) {
      e.stopPropagation();
      dragged.current = false;
    }
  };

  const toScreen: ToScreen = (x, y) => ({ x: view.x + x * view.z, y: view.y + y * view.z });
  const inverse = 1 / view.z;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#ebebea]">
      <div
        ref={box}
        className={cn("absolute inset-0 touch-none select-none", tool === "hand" && "cursor-grab active:cursor-grabbing")}
        style={tool === "comment" ? { cursor: COMMENT_CURSOR } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={onClickCapture}
        onClick={(e) => {
          if (e.target === e.currentTarget) onBackground();
        }}
      >
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, transformOrigin: "0 0" }}
        >
          {notes.map((n, i) => (
            <div
              key={i}
              className="absolute whitespace-nowrap font-display text-[72px] font-semibold leading-none tracking-[-0.02em] text-foreground"
              style={{ left: n.x, top: n.y }}
            >
              {n.text}
            </div>
          ))}
          {frames.map((f) => (
            <div key={f.id} className="pointer-events-auto absolute" style={{ left: f.x, top: f.y }}>
              <FrameBox
                frame={f}
                inverse={inverse}
                tool={tool}
                pins={pins.filter((p) => p.frameId === f.id)}
                selectedId={selectedId}
                draft={draft?.frameId === f.id ? draft : null}
                onSpot={onSpot}
                onSelectPin={onSelectPin}
                onBackground={onBackground}
                src={src}
              />
            </div>
          ))}
        </div>

        {/* Name strips sit in screen space, so they stay readable at any zoom. */}
        {frames.map((f) => {
          const at = toScreen(f.x, f.y);
          const width = f.w * view.z;
          if (width < 48 || at.x > size.w || at.x + width < 0 || at.y < -4 || at.y > size.h + 40) return null;
          return (
            <div
              key={f.id}
              data-float
              className="pointer-events-none absolute flex items-center gap-2"
              style={{ left: at.x, top: at.y - 28, width }}
            >
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#6b6a66]">{f.title}</span>
              {width > 140 ? (
                <ExpandButton label={`Zoom to ${f.title}`} onClick={() => fitBox({ x: f.x, y: f.y - 32, w: f.w, h: f.h + 32 }, 72, 2)} />
              ) : null}
            </div>
          );
        })}

        {overlay ? overlay(toScreen, size, view.z) : null}
      </div>

      <ZoomMenu
        zoom={view.z}
        onFit={fit}
        onZoom={(factor) => zoomAt(size.w / 2, size.h / 2, view.z * factor)}
        onActual={() => zoomAt(size.w / 2, size.h / 2, 1)}
      />
    </div>
  );
});

/* ------------------------------------------------------------------ one frame */

function FrameBox({
  frame,
  inverse,
  tool,
  pins,
  selectedId,
  draft,
  onSpot,
  onSelectPin,
  onBackground,
  src,
}: {
  frame: BoardFrame;
  inverse: number;
  tool: Tool;
  pins: BoardPin[];
  selectedId: string | null;
  draft: Spot | null;
  onSpot: (spot: Spot) => void;
  onSelectPin: (id: string) => void;
  onBackground: () => void;
  src: (frame: BoardFrame) => string;
}) {
  const commenting = tool === "comment";

  const press = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!commenting) {
      onBackground();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    onSpot({
      frameId: frame.id,
      x: clamp(((e.clientX - rect.left) / rect.width) * frame.w, 0, frame.w),
      y: clamp(((e.clientY - rect.top) / rect.height) * frame.h, 0, frame.h),
    });
  };

  return (
    <div
      className={cn("group relative bg-white", commenting && "hover:outline hover:outline-[#c2741c]")}
      style={{ width: frame.w, height: frame.h, outlineWidth: 2 * inverse }}
    >
      {/* Scripts off, no permissions: the page can only be looked at. */}
      <iframe
        src={src(frame)}
        title={frame.title}
        sandbox=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute inset-0 border-0"
        style={{ width: frame.w, height: frame.h }}
      />
      <div className="absolute inset-0" onClick={press}>
        {pins.map((pin) => (
          <div key={pin.id} className="absolute" style={{ left: pin.x, top: pin.y }}>
            <div style={{ transform: `scale(${inverse}) translate(0, -100%)`, transformOrigin: "0 0" }}>
              <PinBubble
                pin={pin}
                selected={pin.id === selectedId}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPin(pin.id);
                }}
              />
            </div>
          </div>
        ))}
        {draft ? (
          <div className="pointer-events-none absolute" style={{ left: draft.x, top: draft.y }}>
            <div style={{ transform: `scale(${inverse}) translate(0, -100%)`, transformOrigin: "0 0" }}>
              <span className="block h-8 w-8 rounded-full rounded-bl-none border-2 border-white bg-foreground shadow-[0_1px_4px_rgba(0,0,0,0.3)]" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ small parts */

function ExpandButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="pointer-events-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#6b6a66] hover:bg-black/5 hover:text-foreground"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
      </svg>
    </button>
  );
}

function ZoomMenu({
  zoom,
  onFit,
  onZoom,
  onActual,
}: {
  zoom: number;
  onFit: () => void;
  onZoom: (factor: number) => void;
  onActual: () => void;
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

  const item = (label: string, keys: string, run: () => void) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        run();
        setOpen(false);
      }}
      className="flex h-9 w-full items-center justify-between gap-6 rounded-md px-3 text-left text-sm hover:bg-muted"
    >
      {label}
      <span className="text-xs text-subtle">{keys}</span>
    </button>
  );

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
        <div role="menu" className="absolute right-0 top-12 w-52 rounded-xl border border-black/10 bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {item("Zoom in", "", () => onZoom(1.25))}
          {item("Zoom out", "", () => onZoom(0.8))}
          {item("Zoom to fit", "Shift 1", onFit)}
          {item("Zoom to 100%", "Shift 0", onActual)}
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
