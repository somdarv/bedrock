/**
 * Shared DTOs mirroring the Laravel API contract (see docs/ARCHITECTURE.md §3–§4).
 * Keep these in sync with the backend; this is the single source of types for the frontend.
 */

export type WorkPackageStatus =
  | "draft"
  | "sent"
  | "awaiting_deposit"
  | "in_progress"
  | "review"
  | "awaiting_final_payment"
  | "delivered"
  | "closed";

/** On-demand client messages for long-running accounts (the "Send statement" actions). */
export type ClientNotifyEvent = "account_statement" | "payment_reminder";

export type PricingMode = "itemized" | "fixed";

export type DeliverableType = "image" | "pdf" | "video";

export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";

export type PaymentStatus = "pending" | "success" | "failed";

export type PaymentKind = "deposit" | "final" | "full";

export type ClientType = "organisation" | "individual";

export interface Contact {
  id: string;
  name: string;
  whatsapp: string;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
}

export interface ContactInput {
  name: string;
  whatsapp: string;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
}

export interface Client {
  id: string;
  type: ClientType;
  /** Organisation name, or the individual's name. */
  name: string;
  contacts: Contact[];
  createdAt: string;
}

export interface ClientInput {
  type: ClientType;
  name: string;
  contacts: ContactInput[];
}

/** The primary contact (or first), used wherever a single number/email is needed. */
export function primaryContact(client: Client): Contact | null {
  return client.contacts.find((c) => c.isPrimary) ?? client.contacts[0] ?? null;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  done: boolean;
}

export interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface WorkPackageInput {
  title: string;
  pricingMode: PricingMode;
  /** Required when pricingMode === "fixed"; ignored otherwise. */
  totalOverride: number | null;
  estimatedDeliveryDate: string | null;
}

export interface Payment {
  id: string;
  amount: number;
  kind: PaymentKind;
  status: PaymentStatus;
  paystackReference: string | null;
  method: string | null;
  paidAt: string | null;
}

export interface PaymentInput {
  amount: number;
  kind: PaymentKind;
  method: string | null;
}

export interface Deliverable {
  id: string;
  type: DeliverableType;
  filename: string;
  previewUrl: string | null;
  locked: boolean;
  /** True once the original file has been deleted from storage (preview kept). */
  archived: boolean;
  processingStatus: ProcessingStatus;
}

export interface ActivityEntry {
  id: string;
  event: string;
  message: string;
  createdAt: string;
}

export interface WorkPackage {
  id: string;
  clientId: string;
  title: string;
  status: WorkPackageStatus;
  publicSlug: string;
  pricingMode: PricingMode;
  /** Set only when pricingMode === "fixed". */
  totalOverride: number | null;
  estimatedDeliveryDate: string | null;
  lineItems: LineItem[];
  payments: Payment[];
  deliverables: Deliverable[];
  activity: ActivityEntry[];
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "worker";
}

export interface AdminSession {
  token: string;
  user: SessionUser;
}

/** Effective total resolved by pricing mode (mirrors backend `effectiveTotal()`). */
export function effectiveTotal(pkg: Pick<WorkPackage, "pricingMode" | "totalOverride" | "lineItems">) {
  if (pkg.pricingMode === "fixed") {
    return pkg.totalOverride ?? 0;
  }
  return pkg.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
}

/** Outstanding balance = effective total − successful payments. */
export function balance(pkg: Pick<WorkPackage, "pricingMode" | "totalOverride" | "lineItems" | "payments">) {
  const paid = pkg.payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);
  return effectiveTotal(pkg) - paid;
}
