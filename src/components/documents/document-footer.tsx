"use client";

import { type DocumentRecord } from "@/lib/documents/registry";
import { useDocumentState } from "./document-context";
import { VerifyStamp } from "./verify-stamp";

/**
 * Shared document footer: approver (default identity for now), the system metadata,
 * and the verify QR. Document ID is the stable ref; the timestamp and serial are the
 * dynamic values minted at prepare time, so they read "pending" until the document
 * is prepared.
 */
export function DocumentFooter({ record }: { record: DocumentRecord }) {
  const { prepared, status } = useDocumentState();
  const ready = status === "ready" && prepared;

  const meta: [string, string][] = [
    ["Document ID", record.id],
    ["Generated on system", record.system],
    ["Time", ready ? prepared!.preparedAt : "— pending preparation —"],
    ...(ready ? ([["Verification serial", prepared!.serial]] as [string, string][]) : []),
  ];

  return (
    <div className="avoid-break mt-16">
      {/* A rule made of fill, like every other separator in the document. */}
      <div className="h-2 rounded-[var(--doc-r-chip)] bg-[var(--doc-fill-strong)]" aria-hidden />

      {/* Stacks on a phone so the long document ID is not squeezed against the QR stamp. */}
      <div className="mt-7 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink)]">
            Approved by {record.approver.name}
          </p>
          <dl className="mt-4 space-y-2">
            {meta.map(([label, value]) => (
              <div key={label} className="flex flex-wrap gap-x-2 text-[length:var(--doc-t-micro)]">
                <dt className="text-[var(--doc-ink-soft)]">{label}:</dt>
                <dd className="break-all text-[var(--doc-ink-body)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <VerifyStamp documentId={record.id} />
      </div>
    </div>
  );
}
