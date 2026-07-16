"use server";

import { revalidatePath } from "next/cache";
import {
  api,
  ApiError,
  type ClientAssetInput,
  type HostingServerInput,
  type InfraChargeInput,
  type TestServerInput,
  type TestServerResult,
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

/** Dry-run a cPanel/SSH credential set before saving — surfaces live metrics or a precise error. */
export async function testServer(input: TestServerInput): Promise<TestServerResult> {
  try {
    return await api.infrastructure.testServer(input);
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "Could not reach the server." };
  }
}

/** Re-check one asset live now. */
export async function syncAsset(id: string): Promise<InfraActionState> {
  try {
    await api.infrastructure.syncAsset(id);
  } catch (e) {
    return fail(e, "Could not re-check this asset.");
  }
  revalidatePath("/admin/infrastructure");
  return { ok: true };
}

/** Re-check every monitored asset live now (the "Refresh" button). */
export async function syncAllAssets(): Promise<InfraActionState> {
  try {
    await api.infrastructure.syncAll();
  } catch (e) {
    return fail(e, "Could not refresh live status.");
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

/* ------------------------------------------------- infrastructure charges */

export interface InfraChargeFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: { description?: string; amount?: string; dueDate?: string };
}

function revalidateBilling(clientId?: string) {
  if (clientId) revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients", "layout");
  revalidatePath("/admin/receivables");
  revalidatePath("/admin/infrastructure");
}

function parseCharge(formData: FormData): {
  input?: InfraChargeInput;
  fieldErrors?: InfraChargeFormState["fieldErrors"];
} {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const clientAssetId = String(formData.get("clientAssetId") ?? "").trim();

  const fieldErrors: InfraChargeFormState["fieldErrors"] = {};
  if (!description) fieldErrors.description = "A description is required.";
  if (!Number.isFinite(amount) || amount < 0) fieldErrors.amount = "Enter an amount of 0 or more.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return {
    input: { description, amount, dueDate: dueDate || null, clientAssetId: clientAssetId || null },
  };
}

export async function addInfraCharge(
  clientId: string,
  _prev: InfraChargeFormState,
  formData: FormData,
): Promise<InfraChargeFormState> {
  const { input, fieldErrors } = parseCharge(formData);
  if (!input) return { fieldErrors };
  try {
    await api.infrastructure.createCharge(clientId, input);
  } catch (e) {
    return fail(e, "Could not add the charge.");
  }
  revalidateBilling(clientId);
  return { ok: true };
}

export async function updateInfraCharge(
  chargeId: string,
  clientId: string,
  _prev: InfraChargeFormState,
  formData: FormData,
): Promise<InfraChargeFormState> {
  const { input, fieldErrors } = parseCharge(formData);
  if (!input) return { fieldErrors };
  try {
    await api.infrastructure.updateCharge(chargeId, input);
  } catch (e) {
    return fail(e, "Could not update the charge.");
  }
  revalidateBilling(clientId);
  return { ok: true };
}

export async function deleteInfraCharge(
  chargeId: string,
  clientId: string,
): Promise<InfraActionState> {
  try {
    await api.infrastructure.removeCharge(chargeId);
  } catch (e) {
    return fail(e, "Could not remove the charge.");
  }
  revalidateBilling(clientId);
  return { ok: true };
}

export async function payInfraCharge(
  chargeId: string,
  clientId: string,
): Promise<InfraActionState> {
  try {
    await api.infrastructure.payCharge(chargeId);
  } catch (e) {
    return fail(e, "Could not mark the charge paid.");
  }
  revalidateBilling(clientId);
  return { ok: true };
}
