"use client";

import * as React from "react";
import type { BoardMark } from "@/lib/api";
import { INKS, NOTE_FILLS, isLine, type Rect } from "@/lib/boards/marks";
import { cn } from "@/lib/utils";
import { Caret, type Tool } from "./board-canvas";

/**
 * The canvas's bars, as the Claude design canvas has them (docs/BOARDS.md): the toolbar with the
 * pages and the tools, and the small bar that floats over whatever is selected.
 */

/* ------------------------------------------------------------------ icons */

const ICONS: Record<string, React.ReactNode> = {
  select: <path d="M6 4l12 7-5.5 1.5L10 18z" fill="currentColor" stroke="none" />,
  hand: (
    <path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 10V5a1.5 1.5 0 0 1 3 0v5M14 10V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a5 5 0 0 1-4-2L4 14.5a1.5 1.5 0 0 1 2.3-2L8 14" />
  ),
  text: <path d="M5 6V5h14v1M12 5v14M9 19h6" />,
  frame: <path d="M8 3v18M16 3v18M3 8h18M3 16h18" />,
  note: <path d="M5 4h14v10l-5 6H5zM14 20v-6h5" />,
  pencil: <path d="M4 20l1-4L16 5a2.1 2.1 0 0 1 3 3L8 19zM14 7l3 3" />,
  pen: <path d="M12 19l7-7-3-3-7 7-2 5zM16 9l-4-4M5 21l2-2" />,
  rect: <rect x="4.5" y="5.5" width="15" height="13" rx="1" />,
  oval: <circle cx="12" cy="12" r="7.5" />,
  arrow: <path d="M5 19L19 5M10 5h9v9" />,
  line: <path d="M5 19L19 5" />,
  comment: <path d="M4 20V12a8 8 0 1 1 8 8z" strokeLinejoin="round" />,
  zoom: <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />,
  trash: <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5" />,
};

export function ToolIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-[18px] w-[18px]", className)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

const PENCILS = [
  { tool: "pencil" as const, label: "Pencil", keys: "P" },
  { tool: "pen" as const, label: "Pen", keys: "Shift P" },
];
const SHAPES = [
  { tool: "rect" as const, label: "Rectangle", keys: "R" },
  { tool: "oval" as const, label: "Oval", keys: "O" },
  { tool: "arrow" as const, label: "Arrow", keys: "Shift L" },
  { tool: "line" as const, label: "Line", keys: "L" },
];

/* ------------------------------------------------------------------ the toolbar */

