"use client";

import * as React from "react";
import Link from "next/link";
import type { BoardAnchor, BoardFrame, BoardMark, BoardPin, PublicBoard } from "@/lib/api";
import { BrandLogo } from "@/components/brand-mark";
import { useToast } from "@/components/ui/toast";
import {
  dropAdminPin,
  dropPublicPin,
  loadAdminBoard,
  loadPublicBoard,
  removeMark,
  replyAdmin,
  replyPublic,
  restoreMark,
  saveMark,
  setBoardClosed,
  setPinDone,
  type BoardResult,
  type MarkResult,
} from "@/lib/boards/actions";
import { boxOf, moveBy, toInput, unionBox, type Rect } from "@/lib/boards/marks";
import { clamp, draftKey, framesOn, NAME_KEY, pageOf, pinOrder, store } from "@/lib/boards/view";
import { cn, publicBaseUrl } from "@/lib/utils";
import {
  BoardCanvas,
  Caret,
  type CanvasHandle,
  type DrawStyle,
  type PinPlace,
  selectedIds,
  type Selection,
  type Spot,
  type ToScreen,
  type Tool,
} from "./board-canvas";
import { FORMAT_EVENT } from "./board-marks";
import { AllComments, Avatar, NewCommentCard, ThreadCard, type NameField } from "./board-panel";
import { EditBar, Menu, PageMenu, SelectionBar, Toolbar, useOutside, type Restyle } from "./board-toolbar";

/**
 * A board (docs/BOARDS.md), laid out and worked as the Claude design canvas is: a thin top bar,
 * a floating toolbar with the pages and the drawing tools, the designs on a grey canvas, comment
 * mode from the top bar, a bar over whatever is selected, a thread floating beside its pin and
 * every comment in the All comments panel. On a phone the tools sit along the bottom and the
 * thread and the panel come up as sheets. The same screen serves the private link and our admin;
 * only we resolve a comment or turn the link off.
 */
export type BoardSide =
  | { kind: "client"; token: string }
  | { kind: "us"; id: string; token: string; userName: string; closedAt: string | null };

/** How often an open board asks for new comments and drawings. */
const POLL_MS = 15_000;
const PANEL_W = 320;
const POP_W = 320;

/** One undo step: every drawing it changed, as it was and as it became. */
type Step = { before: BoardMark | null; after: BoardMark | null }[];

const TOOL_KEYS: Record<string, Tool> = {
  KeyV: "select",
  KeyH: "hand",
  KeyT: "text",
  KeyA: "frame",
  KeyN: "note",
  KeyP: "pencil",
  KeyR: "rect",
  KeyO: "oval",
  KeyL: "line",
};

