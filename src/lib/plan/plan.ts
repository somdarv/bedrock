import type { PlanItem, PlanState, WorkPackage } from "@/lib/api/types";

/**
 * Words and grouping for the plan (docs/PLAN.md). The two sides read the same list but not the
 * same labels: we say "agreed", a client reads "we will do this".
 */

export const PLAN_STATES: PlanState[] = ["proposed", "agreed", "doing", "done", "shelved"];

/** What the operator calls a state, and what the client reads. */
export const STATE_WORDS: Record<PlanState, { ours: string; theirs: string }> = {
  proposed: { ours: "Proposed", theirs: "Asked for" },
  agreed: { ours: "Agreed", theirs: "We will do this" },
  doing: { ours: "In progress", theirs: "Being worked on" },
  done: { ours: "Done", theirs: "Finished" },
  shelved: { ours: "Shelved", theirs: "Parked" },
};

/** The order each side reads the groups in. Both start with whatever needs a decision. */
export const GROUP_ORDER: Record<"admin" | "client", PlanState[]> = {
  admin: ["proposed", "doing", "agreed", "done", "shelved"],
  client: ["proposed", "doing", "agreed", "done", "shelved"],
};

/** Groups that open closed, because they are history rather than work. */
export const COLLAPSED_BY_DEFAULT: PlanState[] = ["done", "shelved"];

export function stateWord(state: PlanState, side: "admin" | "client") {
  return side === "admin" ? STATE_WORDS[state].ours : STATE_WORDS[state].theirs;
}

/** Open work: what is neither finished nor parked. */
export function isOpen(item: PlanItem) {
  return item.state !== "done" && item.state !== "shelved";
}

export interface PlanCounts {
  open: number;
  waitingOnClient: number;
  proposed: number;
  done: number;
  awaitingApproval: number;
}

export function countPlan(items: PlanItem[]): PlanCounts {
  return {
    open: items.filter(isOpen).length,
    waitingOnClient: items.filter((i) => isOpen(i) && i.waitingOn === "client").length,
    proposed: items.filter((i) => i.state === "proposed").length,
    done: items.filter((i) => i.state === "done").length,
    awaitingApproval: items.filter((i) => i.state === "done" && !i.approvedAt).length,
  };
}

/** One line under the heading: what this plan is asking of whoever is reading it. */
export function planSummary(counts: PlanCounts, side: "admin" | "client") {
  if (counts.open === 0 && counts.done === 0) return "Nothing on the plan yet";
  const parts: string[] = [];
  if (side === "admin") {
    parts.push(`${counts.open} open`);
    if (counts.proposed > 0) parts.push(`${counts.proposed} to decide`);
    if (counts.waitingOnClient > 0) parts.push(`${counts.waitingOnClient} waiting on the client`);
  } else {
    if (counts.waitingOnClient > 0) parts.push(`${counts.waitingOnClient} waiting on you`);
    parts.push(`${counts.open} in hand`);
    if (counts.awaitingApproval > 0) parts.push(`${counts.awaitingApproval} to approve`);
  }
  if (counts.done > 0) parts.push(`${counts.done} finished`);
  return parts.join(" · ");
}

export interface PlanGroup {
  /** The state, or the client's one extra group. */
  key: PlanState | "waiting";
  label: string;
  items: PlanItem[];
}

/**
 * The list as each side reads it. Empty groups are dropped.
 *
 * A client's first group is whatever is waiting on them, lifted out of the state groups: the
 * question they arrive with is "what do you need from me", and it should not be buried under
 * work that is ours to do.
 */
export function groupPlan(items: PlanItem[], side: "admin" | "client"): PlanGroup[] {
  const sorted = [...items].sort((a, b) => a.position - b.position);
  const waiting = side === "client" ? sorted.filter((i) => isOpen(i) && i.waitingOn === "client") : [];
  const lifted = new Set(waiting.map((i) => i.id));

  const groups: PlanGroup[] = waiting.length
    ? [{ key: "waiting", label: "Waiting on you", items: waiting }]
    : [];

  for (const state of GROUP_ORDER[side]) {
    const group = sorted.filter((i) => i.state === state && !lifted.has(i.id));
    if (group.length > 0) {
      groups.push({ key: state, label: stateWord(state, side), items: group });
    }
  }

  return groups;
}

/** The plan as it reaches a client link: shared items only, whatever the server sent. */
export function sharedOnly(items: PlanItem[]) {
  return items.filter((i) => i.visibility === "shared");
}

/** "Due 30 Sep", or "Due Friday" when it is close enough to matter. */
export function dueWord(due: string | null, now = new Date()) {
  if (!due) return null;
  const date = new Date(`${due}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.round((date.getTime() - new Date(now.toDateString()).getTime()) / 86_400_000);
  if (days < 0) return `${days === -1 ? "1 day" : `${-days} days`} late`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days < 7) return `Due ${date.toLocaleDateString("en-GB", { weekday: "long" })}`;
  return `Due ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

/** Everything the plan needs from a package, in one place. */
export function planOf(pkg: Pick<WorkPackage, "planItems">) {
  return pkg.planItems ?? [];
}
