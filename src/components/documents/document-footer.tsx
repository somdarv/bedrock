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

  return (
    <div className="mt-10 flex items-end justify-between gap-6 border-t border-gray-300 pt-6">
      <div className="text-xs text-gray-600">
        <p>Approved by: {record.approver.name}</p>
        <p className="mt-2 text-gray-500">Document ID: {record.id}</p>
        <p className="text-gray-500">Generated on System: {record.system}</p>
        <p className="text-gray-500">
          Time: {ready ? prepared!.preparedAt : "— pending preparation —"}
        </p>
        {ready && <p className="text-gray-500">Verification serial: {prepared!.serial}</p>}
      </div>
      <VerifyStamp documentId={record.id} />
    </div>
  );
}
