import "server-only";
import { cookies } from "next/headers";

/**
 * Handing a generated PDF to the client-documents endpoint, which is how every system-generated
 * document reaches a client: it stores the file (R2 in production) so the send is auditable and
 * re-sendable, then fans it out over WhatsApp + email to each chosen contact.
 *
 * Shared by invoice sends and work-package receipt sends. Both put the same shape on the wire,
 * and a receipt only pairs with its invoice correctly if they agree on how.
 */

export interface DocumentFile {
  pdf: Buffer | Uint8Array;
  /** Attachment filename the client sees, e.g. "rct-gigcot-07.pdf". */
  filename: string;
  /** Document kind, used in the message copy and the client's history ("invoice", "receipt"). */
  type: string;
  /** Human title for the client's document history. */
  title: string;
}

export interface SendDocumentInput {
  clientId: string;
  document: DocumentFile;
  /**
   * A second document sent with the first, on the EMAIL only: the invoice a receipt settles.
   * A WhatsApp template message carries exactly one document header, so the primary goes there
   * alone rather than arriving as two separate messages.
   */
  related?: DocumentFile | null;
  /** Contacts to send to. Empty → the API falls back to the client's primary contact. */
  contactIds?: string[];
  replyToName: string;
  replyToMethod: string;
  replyToValue: string;
  /** Which notification supplies the words. Defaults to the neutral document share. */
  event?: "document_sent" | "receipt_sent";
  /** Fallback message when the endpoint fails without one of its own. */
  failure?: string;
}

function pdfBlob(pdf: Buffer | Uint8Array): Blob {
  return new Blob([new Uint8Array(pdf)], { type: "application/pdf" });
}

function appendFile(fd: FormData, field: string, file: DocumentFile, typeField: string, titleField: string) {
  fd.append(field, pdfBlob(file.pdf), file.filename);
  fd.append(typeField, file.type);
  fd.append(titleField, file.title);
}

export async function sendClientDocument(
  input: SendDocumentInput,
): Promise<{ ok?: true; sentTo?: string; error?: string }> {
  const fd = new FormData();
  appendFile(fd, "file", input.document, "type", "title");
  if (input.related) appendFile(fd, "related", input.related, "relatedType", "relatedTitle");
  if (input.event) fd.append("event", input.event);

  (input.contactIds ?? []).forEach((id) => fd.append("contactIds[]", id));
  fd.append("replyToName", input.replyToName.trim());
  fd.append("replyToMethod", input.replyToMethod);
  fd.append("replyToValue", input.replyToValue.trim());

  const token = (await cookies()).get("bedrock_token")?.value;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/admin/clients/${input.clientId}/documents`,
    {
      method: "POST",
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: fd,
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body.message ?? input.failure ?? "Could not send the document." };
  }

  const body = (await res.json()) as { sentTo?: string };
  return { ok: true, sentTo: body.sentTo };
}
