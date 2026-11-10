"use client";

import * as React from "react";
import type { BoardFrame, BoardPin, PublicBoard } from "@/lib/api";
import { ago, initial, pinOrder, speakers, store } from "@/lib/boards/view";
import { cn } from "@/lib/utils";

/**
 * The talk on a board (docs/BOARDS.md), laid out as the Claude canvas lays out its comments: a
 * pin is a bubble of the people in it, a thread floats beside its pin, and every comment is a
 * card in the All comments panel, ticked when it is resolved.
 */

/* ------------------------------------------------------------------ people */

export function Avatar({ name, side, size = 24 }: { name: string; side: "client" | "us"; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold leading-none text-white",
        side === "client" ? "bg-[#15806b]" : "bg-foreground",
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.46) }}
    >
      {initial(name)}
    </span>
  );
}

/** A pin on a frame: a bubble pointing at its spot, holding the people who spoke on it. */
export function PinBubble({
  pin,
  selected,
  onClick,
}: {
  pin: BoardPin;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const people = speakers(pin).slice(0, 2);
  return (
    <button
      type="button"
      data-pin
      onClick={onClick}
      aria-label={`Comment by ${people[0]?.author ?? "someone"}${pin.doneAt ? ", resolved" : ""}`}
      className={cn(
        "flex items-center gap-0.5 rounded-full rounded-bl-none bg-surface p-1 shadow-[0_1px_4px_rgba(0,0,0,0.3)]",
        selected && "outline outline-2 outline-[#2f6fdf]",
        pin.doneAt && "opacity-60",
      )}
    >
      {people.map((p, i) => (
        <span key={p.author} className={cn(i > 0 && "-ml-2.5 rounded-full ring-2 ring-surface")}>
          <Avatar name={p.author} side={p.side} />
        </span>
      ))}
    </button>
  );
}

/* ------------------------------------------------------------------ All comments */

export function AllComments({
  board,
  showResolved,
  selectedId,
  canResolve,
  onToggleResolved,
  onSelect,
  onResolve,
  onClose,
}: {
  board: PublicBoard;
  showResolved: boolean;
  selectedId: string | null;
  canResolve: boolean;
  onToggleResolved: () => void;
  onSelect: (pin: BoardPin) => void;
  onResolve: (pin: BoardPin, done: boolean) => void;
  onClose: () => void;
}) {
  const { open, done } = pinOrder(board.pins);
  // Newest talk first, as the canvas lists it.
  const latest = (p: BoardPin) => p.comments[p.comments.length - 1]?.createdAt ?? "";
  const shown = [...open, ...(showResolved ? done : [])].sort((a, b) => latest(b).localeCompare(latest(a)));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-1 pl-4 pr-2">
        <h2 className="flex-1 text-[15px] font-semibold">All comments</h2>
        <IconButton
          label={showResolved ? "Hide resolved comments" : "Show resolved comments"}
          pressed={showResolved}
          onClick={onToggleResolved}
        >
          <path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" />
        </IconButton>
        <IconButton label="Close" onClick={onClose}>
          <path d="M6 6l12 12M18 6L6 18" />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {shown.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {board.pins.length === 0 ? "No comments yet." : "No open comments."}
            {done.length > 0 && !showResolved ? (
              <>
                {" "}
                <button type="button" onClick={onToggleResolved} className="underline underline-offset-2 hover:text-foreground">
                  Show {done.length} resolved
                </button>
              </>
            ) : null}
          </p>
        ) : (
          <ul className="space-y-1">
            {shown.map((pin) => (
              <li key={pin.id}>
                <CommentCard
                  pin={pin}
                  frame={board.frames.find((f) => f.id === pin.frameId)}
                  selected={pin.id === selectedId}
                  canResolve={canResolve}
                  onSelect={() => onSelect(pin)}
                  onResolve={(d) => onResolve(pin, d)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CommentCard({
  pin,
  frame,
  selected,
  canResolve,
  onSelect,
  onResolve,
}: {
  pin: BoardPin;
  frame: BoardFrame | undefined;
  selected: boolean;
  canResolve: boolean;
  onSelect: () => void;
  onResolve: (done: boolean) => void;
}) {
  const first = pin.comments[0];
  const replies = pin.comments.length - 1;
  if (!first) return null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())}
      className={cn("cursor-pointer rounded-xl px-3 py-3 outline-none hover:bg-muted focus-visible:bg-muted", selected && "bg-muted")}
    >
      <div className="flex items-center gap-2">
        <Avatar name={first.author} side={first.side} />
        <span className="min-w-0 truncate text-sm font-semibold">{first.author}</span>
        <span className="shrink-0 text-xs text-subtle">{ago(first.createdAt)}</span>
        <span className="ml-auto" />
        <ResolveTick done={Boolean(pin.doneAt)} enabled={canResolve} onChange={onResolve} />
      </div>
      <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-[15px] leading-snug">{first.body}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {frame?.title ?? "A removed drawing"}
        {replies > 0 ? ` · ${replies} ${replies === 1 ? "reply" : "replies"}` : ""}
      </p>
    </div>
  );
}

/** A tick in a circle: filled when resolved. Only our side can press it. */
function ResolveTick({ done, enabled, onChange }: { done: boolean; enabled: boolean; onChange: (done: boolean) => void }) {
  const mark = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="10" fill={done ? "#2f6fdf" : "none"} stroke={done ? "#2f6fdf" : "currentColor"} strokeWidth="1.6" />
      <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke={done ? "white" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (!enabled) {
    return done ? (
      <span className="flex h-8 w-8 items-center justify-center" title="Resolved" aria-label="Resolved">
        {mark}
      </span>
    ) : null;
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange(!done);
      }}
      aria-label={done ? "Open it again" : "Resolve"}
      title={done ? "Open it again" : "Resolve"}
      className="flex h-8 w-8 items-center justify-center rounded-md text-subtle hover:bg-black/5 hover:text-foreground"
    >
      {mark}
    </button>
  );
}

/* ------------------------------------------------------------------ one thread */

export function ThreadCard({
  pin,
  frame,
  canResolve,
  draftKey,
  name,
  busy,
  onReply,
  onResolve,
  onClose,
}: {
  pin: BoardPin;
  frame: BoardFrame | undefined;
  canResolve: boolean;
  draftKey: string;
  name: NameField;
  busy: boolean;
  onReply: (body: string, author: string) => Promise<boolean>;
  onResolve: (done: boolean) => void;
  onClose: () => void;
}) {
  const end = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // Braces matter: scrollIntoView returns a promise in new browsers, and an effect may only return a cleanup.
    end.current?.scrollIntoView({ block: "end" });
  }, [pin.comments.length]);
  const redrawn = frame && pin.frameVersion < frame.version;

  return (
    <div className="flex max-h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3">
        {pin.comments.map((c, i) => (
          <div key={c.id} className={cn(i > 0 && "mt-4")}>
            <div className="flex items-center gap-2">
              <Avatar name={c.author} side={c.side} />
              <span className="min-w-0 truncate text-sm font-semibold">{c.author}</span>
              <span className="shrink-0 text-xs text-subtle">{ago(c.createdAt)}</span>
              {i === 0 ? (
                <span className="ml-auto flex shrink-0 items-center">
                  <ResolveTick done={Boolean(pin.doneAt)} enabled={canResolve} onChange={onResolve} />
                  <IconButton label="Close" onClick={onClose}>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </IconButton>
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{c.body}</p>
          </div>
        ))}
        {redrawn ? <p className="mt-3 text-xs text-warning">Left on an earlier version of this drawing.</p> : null}
        {pin.doneAt ? (
          <p className="mt-3 text-xs text-muted-foreground">Resolved by {pin.doneBy ?? "SaharaBase"}.</p>
        ) : null}
        <div ref={end} className="h-3" />
      </div>
      <div className="shrink-0 border-t border-border p-3">
        <Composer
          draftKey={draftKey}
          name={name}
          busy={busy}
          placeholder={pin.doneAt ? "Reply to reopen" : "Reply"}
          onSend={onReply}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ a new comment */

export function NewCommentCard({
  draftKey,
  name,
  busy,
  onSend,
  onCancel,
}: {
  draftKey: string;
  name: NameField;
  busy: boolean;
  onSend: (body: string, author: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  return (
    <div className="p-3">
      <Composer draftKey={draftKey} name={name} busy={busy} autoFocus placeholder="Add a comment" onSend={onSend} onCancel={onCancel} />
    </div>
  );
}

/* ------------------------------------------------------------------ the box */

/**
 * Who is writing. On the link it is the name they typed, asked once and kept on the device. On
 * our side it is the admin's account and cannot change here.
 */
export type NameField =
  | { kind: "fixed"; value: string }
  | { kind: "typed"; value: string; set: (value: string) => void };

function Composer({
  draftKey,
  name,
  busy,
  autoFocus,
  placeholder,
  onSend,
  onCancel,
}: {
  draftKey: string;
  name: NameField;
  busy: boolean;
  autoFocus?: boolean;
  placeholder: string;
  onSend: (body: string, author: string) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [text, setText] = React.useState("");
  const [typedName, setTypedName] = React.useState("");
  const [editingName, setEditingName] = React.useState(false);
  const area = React.useRef<HTMLTextAreaElement>(null);

  // A comment not yet sent comes back after a reload or a dropped connection.
  React.useEffect(() => {
    setText(store.get(draftKey) ?? "");
  }, [draftKey]);

  const needName = name.kind === "typed" && (name.value === "" || editingName);
  const ready = text.trim() !== "" && (!needName || typedName.trim() !== "") && !busy;

  // The box grows with what is typed, up to a point.
  React.useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  const send = async () => {
    if (!ready) return;
    const author = needName ? typedName.trim() : name.value;
    if (needName && name.kind === "typed") {
      name.set(author);
      setEditingName(false);
    }
    if (await onSend(text, author)) {
      setText("");
      store.set(draftKey, null);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      {needName ? (
        <label className="mb-2 block">
          <span className="text-xs font-medium text-muted-foreground">Your name</span>
          <input
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            autoComplete="name"
            autoFocus={autoFocus}
            maxLength={120}
            className="mt-1 h-10 w-full rounded-lg border border-input bg-surface px-3 text-[16px] outline-none focus:border-foreground"
          />
        </label>
      ) : null}
      <div className="flex items-end gap-2 rounded-xl border border-input bg-surface py-1.5 pl-3 pr-1.5 focus-within:border-foreground">
        <textarea
          ref={area}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            store.set(draftKey, e.target.value);
          }}
          onKeyDown={(e) => {
            // Enter sends, as in the canvas; Shift and Enter starts a new line.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
            if (e.key === "Escape" && onCancel) onCancel();
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={autoFocus && !needName}
          rows={1}
          maxLength={4000}
          className="max-h-[200px] min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[16px] leading-snug outline-none placeholder:text-subtle"
        />
        <button
          type="submit"
          disabled={!ready}
          aria-label={busy ? "Sending" : "Send"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-white disabled:bg-muted disabled:text-subtle"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </button>
      </div>
      {name.kind === "typed" && name.value !== "" && !editingName ? (
        <p className="mt-1.5 text-xs text-subtle">
          As {name.value}.{" "}
          <button
            type="button"
            onClick={() => {
              setTypedName(name.value);
              setEditingName(true);
            }}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Change name
          </button>
        </p>
      ) : null}
    </form>
  );
}

export function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5 hover:text-foreground",
        pressed && "bg-[#e5eefc] text-[#2f6fdf]",
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
