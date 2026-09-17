"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { Deliverable } from "@/lib/api/types";
import { formatBytes, shortDate } from "@/lib/files/tree";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DownloadIcon,
  FileGlyph,
  LockIcon,
} from "./icons";

export interface ViewerSource {
  /** What to show. Null when the file has nothing viewable (a ZIP, a PSD). */
  src: string | null;
  /** Show it as an image, even when the file is a PDF or video (a client sees a still preview). */
  as: "image" | "pdf" | "video" | null;
  /** Where the Download button goes, or null when the file is locked or archived. */
  downloadHref: string | null;
}

/**
 * The full-screen viewer. Arrow keys and a sideways swipe step through the folder; Escape
 * closes. A client looking at a locked file gets the review frame: no right-click, no drag,
 * and a caption that travels with any screenshot.
 */
export function FileViewer({
  files,
  index,
  onIndex,
  onClose,
  source,
  protect,
}: {
  files: Deliverable[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  source: (file: Deliverable) => ViewerSource;
  protect?: boolean;
}) {
  const open = index !== null && index >= 0 && index < files.length;
  const file = open ? files[index] : null;
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  const [failed, setFailed] = React.useState(false);

  const step = React.useCallback(
    (by: number) => {
      if (index === null || files.length < 2) return;
      onIndex((index + by + files.length) % files.length);
    },
    [index, files.length, onIndex],
  );

  React.useEffect(() => setFailed(false), [file?.id]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose, step]);

  // Warm the neighbours so stepping through a folder of photos does not wait on each one.
  React.useEffect(() => {
    if (index === null || files.length < 2) return;
    for (const i of [index + 1, index - 1]) {
      const f = files[(i + files.length) % files.length];
      const s = source(f);
      if (s.as === "image" && s.src) {
        const img = new Image();
        img.src = s.src;
      }
    }
  }, [index, files, source]);

  if (!open || !file || typeof document === "undefined") return null;

  const s = source(file);
  const meta = [formatBytes(file.size), shortDate(file.createdAt)].filter(Boolean).join(" · ");
  const viewable = s.src && s.as && !failed;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={file.filename}
      className="drive drive-fade fixed inset-0 z-[80] flex flex-col bg-[#131211] text-white select-none"
      onContextMenu={protect ? (e) => e.preventDefault() : undefined}
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - start.x;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(t.clientY - start.y) * 1.5) {
          step(dx < 0 ? 1 : -1);
        }
      }}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 sm:px-5">
        <div className="min-w-0 flex-1 pl-1">
          <p className="truncate text-[15px] font-medium">{file.filename}</p>
          <p className="truncate text-xs text-white/60">
            {meta}
            {files.length > 1 && (
              <span className="tabular-nums">
                {meta ? " · " : ""}
                {index + 1} of {files.length}
              </span>
            )}
          </p>
        </div>
        {s.downloadHref ? (
          <a
            href={s.downloadHref}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-[#131211] transition-colors hover:bg-white/85"
          >
            <DownloadIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
        ) : file.locked ? (
          <span className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm text-white/80">
            <LockIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Unlocks when paid</span>
          </span>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Stage */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-20"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {viewable && s.as === "pdf" ? (
          <iframe key={file.id} src={s.src!} title={file.filename} className="h-full w-full max-w-5xl rounded-[1.125rem] bg-white" />
        ) : viewable && s.as === "video" ? (
          <video
            key={file.id}
            src={s.src!}
            controls
            playsInline
            controlsList={protect ? "nodownload noremoteplayback" : undefined}
            className="max-h-full max-w-full rounded-[1.125rem]"
          />
        ) : viewable && protect ? (
          <figure className="flex max-h-full max-w-full flex-col rounded-[1.25rem] bg-white p-2.5 sm:p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={file.id}
              src={s.src!}
              alt={file.filename}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onError={() => setFailed(true)}
              className="block max-h-[calc(100dvh-11rem)] w-auto max-w-full rounded-[0.875rem] object-contain"
            />
            <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-1 pt-2 text-xs text-[#131211]/60">
              <span className="font-semibold">SaharaBase review preview</span>
              <span>Full files are released once payment is complete</span>
            </figcaption>
          </figure>
        ) : viewable ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={file.id}
            src={s.src!}
            alt={file.filename}
            onError={() => setFailed(true)}
            className="max-h-full max-w-full rounded-[0.875rem] object-contain"
          />
        ) : (
          <div className="flex w-full max-w-sm flex-col items-center rounded-[var(--doc-r-panel)] bg-white/[0.06] px-6 py-10 text-center">
            <div className="h-28 w-28 rounded-[1.25rem] bg-white/[0.08] [--doc-ink:#fff] [--doc-ink-soft:rgba(255,255,255,.6)]">
              <FileGlyph filename={file.filename} type={file.type} size="md" />
            </div>
            <p className="mt-5 text-[15px] font-medium">No preview for this file</p>
            <p className="mt-1 text-sm text-white/60">
              {s.downloadHref
                ? "Download it to open it on your computer."
                : file.locked
                  ? "It can be downloaded once the balance is paid."
                  : "The original is no longer stored."}
            </p>
          </div>
        )}

        {files.length > 1 && (
          <>
            <NavButton side="left" onClick={() => step(-1)} />
            <NavButton side="right" onClick={() => step(1)} />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous file" : "Next file"}
      className={cn(
        "absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 sm:flex",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      {side === "left" ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
    </button>
  );
}
