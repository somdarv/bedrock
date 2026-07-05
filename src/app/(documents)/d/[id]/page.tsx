import { notFound } from "next/navigation";
import { getDocument } from "@/lib/documents/api";
import { hasDocumentBody, renderDocumentBody } from "@/components/documents/bodies";
import { DocumentFrame } from "@/components/documents/document-frame";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDocument(id);
  return { title: doc ? `${doc.type} · ${doc.client}` : "Document" };
}

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getDocument(id);
  if (!record || !hasDocumentBody(record.id)) notFound();

  const filename = `${record.id}-${record.client.replace(/[^a-z0-9]+/gi, "-")}`;

  // Already issued? Start in the ready state with its persisted stamp.
  const initialPrepared =
    record.prepared && record.serial && record.preparedAt
      ? { documentId: record.id, serial: record.serial, preparedAt: record.preparedAt }
      : null;

  return (
    <DocumentFrame documentId={record.id} initialPrepared={initialPrepared} filename={filename}>
      {renderDocumentBody(record)}
    </DocumentFrame>
  );
}