export function BoardView({ side, initial }: { side: BoardSide; initial: PublicBoard }) {
  const { toast } = useToast();
  const wide = useMedia("(min-width: 768px)");
  const canvas = React.useRef<CanvasHandle>(null);

  const [board, setBoard] = React.useState(initial);
  const [marks, setMarks] = React.useState<BoardMark[]>(initial.marks ?? []);
  const [closedAt, setClosedAt] = React.useState(side.kind === "us" ? side.closedAt : null);
  const [page, setPage] = React.useState<string | null>(initial.pages[0]?.id ?? null);
  const [tool, setTool] = React.useState<Tool>("select");
  const [style, setStyle] = React.useState<DrawStyle>({ ink: "#e03131", noteFill: "#ffec99", strokePx: 3 });
  const [selection, setSelection] = React.useState<Selection>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
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
  const firstPage = board.pages[0]?.id ?? null;
  const pageMarks = React.useMemo(() => marks.filter((m) => (m.page ?? firstPage) === page), [marks, page, firstPage]);
  const frameOf = (id: string | null) => (id ? board.frames.find((f) => f.id === id) : undefined);
  const canResolve = side.kind === "us";
  const openCount = pinOrder(board.pins).open.length;

  const sideKind = side.kind;
  const sideId = side.kind === "us" ? side.id : side.token;
  const src = React.useCallback(
    (f: BoardFrame) =>
      sideKind === "us" ? `/admin/boards/${sideId}/frames/${f.id}?v=${f.version}` : `/board/${sideId}/frames/${f.id}?v=${f.version}`,
    [sideKind, sideId],
  );

  /* ------------------------------------------------------------ saving drawings */

  const sideRef = React.useRef(side);
  sideRef.current = side;
  const nameRef = React.useRef(typedName);
  nameRef.current = typedName;
  const who = () => {
    const s = sideRef.current;
    return s.kind === "us" ? ({ kind: "us", id: s.id } as const) : ({ kind: "client", token: s.token } as const);
  };
  const whoNamed = () => {
    const s = sideRef.current;
    return s.kind === "us"
      ? ({ kind: "us", id: s.id } as const)
      : ({ kind: "client", token: s.token, name: nameRef.current || "The client" } as const);
  };

  // Saves for one drawing run one after another, so a move never lands before the drawing exists.
  const chains = React.useRef(new Map<string, Promise<unknown>>());
  const pending = React.useRef(new Map<string, number>());
  const persist = React.useCallback(
    (id: string, run: () => Promise<MarkResult>) => {
      pending.current.set(id, (pending.current.get(id) ?? 0) + 1);
      const next = (chains.current.get(id) ?? Promise.resolve())
        .then(run)
        .then((r) => {
          if (!r.ok) toast(r.error, "danger");
        })
        .catch(() => toast("That drawing did not save. Check your internet.", "danger"))
        .finally(() => {
          const left = (pending.current.get(id) ?? 1) - 1;
          if (left <= 0) pending.current.delete(id);
          else pending.current.set(id, left);
        });
      chains.current.set(id, next);
    },
    [toast],
  );

  const remoteSave = (m: BoardMark) => persist(m.id, () => saveMark(whoNamed(), m.id, toInput(m)));
  const remoteRemove = (id: string) => persist(id, () => removeMark(who(), id));
  const remoteRestore = (m: BoardMark) =>
    persist(m.id, async () => {
      const back = await restoreMark(who(), m.id);
      return back.ok ? saveMark(whoNamed(), m.id, toInput(m)) : back;
    });

  const undoStack = React.useRef<Step[]>([]);
  const redoStack = React.useRef<Step[]>([]);
  const [, bump] = React.useState(0);

  const place = (before: BoardMark | null, after: BoardMark | null) =>
    setMarks((ms) => {
      const id = after?.id ?? before?.id;
      const rest = ms.filter((m) => m.id !== id);
      return after ? [...rest, after] : rest;
    });

  /** Make, change or remove drawings, here at once and on the server behind it, as one undo step. */
  const changeMany = (step: Step, record = true) => {
    for (const { before, after } of step) {
      place(before, after);
      if (after) remoteSave(after);
      else if (before) remoteRemove(before.id);
    }
    if (record && step.length) {
      undoStack.current.push(step);
      if (undoStack.current.length > 200) undoStack.current.shift();
      redoStack.current = [];
      bump((n) => n + 1);
    }
  };
  const change = (before: BoardMark | null, after: BoardMark | null) => changeMany([{ before, after }]);

  const undo = () => {
    const step = undoStack.current.pop();
    if (!step) return;
    for (const { before, after } of step) {
      place(after, before);
      if (before && !after) remoteRestore(before);
      else if (before) remoteSave(before);
      else if (after) remoteRemove(after.id);
    }
    redoStack.current.push(step);
    setSelection(null);
    bump((n) => n + 1);
  };

  const redo = () => {
    const step = redoStack.current.pop();
    if (!step) return;
    for (const { before, after } of step) {
      place(before, after);
      if (after && !before) remoteRestore(after);
      else if (after) remoteSave(after);
      else if (before) remoteRemove(before.id);
    }
    undoStack.current.push(step);
    setSelection(null);
    bump((n) => n + 1);
  };

  // Text and notes are kept here until their words are in; an empty one is never saved.
  const fresh = React.useRef(new Set<string>());

  // The text size while words are typed, shown on the bar above them.
  const [editSize, setEditSize] = React.useState(20);
  const startEditing = (m: BoardMark) => {
    setEditSize(m.fontSize ?? 20);
    setEditingId(m.id);
  };

  const onCreate = (mark: BoardMark, edit: boolean) => {
    if (edit) {
      fresh.current.add(mark.id);
      place(null, mark);
      startEditing(mark);
    } else {
      change(null, mark);
    }
    setSelection({ kind: "mark", id: mark.id });
    if (tool !== "pencil" && tool !== "pen") setTool("select");
  };

  const onEdited = (mark: BoardMark, text: string, height: number, fontSize: number) => {
    setEditingId(null);
    const words = text.replace(/\s+$/, "");
    const h = mark.kind === "text" ? height : mark.h;
    const sized = { ...mark, fontSize };
    if (fresh.current.has(mark.id)) {
      fresh.current.delete(mark.id);
      if (!words.trim()) {
        place(mark, null);
        setSelection(null);
        return;
      }
      change(null, { ...sized, text: words, h });
      return;
    }
    if (!words.trim() && mark.kind === "text") {
      change(mark, null);
      setSelection(null);
      return;
    }
    if (words !== mark.text || h !== mark.h || fontSize !== mark.fontSize) change(mark, { ...sized, text: words, h });
  };

  /* ------------------------------------------------------------ keeping up */

  const editingRef = React.useRef(editingId);
  editingRef.current = editingId;
  React.useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const r = sideKind === "us" ? await loadAdminBoard(sideId) : await loadPublicBoard(sideId);
      if (!r.ok) return;
      setBoard(r.board);
      // Their drawings come in; ours still saving, and the one being typed in, stay as they are here.
      setMarks((local) => {
        const keep = new Set<string>([...pending.current.keys(), ...fresh.current]);
        if (editingRef.current) keep.add(editingRef.current);
        const merged = (r.board.marks ?? []).filter((m) => !keep.has(m.id));
        for (const m of local) if (keep.has(m.id)) merged.push(m);
        return merged;
      });
    };
    const timer = window.setInterval(tick, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sideKind, sideId]);

  /* ------------------------------------------------------------ comments */

  const take = (r: BoardResult<PublicBoard>): r is { ok: true; board: PublicBoard } => {
    if (!r.ok) {
      toast(r.error, "danger");
      return false;
    }
    setBoard(r.board);
    return true;
  };

  /** Where a pin sits on the board. One on a drawing follows the drawing. */
  const placeOf = (pin: { frameId: string | null; anchor: BoardAnchor | null; x: number; y: number }) => {
    if (pin.anchor?.kind === "mark") {
      const markId = pin.anchor.markId;
      const m = marks.find((x) => x.id === markId);
      if (m) {
        const b = boxOf(m);
        return { x: b.x + b.w, y: b.y };
      }
    }
    if (pin.frameId) {
      const f = frameOf(pin.frameId);
      return f ? { x: f.x + pin.x, y: f.y + pin.y } : null;
    }
    return { x: pin.x, y: pin.y };
  };

  /** The box a comment is about, to outline while it is open. */
  const anchorBox = (frameId: string | null, anchor: BoardAnchor | null): Rect | null => {
    if (!anchor) return null;
    if (anchor.kind === "mark") {
      const m = marks.find((x) => x.id === anchor.markId);
      return m ? boxOf(m) : null;
    }
    if (anchor.kind === "area" && !frameId) return anchor.rect;
    const f = frameOf(frameId);
    if (!f) return null;
    return anchor.kind === "frame" ? f : { x: f.x + anchor.rect.x, y: f.y + anchor.rect.y, w: anchor.rect.w, h: anchor.rect.h };
  };

  const isOnPage = (pin: BoardPin) => {
    if (pin.frameId) {
      const f = frameOf(pin.frameId);
      return Boolean(f && pageOf(board, f) === page);
    }
    return (pin.page ?? firstPage) === page;
  };

  const pins: PinPlace[] = [];
  for (const pin of board.pins) {
    if (!isOnPage(pin) || (pin.doneAt && !showResolved && pin.id !== selected)) continue;
    const at = placeOf(pin);
    if (at) pins.push({ pin, x: at.x, y: at.y });
  }

  const selectedPin = board.pins.find((p) => p.id === selected) ?? null;
  const highlight = draft ? anchorBox(draft.frameId, draft.anchor) : selectedPin ? anchorBox(selectedPin.frameId, selectedPin.anchor) : null;

  const goTo = (pin: BoardPin) => {
    const f = frameOf(pin.frameId);
    const target = f ? pageOf(board, f) : (pin.page ?? firstPage);
    if (target !== page) setPage(target);
    const box = anchorBox(pin.frameId, pin.anchor) ?? (f ? (f as Rect) : null);
    const at = placeOf(pin);
    requestAnimationFrame(() => {
      if (box && box.w > 0) canvas.current?.fitRect(box);
      else if (at) canvas.current?.fitRect({ x: at.x - 400, y: at.y - 300, w: 800, h: 600 });
    });
  };

  const openPin = (pin: BoardPin, move: boolean) => {
    setDraft(null);
    setSelected(pin.id);
    if (move) goTo(pin);
  };

  const sendNew = async (body: string, author: string) => {
    if (!draft) return false;
    setBusy(true);
    const input = { frameId: draft.frameId, page: draft.page, anchor: draft.anchor, x: draft.x, y: draft.y, body };
    const r = side.kind === "us" ? await dropAdminPin(side.id, input) : await dropPublicPin(side.token, { ...input, name: author });
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
      side.kind === "us" ? await replyAdmin(side.id, selected, body) : await replyPublic(side.token, selected, { body, name: author });
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

  /** A comment on whatever is selected: a drawing, a block of a design, or a whole design. */
  const commentOnSelection = () => {
    if (!selection) return;
    if (selection.kind === "mark") {
      const m = marks.find((x) => x.id === selection.id);
      if (!m) return;
      const b = boxOf(m);
      setDraft({ frameId: null, page: m.page ?? firstPage, x: b.x + b.w, y: b.y, anchor: { kind: "mark", markId: m.id } });
    } else if (selection.kind === "marks") {
      // Several drawings: the comment is on the area round them all.
      const b = unionBox(marks.filter((m) => selection.ids.includes(m.id)));
      if (!b) return;
      setDraft({ frameId: null, page, x: b.x + b.w, y: b.y, anchor: { kind: "area", rect: b } });
    } else if (selection.kind === "area") {
      const r = selection.rect;
      setDraft({ frameId: selection.frameId, page, x: r.x + r.w, y: r.y, anchor: { kind: "area", rect: r } });
    } else {
      const f = frameOf(selection.frameId);
      if (!f) return;
      if (selection.kind === "frame") {
        setDraft({ frameId: f.id, page: f.page, x: f.w, y: 0, anchor: { kind: "frame" } });
      } else {
        const r = selection.rect;
        setDraft({
          frameId: f.id,
          page: f.page,
          x: clamp(r.x + r.w, 0, f.w),
          y: clamp(r.y, 0, f.h),
          anchor: { kind: "element", rect: r, path: selection.path, label: selection.label },
        });
      }
    }
    setSelected(null);
    // The comment takes over from the selection, as on the Claude canvas.
    setSelection(null);
  };

  const selectionBox = (): Rect | null => {
    if (!selection) return null;
    if (selection.kind === "mark" || selection.kind === "marks") {
      return unionBox(marks.filter((m) => selectedIds(selection).includes(m.id)));
    }
    if (selection.kind === "area") return anchorBox(selection.frameId, { kind: "area", rect: selection.rect });
    const f = frameOf(selection.frameId);
    if (!f) return null;
    return selection.kind === "frame" ? f : { x: f.x + selection.rect.x, y: f.y + selection.rect.y, w: selection.rect.w, h: selection.rect.h };
  };

  const zoomToSelection = () => {
    const b = selectionBox();
    if (b) canvas.current?.fitRect(b);
  };

  const chosen = marks.filter((m) => selectedIds(selection).includes(m.id));

  const removeSelected = () => {
    if (!chosen.length) return;
    changeMany(chosen.map((m) => ({ before: m, after: null })));
    setSelection(null);
  };

  const restyle = (fn: Restyle) => {
    if (!chosen.length) return;
    changeMany(chosen.map((m) => ({ before: m, after: { ...m, ...fn(m) } })));
    const colour = fn(chosen[0]).color;
    if (colour) setStyle((st) => (chosen[0].kind === "note" ? { ...st, noteFill: colour } : { ...st, ink: colour }));
  };

  function pickTool(t: Tool) {
    setTool(t);
    setDraft(null);
    if (t !== "select") setSelection(null);
  }

  /* ------------------------------------------------------------ keys */

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.code === "KeyZ") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.code === "KeyY") {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        canvas.current?.zoomBy(1.25);
        return;
      }
      if (mod && e.key === "-") {
        e.preventDefault();
        canvas.current?.zoomBy(0.8);
        return;
      }
      if (mod || e.altKey) return;

      if (e.key === "Escape") {
        if (draft) setDraft(null);
        else if (selected) setSelected(null);
        else if (selection?.kind === "element" && selection.depth > 0) setSelection({ ...selection, depth: selection.depth - 1 });
        else if (selection) setSelection(null);
        else if (tool !== "select") setTool("select");
        else if (allOpen) setAllOpen(false);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && chosen.length) {
        e.preventDefault();
        removeSelected();
        return;
      }
      if (e.key === "Enter" && selection?.kind === "mark") {
        const m = marks.find((x) => x.id === selection.id);
        if (m && (m.kind === "text" || m.kind === "note")) {
          e.preventDefault();
          startEditing(m);
        }
        return;
      }
      if (e.shiftKey && e.code === "Digit1") return void canvas.current?.fit();
      if (e.shiftKey && e.code === "Digit2") return void zoomToSelection();
      if (e.shiftKey && e.code === "Digit0") return void canvas.current?.zoomTo(1);
      if (e.key.startsWith("Arrow") && chosen.length) {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) / (canvas.current?.zoom() ?? 1);
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        changeMany(chosen.map((m) => ({ before: m, after: moveBy(m, dx, dy) })));
        return;
      }
      if (e.code === "KeyC" && !e.shiftKey) {
        if (selection) commentOnSelection();
        else pickTool(tool === "comment" ? "select" : "comment");
        return;
      }
      if (e.shiftKey && e.code === "KeyP") return void pickTool("pen");
      if (e.shiftKey && e.code === "KeyL") return void pickTool("arrow");
      const next = TOOL_KEYS[e.code];
      if (next && !e.shiftKey) pickTool(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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
    <NewCommentCard draftKey={draftKey(side.token, null)} name={name} busy={busy} onSend={sendNew} onCancel={() => setDraft(null)} />
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

  // On a laptop the thread or the new comment floats beside its pin, out of the panel's way.
  const overlay = (toScreen: ToScreen, size: { w: number; h: number }) => {
    if (!wide) return null;
    const at = draft ? placeOf({ frameId: draft.frameId, anchor: null, x: draft.x, y: draft.y }) : selectedPin ? placeOf(selectedPin) : null;
    const body = draft ? composer : thread;
    if (!at || !body) return null;
    const p = toScreen(at.x, at.y);
    const right = size.w - (allOpen ? PANEL_W + 12 : 0);
    let left = p.x + 30;
    if (left + POP_W > right - 12) left = p.x - POP_W - 14;
    left = clamp(left, 12, Math.max(12, right - POP_W - 12));
    const top = clamp(p.y - 44, 60, Math.max(60, size.h - 160));
    return (
      <div
        data-float
        className="absolute z-30 flex flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
        style={{ left, top, width: POP_W, maxHeight: size.h - top - 12 }}
      >
        {body}
      </div>
    );
  };

  const selectionBar = (rect: Rect, zoom: number) => (
    <SelectionBar
      rect={rect}
      marks={chosen}
      zoom={zoom}
      label={
        selection?.kind === "element" ? selection.label : selection?.kind === "frame" ? (frameOf(selection.frameId)?.title ?? null) : null
      }
      onComment={commentOnSelection}
      onZoom={zoomToSelection}
      onStyle={restyle}
      onRemove={removeSelected}
    />
  );

  const editBar = (rect: Rect) => (
    <EditBar
      rect={rect}
      size={editSize}
      onSize={(next) => {
        setEditSize(next);
        document.querySelector("[data-editing]")?.dispatchEvent(new CustomEvent(FORMAT_EVENT, { detail: { size: next } }));
      }}
    />
  );

  const empty = board.frames.length === 0 && marks.length === 0;
  const phoneSheet = !wide ? (draft ? "new" : selectedPin ? "thread" : allOpen ? "all" : null) : null;

  const pageMenu =
    board.pages.length > 0 ? (
      <PageMenu
        pages={board.pages}
        page={page}
        onPage={(id) => {
          setPage(id);
          setDraft(null);
          setSelected(null);
          setSelection(null);
        }}
      />
    ) : null;

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
          <CommentMenu
            active={tool === "comment"}
            openCount={openCount}
            onToggle={() => pickTool(tool === "comment" ? "select" : "comment")}
            onShowAll={() => {
              setAllOpen(true);
              setDraft(null);
            }}
          />
        </div>
      </header>

      {closedAt ? (
        <p className="shrink-0 border-b border-warning/30 bg-warning-soft px-4 py-2 text-sm text-warning">
          The link is off. Nobody can open this board from it.
        </p>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <BoardCanvas
          ref={canvas}
          frames={frames}
          marks={pageMarks}
          notes={notes}
          page={page}
          fitKey={page ?? ""}
          tool={tool}
          style={style}
          selection={selection}
          onSelect={(s) => {
            setSelection(s);
            if (s) setSelected(null);
          }}
          editingId={editingId}
          onEdit={(id) => {
            const m = id ? marks.find((x) => x.id === id) : null;
            if (m) startEditing(m);
            else setEditingId(null);
          }}
          onEdited={onEdited}
          onCreate={onCreate}
          onCommit={(before, after) => changeMany(before.map((b, i) => ({ before: b, after: after[i] })))}
          pins={pins}
          selectedPinId={selected}
          highlight={highlight}
          draft={draft}
          onSelectPin={(id) => {
            const pin = board.pins.find((p) => p.id === id);
            if (pin) openPin(pin, false);
            setSelection(null);
          }}
          onComment={(spot) => {
            setSelected(null);
            setDraft(spot);
          }}
          onBackground={() => {
            setDraft(null);
            setSelected(null);
          }}
          insetRight={wide && allOpen ? PANEL_W + 12 : 0}
          src={src}
          author={{ name: name.value || "The client", side: side.kind === "us" ? "us" : "client" }}
          zoomMenu={{
            canUndo: undoStack.current.length > 0,
            canRedo: redoStack.current.length > 0,
            onUndo: undo,
            onRedo: redo,
            zoomToSelection,
          }}
          overlay={overlay}
          selectionBar={tool === "select" ? selectionBar : undefined}
          editBar={editBar}
        />

        {empty ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
            <div>
              <p className="font-display text-lg font-semibold">Nothing is on this board yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Draw on it, or wait for the designs we add.</p>
            </div>
          </div>
        ) : null}

        <Toolbar tool={tool} onTool={pickTool} compact={!wide} pageMenu={pageMenu} />

        {!wide && pageMenu ? (
          <div
            data-float
            className="absolute left-3 top-3 z-10 flex h-11 items-center rounded-xl border border-black/10 bg-surface px-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
          >
            {pageMenu}
          </div>
        ) : null}

        {!wide && tool === "comment" && !draft ? (
          <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white">
            Tap a spot to comment
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

/* ------------------------------------------------------------------ the top bar */

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
        aria-label={active ? "Stop commenting C" : "Comment C"}
        title={active ? "Stop commenting C" : "Comment C"}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          active ? "bg-[#e5eefc] text-[#2f6fdf]" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
          <path d="M4 20V12a8 8 0 1 1 8 8z" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
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
        <Menu className="right-0 top-10 w-56">
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
            <span className="text-xs tabular-nums text-subtle">{openCount} open</span>
          </button>
        </Menu>
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
        <Menu className="left-0 top-10 w-60">
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
        </Menu>
      ) : null}
    </div>
  );
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
