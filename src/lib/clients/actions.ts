"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError, type ClientInput } from "@/lib/api";

export interface ClientFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof ClientInput, string>>;
}

function parseClient(formData: FormData): {
  input?: ClientInput;
  fieldErrors?: ClientFormState["fieldErrors"];
} {
  const name = String(formData.get("name") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const fieldErrors: ClientFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Name is required.";
  if (!whatsapp) fieldErrors.whatsapp = "WhatsApp number is required.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    input: { name, whatsapp, email: email || null, phone: phone || null },
  };
}

export async function createClient(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const { input, fieldErrors } = parseClient(formData);
  if (!input) return { fieldErrors };

  try {
    await api.clients.create(input);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not create client." };
  }
  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function updateClient(
  id: string,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const { input, fieldErrors } = parseClient(formData);
  if (!input) return { fieldErrors };

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
