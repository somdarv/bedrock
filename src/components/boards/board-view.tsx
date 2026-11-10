"use client";

import * as React from "react";
import Link from "next/link";
import type { BoardFrame, BoardPin, PublicBoard } from "@/lib/api";
import { BrandLogo } from "@/components/brand-mark";
import { useToast } from "@/components/ui/toast";
import {
  dropAdminPin,
  dropPublicPin,
  loadAdminBoard,
  loadPublicBoard,
  replyAdmin,
  replyPublic,
  setBoardClosed,
  setPinDone,
  type BoardResult,
} from "@/lib/boards/actions";
import { clamp, draftKey, framesOn, NAME_KEY, pageOf, pinOrder, store } from "@/lib/boards/view";
import { cn, publicBaseUrl } from "@/lib/utils";
import { BoardCanvas, Caret, type CanvasHandle, type Spot, type ToScreen, type Tool } from "./board-canvas";
import { AllComments, Avatar, NewCommentCard, ThreadCard, type NameField } from "./board-panel";

/**
 * A board (docs/BOARDS.md), laid out as the Claude design canvas is: a thin top bar, a floating
 * toolbar with the pages, the frames on a grey canvas, comment mode from the top bar, a thread
 * floating beside its pin and every comment in the All comments panel. On a phone the thread
 * and the panel come up as sheets. The same screen serves the private link and our admin; only
 * we resolve a comment or turn the link off.
 */
export type BoardSide =
  | { kind: "client"; token: string }
  | { kind: "us"; id: string; token: string; userName: string; closedAt: string | null };

/** How often an open board asks for new comments, so both sides see each other's replies. */
const POLL_MS = 20_000;
const PANEL_W = 320;
const POP_W = 320;

