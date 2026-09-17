"use client";

import * as React from "react";
import type { UploadItem } from "@/lib/files/use-uploads";
import { formatBytes } from "@/lib/files/tree";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon, CloseIcon } from "./icons";

/**
 * The upload queue, docked bottom right on a desktop and along the bottom edge on a phone.
 * An ink panel, so it sits apart from the page it is filling.
 */
export function UploadTray({
  items,
  active,
  onCancel,
  onRetry,
  onClear,
  onCancelAll,
}: {
  items: UploadItem[];
  active: boolean;
  onCancel: (key: string) => void;
  onRetry: (key: string) => void;
  onClear: () => void;
  onCancelAll: () => void;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  if (items.length === 0) return null;

  const total = items.reduce((s, i) => s + i.size, 0);
  const sent = items.reduce(
    (s, i) => s + (i.status === "done" ? i.size : Math.min(i.loaded, i.size)),
    0,
  );
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const pct = total > 0 ? Math.round((sent / total) * 100) : 100;

  const heading = active
    ? `Uploading ${items.length === 1 ? "1 file" : `${done} of ${items.length} files`}`
    : failed > 0
      ? `${failed} ${failed === 1 ? "upload" : "uploads"} did not finish`
      : `${done === 1 ? "1 file" : `${done} files`} uploaded`;

  return (
    <div
      className="drive doc-invert drive-rise fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-[60] overflow-hidden rounded-[1.25rem] bg-[var(--doc-fill-ink)] text-white shadow-[0_18px_48px_-12px_rgba(18,17,15,0.5)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[23rem]"
      role="region"
      aria-label="Uploads"
    >
      <div className="flex items-center gap-2 py-2.5 pr-2 pl-5">
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="truncate text-sm font-semibold">{heading}</p>
          {active && (
            <p className="text-xs text-white/60 tabular-nums">
              {pct}% · {formatBytes(sent)} of {formatBytes(total)}
            </p>
          )}
        </div>
        <TrayButton label={collapsed ? "Show uploads" : "Hide uploads"} onClick={() => setCollapsed((c) => !c)}>
          <ChevronDownIcon className={cn("transition-transform duration-150", collapsed && "rotate-180")} />
        </TrayButton>
        <TrayButton
          label={active ? "Cancel all uploads" : "Close"}
          onClick={active ? onCancelAll : onClear}
        >
          <CloseIcon />
        </TrayButton>
      </div>

      {active && (
        <div className="h-1 bg-white/10">
          <div className="h-full bg-white transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
        </div>
      )}

      {!collapsed && (
        <ul className="max-h-[min(18rem,40dvh)] overflow-y-auto py-1.5">
          {items.map((item) => (
            <Row key={item.key} item={item} onCancel={onCancel} onRetry={onRetry} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({
  item,
  onCancel,
  onRetry,
}: {
  item: UploadItem;
  onCancel: (key: string) => void;
  onRetry: (key: string) => void;
}) {
  const pct = item.size > 0 ? Math.min(100, Math.round((item.loaded / item.size) * 100)) : 100;
  const moving = item.status === "uploading" || item.status === "finishing" || item.status === "queued";

  const status =
    item.status === "queued"
      ? "Waiting"
      : item.status === "uploading"
        ? `${formatBytes(item.loaded)} of ${formatBytes(item.size)}`
        : item.status === "finishing"
          ? "Saving"
          : item.status === "done"
            ? `In ${item.destination}`
            : item.status === "cancelled"
              ? "Cancelled"
              : item.error || "Did not finish";

  return (
    <li className="flex items-center gap-3 py-2 pr-2 pl-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{item.name}</p>
        <p className={cn("truncate text-xs tabular-nums", item.status === "failed" ? "text-[#ffb4ab]" : "text-white/55")}>
          {status}
        </p>
        {moving && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white/85 transition-[width] duration-200 ease-out"
              style={{ width: `${item.status === "finishing" ? 100 : pct}%` }}
            />
          </div>
        )}
      </div>
      {item.status === "done" ? (
        <span className="flex h-9 w-9 items-center justify-center text-white/80" aria-label="Done">
          <CheckIcon className="h-4 w-4" />
        </span>
      ) : item.status === "failed" || item.status === "cancelled" ? (
        <button
          type="button"
          onClick={() => onRetry(item.key)}
          className="h-8 rounded-full bg-white/10 px-3 text-xs font-medium transition-colors hover:bg-white/20"
        >
          Retry
        </button>
      ) : item.status !== "finishing" ? (
        <TrayButton label={`Cancel ${item.name}`} onClick={() => onCancel(item.key)}>
          <CloseIcon className="h-4 w-4" />
        </TrayButton>
      ) : null}
    </li>
  );
}

function TrayButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}
