"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlanItem, PlanItemInput, WorkPackage } from "@/lib/api/types";
import { useToast } from "@/components/ui/toast";
import {
  addPlanItem,
  commentOnPlanItem,
  deletePlanItem,
  editPlanItem,
} from "@/lib/plan/actions";
import {
  approvePlanItem,
  commentAsClient,
  requestPlanItem,
} from "@/lib/plan/portal-actions";
import { COLLAPSED_BY_DEFAULT, countPlan, groupPlan, planSummary } from "@/lib/plan/plan";
import { cn } from "@/lib/utils";
import { Dialog, FieldPill, Pill, useStoredState } from "@/components/files/drive-ui";
import { ArrowUpRightIcon, ChevronRightIcon } from "@/components/files/icons";
import { PlusIcon } from "./plan-icons";
import { PlanRow, type RowHandlers } from "./plan-row";

/**
 * The plan (docs/PLAN.md): one list both sides read. `admin` adds, moves and parks items and
 * keeps some of them internal; `client` sees the shared ones, approves what is finished, asks
 * for things, and talks.
 *
 * Nothing here touches money. The quote's line items remain the only priced list.
 */

type Crumb = { label: string; href: string };

export type PlanBoardProps =
  | { mode: "admin"; pkg: WorkPackage; layout: "page" | "embedded"; trail?: Crumb[] }
  | { mode: "client"; pkg: WorkPackage; slug: string };

/** Narrowing the list on our side: everything, open work, what sits with them, what is ours alone. */
const FILTERS = [
  ["all", "All"],
  ["open", "Open"],
  ["client", "On them"],
  ["internal", "Internal"],
] as const;
type Filter = (typeof FILTERS)[number][0];

const NAME_KEY = "bedrock:client-name";

