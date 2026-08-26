import { notFound } from "next/navigation";
import { getDocument } from "@/lib/documents/api";
import { hasDocumentBody, renderDocumentBody } from "@/components/documents/bodies";
import { DocumentFrame } from "@/components/documents/document-frame";

/**
 * The client-facing view of a document. Same body, same verification QR, but none of
 * our issuing controls: a recipient sees the document and a Download PDF button.
 *
 * The URL still carries the full document ID rather than a friendly slug, and that is
 * deliberate. The ID is long and unguessable, so the link works as the key: anyone we
 * send it to can read it, and nobody can find another client's proposal by guessing.
 * A tidy `/proposals/shammah` would be typed in by anyone.
 *
 * Prepare the document at /d/{id} before sending this link, otherwise the footer reads
 * "pending preparation" and /verify/{ref} has nothing to confirm.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDocument(id);
  return {
    title: doc ? `${doc.type} · ${doc.client}` : "Document",
    // A client proposal is private to whoever holds the link, not something to index.
    robots: { index: false, follow: false },
  };
}

export default async function PublicDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getDocument(id);
  if (!record || !hasDocumentBody(record.id)) notFound();

  const filename = `${record.id}-${record.client.replace(/[^a-z0-9]+/gi, "-")}`;

  const initialPrepared =
    record.prepared && record.serial && record.preparedAt
      ? { documentId: record.id, serial: record.serial, preparedAt: record.preparedAt }
      : null;

  return (
    <DocumentFrame
      documentId={record.id}
      initialPrepared={initialPrepared}
      filename={filename}
      mode="read"
    >
      {renderDocumentBody(record)}
    </DocumentFrame>
  );
}
