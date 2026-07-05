"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError, type ClientInput } from "@/lib/api";

export interface ClientFormState {
  ok?: boolean;
  error?: string;
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
