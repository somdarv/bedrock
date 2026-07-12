"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  renderCuratedStatement,
  type CuratedStatementInput,
} from "@/lib/pdf/statement-builder";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface FinalizeStatementInput extends CuratedStatementInput {
  title: string;
  contactId?: string;
  replyToName: string;
  replyToMethod: string;
  replyToValue: string;
}

export interface FinalizeStatementState {
  ok?: boolean;
  error?: string;
  sentTo?: string;
}

/**
 * Prepare & send an Infrastructure Status Statement: render the curated PDF server-side, then hand
 * it to the existing client-documents endpoint (multipart) which stores it on R2 as a ClientDocument
 * — so it lands in the client's document history, is auditable and re-sendable — and fans it out
 * over WhatsApp + email via `document_sent`. Reuses the same pipeline as an uploaded proposal.
 */
export async function finalizeStatement(
  clientId: string,
  input: FinalizeStatementInput,
): Promise<FinalizeStatementState> {
  if (!input.title.trim()) return { error: "Give the statement a title." };
  if (!input.replyToName.trim()) return { error: "Add a contact name for replies." };
  if (!input.replyToValue.trim()) return { error: "Add the reply contact's number or email." };

  try {
    const { clientName, pdf } = await renderCuratedStatement(clientId, {
      summary: input.summary,
      closingNote: input.closingNote,
      items: input.items,
    });

    const safe = clientName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const fd = new FormData();
    fd.append(
      "file",
      new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
      `infrastructure-statement-${safe}.pdf`,
    );
    fd.append("type", "infrastructure statement");
    fd.append("title", input.title.trim());
    if (input.contactId) fd.append("contactId", input.contactId);
    fd.append("replyToName", input.replyToName.trim());
    fd.append("replyToMethod", input.replyToMethod);
    fd.append("replyToValue", input.replyToValue.trim());

    const token = (await cookies()).get("bedrock_token")?.value;
    const res = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/documents`, {
      method: "POST",
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: fd,
      cache: "no-store",
    });

    if (!res.ok) {
      let message = "Could not prepare and send the statement.";
      try {
        const body = (await res.json()) as { message?: string };
        if (body.message) message = body.message;
      } catch {
        // keep the generic message
      }
      return { error: message };
    }

    const body = (await res.json().catch(() => ({}))) as { sentTo?: string };
    revalidatePath(`/admin/clients/${clientId}`);
    return { ok: true, sentTo: body.sentTo };
  } catch {
    return { error: "Could not reach the server to send the statement." };
  }
}