export function PlanBoard(props: PlanBoardProps) {
  const { pkg, mode } = props;
  const admin = mode === "admin";
  const embedded = props.mode === "admin" && props.layout === "embedded";
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = React.useState<PlanItem[]>(pkg.planItems ?? []);
  React.useEffect(() => setItems(pkg.planItems ?? []), [pkg]);

  const [busy, setBusy] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set(COLLAPSED_BY_DEFAULT));
  const [draft, setDraft] = React.useState("");
  const [asking, setAsking] = React.useState(false);
  const [removing, setRemoving] = React.useState<PlanItem | null>(null);
  // Whoever is on the client link tells us their name once, and it stays on their device.
  const [name, setName] = useStoredNameState();

  const counts = React.useMemo(() => countPlan(items), [items]);
  const shown = React.useMemo(() => {
    if (!admin || filter === "all") return items;
    if (filter === "open") return items.filter((i) => i.state !== "done" && i.state !== "shelved");
    if (filter === "client") return items.filter((i) => i.waitingOn === "client");
    return items.filter((i) => i.visibility === "internal");
  }, [items, filter, admin]);
  const groups = React.useMemo(() => groupPlan(shown, admin ? "admin" : "client"), [shown, admin]);

  /* ------------------------------------------------------------- writing */

  const settle = React.useCallback(
    async (call: () => Promise<{ ok: true; pkg: WorkPackage } | { ok: false; error: string }>) => {
      setBusy(true);
      const res = await call();
      setBusy(false);
      if (!res.ok) {
        toast(res.error, "danger");
        return false;
      }
      setItems(res.pkg.planItems ?? []);
      router.refresh();
      return true;
    },
    [router, toast],
  );

  const patch = React.useCallback(
    (item: PlanItem, input: PlanItemInput) => {
      // Show it at once; the answer replaces the list a moment later.
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...input } as PlanItem : i)));
      void settle(() => editPlanItem(pkg.id, item.id, input));
    },
    [pkg.id, settle],
  );

  const add = async () => {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    await settle(() => addPlanItem(pkg.id, title));
  };

  const handlers: RowHandlers = {
    onToggleDone: (item) => patch(item, { state: item.state === "done" ? "agreed" : "done" }),
    onState: (item, state) => patch(item, { state }),
    onWaitingOn: (item, waitingOn) => patch(item, { waitingOn }),
    onVisibility: (item, visibility) => patch(item, { visibility }),
    onDue: (item, dueDate) => patch(item, { dueDate }),
    onNote: (item, note) => patch(item, { note: note.trim() || null }),
    onShelvedReason: (item, shelvedReason) => patch(item, { shelvedReason: shelvedReason.trim() || null }),
    onDelete: (item) => setRemoving(item),
    onComment: (item, body) => {
      void settle(() =>
        admin
          ? commentOnPlanItem(pkg.id, item.id, body)
          : commentAsClient((props as { slug: string }).slug, item.id, body, name || null),
      );
    },
    onApprove: (item) => {
      void (async () => {
        const ok = await settle(() =>
          approvePlanItem((props as { slug: string }).slug, item.id, name || null),
        );
        if (ok) toast("Thank you. Your approval is on the project.", "success");
      })();
    },
  };

  /* -------------------------------------------------------------- render */

  const heading = admin ? (embedded ? "Plan" : pkg.title) : "What we agreed";
  const trail: Crumb[] = props.mode === "admin" ? (props.trail ?? []) : [];
  const empty = items.length === 0;

  return (
    <section
      aria-label="Plan"
      className={cn(
        "drive relative rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] text-[var(--doc-ink-body)]",
        embedded ? "p-4 sm:p-6" : "p-4 sm:p-7 lg:p-8",
      )}
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {trail.length > 0 && (
            <nav aria-label="Path" className="-ml-1.5 mb-1.5 flex flex-wrap items-center text-sm">
              {trail.map((c, i) => (
                <React.Fragment key={c.href}>
                  {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-[var(--doc-ink-soft)]" />}
                  <Link
                    href={c.href}
                    className="max-w-[14rem] truncate rounded-full px-1.5 py-0.5 text-[var(--doc-ink-body)] transition-colors hover:bg-[var(--doc-fill)] hover:text-[var(--doc-ink)]"
                  >
                    {c.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          )}
          <h2
            className={cn(
              "font-display font-semibold tracking-[-0.025em] text-[var(--doc-ink)]",
              embedded || !admin ? "text-[1.5rem] leading-tight" : "text-[1.75rem] leading-tight",
            )}
          >
            {heading}
          </h2>
          <p className="mt-1 text-sm text-[var(--doc-ink-soft)]">
            {admin
              ? planSummary(counts, "admin")
              : empty
                ? "Nothing here yet. We will fill this in as the work is agreed."
                : planSummary(counts, "client")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {embedded && (
            <Link
              href={`/admin/packages/${pkg.id}/plan`}
              className="inline-flex h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-[var(--doc-ink-body)] hover:bg-[var(--doc-fill)] sm:h-10"
            >
              Full view <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          )}
          {!admin && (
            <Pill tone="ink" onClick={() => setAsking(true)}>
              <PlusIcon className="h-4 w-4" />
              Ask for something
            </Pill>
          )}
        </div>
      </header>

      {/* Ours: add a line, and narrow the list */}
      {admin && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <FieldPill
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void add();
              }}
              placeholder="Add something to the plan"
              aria-label="Add something to the plan"
              maxLength={200}
            />
            <Pill tone="ink" disabled={busy || !draft.trim()} onClick={() => void add()}>
              Add
            </Pill>
          </div>
          <div className="flex shrink-0 gap-1 overflow-x-auto">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors sm:h-8",
                  filter === value
                    ? "bg-[#12110f] text-white"
                    : "bg-[var(--doc-fill)] text-[var(--doc-ink-body)] hover:bg-[var(--doc-fill-strong)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The list */}
      <div className="mt-4 space-y-5">
        {groups.length === 0 ? (
          <EmptyPlan admin={admin} filtered={!empty} />
        ) : (
          groups.map((group) => {
            const shut = collapsed.has(group.key);
            const attention = group.key === "waiting" || group.key === "proposed";
            return (
              <div key={group.key}>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((prev) => {
                      const next = new Set(prev);
                      if (next.has(group.key)) next.delete(group.key);
                      else next.add(group.key);
                      return next;
                    })
                  }
                  aria-expanded={!shut}
                  className={cn(
                    "mb-2 flex items-center gap-1.5 rounded-full px-1 py-0.5 text-[13px] font-semibold transition-colors hover:text-[var(--doc-ink)]",
                    attention ? "text-[var(--doc-ink)]" : "text-[var(--doc-ink-soft)]",
                  )}
                >
                  <ChevronRightIcon
                    className={cn("h-3.5 w-3.5 transition-transform duration-150", !shut && "rotate-90")}
                  />
                  {group.label}
                  <span className="tabular-nums">({group.items.length})</span>
                </button>
                {!shut && (
                  <div className="space-y-1.5">
                    {group.items.map((item) => (
                      <PlanRow
                        key={item.id}
                        item={item}
                        side={admin ? "admin" : "client"}
                        open={openId === item.id}
                        busy={busy}
                        onOpen={() => setOpenId(openId === item.id ? null : item.id)}
                        handlers={handlers}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!admin && !empty && (
        <p className="mt-5 text-xs leading-relaxed text-[var(--doc-ink-soft)]">
          Anything you approve or ask for here is recorded against this project under the name you
          give, and we see it straight away.
        </p>
      )}

      {/* Theirs: ask for something */}
      <AskDialog
        open={asking}
        name={name}
        busy={busy}
        onName={setName}
        onClose={() => setAsking(false)}
        onSend={async (title, note, who) => {
          setName(who);
          const ok = await settle(() =>
            requestPlanItem((props as { slug: string }).slug, {
              title,
              note: note || null,
              name: who || null,
            }),
          );
          if (ok) {
            setAsking(false);
            toast("Sent. We will come back to you on it.", "success");
          }
        }}
      />

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={`Remove “${removing?.title ?? ""}”?`}
        footer={
          <>
            <Pill tone="ghost" onClick={() => setRemoving(null)}>
              Keep it
            </Pill>
            <Pill
              tone="danger"
              disabled={busy}
              onClick={() => {
                const item = removing;
                setRemoving(null);
                if (item) void settle(() => deletePlanItem(pkg.id, item.id));
              }}
            >
              Remove
            </Pill>
          </>
        }
      >
        <p className="text-[15px] leading-relaxed">
          It goes from the plan for both sides, with anything said about it. To keep the record
          instead, park it and say why.
        </p>
      </Dialog>
    </section>
  );
}

/* --------------------------------------------------------------- pieces */

function useStoredNameState() {
  const [name, setName] = useStoredState<string>(NAME_KEY, "", []);
  return [name, setName] as const;
}

function EmptyPlan({ admin, filtered }: { admin: boolean; filtered: boolean }) {
  return (
    <div className="rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)] px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold text-[var(--doc-ink)]">
        {filtered ? "Nothing under that filter" : admin ? "The plan is empty" : "Nothing here yet"}
      </p>
      <p className="mt-2 text-[15px] text-[var(--doc-ink-soft)]">
        {filtered
          ? "Try All to see the whole plan."
          : admin
            ? "Write the first thing you agreed to do. Keep each line short."
            : "We will fill this in as the work is agreed, and you can ask for things here too."}
      </p>
    </div>
  );
}

function AskDialog({
  open,
  name,
  busy,
  onName,
  onClose,
  onSend,
}: {
  open: boolean;
  name: string;
  busy: boolean;
  onName: (name: string) => void;
  onClose: () => void;
  onSend: (title: string, note: string, name: string) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [who, setWho] = React.useState(name);
  React.useEffect(() => {
    if (open) {
      setTitle("");
      setNote("");
      setWho(name);
    }
  }, [open, name]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ask for something"
      footer={
        <>
          <Pill tone="ghost" onClick={onClose}>
            Cancel
          </Pill>
          <Pill
            tone="ink"
            disabled={busy || !title.trim()}
            onClick={() => {
              onName(who.trim());
              onSend(title.trim(), note.trim(), who.trim());
            }}
          >
            Send it
          </Pill>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-[var(--doc-ink-soft)]">
          It reaches us as a request, not as agreed work. We will price it if it needs pricing, or
          say why it does not fit.
        </p>
        <FieldPill
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need?"
          aria-label="What do you need?"
          maxLength={200}
          data-autofocus
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Anything that helps us understand it"
          aria-label="More detail"
          className="w-full resize-y rounded-[1.25rem] bg-[var(--doc-fill)] px-4 py-3 text-sm leading-relaxed text-[var(--doc-ink)] outline-none focus:bg-[var(--doc-paper)] focus:shadow-[0_0_0_2px_var(--doc-ink)]"
        />
        <FieldPill
          value={who}
          onChange={(e) => setWho(e.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          maxLength={120}
        />
      </div>
    </Dialog>
  );
}
