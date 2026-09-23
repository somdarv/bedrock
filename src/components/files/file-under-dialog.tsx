"use client";

import * as React from "react";
import type { Deliverable, PlanItem } from "@/lib/api/types";
import { stateWord } from "@/lib/plan/plan";
import { cn } from "@/lib/utils";
import { Dialog, Pill } from "./drive-ui";
import { CheckIcon } from "./icons";

/**
 * Which piece of agreed work a file satisfies (docs/PLAN.md). Filing it here is what puts the
 * file under the item on the client's link, so they see the artwork beside the thing they
 * approved rather than in a pile.
 */
export function FileUnderDialog({
  file,
  items,
  busy,
  onClose,
  onPick,
}: {
  file: Deliverable | null;
  items: PlanItem[];
  busy: boolean;
  onClose: () => void;
  onPick: (planItemId: string | null) => void;
}) {
  const open = file !== null;
  // Parked work is not what a fresh file belongs to; keep it out unless the file is already there.
  const choices = items.filter((i) => i.state !== "shelved" || i.id === file?.planItemId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`What is “${file?.filename ?? ""}” for?`}
      footer={
        <>
          <Pill tone="ghost" onClick={onClose}>
            Cancel
          </Pill>
          {file?.planItemId && (
            <Pill tone="fill" disabled={busy} onClick={() => onPick(null)}>
              Unfile it
            </Pill>
          )}
        </>
      }
    >
      <p className="text-sm text-[var(--doc-ink-soft)]">
        The client sees it under this item on their link.
      </p>
      <ul className="mt-3 overflow-hidden rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)]">
        {choices.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-[var(--doc-ink-soft)]">
            The plan has nothing to file this under yet.
          </li>
        ) : (
          choices.map((item) => {
            const current = item.id === file?.planItemId;
            return (
              <li key={item.id} className="odd:bg-[var(--doc-paper)]">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onPick(item.id)}
                  className={cn(
                    "flex min-h-13 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    "hover:bg-[var(--doc-fill)] disabled:opacity-40",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-[var(--doc-ink)] sm:text-sm">
                      {item.title}
                    </span>
                    <span className="block text-xs text-[var(--doc-ink-soft)]">
                      {stateWord(item.state, "admin")}
                      {item.visibility === "internal" && " · internal"}
                    </span>
                  </span>
                  {current && <CheckIcon className="h-4 w-4 text-[var(--doc-ink)]" />}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </Dialog>
  );
}
