"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { auditVault, ISSUE_LABELS, type IssueKind } from "@/lib/vault/audit";
import type { VaultItem } from "@/lib/vault/types";
import { cn } from "@/lib/utils";

const TONE: Record<IssueKind, "danger" | "warning" | "info"> = {
  reused: "danger",
  weak: "danger",
  stale: "warning",
  "codes-low": "info",
};

/**
 * A summary of what is wrong across the vault, collapsed by default. Reuse and weak passwords
 * are the findings worth acting on; the rest are nudges. Clicking a row opens that entry.
 */
export function VaultHealth({
  items,
  onSelect,
}: {
  items: VaultItem[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const health = React.useMemo(() => auditVault(items), [items]);

  if (items.length === 0) return null;

  const kinds = (Object.keys(ISSUE_LABELS) as IssueKind[]).filter((k) => health.counts[k] > 0);

  if (kinds.length === 0) {
    return (
      <div className="border-success/30 bg-success-soft text-success rounded-xl border px-4 py-3 text-sm">
        Nothing to flag. No reused or weak passwords, and everything has been changed recently.
      </div>
    );
  }

  return (
    <div className="border-border bg-surface overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="hover:bg-muted/60 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
      >
        <span className="text-sm font-medium">Health</span>
        <span className="flex flex-wrap items-center gap-1.5">
          {kinds.map((kind) => (
            <Badge key={kind} variant={TONE[kind]}>
              {health.counts[kind]} {ISSUE_LABELS[kind]}
            </Badge>
          ))}
        </span>
        <span className="text-muted-foreground ml-auto shrink-0 text-xs">
          {health.healthy} of {items.length} clean
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("text-subtle h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="divide-border border-border divide-y border-t">
          {health.issues.map((issue, i) => (
            <li key={`${issue.item.id}-${issue.kind}-${i}`}>
              <button
                type="button"
                onClick={() => onSelect(issue.item.id)}
                className="hover:bg-muted/60 flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
              >
                <Badge variant={TONE[issue.kind]}>{ISSUE_LABELS[issue.kind]}</Badge>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{issue.item.label}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {issue.detail}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
