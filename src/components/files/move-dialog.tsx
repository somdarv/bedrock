"use client";

import * as React from "react";
import type { DeliverableFolder } from "@/lib/api/types";
import { childFolders, isWithin, pathTo } from "@/lib/files/tree";
import { cn } from "@/lib/utils";
import { Dialog, Pill } from "./drive-ui";
import { ChevronLeftIcon, ChevronRightIcon, FolderFilledIcon } from "./icons";

/**
 * Pick a destination by walking the tree, as in Drive's "Move to". Folders being moved, and
 * anything inside them, cannot be entered or chosen.
 */
export function MoveDialog({
  open,
  title,
  rootLabel,
  folders,
  moving,
  start,
  onClose,
  onMove,
}: {
  open: boolean;
  title: string;
  rootLabel: string;
  folders: DeliverableFolder[];
  /** Folder ids in the selection. */
  moving: string[];
  /** Where the items are now. */
  start: string | null;
  onClose: () => void;
  onMove: (to: string | null) => void;
}) {
  const [at, setAt] = React.useState<string | null>(start);
  React.useEffect(() => {
    if (open) setAt(start);
  }, [open, start]);

  const blocked = (id: string) => moving.some((m) => isWithin(folders, id, m));
  const here = pathTo(folders, at);
  const current = here[here.length - 1];
  const children = childFolders(folders, at).sort((a, b) => a.name.localeCompare(b.name));
  const same = at === start;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Pill tone="ghost" onClick={onClose}>
            Cancel
          </Pill>
          <Pill tone="ink" disabled={same || (at !== null && blocked(at))} onClick={() => onMove(at)}>
            Move to {current?.name ?? rootLabel}
          </Pill>
        </>
      }
    >
      <div className="flex min-h-11 items-center gap-1">
        {at !== null && (
          <button
            type="button"
            onClick={() => setAt(current?.parentId ?? null)}
            aria-label="Up one folder"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--doc-ink)] hover:bg-[var(--doc-fill)]"
          >
            <ChevronLeftIcon />
          </button>
        )}
        <p className="truncate text-sm text-[var(--doc-ink-soft)]">
          {[rootLabel, ...here.map((f) => f.name)].join(" / ")}
        </p>
      </div>

      <div className="mt-2 overflow-hidden rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)]">
        {children.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--doc-ink-soft)]">
            No folders inside {current?.name ?? rootLabel}. Move the items here, or go back up.
          </p>
        ) : (
          <ul>
            {children.map((f) => {
              const off = blocked(f.id);
              return (
                <li key={f.id} className="odd:bg-[var(--doc-paper)]">
                  <button
                    type="button"
                    disabled={off}
                    onClick={() => setAt(f.id)}
                    className={cn(
                      "flex h-13 w-full items-center gap-3 px-4 text-left text-[15px] transition-colors sm:h-12 sm:text-sm",
                      "hover:bg-[var(--doc-fill)] disabled:opacity-40",
                    )}
                  >
                    <FolderFilledIcon className="text-[var(--doc-ink)]" />
                    <span className="min-w-0 flex-1 truncate font-medium text-[var(--doc-ink)]">{f.name}</span>
                    {off ? (
                      <span className="text-xs text-[var(--doc-ink-soft)]">Being moved</span>
                    ) : (
                      <ChevronRightIcon className="text-[var(--doc-ink-soft)]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {same && (
        <p className="mt-3 text-xs text-[var(--doc-ink-soft)]">
          Already in {current?.name ?? rootLabel}. Pick another folder.
        </p>
      )}
    </Dialog>
  );
}
