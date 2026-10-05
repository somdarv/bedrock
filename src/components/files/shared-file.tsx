"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SharedView } from "@/lib/api/types";
import { formatBytes, shortDate } from "@/lib/files/tree";
import { Pill } from "./drive-ui";
import { DownloadIcon, FileGlyph, LockIcon } from "./icons";

/**
 * A link to one file. Drive opens such a link on the file itself rather than on a folder holding
 * it, so this is the file at full width with its download beside the name.
 */
export function SharedFile({ view, token, apiBase }: { view: SharedView; token: string; apiBase: string }) {
  const router = useRouter();
  const file = view.files[0];
  const [broken, setBroken] = React.useState(false);

  // The preview is made after upload; look again until it is in.
  const processing = file?.processingStatus === "processing";
  React.useEffect(() => {
    if (!processing) return;
    const t = setTimeout(() => router.refresh(), 4000);
    return () => clearTimeout(t);
  }, [processing, router]);

  if (!file) {
    return (
      <section className="drive rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] px-6 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-[var(--doc-ink)]">This file is no longer here</h1>
      </section>
    );
  }

  const href =
    view.allowDownload && !file.locked && !file.archived
      ? `${apiBase}/api/s/${token}/files/${file.id}/download`
      : null;
  const note = !view.allowDownload
    ? "Downloads are off for this link."
    : file.archived
      ? "This file is no longer stored. Only its preview is left."
      : file.locked
        ? "This file can be previewed but not downloaded yet."
        : null;
  const picture = file.hasPreview && file.previewUrl && !broken;

  return (
    <section className="drive rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] p-4 text-[var(--doc-ink-body)] sm:p-7 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] break-words text-[var(--doc-ink)] sm:text-[1.75rem]">
            {file.filename}
          </h1>
          <p className="mt-1 text-sm text-[var(--doc-ink-soft)] tabular-nums">
            {[formatBytes(file.size), shortDate(file.createdAt)].filter(Boolean).join(" · ")}
          </p>
        </div>
        {href && (
          <Pill tone="ink" onClick={() => window.location.assign(href)}>
            <DownloadIcon className="h-4 w-4" />
            Download
          </Pill>
        )}
      </header>

      {note && (
        <div className="mt-5 flex items-start gap-3 rounded-[var(--doc-r-inset)] bg-[var(--doc-fill)] px-5 py-4">
          <LockIcon className="mt-0.5 text-[var(--doc-ink)]" />
          <p className="text-sm leading-relaxed font-semibold text-[var(--doc-ink)]">{note}</p>
        </div>
      )}

      <div
        className="mt-5 flex min-h-64 items-center justify-center overflow-hidden rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)] p-2 sm:min-h-96"
        onContextMenu={href ? undefined : (e) => e.preventDefault()}
      >
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.previewUrl!}
            alt={file.filename}
            draggable={false}
            onError={() => setBroken(true)}
            className="max-h-[70vh] w-auto max-w-full rounded-[0.8rem] object-contain select-none"
          />
        ) : (
          <div className="h-48 w-full">
            <FileGlyph filename={file.filename} type={file.type} size="lg" />
          </div>
        )}
      </div>
      {processing && <p className="mt-3 text-center text-sm text-[var(--doc-ink-soft)]">Preparing the preview</p>}
    </section>
  );
}