export function Toolbar({
  tool,
  onTool,
  compact,
  pageMenu,
}: {
  tool: Tool;
  onTool: (t: Tool) => void;
  /** A phone: the tools sit along the bottom and the hand is left out, since a finger pans. */
  compact: boolean;
  pageMenu: React.ReactNode;
}) {
  const [pencil, setPencil] = React.useState<"pencil" | "pen">("pencil");
  const [shape, setShape] = React.useState<"rect" | "oval" | "arrow" | "line">("rect");
  React.useEffect(() => {
    if (tool === "pencil" || tool === "pen") setPencil(tool);
    if (tool === "rect" || tool === "oval" || tool === "arrow" || tool === "line") setShape(tool);
  }, [tool]);

  const one = (t: Tool, label: string, keys: string) => (
    <ToolButton key={t} label={`${label} ${keys}`} active={tool === t} onClick={() => onTool(t)}>
      <ToolIcon name={t} />
    </ToolButton>
  );

  return (
    <div
      data-float
      className={cn(
        "absolute z-10 flex h-11 items-center gap-0.5 rounded-xl border border-black/10 bg-surface px-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
        compact ? "bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2" : "left-3 top-3",
      )}
    >
      {!compact ? (
        <>
          {pageMenu}
          {pageMenu ? <Divider /> : null}
        </>
      ) : null}
      {one("select", "Select", "V")}
      {!compact ? one("hand", "Hand", "H") : null}
      {one("text", "Text", "T")}
      {one("frame", "Artboard", "A")}
      {one("note", "Note", "N")}
      <Split current={pencil} active={tool === "pencil" || tool === "pen"} options={PENCILS} onTool={onTool} />
      <Split current={shape} active={["rect", "oval", "arrow", "line"].includes(tool)} options={SHAPES} onTool={onTool} />
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
}

function Split<T extends Tool>({
  current,
  active,
  options,
  onTool,
}: {
  current: T;
  active: boolean;
  options: { tool: T; label: string; keys: string }[];
  onTool: (t: Tool) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const wrap = useOutside<HTMLDivElement>(open, () => setOpen(false));
  const now = options.find((o) => o.tool === current) ?? options[0];
  return (
    <div ref={wrap} className="relative flex items-center">
      <ToolButton label={`${now.label} ${now.keys}`} active={active} onClick={() => onTool(now.tool)}>
        <ToolIcon name={now.tool} />
      </ToolButton>
      <button
        type="button"
        aria-label={`More like ${now.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-4 items-center justify-center rounded-md hover:bg-muted"
      >
        <Caret className="h-3 w-3" />
      </button>
      {open ? (
        <Menu className="left-0 top-11 max-sm:bottom-12 max-sm:top-auto">
          {options.map((o) => (
            <button
              key={o.tool}
              type="button"
              role="menuitem"
              onClick={() => {
                onTool(o.tool);
                setOpen(false);
              }}
              className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm hover:bg-muted"
            >
              <ToolIcon name={o.tool} className="h-4 w-4" />
              <span className="flex-1">{o.label}</span>
              <span className="text-xs text-subtle">{o.keys}</span>
            </button>
          ))}
        </Menu>
      ) : null}
    </div>
  );
}

export function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        active ? "bg-[#e5eefc] text-[#2f6fdf]" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ over a selection */

/**
 * The bar over what is selected. A drawing gets its colour, its line width, a comment and
 * removal; a block of a design gets a comment and a zoom, as on the Claude canvas.
 */
export function SelectionBar({
  rect,
  mark,
  zoom,
  label,
  onComment,
  onZoom,
  onStyle,
  onRemove,
}: {
  rect: Rect;
  mark: BoardMark | null;
  /** The canvas's zoom, so a line width is chosen as it looks on screen. */
  zoom: number;
  /** What a block of a design says, shown so it is clear what a comment will be about. */
  label: string | null;
  onComment: () => void;
  onZoom: () => void;
  onStyle: (patch: Partial<BoardMark>) => void;
  onRemove: () => void;
}) {
  const [palette, setPalette] = React.useState(false);
  const wrap = useOutside<HTMLDivElement>(palette, () => setPalette(false));
  const top = rect.y - 52 < 8 ? rect.y + rect.h + 10 : rect.y - 52;
  const left = rect.x + rect.w / 2;
  const fills = mark?.kind === "note";
  const lines = mark ? isLine(mark.kind) || mark.kind === "rect" || mark.kind === "oval" : false;

  return (
    <div
      ref={wrap}
      data-float
      className="absolute z-20 flex h-10 -translate-x-1/2 items-center gap-0.5 rounded-xl border border-black/10 bg-surface px-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
      style={{ left, top }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {mark && mark.kind !== "frame" ? (
        <button
          type="button"
          aria-label="Colour"
          title="Colour"
          aria-expanded={palette}
          onClick={() => setPalette((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
        >
          <span className="h-4 w-4 rounded-full border border-black/15" style={{ background: mark.color }} />
        </button>
      ) : null}
      {label ? <span className="max-w-[12rem] truncate px-2 text-xs text-muted-foreground">{label}</span> : null}
      <ToolButton label="Comment C" onClick={onComment}>
        <ToolIcon name="comment" />
      </ToolButton>
      <ToolButton label="Zoom to selection Shift 2" onClick={onZoom}>
        <ToolIcon name="zoom" />
      </ToolButton>
      {mark ? (
        <ToolButton label="Remove Delete" onClick={onRemove}>
          <ToolIcon name="trash" />
        </ToolButton>
      ) : null}

      {palette && mark ? (
        <Menu className="left-0 top-12 w-auto p-2">
          <div className="flex gap-1.5">
            {(fills ? NOTE_FILLS : INKS).map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${c}`}
                onClick={() => onStyle({ color: c })}
                className={cn("h-7 w-7 rounded-full border border-black/15", mark.color === c && "ring-2 ring-[#2f6fdf] ring-offset-1")}
                style={{ background: c }}
              />
            ))}
          </div>
          {lines ? (
            <div className="mt-2 flex gap-1.5">
              {[2, 4, 8].map((px) => (
                <button
                  key={px}
                  type="button"
                  aria-label={px === 2 ? "Thin line" : px === 4 ? "Medium line" : "Thick line"}
                  onClick={() => onStyle({ stroke: Math.round((px / zoom) * 100) / 100 })}
                  className="flex h-8 flex-1 items-center justify-center rounded-md hover:bg-muted"
                >
                  <span className="w-6 rounded-full bg-foreground" style={{ height: px }} />
                </button>
              ))}
            </div>
          ) : null}
        </Menu>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ pages */

export function PageMenu({
  pages,
  page,
  onPage,
}: {
  pages: { id: string; name: string }[];
  page: string | null;
  onPage: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const wrap = useOutside<HTMLDivElement>(open, () => setOpen(false));
  const current = pages.find((p) => p.id === page) ?? pages[0];
  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 max-w-[14rem] items-center gap-1.5 rounded-lg px-2 text-[15px] hover:bg-muted"
      >
        <span className="text-xs tabular-nums text-subtle">{pages.length}</span>
        <span className="min-w-0 truncate">{current?.name}</span>
        <Caret />
      </button>
      {open ? (
        <Menu className="left-0 top-11 w-60">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitemradio"
              aria-checked={p.id === current?.id}
              onClick={() => {
                onPage(p.id);
                setOpen(false);
              }}
              className="flex h-9 w-full items-center justify-between rounded-md px-3 text-left text-[15px] hover:bg-muted"
            >
              <span className="truncate">{p.name}</span>
              {p.id === current?.id ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#2f6fdf]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : null}
            </button>
          ))}
        </Menu>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ shared */

export function Menu({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="menu" className={cn("absolute z-50 w-52 rounded-xl border border-black/10 bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]", className)}>
      {children}
    </div>
  );
}

/** Close a menu when a press lands outside it. */
export function useOutside<T extends HTMLElement>(active: boolean, close: () => void) {
  const ref = React.useRef<T>(null);
  const closeRef = React.useRef(close);
  closeRef.current = close;
  React.useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) closeRef.current();
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [active]);
  return ref;
}
