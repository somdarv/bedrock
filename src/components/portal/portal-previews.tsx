"use client";

import * as React from "react";
import Image from "next/image";
import { PreviewLightbox } from "@/components/media/preview-lightbox";
import type { Deliverable } from "@/lib/api";

/**
 * Client-facing preview grid. Previews open in a view-only lightbox (no download, drag or
 * context menu). Clean originals are downloadable only once unlocked (balance cleared).
 */
export function PortalPreviews({
  deliverables,
  slug,
  apiBase,
  settled,
}: {
  deliverables: Deliverable[];
  slug: string;
  apiBase: string;
  settled: boolean;
}) {
  const [viewing, setViewing] = React.useState<Deliverable | null>(null);

  return (
    <section>
      <h2 className="font-display text-lg font-semibold tracking-tight">Preview</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {settled
          ? "Your final files are ready to download."
          : "Watermarked previews — tap to view. Clean originals unlock once the balance is cleared."}
      </p>
      <div
        className="mt-4 grid grid-cols-1 gap-4 select-none sm:grid-cols-2"
        onContextMenu={(e) => e.preventDefault()}
      >
        {deliverables.map((d) => (
          <div key={d.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => d.previewUrl && setViewing(d)}
              disabled={!d.previewUrl}
              className="group relative flex h-44 w-full items-center justify-center bg-muted"
              aria-label={`View ${d.filename}`}
            >
              {d.previewUrl ? (
                <Image
                  src={d.previewUrl}
                  alt={d.filename}
                  fill
                  unoptimized
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">Preparing…</span>
              )}
              {d.locked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/40 text-white backdrop-blur-[1px]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden>
                    <rect x="4" y="11" width="16" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  <span className="text-[11px] font-medium uppercase tracking-wider">Locked</span>
                </div>
              )}
            </button>
            <div className="flex items-center justify-between gap-2 p-3">
              <span className="truncate text-sm font-medium">{d.filename}</span>
              {d.archived ? (
                <span className="shrink-0 text-xs text-muted-foreground">Archived</span>
              ) : d.locked ? (
                <span className="shrink-0 text-xs text-muted-foreground">Unlocks at GHS 0</span>
              ) : (
                <a
                  href={`${apiBase}/api/p/${slug}/deliverables/${d.id}/download`}
                  className="shrink-0 rounded-md border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Download
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <PreviewLightbox
        open={Boolean(viewing?.previewUrl)}
        src={viewing?.previewUrl ?? ""}
        alt={viewing?.filename ?? "Preview"}
        onClose={() => setViewing(null)}
        protect
      />
    </section>
  );
}
