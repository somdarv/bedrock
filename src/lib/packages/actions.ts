"use server";

import { revalidatePath } from "next/cache";
import {
  api,
  ApiError,
  effectiveTotal,
  type LineItemInput,
  type PricingMode,
  type WorkPackageInput,
  type WorkPackageStatus,
} from "@/lib/api";

function revalidatePackage(id: string) {
  revalidatePath("/admin/packages");
  revalidatePath(`/admin/packages/${id}`);
  revalidatePath("/admin/clients", "layout");
}

// ----- Work package -----

export interface PackageFormState {
  ok?: boolean;
  error?: string;
  packageId?: string;
  fieldErrors?: Partial<Record<keyof WorkPackageInput | "clientId", string>>;
}

function parsePackage(formData: FormData): {
  input?: WorkPackageInput;
  fieldErrors?: PackageFormState["fieldErrors"];
} {
  const title = String(formData.get("title") ?? "").trim();
  const pricingMode = String(formData.get("pricingMode") ?? "itemized") as PricingMode;
  const overrideRaw = String(formData.get("totalOverride") ?? "").trim();
  const date = String(formData.get("estimatedDeliveryDate") ?? "").trim();

  const fieldErrors: PackageFormState["fieldErrors"] = {};
  if (!title) fieldErrors.title = "Title is required.";
  if (pricingMode !== "itemized" && pricingMode !== "fixed") {
    fieldErrors.pricingMode = "Choose a pricing mode.";
  }

  let totalOverride: number | null = null;
  if (pricingMode === "fixed") {
    const value = Number(overrideRaw);
    if (!overrideRaw || !Number.isFinite(value) || value < 0) {
      fieldErrors.totalOverride = "Enter a fixed total of 0 or more.";
    } else {
      totalOverride = value;
    }
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    input: { title, pricingMode, totalOverride, estimatedDeliveryDate: date || null },
  };
}

export async function createPackage(
  _prev: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  const clientId = String(formData.get("clientId") ?? "").trim();
  const { input, fieldErrors } = parsePackage(formData);
  const errors = { ...fieldErrors };
  if (!clientId) errors.clientId = "Choose a client.";
  if (!input || Object.keys(errors).length > 0) return { fieldErrors: errors };

  try {
    const pkg = await api.packages.create(clientId, input);
    revalidatePackage(pkg.id);
    return { ok: true, packageId: pkg.id };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not create package." };
  }
}

export async function updatePackage(
  id: string,
  _prev: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  const { input, fieldErrors } = parsePackage(formData);
  if (!input) return { fieldErrors };

  try {
    await api.packages.update(id, input);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not update package." };
  }
  revalidatePackage(id);
  return { ok: true };
}

export async function deletePackage(id: string): Promise<PackageFormState> {
  try {
    await api.packages.remove(id);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not delete package." };
  }
  revalidatePath("/admin/packages");
  revalidatePath("/admin/clients", "layout");
  return { ok: true };
}

/** Quick toggle between itemized and fixed pricing, seeding a sensible override. */
export async function setPricingMode(id: string, mode: PricingMode): Promise<PackageFormState> {
  try {
    const pkg = await api.packages.get(id);
    const totalOverride = mode === "fixed" ? (pkg.totalOverride ?? effectiveTotal(pkg)) : null;
    await api.packages.update(id, {
      title: pkg.title,
      pricingMode: mode,
      totalOverride,
      estimatedDeliveryDate: pkg.estimatedDeliveryDate,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not change pricing mode." };
  }
  revalidatePackage(id);
  return { ok: true };
}

export async function setTotalOverride(
  id: string,
  _prev: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  const value = Number(String(formData.get("totalOverride") ?? "").trim());
  if (!Number.isFinite(value) || value < 0) {
    return { fieldErrors: { totalOverride: "Enter an amount of 0 or more." } };
  }
  try {
    const pkg = await api.packages.get(id);
    await api.packages.update(id, {
      title: pkg.title,
      pricingMode: "fixed",
      totalOverride: value,
      estimatedDeliveryDate: pkg.estimatedDeliveryDate,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not update total." };
  }
  revalidatePackage(id);
  return { ok: true };
}

// ----- Lifecycle -----

export interface ActionState {
  ok?: boolean;
  error?: string;
}

export async function sendPackage(id: string): Promise<ActionState> {
  try {
    await api.packages.send(id);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not send package." };
  }
  revalidatePackage(id);
  return { ok: true };
}

export async function changeStatus(
  id: string,
  status: WorkPackageStatus,
): Promise<ActionState> {
  try {
    await api.packages.setStatus(id, status);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not change status." };
  }
  revalidatePackage(id);
  return { ok: true };
}

export async function toggleLineItemDone(
  packageId: string,
  itemId: string,
  done: boolean,
): Promise<ActionState> {
  try {
    await api.packages.setLineItemDone(packageId, itemId, done);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not update progress." };
  }
  revalidatePackage(packageId);
  return { ok: true };
}

// ----- Deliverables -----

export async function uploadDeliverable(
  packageId: string,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  try {
    await api.packages.addDeliverable(packageId, file);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Upload failed." };
  }
  revalidatePackage(packageId);
  return { ok: true };
}

export async function deleteDeliverable(
  packageId: string,
  deliverableId: string,
): Promise<ActionState> {
  try {
    await api.packages.removeDeliverable(packageId, deliverableId);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not remove deliverable." };
  }
  revalidatePackage(packageId);
  return { ok: true };
}

// ----- Line items -----

export interface LineItemFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof LineItemInput, string>>;
}

function parseLineItem(formData: FormData): {
  input?: LineItemInput;
  fieldErrors?: LineItemFormState["fieldErrors"];
} {
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(String(formData.get("quantity") ?? "").trim());
  const unitPrice = Number(String(formData.get("unitPrice") ?? "").trim());

  const fieldErrors: LineItemFormState["fieldErrors"] = {};
  if (!description) fieldErrors.description = "Description is required.";
  if (!Number.isFinite(quantity) || quantity <= 0) fieldErrors.quantity = "Quantity must be ≥ 1.";
  if (!Number.isFinite(unitPrice) || unitPrice < 0) fieldErrors.unitPrice = "Enter a valid price.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return { input: { description, quantity, unitPrice } };
}

export async function addLineItem(
  packageId: string,
  _prev: LineItemFormState,
  formData: FormData,
): Promise<LineItemFormState> {
  const { input, fieldErrors } = parseLineItem(formData);
  if (!input) return { fieldErrors };
  try {
    await api.packages.addLineItem(packageId, input);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not add line item." };
  }
  revalidatePackage(packageId);
  return { ok: true };
}

export async function updateLineItem(
  packageId: string,
  itemId: string,
  _prev: LineItemFormState,
  formData: FormData,
): Promise<LineItemFormState> {
  const { input, fieldErrors } = parseLineItem(formData);
  if (!input) return { fieldErrors };
  try {
    await api.packages.updateLineItem(packageId, itemId, input);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not update line item." };
  }
  revalidatePackage(packageId);
  return { ok: true };
}

export async function deleteLineItem(
  packageId: string,
  itemId: string,
): Promise<LineItemFormState> {
  try {
    await api.packages.removeLineItem(packageId, itemId);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not delete line item." };
  }
  revalidatePackage(packageId);
  return { ok: true };
}
