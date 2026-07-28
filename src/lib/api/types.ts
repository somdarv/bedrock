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

/** A row in the admin reminder calendar: fire `event` on `dayOfMonth` for accounts with a balance. */
export interface ReminderRule {
  id: string;
  dayOfMonth: number;
  event: ClientNotifyEvent;
  enabled: boolean;
}

/** Rule shape when saving (no id — the whole set is replaced). */
export type ReminderRuleInput = Omit<ReminderRule, "id">;

export interface ReminderSettings {
  rules: ReminderRule[];
  events: ClientNotifyEvent[];
}

/** Result of a successful phone + OTP track verification. */
export interface TrackResult {
  token: string;
  client: { id: string; name: string };
  packages: WorkPackage[];
}

export type PricingMode = "itemized" | "fixed";

export type DeliverableType = "image" | "pdf" | "video";

export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";

export type PaymentStatus = "pending" | "success" | "failed";

export type PaymentKind = "deposit" | "final" | "full" | "progress";

/** How a package's value is delivered/gated. gated_files = graphic design (download gate);
 * milestones = web/systems (handover gate). See docs/RECEIVABLES-MILESTONES.md. */
export type DeliveryMode = "gated_files" | "milestones";

export type MilestoneKind = "deposit" | "progress" | "final";
export type MilestoneStatus = "pending" | "paid";

export type ClientType = "organisation" | "individual";

/** standard = pay per project; ongoing = rolling work, deferred billing, account statements. */
export type AccountType = "standard" | "ongoing";

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
  accountType: AccountType;
  /** Organisation name, or the individual's name. */
  name: string;
  contacts: Contact[];
  createdAt: string;
}

export interface ClientInput {
  type: ClientType;
  accountType: AccountType;
  name: string;
  contacts: ContactInput[];
}

/** A message we sent, with its channel and (for WhatsApp) delivery/read status from the webhook. */
export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";

export interface ActivityMessage {
  id: string;
  event: string;
  label: string;
  channel: string; // whatsapp | email
  recipient: string;
  status: MessageStatus;
  error: string | null;
  at: string | null;
}

export interface ActivityDocument {
  id: string;
  title: string;
  type: string;
  filename: string;
  size: number | null;
  at: string | null;
}

