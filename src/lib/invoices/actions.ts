"use server";

import { revalidatePath } from "next/cache";
import {
  api,
  ApiError,
  type FxInput,
  type Invoice,
  type InvoiceInput,
  type InvoicePaymentInput,
} from "@/lib/api";
import { renderInvoicePdf } from "@/lib/pdf/render";
import { sendClientDocument } from "@/lib/documents/send";
import { VERIFY_BASE_URL } from "@/lib/documents/registry";
import { publicBaseUrl } from "@/lib/utils";

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

/**
 * Save the USD → GHS billing rate settings.
 *
 * The margin is one number covering what settling a dollar bill from Ghana actually costs us
 * (card issuer FX markup + international fees + spread). It is deliberately not split into an
 * FX margin and a separate card fee: that would bill the same cost twice.
 */
export async function saveFxSettings(input: FxInput): Promise<InvoiceActionState> {
  try {
    await api.invoices.saveFx(input);
  } catch (e) {
    return fail(e, "Could not save the exchange rate settings.");
  }
  revalidatePath("/admin/settings");
  revalidatePath("/admin/invoices");
  return { ok: true };
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

/**
 * Re-lock a dollar invoice at today's rate and reopen its validity window. For when a client
 * comes back after the printed cedi figure has expired: the reference and history survive, only
 * the amount moves. Re-send the invoice afterwards so they have the new figure.
 */
export async function refreshInvoiceRate(
  invoiceId: string,
  clientId: string,
): Promise<InvoiceActionState> {
  try {
    await api.invoices.refreshRate(invoiceId);
  } catch (e) {
    return fail(e, "Could not refresh the rate.");
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
  /** Receipt sends only: attach the invoice it settles alongside it. Defaults to true. */
  includeInvoice?: boolean;
}

/**
 * Send an issued invoice (or its receipt) to the client: render the PDF server-side, then hand it
 * to the client-documents endpoint (multipart), which stores it on R2 as a ClientDocument — so it
 * lands in the client's document history, auditable and re-sendable — and fans it out over
 * WhatsApp + email.
 *
 * A **receipt** carries the invoice it settles as a second attachment: on its own it proves money
 * moved but not what for, and the client should not have to dig out an older email to see the two
 * halves together. It rides on the email only (WhatsApp has room for one document header), and it
 * cannot invite a second payment — the invoice PDF only draws a Pay button while a balance stands.
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

    const render = (of: "invoice" | "receipt") =>
      renderInvoicePdf(invoice, of, {
        billTo: {
          name: client.name,
          contactName: contact?.name ?? null,
          email: contact?.email ?? null,
          phone: contact?.phone ?? contact?.whatsapp ?? null,
        },
        payUrl: base ? `${base}/i/${invoice.publicSlug}` : null,
      });

    const label = (of: "invoice" | "receipt") => {
      const ref = (of === "receipt" ? invoice.receiptReference : invoice.reference) ?? invoiceId;
      return {
        type: of,
        filename: `${ref.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
        title: `${of === "receipt" ? "Receipt" : "Invoice"} ${ref} for ${invoice.title}`,
      };
    };

    const file = async (of: "invoice" | "receipt") => ({ ...label(of), pdf: await render(of) });

    // Only an issued invoice has a document to pair with, and only a receipt needs the pairing.
    const pairInvoice =
      variant === "receipt" && (input.includeInvoice ?? true) && Boolean(invoice.reference);

    const res = await sendClientDocument({
      clientId: invoice.clientId,
      document: await file(variant),
      related: pairInvoice ? await file("invoice") : null,
      contactIds: input.contactIds,
      replyToName: input.replyToName,
      replyToMethod: input.replyToMethod,
      replyToValue: input.replyToValue,
      // The words differ for a receipt ("thank you for your payment", not "let us know your
      // thoughts"); the approved WhatsApp template behind both events is the same one.
      event: variant === "receipt" ? "receipt_sent" : undefined,
      failure: `Could not send the ${variant}.`,
    });

    if (res.error) return { error: res.error };

    revalidateInvoices(invoice.clientId, invoiceId);
    return { ok: true, sentTo: res.sentTo };
  } catch (e) {
    return fail(e, `Could not send the ${variant}.`);
  }
}
