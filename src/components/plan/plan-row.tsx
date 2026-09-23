"use client";

import * as React from "react";
import type { PlanItem, PlanSide, PlanState, PlanVisibility } from "@/lib/api/types";
import { dueWord, stateWord } from "@/lib/plan/plan";
import { shortDate } from "@/lib/files/tree";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronRightIcon, LockIcon, TrashIcon } from "@/components/files/icons";
import { Pill } from "@/components/files/drive-ui";
import {
  CalendarIcon,
  ChatIcon,
  EyeOffIcon,
  HandIcon,
  PaperclipIcon,
  StateMark,
} from "./plan-icons";

/**
 * One line of the plan, and everything about it underneath when it is opened. Opening in place
 * rather than in a dialog: this is a list to work down, and a dialog on every row makes that a
 * chore on a phone.
 */

export interface RowHandlers {
  onToggleDone(item: PlanItem): void;
  onState(item: PlanItem, state: PlanState): void;
  onWaitingOn(item: PlanItem, side: PlanSide): void;
  onVisibility(item: PlanItem, visibility: PlanVisibility): void;
  onDue(item: PlanItem, date: string | null): void;
  onNote(item: PlanItem, note: string): void;
  onShelvedReason(item: PlanItem, reason: string): void;
  onComment(item: PlanItem, body: string): void;
  onDelete(item: PlanItem): void;
  onApprove(item: PlanItem): void;
}

export function PlanRow({
  item,
  side,
  open,
  busy,
  onOpen,
  handlers,
}: {
  item: PlanItem;
  side: "admin" | "client";
  open: boolean;
  busy: boolean;
  onOpen: () => void;
  handlers: RowHandlers;
}) {
  const admin = side === "admin";
  const done = item.state === "done";
  const shelved = item.state === "shelved";
  const due = dueWord(item.dueDate);
  const late = Boolean(due?.endsWith("late"));
  const canApprove = !admin && done && !item.approvedAt;

  return (
    <div
      className={cn(
        "rounded-[var(--doc-r-inset)] transition-colors duration-150",
        open ? "bg-[var(--doc-fill)]" : "bg-[var(--doc-fill-quiet)] hover:bg-[var(--doc-fill)]",
        shelved && !open && "opacity-75",
      )}
    >
      {/* The line itself */}
      <div className="flex items-start gap-2 p-2 sm:gap-3 sm:p-2.5">
        {admin ? (
          <button
            type="button"
            onClick={() => handlers.onToggleDone(item)}
            disabled={busy}
            aria-pressed={done}
            aria-label={done ? `Mark "${item.title}" not done` : `Mark "${item.title}" done`}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--doc-fill-strong)] disabled:opacity-40"
          >
            <Tick done={done} />
          </button>
        ) : (
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-[var(--doc-ink-soft)]"
            aria-hidden
          >
            {/* Every line carries a mark, so the client's list reads as a list and not as ragged
                text: a tick for finished, the state's own glyph where it has one, an empty ring
                for work still to come. */}
            {done ? <Tick done /> : shelved || item.state === "proposed" || item.state === "doing" ? (
              <StateMark state={item.state} className="h-4 w-4" />
            ) : (
              <Tick done={false} />
            )}
          </span>
        )}

        <button
          type="button"
          onClick={onOpen}
          aria-expanded={open}
          className="min-w-0 flex-1 rounded-[0.75rem] py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)]"
        >
          <p
            className={cn(
              "text-[15px] leading-snug font-medium text-[var(--doc-ink)]",
              done && "line-through decoration-[var(--doc-ink-soft)] decoration-1",
            )}
          >
            {item.title}
          </p>
          {!open && item.note && (
            <p className="mt-0.5 truncate text-[13px] text-[var(--doc-ink-soft)]">{item.note}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {item.waitingOn === "client" && !done && !shelved && (
              <Chip tone="attention">
                <HandIcon className="h-3.5 w-3.5" />
                {admin ? "Waiting on them" : "Waiting on you"}
              </Chip>
            )}
            {admin && item.visibility === "internal" && (
              <Chip>
                <EyeOffIcon className="h-3.5 w-3.5" />
                Internal
              </Chip>
            )}
            {item.raisedBy === "client" && item.state === "proposed" && (
              <Chip tone="attention">{admin ? "They asked for this" : "You asked for this"}</Chip>
            )}
            {due && !done && !shelved && (
              <Chip tone={late ? "attention" : "plain"}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {due}
              </Chip>
            )}
            {item.approvedAt && (
              <Chip tone="good">
                <CheckIcon className="h-3 w-3" />
                Approved by {item.approvedBy} on {shortDate(item.approvedAt)}
              </Chip>
            )}
            {shelved && item.shelvedReason && <Chip>Parked: {item.shelvedReason}</Chip>}
            {item.fileIds.length > 0 && (
              <Chip>
                <PaperclipIcon className="h-3.5 w-3.5" />
                {item.fileIds.length}
              </Chip>
            )}
            {item.comments.length > 0 && (
              <Chip>
                <ChatIcon className="h-3.5 w-3.5" />
                {item.comments.length}
              </Chip>
            )}
          </div>
        </button>

        {canApprove ? (
          <Pill tone="ink" size="sm" disabled={busy} onClick={() => handlers.onApprove(item)}>
            Approve
          </Pill>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            aria-expanded={open}
            aria-label={open ? `Close ${item.title}` : `Open ${item.title}`}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--doc-ink-soft)] transition-colors hover:bg-[var(--doc-fill-strong)] hover:text-[var(--doc-ink)]"
          >
            <ChevronRightIcon
              className={cn("h-4 w-4 transition-transform duration-150", open && "rotate-90")}
            />
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-4 border-t border-[var(--doc-fill-strong)] px-2 pt-3 pb-3 sm:px-3">
          {admin ? (
            <AdminControls item={item} busy={busy} handlers={handlers} />
          ) : (
            item.note && (
              <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--doc-ink-body)]">
                {item.note}
              </p>
            )
          )}

          <Comments item={item} side={side} busy={busy} onComment={handlers.onComment} />

          {canApprove && (
            <div className="rounded-[var(--doc-r-inset)] bg-[var(--doc-paper)] p-3">
              <p className="text-sm text-[var(--doc-ink-body)]">
                Happy with this one? Approving records your name against it.
              </p>
              <Pill tone="ink" className="mt-2.5" disabled={busy} onClick={() => handlers.onApprove(item)}>
                <CheckIcon className="h-4 w-4" />
                Approve this
              </Pill>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function Tick({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        "flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full transition-colors duration-150",
        done
          ? "bg-[#12110f] text-white"
          : "bg-[var(--doc-paper)] shadow-[0_0_0_1.5px_rgba(18,17,15,0.3)]",
      )}
    >
      {done && <CheckIcon className="h-3.5 w-3.5" />}
    </span>
  );
}