export function BoardView({ side, initial }: { side: BoardSide; initial: PublicBoard }) {
  const { toast } = useToast();
  const wide = useMedia("(min-width: 768px)");
  const canvas = React.useRef<CanvasHandle>(null);

  const [board, setBoard] = React.useState(initial);
  const [closedAt, setClosedAt] = React.useState(side.kind === "us" ? side.closedAt : null);
  const [page, setPage] = React.useState<string | null>(initial.pages[0]?.id ?? null);
  const [tool, setTool] = React.useState<"select" | "hand">("select");
  const [commenting, setCommenting] = React.useState(false);
  const [draft, setDraft] = React.useState<Spot | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [allOpen, setAllOpen] = React.useState(false);
  const [showResolved, setShowResolved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [typedName, setTypedName] = React.useState("");

  React.useEffect(() => {
    setTypedName(store.get(NAME_KEY) ?? "");
  }, []);

  const name: NameField =
    side.kind === "us"
      ? { kind: "fixed", value: side.userName }
      : {
          kind: "typed",
          value: typedName,
          set: (v) => {
            setTypedName(v);
            store.set(NAME_KEY, v);
          },
        };

  const frames = React.useMemo(() => framesOn(board, page), [board, page]);
  const notes = React.useMemo(
    () => board.notes.filter((n) => board.pages.length === 0 || (n.page ?? board.pages[0].id) === page),
    [board, page],
  );
  const onPage = new Set(frames.map((f) => f.id));
  const shownPins = board.pins.filter(
    (p) => onPage.has(p.frameId) && (!p.doneAt || showResolved || p.id === selected),
  );
  const selectedPin = board.pins.find((p) => p.id === selected) ?? null;
  const openCount = pinOrder(board.pins).open.length;
  const frameOf = (frameId: string) => board.frames.find((f) => f.id === frameId);
  const canResolve = side.kind === "us";
  const activeTool: Tool = commenting ? "comment" : tool;

  /* ------------------------------------------------------------ keeping up */

  const kind = side.kind;
  const key = side.kind === "us" ? side.id : side.token;
  React.useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const r = kind === "us" ? await loadAdminBoard(key) : await loadPublicBoard(key);
      if (r.ok) setBoard(r.board);
    };
    const timer = window.setInterval(tick, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [kind, key]);

  // The canvas's keys: C comments, V select, H hand, Shift 1 fit, Shift 0 100%, Escape backs out.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape") {
        if (draft) setDraft(null);
        else if (selected) setSelected(null);
        else if (commenting) setCommenting(false);
        else if (allOpen) setAllOpen(false);
      } else if (e.code === "Digit1" && e.shiftKey) canvas.current?.fit();
      else if (e.code === "Digit0" && e.shiftKey) canvas.current?.actual();
      else if (e.key === "c" || e.key === "C") toggleCommenting();
      else if (e.key === "v" || e.key === "V") pickTool("select");
      else if (e.key === "h" || e.key === "H") pickTool("hand");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ------------------------------------------------------------ actions */

  const take = (r: BoardResult<PublicBoard>): r is { ok: true; board: PublicBoard } => {
    if (!r.ok) {
      toast(r.error, "danger");
      return false;
    }
    setBoard(r.board);
    return true;
  };

  function toggleCommenting() {
    setCommenting((v) => !v);
    setDraft(null);
  }

  function pickTool(t: "select" | "hand") {
    setTool(t);
    setCommenting(false);
    setDraft(null);
  }

  const goTo = (pin: BoardPin) => {
    const frame = frameOf(pin.frameId);
    if (!frame) return;
    const target = pageOf(board, frame);
    if (target !== page) setPage(target);
    // After the page has changed and fitted itself.
    requestAnimationFrame(() => canvas.current?.fitFrame(frame));
  };

  const openPin = (pin: BoardPin, move: boolean) => {
    setDraft(null);
    setSelected(pin.id);
    if (move) goTo(pin);
  };

  const sendNew = async (body: string, author: string) => {
    if (!draft) return false;
    setBusy(true);
    const r =
      side.kind === "us"
        ? await dropAdminPin(side.id, { ...draft, body })
        : await dropPublicPin(side.token, { ...draft, body, name: author });
    setBusy(false);
    if (!take(r)) return false;
    const newest = r.board.pins.reduce((a, b) => (b.number > a.number ? b : a));
    setDraft(null);
    setSelected(newest.id);
    return true;
  };

  const sendReply = async (body: string, author: string) => {
    if (!selected) return false;
    setBusy(true);
    const r =
      side.kind === "us"
        ? await replyAdmin(side.id, selected, body)
        : await replyPublic(side.token, selected, { body, name: author });
    setBusy(false);
    return take(r);
  };

  const resolve = async (pin: BoardPin, done: boolean) => {
    if (side.kind !== "us") return;
    setBusy(true);
    const r = await setPinDone(side.id, pin.id, done);
    setBusy(false);
    if (take(r) && done && pin.id === selected && !showResolved) setSelected(null);
  };

  const toggleLink = async () => {
    if (side.kind !== "us") return;
    setBusy(true);
    const r = await setBoardClosed(side.id, !closedAt);
    setBusy(false);
    if (take(r)) {
      const next = (r.board as PublicBoard & { closedAt?: string | null }).closedAt ?? null;
      setClosedAt(next);
      toast(next ? "The link is off." : "The link works again.", "success");
    }
  };

  /* ------------------------------------------------------------ what floats */

  const thread = selectedPin ? (
    <ThreadCard
      key={selectedPin.id}
      pin={selectedPin}
      frame={frameOf(selectedPin.frameId)}
      canResolve={canResolve}
      draftKey={draftKey(side.token, selectedPin.id)}
      name={name}
      busy={busy}
      onReply={sendReply}
      onResolve={(done) => resolve(selectedPin, done)}
      onClose={() => setSelected(null)}
    />
  ) : null;

  const composer = draft ? (
    <NewCommentCard
      draftKey={draftKey(side.token, null)}
      name={name}
      busy={busy}
      onSend={sendNew}
      onCancel={() => setDraft(null)}
    />
  ) : null;

  const all = (
    <AllComments
      board={board}
      showResolved={showResolved}
      selectedId={selected}
      canResolve={canResolve}
      onToggleResolved={() => setShowResolved((v) => !v)}
      onSelect={(pin) => {
        openPin(pin, true);
        if (!wide) setAllOpen(false);
      }}
      onResolve={resolve}
      onClose={() => setAllOpen(false)}
    />
  );

  // On a laptop the thread or the new comment floats beside its spot, out of the panel's way.
  const overlay = (toScreen: ToScreen, size: { w: number; h: number }) => {
    if (!wide) return null;
    const spot = draft ?? (selectedPin ? { frameId: selectedPin.frameId, x: selectedPin.x, y: selectedPin.y } : null);
    const body = draft ? composer : thread;
    if (!spot || !body) return null;
    const frame = frameOf(spot.frameId);
    if (!frame) return null;
    const p = toScreen(frame.x + spot.x, frame.y + spot.y);
    const right = size.w - (allOpen ? PANEL_W + 12 : 0);
    let left = p.x + 30;
    if (left + POP_W > right - 12) left = p.x - POP_W - 14;
    left = clamp(left, 12, Math.max(12, right - POP_W - 12));
    const top = clamp(p.y - 44, 60, Math.max(60, size.h - 160));
    return (
      <div
        data-float
        className="absolute z-20 flex flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
        style={{ left, top, width: POP_W, maxHeight: size.h - top - 12 }}
        onClick={(e) => e.stopPropagation()}
      >
        {body}
      </div>
    );
  };

  const empty = board.frames.length === 0;
  const phoneSheet = !wide ? (draft ? "new" : selectedPin ? "thread" : allOpen ? "all" : null) : null;

  /* ------------------------------------------------------------ the screen */

  if (wide === null) return <div className="fixed inset-0 z-40 bg-[#ebebea]" />;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#ebebea]">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface pl-3 pr-2">
        {side.kind === "us" ? (
          <Link
            href="/admin/boards"
            aria-label="All boards"
            title="All boards"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 11l8-6.5 8 6.5M6 9.5V19h12V9.5" />
            </svg>
          </Link>
        ) : (
          <>
            <BrandLogo className="h-[18px] w-auto" />
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          </>
        )}
        {side.kind === "us" ? (
          <TitleMenu title={board.title} token={side.token} closed={Boolean(closedAt)} busy={busy} onToggleLink={toggleLink} />
        ) : (
          <h1 className="min-w-0 truncate px-1 text-[15px]">{board.title}</h1>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {name.value ? <Avatar name={name.value} side={side.kind === "us" ? "us" : "client"} /> : null}
          {!empty ? (
            <CommentMenu
              active={commenting}
              openCount={openCount}
              onToggle={toggleCommenting}
              onShowAll={() => {
                setAllOpen(true);
                setDraft(null);
              }}
            />
          ) : null}
        </div>
      </header>

      {closedAt ? (
        <p className="shrink-0 border-b border-warning/30 bg-warning-soft px-4 py-2 text-sm text-warning">
          The link is off. Nobody can open this board from it.
        </p>
      ) : null}

      <div className="relative min-h-0 flex-1">
        {empty ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="font-display text-lg font-semibold">Nothing is on this board yet</p>
              <p className="mt-1 text-sm text-muted-foreground">The drawings appear here when we add them.</p>
            </div>
          </div>
        ) : (
          <BoardCanvas
            ref={canvas}
            frames={frames}
            notes={notes}
            fitKey={page ?? ""}
            tool={activeTool}
            pins={shownPins}
            selectedId={selected}
            draft={draft}
            insetRight={wide && allOpen ? PANEL_W + 12 : 0}
            onSpot={(spot) => {
              setSelected(null);
              setDraft(spot);
            }}
            onSelectPin={(id) => {
              const pin = board.pins.find((p) => p.id === id);
              if (pin) openPin(pin, false);
            }}
            onBackground={() => {
              setDraft(null);
              setSelected(null);
            }}
            src={(f: BoardFrame) =>
              side.kind === "us"
                ? `/admin/boards/${side.id}/frames/${f.id}?v=${f.version}`
                : `/board/${side.token}/frames/${f.id}?v=${f.version}`
            }
            overlay={overlay}
          />
        )}

        {!empty && (board.pages.length > 0 || wide) ? (
          <div
            data-float
            className="absolute left-3 top-3 z-10 flex h-10 items-center gap-0.5 rounded-xl border border-black/10 bg-surface px-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          >
            {board.pages.length > 0 ? (
              <PageMenu
                pages={board.pages}
                page={page}
                onPage={(id) => {
                  setPage(id);
                  setDraft(null);
                  setSelected(null);
                }}
              />
            ) : null}
            {wide ? (
              <>
                {board.pages.length > 0 ? <span className="mx-1 h-5 w-px bg-border" aria-hidden /> : null}
                <ToolButton label="Select (V)" active={activeTool === "select"} onClick={() => pickTool("select")}>
                  <path d="M6 4l12 7-5.5 1.5L10 18z" fill="currentColor" stroke="none" />
                </ToolButton>
                <ToolButton label="Hand (H)" active={activeTool === "hand"} onClick={() => pickTool("hand")}>
                  <path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 10V5a1.5 1.5 0 0 1 3 0v5M14 10V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a5 5 0 0 1-4-2L4 14.5a1.5 1.5 0 0 1 2.3-2L8 14" />
                </ToolButton>
              </>
            ) : null}
          </div>
        ) : null}

        {!wide && commenting && !draft ? (
          <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white">
            Tap a spot on a drawing
          </div>
        ) : null}

        {wide && allOpen ? (
          <div
            data-float
            className="absolute bottom-3 right-3 top-3 z-30 overflow-hidden rounded-2xl bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.14)]"
            style={{ width: PANEL_W }}
          >
            {all}
          </div>
        ) : null}
      </div>

      {phoneSheet ? (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/25"
          onClick={() => {
            setDraft(null);
            setSelected(null);
            setAllOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={phoneSheet === "all" ? "All comments" : phoneSheet === "new" ? "New comment" : "Comment"}
            className="flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-surface pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
            {phoneSheet === "all" ? all : phoneSheet === "new" ? composer : thread}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ the bars */

function CommentMenu({
  active,
  openCount,
  onToggle,
  onShowAll,
}: {
  active: boolean;
  openCount: number;
  onToggle: () => void;
  onShowAll: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const wrap = useOutside<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div ref={wrap} className="relative flex items-center">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        aria-label={active ? "Stop commenting (C)" : "Comment (C)"}
        title={active ? "Stop commenting (C)" : "Comment (C)"}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          active ? "bg-[#e5eefc] text-[#2f6fdf]" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
          <path
            d="M4 20V12a8 8 0 1 1 8 8z"
            fill={active ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Comment options"
        className="flex h-8 w-5 items-center justify-center rounded-md hover:bg-muted"
      >
        <Caret />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-black/10 bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onShowAll();
              setOpen(false);
            }}
            className="flex h-9 w-full items-center justify-between rounded-md px-3 text-left text-sm hover:bg-muted"
          >
            Show all comments
            <span className="tabular-nums text-xs text-subtle">{openCount} open</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PageMenu({
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
        className="flex h-8 max-w-[14rem] items-center gap-1.5 rounded-lg px-2 text-[15px] hover:bg-muted"
      >
        <span className="text-xs tabular-nums text-subtle">{pages.length}</span>
        <span className="min-w-0 truncate">{current?.name}</span>
        <Caret />
      </button>
      {open ? (
        <div role="menu" className="absolute left-0 top-10 z-50 w-60 rounded-xl border border-black/10 bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
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
        </div>
      ) : null}
    </div>
  );
}

function TitleMenu({
  title,
  token,
  closed,
  busy,
  onToggleLink,
}: {
  title: string;
  token: string;
  closed: boolean;
  busy: boolean;
  onToggleLink: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const wrap = useOutside<HTMLDivElement>(open, () => setOpen(false));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${publicBaseUrl()}/board/${token}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard refused: the admin list shows the link as text.
    }
  };
  return (
    <div ref={wrap} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 min-w-0 max-w-full items-center gap-1 rounded-md px-2 text-[15px] hover:bg-muted"
      >
        <span className="min-w-0 truncate">{title}</span>
        <Caret />
      </button>
      {open ? (
        <div role="menu" className="absolute left-0 top-10 z-50 w-60 rounded-xl border border-black/10 bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <button type="button" role="menuitem" onClick={copy} className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm hover:bg-muted">
            {copied ? "Link copied" : "Copy the link"}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => {
              onToggleLink();
              setOpen(false);
            }}
            className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm hover:bg-muted disabled:opacity-50"
          >
            {closed ? "Turn the link on" : "Turn the link off"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
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
        "flex h-8 w-8 items-center justify-center rounded-lg",
        active ? "bg-[#e5eefc] text-[#2f6fdf]" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ hooks */

/** Close a menu when a press lands outside it. */
function useOutside<T extends HTMLElement>(active: boolean, close: () => void) {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [active, close]);
  return ref;
}

/** A media query's answer, or null until the browser has said. */
function useMedia(query: string): boolean | null {
  const [match, setMatch] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    const q = window.matchMedia(query);
    const read = () => setMatch(q.matches);
    read();
    q.addEventListener("change", read);
    return () => q.removeEventListener("change", read);
  }, [query]);
  return match;
}

