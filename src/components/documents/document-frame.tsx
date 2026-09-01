"use client";

import * as React from "react";
import type { PreparedDocument } from "@/lib/documents/api";
import { DocumentProvider, useDocumentState } from "./document-context";

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
function CheckIcon({ done }: { done: boolean }) {
  return done ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      className="text-success h-3.5 w-3.5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <span className="bg-subtle h-1.5 w-1.5 rounded-full" aria-hidden />
  );
}
function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
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
    <div className="no-print bg-surface mx-auto mb-5 max-w-[8.27in] rounded-2xl p-5 shadow-[0_1px_2px_rgba(24,22,18,0.05),0_10px_28px_-16px_rgba(24,22,18,0.25)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="eyebrow">Issue document</div>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {ready
              ? "Ready — everything is stamped. Choose Save as PDF in the print dialog."
              : "Prepare the document to stamp its reference and timestamp before download."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={prepare}
            disabled={status !== "idle"}
            className="bg-muted hover:bg-border inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {status === "preparing" ? <Spinner /> : null}
            {ready ? "Prepared" : status === "preparing" ? "Preparing…" : "Prepare document"}
          </button>
          <button
            onClick={print}
            disabled={!ready}
            className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
          >
            <DownloadIcon />
            Download PDF
          </button>
        </div>
      </div>

      <ul className="bg-muted mt-5 grid gap-x-6 gap-y-2.5 rounded-xl px-4 py-3.5 text-xs sm:grid-cols-2">
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
        <p className="text-subtle mt-3 text-[11px]">
          Serial {prepared.serial} · stamped {new Date(prepared.preparedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

/** The client-facing bar: no issuing controls, just a way to save the PDF. */
function ReadBar({ filename }: { filename?: string }) {
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

  return (
    <div className="no-print mx-auto mb-5 flex max-w-[8.27in] items-center justify-end">
      <button
        onClick={print}
        className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
      >
        <DownloadIcon />
        Download PDF
      </button>
    </div>
  );
}

/**
 * Print scaffolding shared by every document. Renders the authored body inside an A4
 * `.doc-sheet`. Download = native print → PDF.
 *
 * Two modes, because the same document has two audiences. `issue` is ours: the
 * prepare/download gate and the stamping checklist. `read` is the client's: the
 * document and a download button, nothing else. A recipient should never be shown
 * "Prepare document" — it is our internal action, it mints the verification serial,
 * and the endpoint behind it is currently unauthenticated.
 */
export function DocumentFrame({
  documentId,
  initialPrepared = null,
  children,
  filename,
  mode = "issue",
}: {
  documentId: string;
  initialPrepared?: PreparedDocument | null;
  children: React.ReactNode;
  filename?: string;
  mode?: "issue" | "read";
}) {
  return (
    <DocumentProvider documentId={documentId} initialPrepared={initialPrepared}>
      <div className="doc-page">
        {mode === "read" ? <ReadBar filename={filename} /> : <ControlBar filename={filename} />}
        <div className="doc-sheet">{children}</div>
      </div>
    </DocumentProvider>
  );
}