function Chip({
  children,
  tone = "plain",
}: {
  children: React.ReactNode;
  tone?: "plain" | "attention" | "good";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium",
        tone === "attention" && "bg-warning-soft text-warning",
        tone === "good" && "bg-success-soft text-success",
        tone === "plain" && "bg-[var(--doc-fill-strong)] text-[var(--doc-ink-soft)]",
      )}
    >
      {children}
    </span>
  );
}

const STATES: PlanState[] = ["proposed", "agreed", "doing", "done", "shelved"];

function AdminControls({
  item,
  busy,
  handlers,
}: {
  item: PlanItem;
  busy: boolean;
  handlers: RowHandlers;
}) {
  return (
    <div className="space-y-3">
      <Field label="State">
        <div className="flex flex-wrap gap-1.5">
          {STATES.map((state) => (
            <button
              key={state}
              type="button"
              disabled={busy}
              onClick={() => handlers.onState(item, state)}
              aria-pressed={item.state === state}
              className={cn(
                "h-8 rounded-full px-3 text-[13px] font-medium transition-colors disabled:opacity-40",
                item.state === state
                  ? "bg-[#12110f] text-white"
                  : "bg-[var(--doc-paper)] text-[var(--doc-ink-body)] hover:bg-[var(--doc-fill-strong)]",
              )}
            >
              {stateWord(state, "admin")}
            </button>
          ))}
        </div>
      </Field>

      {item.state === "shelved" && (
        <Field label="Why it is parked">
          <TextInput
            defaultValue={item.shelvedReason ?? ""}
            placeholder="Out of scope for this event"
            maxLength={200}
            onSave={(value) => handlers.onShelvedReason(item, value)}
          />
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Waiting on">
          <Segmented
            value={item.waitingOn}
            options={[
              { value: "us", label: "Us" },
              { value: "client", label: "The client" },
            ]}
            disabled={busy}
            onChange={(value) => handlers.onWaitingOn(item, value as PlanSide)}
          />
        </Field>
        <Field label="The client sees this">
          <Segmented
            value={item.visibility}
            options={[
              { value: "shared", label: "Yes" },
              { value: "internal", label: "Internal" },
            ]}
            disabled={busy}
            onChange={(value) => handlers.onVisibility(item, value as PlanVisibility)}
          />
        </Field>
      </div>

      <Field label="Note">
        <TextArea
          defaultValue={item.note ?? ""}
          placeholder="A line or two, if it needs them"
          onSave={(value) => handlers.onNote(item, value)}
        />
      </Field>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field label="Due">
          <input
            type="date"
            defaultValue={item.dueDate ?? ""}
            disabled={busy}
            onChange={(e) => handlers.onDue(item, e.target.value || null)}
            className="h-10 rounded-full bg-[var(--doc-paper)] px-4 text-sm text-[var(--doc-ink)] outline-none focus:shadow-[0_0_0_2px_var(--doc-ink)]"
          />
        </Field>
        <button
          type="button"
          disabled={busy}
          onClick={() => handlers.onDelete(item)}
          className="text-danger inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors hover:bg-[var(--doc-fill-strong)] disabled:opacity-40"
        >
          <TrashIcon className="h-4 w-4" />
          Remove
        </button>
      </div>

      {item.approvedAt && (
        <p className="flex items-start gap-2 text-xs text-[var(--doc-ink-soft)]">
          <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Approved from the project link as {item.approvedBy} on {shortDate(item.approvedAt)}. That
          is the name they gave, not a checked identity. Changing the title clears it.
        </p>
      )}
    </div>
  );
}

function Comments({
  item,
  side,
  busy,
  onComment,
}: {
  item: PlanItem;
  side: "admin" | "client";
  busy: boolean;
  onComment: (item: PlanItem, body: string) => void;
}) {
  const [body, setBody] = React.useState("");
  const send = () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    onComment(item, text);
  };

  return (
    <div>
      {item.comments.length > 0 && (
        <ul className="mb-2.5 space-y-2">
          {item.comments.map((c) => (
            <li
              key={c.id}
              className={cn(
                "rounded-[var(--doc-r-inset)] px-3.5 py-2.5",
                (side === "admin") === (c.side === "us")
                  ? "bg-[var(--doc-paper)]"
                  : "bg-[var(--doc-fill-strong)]",
              )}
            >
              <p className="text-[13px] leading-relaxed whitespace-pre-line text-[var(--doc-ink-body)]">
                {c.body}
              </p>
              <p className="mt-1 text-[11.5px] text-[var(--doc-ink-soft)]">
                {c.author} · {shortDate(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
          rows={1}
          maxLength={2000}
          placeholder={side === "admin" ? "Reply to the client" : "Say something"}
          className="min-h-10 flex-1 resize-y rounded-[1.25rem] bg-[var(--doc-paper)] px-4 py-2.5 text-sm text-[var(--doc-ink)] outline-none focus:shadow-[0_0_0_2px_var(--doc-ink)]"
        />
        <Pill tone="fill" disabled={busy || !body.trim()} onClick={send}>
          Post
        </Pill>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11.5px] font-semibold tracking-[0.05em] text-[var(--doc-ink-soft)] uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function Segmented({
  value,
  options,
  disabled,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-[var(--doc-paper)] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 rounded-full px-3.5 text-[13px] font-medium transition-colors disabled:opacity-40",
            value === o.value
              ? "bg-[#12110f] text-white"
              : "text-[var(--doc-ink-body)] hover:bg-[var(--doc-fill-strong)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Saves when it loses focus, which is what a list of small edits wants. */
function TextInput({
  defaultValue,
  placeholder,
  maxLength,
  onSave,
}: {
  defaultValue: string;
  placeholder?: string;
  maxLength?: number;
  onSave: (value: string) => void;
}) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      maxLength={maxLength}
      onBlur={(e) => e.target.value !== defaultValue && onSave(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="h-10 w-full rounded-full bg-[var(--doc-paper)] px-4 text-sm text-[var(--doc-ink)] outline-none focus:shadow-[0_0_0_2px_var(--doc-ink)]"
    />
  );
}

function TextArea({
  defaultValue,
  placeholder,
  onSave,
}: {
  defaultValue: string;
  placeholder?: string;
  onSave: (value: string) => void;
}) {
  return (
    <textarea
      defaultValue={defaultValue}
      placeholder={placeholder}
      rows={2}
      maxLength={4000}
      onBlur={(e) => e.target.value !== defaultValue && onSave(e.target.value)}
      className="w-full resize-y rounded-[1.25rem] bg-[var(--doc-paper)] px-4 py-2.5 text-sm leading-relaxed text-[var(--doc-ink)] outline-none focus:shadow-[0_0_0_2px_var(--doc-ink)]"
    />
  );
}
