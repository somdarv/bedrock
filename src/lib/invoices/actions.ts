"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  api,
  ApiError,
  type Invoice,
  type InvoiceInput,
  type InvoicePaymentInput,
} from "@/lib/api";
import { renderInvoicePdf } from "@/lib/pdf/render";
import { VERIFY_BASE_URL } from "@/lib/documents/registry";
import { publicBaseUrl } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface InvoiceActionState {
  ok?: boolean;
  error?: string;
  /** Set by createInvoice so the caller can navigate to the new draft. */
  invoiceId?: string;
  /** Set by sendInvoice: who the document actually went to. */
  sentTo?: string;
}

const fail = (e: unknown, fallback: string): InvoiceActionState => ({
  error: e instanceof ApiError ? e.message : fallback,
});

function revalidateInvoices(clientId?: string, invoiceId?: string) {
  if (invoiceId) revalidatePath(`/admin/invoices/${invoiceId}`);
  if (clientId) revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/receivables");
  revalidatePath("/admin/infrastructure");
}

export async function createInvoice(
  clientId: string,
  input: InvoiceInput,
): Promise<InvoiceActionState> {
  let invoice: Invoice;
  try {
    invoice = await api.invoices.create(clientId, input);
  } catch (e) {
    return fail(e, "Could not create the invoice.");
  }
  revalidateInvoices(clientId);
  return { ok: true, invoiceId: invoice.id };
}

export async function updateInvoice(
  invoiceId: string,
  clientId: string,
  input: InvoiceInput,
): Promise<InvoiceActionState> {
  try {
    await api.invoices.update(invoiceId, input);
  } catch (e) {
    return fail(e, "Could not save the invoice.");
  }
  revalidateInvoices(clientId, invoiceId);
  return { ok: true };
}

export async function deleteInvoice(
  invoiceId: string,
  clientId: string,
): Promise<InvoiceActionState> {
  try {
    await api.invoices.remove(invoiceId);
  } catch (e) {
    return fail(e, "Could not delete the invoice.");
  }
  revalidateInvoices(clientId);
  return { ok: true };
}

/** Mint the verification identity and freeze the lines. Required before the invoice can be sent. */
export async function issueInvoice(
  invoiceId: string,
  clientId: string,
): Promise<InvoiceActionState> {
  try {
    await api.invoices.issue(invoiceId);
  } catch (e) {
    return fail(e, "Could not issue the invoice.");
  }
  revalidateInvoices(clientId, invoiceId);
  return { ok: true };
}

export async function voidInvoice(
  invoiceId: string,
  clientId: string,
): Promise<InvoiceActionState> {
  try {
    await api.invoices.void(invoiceId);
  } catch (e) {
    return fail(e, "Could not void the invoice.");
  }
  revalidateInvoices(clientId, invoiceId);
  return { ok: true };
}

/**
 * Record money taken outside the gateway (bank transfer, cash, a MoMo transfer straight to us).
 * A payment that clears the balance settles the invoice, closes the infrastructure charges it
 * bills, and mints the receipt — all server-side, so this route and Paystack end up identical.
 */
export async function recordInvoicePayment(
  invoiceId: string,
  clientId: string,
  input: InvoicePaymentInput,
): Promise<InvoiceActionState> {
  try {
    await api.invoices.recordPayment(invoiceId, input);
  } catch (e) {
    return fail(e, "Could not record the payment.");
  }
  revalidateInvoices(clientId, invoiceId);
  return { ok: true };
}

export interface SendInvoiceInput {
  /** Contacts to send to (primary + any secondary). Empty → backend falls back to the primary. */
  contactIds?: string[];
  replyToName: string;
  replyToMethod: string;
  replyToValue: string;
  /** Send the receipt instead of the invoice (only once the invoice is settled). */
  variant?: "invoice" | "receipt";
}

/**
 * Send an issued invoice (or its receipt) to the client: render the PDF server-side, then hand it
 * to the client-documents endpoint (multipart), which stores it on R2 as a ClientDocument — so it
 * lands in the client's document history, auditable and re-sendable — and fans it out over
 * WhatsApp + email via `document_sent`. The same pipeline an infrastructure statement uses.
 *
 * Note it deliberately does NOT send `reference`/`serial`. That parameter makes the documents
 * endpoint write a *statement* row into the verification registry, and this document already has
 * its own registry row, written by the API when the invoice was issued. Passing it here would
 * overwrite an invoice's verification record with statement metadata.
 */
export async function sendInvoice(
  invoiceId: string,
  input: SendInvoiceInput,
): Promise<InvoiceActionState> {
  if (!input.replyToName.trim()) return { error: "Add a contact name for replies." };
  if (!input.replyToValue.trim()) return { error: "Add the reply contact's number or email." };

  const variant = input.variant ?? "invoice";

  try {
    const invoice = await api.invoices.get(invoiceId);

    if (invoice.status === "draft") {
      return { error: "Issue the invoice before sending it." };
    }
    if (variant === "receipt" && !invoice.receiptDocumentId) {
      return { error: "There is no receipt yet — record the payment first." };
    }

    const client = await api.clients.get(invoice.clientId);
    const contact = client.contacts.find((c) => c.isPrimary) ?? client.contacts[0];
    const base = publicBaseUrl() || VERIFY_BASE_URL;

    const pdf = await renderInvoicePdf(invoice, variant, {
      billTo: {
        name: client.name,
        contactName: contact?.name ?? null,
        email: contact?.email ?? null,
        phone: contact?.phone ?? contact?.whatsapp ?? null,
      },
      payUrl: base ? `${base}/i/${invoice.publicSlug}` : null,
    });

    const ref = (variant === "receipt" ? invoice.receiptReference : invoice.reference) ?? invoiceId;
    const safe = ref.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), `${safe}.pdf`);
    fd.append("type", variant === "receipt" ? "receipt" : "invoice");
    fd.append("title", `${variant === "receipt" ? "Receipt" : "Invoice"} ${ref} — ${invoice.title}`);
    (input.contactIds ?? []).forEach((id) => fd.append("contactIds[]", id));
    fd.append("replyToName", input.replyToName.trim());
    fd.append("replyToMethod", input.replyToMethod);
    fd.append("replyToValue", input.replyToValue.trim());

    const token = (await cookies()).get("bedrock_token")?.value;
    const res = await fetch(`${BASE_URL}/api/admin/clients/${invoice.clientId}/documents`, {
      method: "POST",
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: fd,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? "Could not send the invoice." };
    }

    const body = (await res.json()) as { sentTo?: string };
    revalidateInvoices(invoice.clientId, invoiceId);
    return { ok: true, sentTo: body.sentTo };
  } catch (e) {
    return fail(e, "Could not send the invoice.");
  }
}
