"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { api, ApiError, type ClientInput } from "@/lib/api";

export interface ClientFormState {
  ok?: boolean;
  error?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface SendDocumentState {
  ok?: boolean;
  error?: string;
  sentTo?: string;
}

/**
 * Upload a document from the operator's machine and send it to a client contact (WhatsApp + email).
 * Multipart, so it bypasses the JSON api layer and forwards the FormData with the bearer token.
 */
export async function sendClientDocument(
  clientId: string,
  formData: FormData,
): Promise<SendDocumentState> {
  const token = (await cookies()).get("bedrock_token")?.value;
  try {
    const res = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/documents`, {
      method: "POST",
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
      cache: "no-store",
    });
    if (!res.ok) {
      let message = "Could not send the document.";
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
    return { error: "Could not reach the server." };
  }
}

export interface AddContactInput {
  name: string;
  whatsapp: string;
  phone: string | null;
  email: string | null;
}

/**
 * Add a single contact to an existing client from the client page. The new contact receives their
 * own welcome; existing contacts are untouched. Direct fetch (like sendClientDocument) so it works
 * against the live API with the forwarded bearer token.
 */
export async function addClientContact(
  clientId: string,
  input: AddContactInput,
): Promise<ClientFormState & { name?: string }> {
  const token = (await cookies()).get("bedrock_token")?.value;
  try {
    const res = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/contacts`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    if (!res.ok) {
      let message = "Could not add the contact.";
      try {
        const body = (await res.json()) as { message?: string };
        if (body.message) message = body.message;
      } catch {
        // keep the generic message
      }
      return { error: message };
    }
    const body = (await res.json().catch(() => ({}))) as { name?: string };
    revalidatePath(`/admin/clients/${clientId}`);
    return { ok: true, name: body.name };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function createClient(input: ClientInput): Promise<ClientFormState> {
  try {
    await api.clients.create(input);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not create client." };
  }
  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function updateClient(id: string, input: ClientInput): Promise<ClientFormState> {
  try {
    await api.clients.update(id, input);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not update client." };
  }
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  return { ok: true };
}

export async function deleteClient(id: string): Promise<ClientFormState> {
  try {
    await api.clients.remove(id);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not delete client." };
  }
  revalidatePath("/admin/clients");
  return { ok: true };
}
