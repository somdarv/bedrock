"use server";

import { revalidatePath } from "next/cache";
import {
  api,
  ApiError,
  type BillingMode,
  type ClientNotifyEvent,
  type DeliveryMode,
  effectiveTotal,
  type LineItemInput,
  type MilestoneInput,
  type MilestoneKind,
  type PaymentKind,
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
  // Absent on create means "use the client's default" (ongoing accounts get deferred), so it
  // is only sent when the form actually carried a choice.
  const billingRaw = String(formData.get("billingMode") ?? "").trim();
  const billingMode = billingRaw === "deferred" || billingRaw === "gated" ? billingRaw : undefined;

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
    input: { title, pricingMode, billingMode, totalOverride, estimatedDeliveryDate: date || null },
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
    // Seed a fixed total on first switch; otherwise preserve whatever was set so
    // toggling back and forth never loses the number.
    const totalOverride = mode === "fixed" ? (pkg.totalOverride ?? effectiveTotal(pkg)) : pkg.totalOverride;
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

/**
 * Switch a package between gated billing (deposit to start, balance to unlock) and deferred
 * (work now, invoice later). The backend follows through on files already uploaded, so this
 * changes what the client can reach right now, not just what happens next.
 */
export async function setBillingMode(id: string, mode: BillingMode): Promise<PackageFormState> {
  try {
    const pkg = await api.packages.get(id);
    await api.packages.update(id, {
      title: pkg.title,
      pricingMode: pkg.pricingMode,
      billingMode: mode,
      totalOverride: pkg.totalOverride,
      estimatedDeliveryDate: pkg.estimatedDeliveryDate,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not change billing mode." };
  }
  revalidatePackage(id);
  return { ok: true };
}

/**
 * Raise the invoice for work already done. Returns the new DRAFT invoice's id so the caller can
 * send the operator straight to it — nothing reaches the client until it is issued there.
 */
export async function billPackage(
  id: string,
): Promise<{ ok?: boolean; invoiceId?: string; error?: string }> {
  let invoiceId: string;
  try {
    const invoice = await api.packages.bill(id);
    invoiceId = invoice.id;
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not raise the invoice." };
  }
  revalidatePackage(id);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/receivables");
  return { ok: true, invoiceId };
}

/** Switch a package between gated-files and milestones delivery. */
export async function setDeliveryMode(id: string, mode: DeliveryMode): Promise<PackageFormState> {
  try {
    const pkg = await api.packages.get(id);
    await api.packages.update(id, {
      title: pkg.title,
      pricingMode: pkg.pricingMode,
      deliveryMode: mode,
      totalOverride: pkg.totalOverride,
      estimatedDeliveryDate: pkg.estimatedDeliveryDate,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not change delivery mode." };
  }
  revalidatePackage(id);
  return { ok: true };
}

/**
 * Set (or clear) the discount on the whole quote. Independent of anything the lines discount:
 * this is "the job is cheaper for you", not "this item is cheaper for you".
 *
 * Sent explicitly rather than folded into the price, so the client's documents can show the
 * standard price and the reduction as separate rows. Clearing sends `discountType: null`,
 * which the API treats as a removal — omitting the field would preserve what is there.
 */
export async function setPackageDiscount(
  id: string,
  _prev: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  const raw = String(formData.get("discountType") ?? "").trim();
  const type = raw === "percent" || raw === "amount" ? raw : null;
  const value = Number(String(formData.get("discountValue") ?? "").trim());
  const label = String(formData.get("discountLabel") ?? "").trim();

  if (type && (!Number.isFinite(value) || value <= 0)) {
    return { error: "Enter how much the discount takes off." };
  }
  if (type === "percent" && value > 100) {
    return { error: "A percentage discount cannot be more than 100%." };
  }

  try {
    const pkg = await api.packages.get(id);
    await api.packages.update(id, {
      title: pkg.title,
      pricingMode: pkg.pricingMode,
      totalOverride: pkg.totalOverride,
      estimatedDeliveryDate: pkg.estimatedDeliveryDate,
      discountType: type,
      discountValue: type ? value : 0,
      discountLabel: type ? label || null : null,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not save the discount." };
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

export async function sendStatement(
  id: string,
  event: ClientNotifyEvent,
): Promise<ActionState> {
  try {
    await api.packages.notify(id, event);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not send message." };
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

// ----- Payments -----

export interface PaymentFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: { amount?: string };
}

export async function recordPayment(
  packageId: string,
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const kind = String(formData.get("kind") ?? "deposit") as PaymentKind;
  const method = String(formData.get("method") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return { fieldErrors: { amount: "Enter an amount greater than 0." } };
  }

  try {
    await api.packages.recordPayment(packageId, { amount, kind, method: method || null });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not record payment." };
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

export async function purgeDeliverables(packageId: string): Promise<ActionState> {
  try {
    await api.packages.purgeDeliverables(packageId);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not free up storage." };
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
  const rawType = String(formData.get("discountType") ?? "").trim();
  const discountValue = Number(String(formData.get("discountValue") ?? "").trim()) || 0;
  // A type with no value is not a discount — both collapse to none, so a half-filled form
  // saves as "no discount" rather than as a silent zero-percent row.
  const discountType =
    (rawType === "percent" || rawType === "amount") && discountValue > 0 ? rawType : null;

  const fieldErrors: LineItemFormState["fieldErrors"] = {};
  if (!description) fieldErrors.description = "Description is required.";
  if (!Number.isFinite(quantity) || quantity <= 0) fieldErrors.quantity = "Quantity must be ≥ 1.";
  if (!Number.isFinite(unitPrice) || unitPrice < 0) fieldErrors.unitPrice = "Enter a valid price.";
  if (discountType === "percent" && discountValue > 100) {
    fieldErrors.discountValue = "A percentage discount cannot be more than 100%.";
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return {
    input: { description, quantity, unitPrice, discountType, discountValue: discountType ? discountValue : 0 },
  };
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

// ----- Milestones (payment schedule) -----

export interface MilestoneFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof MilestoneInput, string>>;
}

function parseMilestone(formData: FormData): {
  input?: MilestoneInput;
  fieldErrors?: MilestoneFormState["fieldErrors"];
} {
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const kind = String(formData.get("kind") ?? "progress") as MilestoneKind;

  const fieldErrors: MilestoneFormState["fieldErrors"] = {};
  if (!label) fieldErrors.label = "A label is required.";
  if (!Number.isFinite(amount) || amount < 0) fieldErrors.amount = "Enter an amount of 0 or more.";
  if (!["deposit", "progress", "final"].includes(kind)) fieldErrors.kind = "Choose a kind.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return { input: { label, amount, kind } };
}

export async function addMilestone(
  packageId: string,
  _prev: MilestoneFormState,
  formData: FormData,
): Promise<MilestoneFormState> {
  const { input, fieldErrors } = parseMilestone(formData);
  if (!input) return { fieldErrors };
  try {
    await api.packages.addMilestone(packageId, input);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not add milestone." };
  }
  revalidatePackage(packageId);
  return { ok: true };
}

export async function updateMilestone(
  packageId: string,
  milestoneId: string,
  _prev: MilestoneFormState,
  formData: FormData,
): Promise<MilestoneFormState> {
  const { input, fieldErrors } = parseMilestone(formData);
  if (!input) return { fieldErrors };
  try {
    await api.packages.updateMilestone(packageId, milestoneId, input);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not update milestone." };
  }
  revalidatePackage(packageId);
  return { ok: true };
}

export async function deleteMilestone(
  packageId: string,
  milestoneId: string,
): Promise<ActionState> {
  try {
    await api.packages.removeMilestone(packageId, milestoneId);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not remove milestone." };
  }
  revalidatePackage(packageId);
  return { ok: true };
}

export async function payMilestone(
  packageId: string,
  milestoneId: string,
  method: string | null,
): Promise<ActionState> {
  try {
    await api.packages.payMilestone(packageId, milestoneId, method);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not record milestone payment." };
  }
  revalidatePackage(packageId);
  return { ok: true };
}