export interface ClientActivity {
  messages: ActivityMessage[];
  documents: ActivityDocument[];
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

/** One step in a package's payment schedule (the plan for how money comes in). */
export interface Milestone {
  id: string;
  position: number;
  label: string;
  amount: number;
  kind: MilestoneKind;
  status: MilestoneStatus;
  paidAt: string | null;
}

export interface MilestoneInput {
  label: string;
  amount: number;
  kind: MilestoneKind;
  position?: number;
}

export interface WorkPackageInput {
  title: string;
  pricingMode: PricingMode;
  /** Optional on update; when omitted the backend preserves the current mode. */
  deliveryMode?: DeliveryMode;
  /** Required when pricingMode === "fixed"; ignored otherwise. */
  totalOverride: number | null;
  estimatedDeliveryDate: string | null;
}

export interface Payment {
  id: string;
  /** The milestone this payment settled, or null for ad-hoc/legacy payments. */
  milestoneId: string | null;
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

/**
 * A checkout the gateway has opened for a portal visitor. Confirms nothing: the payment only
 * becomes real when Paystack's webhook reaches the API and is verified there.
 */
export interface PaymentSession {
  reference: string;
  accessCode: string;
  /** Paystack's hosted checkout page. Where we send the payer. */
  authorizationUrl: string;
  publicKey: string | null;
  amount: number;
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
  deliveryMode: DeliveryMode;
  /** Set only when pricingMode === "fixed". */
  totalOverride: number | null;
  estimatedDeliveryDate: string | null;
  lineItems: LineItem[];
  milestones: Milestone[];
  payments: Payment[];
  deliverables: Deliverable[];
  activity: ActivityEntry[];
  createdAt: string;
  /** Only present on the public portal read (showBySlug): the client's outstanding infra fees. */
  portalInfraCharges?: InfraCharge[];
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

/* ------------------------------------------------------------------ infrastructure
 * Client infrastructure monitoring (domains, SSL, hosting, sites). Mirrors the Laravel
 * models HostingServer + ClientAsset. See bedrock-api/docs/INFRASTRUCTURE-MODULE.md.
 */

export type ServerKind = "vps" | "shared";
export type ServerAuthType = "cpanel" | "ssh" | "hostinger" | "none";
export type AssetType = "domain" | "ssl" | "hosting" | "site";
export type AssetStatus = "ok" | "warn" | "critical" | "down" | "unknown";
export type AssetSource =
  | "website"
  | "rdap"
  | "tls"
  | "http"
  | "cpanel"
  | "ssh"
  | "hostinger"
  | "manual";

/** A host we control and read metrics from: a shared-hosting cPanel account, or our VPS. */
export interface HostingServer {
  id: string;
  /** null = Sahara's own infrastructure. */
  clientId: string | null;
  label: string;
  kind: ServerKind;
  authType: ServerAuthType;
  hostname: string | null;
  port: number | null;
  username: string | null;
  docroot: string | null;
  scope: string;
  /** The secret (token/SSH key) is write-only; the API only tells us whether one is stored. */
  hasSecret: boolean;
  createdAt: string;
}

export interface HostingServerInput {
  clientId: string | null;
  label: string;
  kind: ServerKind;
  authType: ServerAuthType;
  hostname: string | null;
  port: number | null;
  username: string | null;
  /** cPanel/WHM token or SSH private key. Leave null on update to keep the stored one. */
  secret: string | null;
  docroot: string | null;
  scope: string | null;
}

/** Live figures from the last sync (shape varies by source; storage in bytes). */
export interface AssetMetrics {
  // Hosting (cPanel/SSH)
  diskUsed?: number;
  diskLimit?: number;
  bandwidth?: number;
  inodes?: number;
  // Site (HTTP) — also used inside a website
  httpStatus?: number;
  responseMs?: number;
  httpOk?: number;
  // Website facets (a "domain" asset carries all three)
  siteUp?: number;
  sslExpiry?: string;
  sslDays?: number;
  regStatus?: AssetStatus;
  sslStatus?: AssetStatus;
  siteStatus?: AssetStatus;
}

export interface ClientAsset {
  id: string;
  clientId: string;
  hostingServerId: string | null;
  type: AssetType;
  label: string | null;
  identifier: string;
  source: AssetSource;
  status: AssetStatus;
  expiryDate: string | null;
  renewalDate: string | null;
  /** Fee to auto-bill on renewal (null = not auto-billed). */
  renewalFee: number | null;
  /** How many days before expiry the renewal charge is raised. */
  renewalLeadDays: number;
  daysUntilExpiry: number | null;
  metrics: AssetMetrics | null;
  recommendation: string | null;
  monitorEnabled: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface ClientAssetInput {
  hostingServerId: string | null;
  type: AssetType;
  label: string | null;
  identifier: string;
  source: AssetSource | null;
  expiryDate: string | null;
  renewalDate: string | null;
  renewalFee: number | null;
  renewalLeadDays: number | null;
  recommendation: string | null;
  monitorEnabled: boolean;
}

/** Dry-run credential check for a hosting server (cPanel/SSH) before saving it. */
export interface TestServerInput {
  authType: ServerAuthType;
  hostname: string;
  port: number | null;
  username: string;
  secret: string;
  docroot: string | null;
  identifier: string | null;
}

export interface TestServerResult {
  ok: boolean;
  metrics?: AssetMetrics | null;
  error?: string;
}

/** Rich on-demand detail for a hosting server's dashboard (cPanel exposes the full set). */
export interface ServerMetricsDetail {
  kind: string;
  fetchedAt: string;
  disk: { usedBytes: number; limitBytes: number | null; percent: number | null };
  inodes: { used: number; limit: number | null; percent: number | null };
  composition: { label: string; bytes: number }[];
  bandwidth: { totalBytes: number; byProtocol: Record<string, number> };
  email: { count: number; totalBytes: number; top: { login: string; bytes: number }[] };
  counts: {
    addonDomains: string | null;
    subdomains: string | null;
    emailAccounts: string | null;
    ftpAccounts: string | null;
  };
  domains: { main: string | null; addon: string[]; sub: string[] };
}

export interface ServerMetrics {
  server: HostingServer;
  clientName: string | null;
  details: ServerMetricsDetail | null;
  error: string | null;
}

/** An asset joined with its owning client's name, for the cross-client attention view. */
export interface AssetOverviewRow extends ClientAsset {
  clientName: string | null;
}

export interface InfrastructureOverview {
  attention: AssetOverviewRow[];
  all: AssetOverviewRow[];
}

/* ------------------------------------------------------------ infrastructure charges
 * Hosting / domain / other fees billed SEPARATELY from project work (their own
 * Receivables bucket). Mirrors the Laravel model InfraCharge.
 */

export type InfraChargeStatus = "pending" | "paid";

export interface InfraCharge {
  id: string;
  clientId: string;
  /** Optional link to the monitored asset this fee renews (null = general infra fee). */
  clientAssetId: string | null;
  description: string;
  amount: number;
  dueDate: string | null;
  /** The asset expiry this charge renews (set for auto-generated recurring charges). */
  billedForDate: string | null;
  status: InfraChargeStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface InfraChargeInput {
  clientAssetId: string | null;
  description: string;
  amount: number;
  dueDate: string | null;
}

/** A pending charge joined with its client's name, for the cross-client dashboard bucket. */
export interface InfraChargeRow extends InfraCharge {
  clientName: string | null;
}

export interface InfraChargesOutstanding {
  total: number;
  items: InfraChargeRow[];
}

/* ------------------------------------------------------------------------ vault
 * The operator's own credential store. Zero knowledge: every shape below is opaque
 * ciphertext produced in the browser, so nothing here is readable by the API or by
 * anyone holding the database. The decrypted payload type lives in @/lib/vault/types.
 * See docs/VAULT.md.
 */

/** The wrapped data key plus the parameters needed to re-derive the wrapping key. */
export interface VaultKeyRecord {
  kdf: "pbkdf2-sha256";
  iterations: number;
  salt: string;
  wrappedKey: string;
  wrapIv: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultKeyInput {
  kdf: "pbkdf2-sha256";
  iterations: number;
  salt: string;
  wrappedKey: string;
  wrapIv: string;
}

/** An encrypted entry exactly as stored. No plaintext metadata, deliberately. */
export interface VaultEntryRecord {
  id: string;
  ciphertext: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultEntryInput {
  ciphertext: string;
  iv: string;
}

/** The vault's whole server-side state. A null key means it has not been set up yet. */
export interface VaultState {
  key: VaultKeyRecord | null;
  entries: VaultEntryRecord[];
}
