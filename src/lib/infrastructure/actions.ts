"use server";

import { revalidatePath } from "next/cache";
import {
  api,
  ApiError,
  type ClientAssetInput,
  type HostingServerInput,
} from "@/lib/api";

export interface InfraActionState {
  ok?: boolean;
  error?: string;
}

const fail = (e: unknown, fallback: string): InfraActionState => ({
  error: e instanceof ApiError ? e.message : fallback,
});

/* --------------------------------------------------------------- servers */

export async function createServer(input: HostingServerInput): Promise<InfraActionState> {
  try {
    await api.infrastructure.createServer(input);
  } catch (e) {
    return fail(e, "Could not add the hosting server.");
  }
  revalidatePath("/admin/infrastructure");
  return { ok: true };
}

export async function updateServer(
  id: string,
  input: HostingServerInput,
): Promise<InfraActionState> {
  try {
    await api.infrastructure.updateServer(id, input);
  } catch (e) {
    return fail(e, "Could not update the hosting server.");
  }
  revalidatePath("/admin/infrastructure");
  return { ok: true };
}

export async function deleteServer(id: string): Promise<InfraActionState> {
  try {
    await api.infrastructure.removeServer(id);
  } catch (e) {
    return fail(e, "Could not remove the hosting server.");
  }
  revalidatePath("/admin/infrastructure");
  return { ok: true };
}

/* ---------------------------------------------------------------- assets */

export async function createAsset(
  clientId: string,
  input: ClientAssetInput,
): Promise<InfraActionState> {
  try {
    await api.infrastructure.createAsset(clientId, input);
  } catch (e) {
    return fail(e, "Could not add the asset.");
  }
  revalidatePath("/admin/infrastructure");
  return { ok: true };
}

export async function updateAsset(
  id: string,
  input: ClientAssetInput,
): Promise<InfraActionState> {
  try {
    await api.infrastructure.updateAsset(id, input);
  } catch (e) {
    return fail(e, "Could not update the asset.");
  }
  revalidatePath("/admin/infrastructure");
  return { ok: true };
}

export async function deleteAsset(id: string): Promise<InfraActionState> {
  try {
    await api.infrastructure.removeAsset(id);
  } catch (e) {
    return fail(e, "Could not remove the asset.");
  }
  revalidatePath("/admin/infrastructure");
  return { ok: true };
}
