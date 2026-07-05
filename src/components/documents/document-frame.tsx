"use client";

import * as React from "react";
import type { PreparedDocument } from "@/lib/documents/api";
import { DocumentProvider, useDocumentState } from "./document-context";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
function CheckIcon({ done }: { done: boolean }) {
  return done ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3.5 w-3.5 text-success" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <span className="h-1.5 w-1.5 rounded-full bg-subtle" aria-hidden />
  );
}
function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}

/** The pre-download checklist + prepare/download controls. Never printed. */
function ControlBar({ filename }: { filename?: string }) {
  const { status, prepared, prepare } = useDocumentState();
  const ready = status === "ready";

  const print = () => {
    if (filename) {
      const prev = document.title;
      document.title = filename;
      window.print();
      setTimeout(() => (document.title = prev), 500);
    } else {
      window.print();
    }
  };

  const checks = [
    { label: "Document reference assigned", done: ready },
    { label: "Generation timestamp stamped", done: ready },
    { label: "Registered for verification", done: ready },
    { label: "Authenticity QR generated", done: ready },
  ];

  return (
    <div className="no-print mx-auto mb-4 max-w-[8.27in] rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Issue document</div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {ready
              ? "Ready — everything is stamped. Choose Save as PDF in the print dialog."
              : "Prepare the document to stamp its reference and timestamp before download."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={prepare}
            disabled={status !== "idle"}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {status === "preparing" ? <Spinner /> : null}
            {ready ? "Prepared" : status === "preparing" ? "Preparing…" : "Prepare document"}
          </button>
          <button
            onClick={print}
            disabled={!ready}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            <DownloadIcon />
            Download PDF
          </button>
        </div>
      </div>

      <ul className="mt-4 grid gap-x-6 gap-y-2 border-t border-border pt-3 text-xs sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center">
              <CheckIcon done={c.done} />
            </span>
            <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
          </li>
        ))}
      </ul>

      {ready && prepared && (
        <p className="mt-3 text-[11px] text-subtle">
          Serial {prepared.serial} · stamped {new Date(prepared.preparedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

/**
 * Print scaffolding shared by every document. Provides the prepare/download gate and
 * renders the authored body inside an A4 `.doc-sheet`. Download = native print → PDF.
 */
export function DocumentFrame({
  documentId,
  initialPrepared = null,
  children,
  filename,
}: {
  documentId: string;
  initialPrepared?: PreparedDocument | null;
  children: React.ReactNode;
  filename?: string;
}) {
  return (
    <DocumentProvider documentId={documentId} initialPrepared={initialPrepared}>
      <div className="doc-page">
        <ControlBar filename={filename} />
        <div className="doc-sheet">{children}</div>
      </div>
    </DocumentProvider>
  );
}
