/**
 * Document registry — the source of truth for every document Bedrock has issued.
 *
 * Each entry is authored locally (alongside its render component) and carries the
 * "system-generated" metadata that proves authenticity: a stable Document ID, the
 * issuing system, a timestamp, and a verify status. The public /verify/{id} page
 * and the QR code on every document both resolve against this registry.
 *
 * This is deliberately shaped like the future `bedrock-api` response so it can be
 * swapped for a live fetch (GET /api/documents, GET /api/verify/{id}) without
 * touching callers — the same mock/live split Bedrock already uses for the API.
 */

export type DocumentCategory = "invoices" | "proposals" | "quotes" | "receipts";

export type DocumentStatus = "valid" | "draft" | "expired" | "void";

export interface DocumentApprover {
  name: string;
  employeeId: string;
}

export interface DocumentRecord {
  /** Stable, complex Document ID / verify ref, e.g. "SAH-BD-20260630-BIL-DYN-52". */
  id: string;
  /** Short human reference shown in the letterhead, e.g. "BIL-DYN-52". */
  reference: string;
  category: DocumentCategory;
  /** Human label for the kind of document, e.g. "Fee Schedule". */
  type: string;
  /** Listing title. */
  title: string;
  client: string;
  project: string | null;
  /** Display issue date, e.g. "30 June 2026". */
  issueDate: string;
  /** Display validity date, if the document expires. */
  validUntil?: string | null;
  status: DocumentStatus;
  /** Issuing identity (default account for now). */
  approver: DocumentApprover;
  /** "Generated on System" tag. */
  system: string;
  /** Minted at prepare time; null until prepared. */
  serial: string | null;
  /** ISO timestamp minted at prepare time; null until prepared. */
  preparedAt: string | null;
  /** True once prepared/issued. */
  prepared: boolean;
  /**
   * Human money line for billing documents, e.g. "GHS 8,500.00 outstanding of GHS 10,000.00".
   * Only invoices/receipts resolved from a work package carry it — it is what lets a reader
   * catch a doctored total, so it is shown on the verification page when present.
   */
  amount?: string | null;
}

/**
 * The system credited with generating documents (shown as "Generated on System").
 * Placeholder tag for the hub tools portal — rename once finalized.
 */
export const GENERATING_SYSTEM = "SAH-HUB-DOC-2026";

/**
 * Default approver until backend user accounts exist. Every document is issued under
 * this identity for now; later this comes from the signed-in operator.
 */
export const DEFAULT_APPROVER = {
  name: "Julitta Adanuse",
  employeeId: "SAH-BD-2020-07",
} as const;

/** Public verification portal origin. Printed QR codes resolve here. */
export const VERIFY_BASE_URL =
  process.env.NEXT_PUBLIC_VERIFY_BASE_URL || "https://hub.saharabasetech.com";

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  invoices: "Invoices",
  proposals: "Proposals",
  quotes: "Quotes",
  receipts: "Receipts",
};

const REGISTRY: DocumentRecord[] = [
  {
    id: "SAH-BD-20260901-PRO-STE-58",
    reference: "PRO-STE-58",
    category: "proposals",
    type: "Proposal",
    title: "A School Management System for Stellar Edge School",
    client: "Stellar Edge School",
    project: "School Management System",
    issueDate: "1 September 2026",
    validUntil: "22 September 2026",
    status: "valid",
    approver: { ...DEFAULT_APPROVER },
    system: GENERATING_SYSTEM,
    serial: null,
    preparedAt: null,
    prepared: false,
  },
  {
    id: "SAH-BD-20260826-PRO-SHM-57",
    reference: "PRO-SHM-57",
    category: "proposals",
    type: "Proposal",
    title: "A School Management System for Shammah Preparatory School",
    client: "Shammah Preparatory School",
    project: "School Management System",
    issueDate: "26 August 2026",
    validUntil: "16 September 2026",
    status: "valid",
    approver: { ...DEFAULT_APPROVER },
    system: GENERATING_SYSTEM,
    serial: null,
    preparedAt: null,
    prepared: false,
  },
  {
    id: "SAH-BD-20260714-BIL-DEIG-56",
    reference: "BIL-DEIG-56",
    category: "proposals",
    type: "Fee Schedule",
    title: "Dei Gratia Website & SEO",
    client: "Dei Gratia Medical Services",
    project: "Dei Gratia Website & SEO",
    issueDate: "14 July 2026",
    validUntil: "14 August 2026",
    status: "valid",
    approver: { ...DEFAULT_APPROVER },
    system: GENERATING_SYSTEM,
    serial: null,
    preparedAt: null,
    prepared: false,
  },
  {
    id: "SAH-BD-20260709-BIL-ZEN-55",
    reference: "BIL-ZEN-55",
    category: "proposals",
    type: "Fee Schedule",
    title: "Zenith School Website & Online Admissions",
    client: "Zenith School",
    project: "Zenith School Website & eSkooly Admissions",
    issueDate: "9 July 2026",
    validUntil: "9 August 2026",
    status: "valid",
    approver: { ...DEFAULT_APPROVER },
    system: GENERATING_SYSTEM,
    serial: null,
    preparedAt: null,
    prepared: false,
  },
  {
    id: "SAH-BD-20260706-PRO-ZEN-54",
    reference: "PRO-ZEN-54",
    category: "proposals",
    type: "Proposal",
    title: "Bringing Zenith School Online: A Website Proposal",
    client: "Zenith School",
    project: "Zenith School Website",
    issueDate: "6 July 2026",
    validUntil: "13 July 2026",
    status: "valid",
    approver: { ...DEFAULT_APPROVER },
    system: GENERATING_SYSTEM,
    serial: null,
    preparedAt: null,
    prepared: false,
  },
  {
    id: "SAH-BD-20260706-PRO-GHIS-53",
    reference: "PRO-GHIS-53",
    category: "proposals",
    type: "Collaboration Brief",
    title: "Digitizing School Operations: A Collaboration Proposal",
    client: "Greater Heights International School",
    project: "School Operations Digitisation",
    issueDate: "6 July 2026",
    validUntil: "6 August 2026",
    status: "valid",
    approver: { name: "Magdalene Assam", employeeId: "SAH-BD-2021-04" },
    system: GENERATING_SYSTEM,
    serial: null,
    preparedAt: null,
    prepared: false,
  },
  {
    id: "SAH-BD-20260630-BIL-DYN-52",
    reference: "BIL-DYN-52",
    category: "proposals",
    type: "Fee Schedule",
    title: "Commodity Sourcing & Lead-Management Platform",
    client: "Dropyn Trading LLC",
    project: "Commodity Sourcing & Lead-Management Platform",
    issueDate: "30 June 2026",
    validUntil: "30 July 2026",
    status: "valid",
    approver: { ...DEFAULT_APPROVER },
    system: GENERATING_SYSTEM,
    serial: null,
    preparedAt: null,
    prepared: false,
  },
];

/** Every document, newest first. The ID embeds the issue date (…-YYYYMMDD-…). */
export function listDocuments(): DocumentRecord[] {
  return [...REGISTRY].sort((a, b) => b.id.localeCompare(a.id));
}

export function listDocumentsByCategory(category: DocumentCategory): DocumentRecord[] {
  return listDocuments().filter((d) => d.category === category);
}

export function getDocument(id: string): DocumentRecord | undefined {
  return REGISTRY.find((d) => d.id === id);
}

/** Public verification lookup — what /verify/{ref} resolves against. */
export function verifyDocument(ref: string): DocumentRecord | null {
  return REGISTRY.find((d) => d.id === ref) ?? null;
}
