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

export type PricingMode = "itemized" | "fixed";

export type DeliverableType = "image" | "pdf" | "video";

export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";

export type PaymentStatus = "pending" | "success" | "failed";

export type PaymentKind = "deposit" | "final" | "full";

export interface Client {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface ClientInput {
  name: string;
  whatsapp: string;
  email: string | null;
  phone: string | null;
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

export interface Deliverable {
  id: string;
  type: DeliverableType;
  filename: string;
  previewUrl: string | null;
  locked: boolean;
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
