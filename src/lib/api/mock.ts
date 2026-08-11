import { ApiError, type BedrockApi } from "./contract";
import { balance, type ActivityEntry, type AssetOverviewRow, type BillTo, type Client, type ClientAsset, type Deliverable, type DeliverableType, type HostingServer, type InfraCharge, type Invoice, type LineItem, type Milestone, type Payment, type ReminderRule, type VaultEntryRecord, type VaultKeyRecord, type WorkPackage } from "./types";
import { ALLOWED_TRANSITIONS, statusMeta } from "@/lib/status";
import { deliverableTypeFromName, formatCedis } from "@/lib/utils";

/**
 * In-memory mock backend. Default in dev so the frontend is never blocked on the
 * separate Laravel repo. Fixtures mirror the DTO shapes; swap to `live` via
 * NEXT_PUBLIC_API_SOURCE once real endpoints exist.
 */

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const infraCharges: InfraCharge[] = [];

/**
 * One issued, unpaid invoice so the invoice screens, the public pay page and both PDF routes
 * have something real to render in dev. Money fields are recomputed by hydrateInvoice.
 */
const invoices: Invoice[] = [
  {
    id: "in_seed001",
    clientId: "cl_1",
    clientName: "Ama Boateng",
    publicSlug: "3f2b91c4-7d6e-4a15-9b28-c50e7f14a2d3",
    title: "Infrastructure renewal — 2026/27",
    memo: "Payable on receipt. Renewing now keeps your site and email online without interruption.",
    documentId: "SAH-FIN-20260811-INV-AMABOA-01",
    reference: "INV-AMABOA-01",
    serial: "G-4C1A-9E77",
    receiptDocumentId: null,
    receiptReference: null,
    receiptSerial: null,
    issueDate: "2026-08-11",
    dueDate: "2026-08-25",
    status: "issued",
    issuedAt: "2026-08-11T09:00:00Z",
    paidAt: null,
    createdAt: "2026-08-11T09:00:00Z",
    items: [
      { id: "ii_s1", position: 0, description: "Domain renewal — amaboateng.com (12 months)", quantity: 1, unitPrice: 220, amount: 220 },
      { id: "ii_s2", position: 1, description: "Web hosting — Starter plan (12 months)", quantity: 1, unitPrice: 1450, amount: 1450 },
      { id: "ii_s3", position: 2, description: "SSL certificate renewal", quantity: 2, unitPrice: 90, amount: 180 },
    ],
    payments: [],
    total: 0,
    paid: 0,
    balance: 0,
  },
];

/** Money on an invoice is derived, never stored — same rule the API follows. */
function hydrateInvoice(invoice: Invoice): Invoice {
  const total = round2(invoice.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
  const paid = round2(
    invoice.payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0),
  );
  return { ...invoice, total, paid, balance: round2(total - paid) };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Stand-in for the API's client code segment, e.g. "Ama Boateng" → "AMABOA". */
function mockClientCode(clientId: string): string {
  const name = clients.find((c) => c.id === clientId)?.name ?? "CLIENT";
  return name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() || "CLIENT";
}

/** Per-generation verification serial: G-XXXX-XXXX (docs/DOCUMENT-CODES.md §4). */
function mockSerial(): string {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `G-${hex.slice(0, 4)}-${hex.slice(4)}`;
}

const clients: Client[] = [
  {
    id: "cl_1",
    type: "individual",
    accountType: "standard",
    name: "Ama Boateng",
    contacts: [
      {
        id: "ct_1",
        name: "Ama Boateng",
        whatsapp: "+233201234567",
        phone: "+233201234567",
        email: "ama@example.com",
        isPrimary: true,
      },
    ],
    createdAt: "2026-06-10T09:00:00Z",
  },
  {
    id: "cl_2",
    type: "individual",
    accountType: "standard",
    name: "Kojo Mensah",
    contacts: [
      {
        id: "ct_2",
        name: "Kojo Mensah",
        whatsapp: "+233557654321",
        phone: "+233557654321",
        email: null,
        isPrimary: true,
      },
    ],
    createdAt: "2026-06-14T14:30:00Z",
  },
];

const packages: WorkPackage[] = [
  {
    id: "wp_1",
    clientId: "cl_1",
    title: "Brand identity pack",
    status: "in_progress",
    publicSlug: "8f1c2a90-3b6e-4a2d-9c11-7e5d0a2b4c6f",
    pricingMode: "itemized",
    deliveryMode: "gated_files",
    totalOverride: null,
    estimatedDeliveryDate: "2026-06-28",
    lineItems: [
      { id: "li_1", description: "Logo design", quantity: 1, unitPrice: 1200, done: true },
      { id: "li_2", description: "Business card", quantity: 1, unitPrice: 400, done: false },
    ],
    milestones: [],
    payments: [
      {
        id: "pm_1",
        milestoneId: null,
        amount: 640,
        kind: "deposit",
        status: "success",
        paystackReference: "ref_dep_001",
        method: "mobile_money",
        paidAt: "2026-06-15T10:12:00Z",
      },
    ],
    deliverables: [],
    activity: [
      {
        id: "ev_1",
        event: "deposit_received",
        message: "Deposit of GHS 640 received.",
        createdAt: "2026-06-15T10:12:00Z",
      },
    ],
    createdAt: "2026-06-14T15:00:00Z",
  },
];

function found<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new ApiError(404, `${what} not found`);
  return value;
}

/** Bill-to block for a package's client — mirrors what the API attaches to the portal read. */
function billToFor(clientId: string): BillTo | undefined {
  const client = clients.find((c) => c.id === clientId);
  if (!client) return undefined;
  const contact = client.contacts.find((c) => c.isPrimary) ?? client.contacts[0];
  return {
    name: client.name,
    contactName: contact?.name ?? null,
    email: contact?.email ?? null,
    phone: contact?.phone ?? contact?.whatsapp ?? null,
  };
}

function logActivity(pkg: WorkPackage, event: string, message: string) {
  const entry: ActivityEntry = {
    id: `ev_${crypto.randomUUID().slice(0, 8)}`,
    event,
    message,
    createdAt: new Date().toISOString(),
  };
  pkg.activity.push(entry);
}

// Simulated media pipeline: deliverables finish "processing" a few seconds after upload.
const PROCESSING_MS = 3000;
const processingUntil = new Map<string, number>();

/** Build a watermarked SVG preview as a self-contained data URI (no network). */
function makePreview(type: DeliverableType, filename: string): string {
  const label = type.toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
    <rect width='400' height='300' fill='#f4efe8'/>
    <g fill='none' stroke='#b45309' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' opacity='0.5'>
      <path d='M150 175 L185 110 L200 145 L215 110 L250 175'/>
    </g>
    <text x='200' y='215' font-family='sans-serif' font-size='15' fill='#78716c' text-anchor='middle'>${label} preview</text>
    <text x='200' y='240' font-family='sans-serif' font-size='12' fill='#a8a29e' text-anchor='middle'>${filename}</text>
    <text x='200' y='160' font-family='sans-serif' font-size='34' font-weight='bold' fill='#1c1917' fill-opacity='0.06' text-anchor='middle' transform='rotate(-20 200 150)'>SAHARABASE</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Lazily advance any deliverable past its processing window to "ready". */
function settleDeliverables(pkg: WorkPackage) {
  const now = Date.now();
  for (const d of pkg.deliverables) {
    if (d.processingStatus === "processing") {
      const until = processingUntil.get(d.id) ?? 0;
      if (now >= until) {
        d.processingStatus = "ready";
        d.previewUrl = makePreview(d.type, d.filename);
        processingUntil.delete(d.id);
      }
    }
  }
}

export const mockApi: BedrockApi = {
  auth: {
    async login(email) {
      await delay();
      return {
        token: "mock-token",
        user: { id: "u_1", name: "Admin", email, role: "admin" },
      };
    },
    async me(token) {
      await delay(100);
      if (token !== "mock-token") throw new ApiError(401, "Unauthenticated");
      return { id: "u_1", name: "Admin", email: "admin@saharabase.test", role: "admin" };
    },
    async logout() {
      await delay(100);
    },
  },
  clients: {
    async list() {
      await delay();
      return [...clients].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async get(id) {
      await delay();
      return found(
        clients.find((c) => c.id === id),
        "Client",
      );
    },
    async create(input) {
      await delay();
      const client: Client = {
        id: `cl_${crypto.randomUUID().slice(0, 8)}`,
        type: input.type,
        accountType: input.accountType,
        name: input.name,
        contacts: input.contacts.map((c) => ({ id: `ct_${crypto.randomUUID().slice(0, 8)}`, ...c })),
        createdAt: new Date().toISOString(),
      };
      clients.push(client);
      return client;
    },
    async update(id, input) {
      await delay();
      const existing = found(
        clients.find((c) => c.id === id),
        "Client",
      );
      existing.type = input.type;
      existing.accountType = input.accountType;
      existing.name = input.name;
      existing.contacts = input.contacts.map((c) => ({
        id: `ct_${crypto.randomUUID().slice(0, 8)}`,
        ...c,
      }));
      return existing;
    },
    async remove(id) {
      await delay();
      const idx = clients.findIndex((c) => c.id === id);
      if (idx === -1) throw new ApiError(404, "Client not found");
      if (packages.some((p) => p.clientId === id)) {
        throw new ApiError(409, "This client still has work packages.");
      }
      clients.splice(idx, 1);
    },
    async activity() {
      await delay();
      const h = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();
      return {
        messages: [
          { id: "n1", event: "invoice_sent", label: "Invoice sent", channel: "whatsapp", recipient: "+233201234567", status: "read" as const, error: null, at: h(120) },
          { id: "n2", event: "invoice_sent", label: "Invoice sent", channel: "email", recipient: "ama@example.com", status: "sent" as const, error: null, at: h(120) },
          { id: "n3", event: "deposit_received", label: "Deposit received", channel: "whatsapp", recipient: "+233201234567", status: "delivered" as const, error: null, at: h(60) },
          { id: "n4", event: "files_ready", label: "Files ready to review", channel: "whatsapp", recipient: "+233201234567", status: "sent" as const, error: null, at: h(20) },
        ],
        documents: [
          { id: "d1", title: "Brand proposal", type: "proposal", filename: "brand-proposal.pdf", size: 240_000, at: h(200) },
        ],
      };
    },
  },
  packages: {
    async list(params) {
      await delay();
      packages.forEach(settleDeliverables);
      const all = [...packages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return params?.clientId ? all.filter((p) => p.clientId === params.clientId) : all;
    },
    async get(id) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === id),
        "Work package",
      );
      settleDeliverables(pkg);
      return pkg;
    },
    async getBySlug(slug) {
      await delay();
      const pkg = found(
        packages.find((p) => p.publicSlug === slug),
        "Work package",
      );
      settleDeliverables(pkg);
      // The portal read carries the bill-to block (invoice/receipt PDFs are built from it).
      return { ...pkg, billTo: billToFor(pkg.clientId) };
    },
    async startPayment(slug) {
      await delay();
      found(
        packages.find((p) => p.publicSlug === slug),
        "Work package",
      );
      // There is no gateway behind the mock, so refuse rather than hand back a checkout that
      // goes nowhere. Point NEXT_PUBLIC_API_LIVE at "packages" to exercise the real flow.
      throw new ApiError(503, "Online payment is not available in mock mode.");
    },
    async create(clientId, input) {
      await delay();
      found(
        clients.find((c) => c.id === clientId),
        "Client",
      );
      const now = new Date().toISOString();
      const activity: ActivityEntry = {
        id: `ev_${crypto.randomUUID().slice(0, 8)}`,
        event: "package_created",
        message: "Work package created.",
        createdAt: now,
      };
      const pkg: WorkPackage = {
        id: `wp_${crypto.randomUUID().slice(0, 8)}`,
        clientId,
        title: input.title,
        status: "draft",
        publicSlug: crypto.randomUUID(),
        pricingMode: input.pricingMode,
        deliveryMode: "gated_files",
        totalOverride: input.pricingMode === "fixed" ? input.totalOverride : null,
        estimatedDeliveryDate: input.estimatedDeliveryDate,
        lineItems: [],
        milestones: [],
        payments: [],
        deliverables: [],
        activity: [activity],
        createdAt: now,
      };
      packages.push(pkg);
      return pkg;
    },
    async update(id, input) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === id),
        "Work package",
      );
      pkg.title = input.title;
      pkg.pricingMode = input.pricingMode;
      if (input.deliveryMode) pkg.deliveryMode = input.deliveryMode;
      pkg.totalOverride = input.pricingMode === "fixed" ? input.totalOverride : null;
      pkg.estimatedDeliveryDate = input.estimatedDeliveryDate;
      return pkg;
    },
    async remove(id) {
      await delay();
      const idx = packages.findIndex((p) => p.id === id);
      if (idx === -1) throw new ApiError(404, "Work package not found");
      packages.splice(idx, 1);
    },
    async addLineItem(packageId, input) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const item: LineItem = {
        id: `li_${crypto.randomUUID().slice(0, 8)}`,
        description: input.description,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        done: false,
      };
      pkg.lineItems.push(item);
      return pkg;
    },
    async updateLineItem(packageId, itemId, input) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const item = found(
        pkg.lineItems.find((li) => li.id === itemId),
        "Line item",
      );
      item.description = input.description;
      item.quantity = input.quantity;
      item.unitPrice = input.unitPrice;
      return pkg;
    },
    async removeLineItem(packageId, itemId) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const idx = pkg.lineItems.findIndex((li) => li.id === itemId);
      if (idx === -1) throw new ApiError(404, "Line item not found");
      pkg.lineItems.splice(idx, 1);
      return pkg;
    },
    async setStatus(id, status) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === id),
        "Work package",
      );
      if (!ALLOWED_TRANSITIONS[pkg.status].includes(status)) {
        throw new ApiError(
          409,
          `Cannot move from ${statusMeta(pkg.status).label} to ${statusMeta(status).label}.`,
        );
      }
      pkg.status = status;
      logActivity(pkg, "status_changed", `Status changed to ${statusMeta(status).label}.`);
      return pkg;
    },
    async send(id) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === id),
        "Work package",
      );
      if (pkg.status !== "draft") {
        throw new ApiError(409, "Only a draft package can be sent.");
      }
      pkg.status = "sent";
      logActivity(pkg, "invoice_sent", "Invoice and tracking link sent via WhatsApp + email.");
      return pkg;
    },
    async notify(id, event) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === id),
        "Work package",
      );
      const label = event === "account_statement" ? "Account statement" : "Payment reminder";
      logActivity(pkg, "notification_sent", `${label} sent to the client via WhatsApp + email.`);
      return pkg;
    },
    async setLineItemDone(packageId, itemId, done) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const item = found(
        pkg.lineItems.find((li) => li.id === itemId),
        "Line item",
      );
      item.done = done;
      logActivity(
        pkg,
        "line_item_progress",
        `"${item.description}" marked ${done ? "done" : "not done"}.`,
      );
      return pkg;
    },
    async addDeliverable(packageId, file) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const type = deliverableTypeFromName(file.name);
      if (!type) throw new ApiError(422, "Unsupported file type. Use an image, PDF, or video.");
      const deliverable: Deliverable = {
        id: `dl_${crypto.randomUUID().slice(0, 8)}`,
        type,
        filename: file.name,
        previewUrl: null,
        // Download gate: originals stay locked until the balance reaches zero.
        locked: balance(pkg) > 0,
        archived: false,
        processingStatus: "processing",
      };
      pkg.deliverables.push(deliverable);
      processingUntil.set(deliverable.id, Date.now() + PROCESSING_MS);
      logActivity(pkg, "deliverable_uploaded", `Uploaded "${file.name}" — generating preview.`);
      return pkg;
    },
    async removeDeliverable(packageId, deliverableId) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const idx = pkg.deliverables.findIndex((d) => d.id === deliverableId);
      if (idx === -1) throw new ApiError(404, "Deliverable not found");
      const [removed] = pkg.deliverables.splice(idx, 1);
      processingUntil.delete(deliverableId);
      logActivity(pkg, "deliverable_removed", `Removed "${removed.filename}".`);
      return pkg;
    },
    async purgeDeliverables(packageId) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      let count = 0;
      for (const d of pkg.deliverables) {
        if (!d.archived) {
          d.archived = true;
          count++;
        }
      }
      if (count > 0) {
        logActivity(pkg, "originals_archived", `Removed ${count} original file(s) from storage to free space.`);
      }
      return pkg;
    },
    async recordPayment(packageId, input) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const payment: Payment = {
        id: `pm_${crypto.randomUUID().slice(0, 8)}`,
        milestoneId: null,
        amount: input.amount,
        kind: input.kind,
        status: "success",
        paystackReference: `ref_${crypto.randomUUID().slice(0, 10)}`,
        method: input.method,
        paidAt: new Date().toISOString(),
      };
      pkg.payments.push(payment);
      logActivity(pkg, "payment_received", `Payment of ${formatCedis(input.amount)} received.`);

      // Start gate: deposit (or full small-job payment) opens work.
      if (pkg.status === "sent" || pkg.status === "awaiting_deposit") {
        pkg.status = "in_progress";
        logActivity(pkg, "work_started", "Deposit confirmed — work started.");
      }

      // Download gate: a zero balance unlocks the clean originals.
      if (balance(pkg) <= 0) {
        pkg.deliverables.forEach((d) => (d.locked = false));
        logActivity(pkg, "payment_complete", "Balance cleared — downloads unlocked, receipt sent.");
      }

      return pkg;
    },
    async addMilestone(packageId, input) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const milestone: Milestone = {
        id: `ms_${crypto.randomUUID().slice(0, 8)}`,
        position:
          input.position ??
          (pkg.milestones.reduce((max, m) => Math.max(max, m.position), -1) + 1),
        label: input.label,
        amount: input.amount,
        kind: input.kind,
        status: "pending",
        paidAt: null,
      };
      pkg.milestones.push(milestone);
      logActivity(pkg, "milestone_added", `Milestone "${input.label}" (${formatCedis(input.amount)}) added.`);
      return pkg;
    },
    async updateMilestone(packageId, milestoneId, input) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const milestone = found(
        pkg.milestones.find((m) => m.id === milestoneId),
        "Milestone",
      );
      milestone.label = input.label;
      milestone.amount = input.amount;
      milestone.kind = input.kind;
      if (input.position !== undefined) milestone.position = input.position;
      return pkg;
    },
    async removeMilestone(packageId, milestoneId) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const idx = pkg.milestones.findIndex((m) => m.id === milestoneId);
      if (idx === -1) throw new ApiError(404, "Milestone not found");
      pkg.milestones.splice(idx, 1);
      return pkg;
    },
    async payMilestone(packageId, milestoneId, method) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const milestone = found(
        pkg.milestones.find((m) => m.id === milestoneId),
        "Milestone",
      );
      if (milestone.status === "paid") throw new ApiError(409, "That milestone is already paid.");

      pkg.payments.push({
        id: `pm_${crypto.randomUUID().slice(0, 8)}`,
        milestoneId: milestone.id,
        amount: milestone.amount,
        kind: milestone.kind,
        status: "success",
        paystackReference: `ref_${crypto.randomUUID().slice(0, 10)}`,
        method,
        paidAt: new Date().toISOString(),
      });
      milestone.status = "paid";
      milestone.paidAt = new Date().toISOString();
      logActivity(pkg, "milestone_paid", `Milestone "${milestone.label}" paid (${formatCedis(milestone.amount)}).`);

      // Start gate: a deposit payment opens work.
      if (pkg.status === "sent" || pkg.status === "awaiting_deposit") {
        pkg.status = "in_progress";
        logActivity(pkg, "work_started", "Deposit confirmed — work started.");
      }
      // Download gate: a zero balance unlocks the clean originals.
      if (balance(pkg) <= 0) {
        pkg.deliverables.forEach((d) => (d.locked = false));
        logActivity(pkg, "payment_complete", "Balance cleared — downloads unlocked, receipt sent.");
      }
      return pkg;
    },
  },
  infrastructure: {
    async listServers(clientId) {
      await delay();
      const all = [...hostingServers].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return clientId ? all.filter((s) => s.clientId === clientId) : all;
    },
    async createServer(input) {
      await delay();
      const server: HostingServer = {
        id: `hs_${crypto.randomUUID().slice(0, 8)}`,
        clientId: input.clientId,
        label: input.label,
        kind: input.kind,
        authType: input.authType,
        hostname: input.hostname,
        port: input.port,
        username: input.username,
        docroot: input.docroot,
        scope: input.scope ?? "readonly",
        hasSecret: Boolean(input.secret),
        createdAt: new Date().toISOString(),
      };
      hostingServers.push(server);
      return server;
    },
    async updateServer(id, input) {
      await delay();
      const existing = found(
        hostingServers.find((s) => s.id === id),
        "Hosting server",
      );
      Object.assign(existing, {
        clientId: input.clientId,
        label: input.label,
        kind: input.kind,
        authType: input.authType,
        hostname: input.hostname,
        port: input.port,
        username: input.username,
        docroot: input.docroot,
        scope: input.scope ?? "readonly",
        // Only flip hasSecret on when a new secret is supplied; omitting keeps the stored one.
        hasSecret: input.secret ? true : existing.hasSecret,
      });
      return existing;
    },
    async removeServer(id) {
      await delay();
      const idx = hostingServers.findIndex((s) => s.id === id);
      if (idx === -1) throw new ApiError(404, "Hosting server not found");
      clientAssets.forEach((a) => {
        if (a.hostingServerId === id) a.hostingServerId = null;
      });
      hostingServers.splice(idx, 1);
    },
    async testServer(input) {
      await delay(600);
      // Mock: a token/host containing "bad" fails; otherwise report a sample disk figure.
      if (/bad|invalid|wrong/i.test(`${input.secret}${input.hostname}`)) {
        return { ok: false, error: "Credentials were rejected (mock)." };
      }
      return { ok: true, metrics: { diskUsed: 4_200_000_000, diskLimit: 10_000_000_000 } };
    },
    async serverMetrics(id) {
      await delay();
      const server = found(
        hostingServers.find((s) => s.id === id),
        "Hosting server",
      );
      const clientName = server.clientId
        ? (clients.find((c) => c.id === server.clientId)?.name ?? null)
        : null;
      if (server.authType !== "cpanel") {
        return { server, clientName, details: null, error: "Detailed metrics are cPanel-only (mock)." };
      }
      return {
        server,
        clientName,
        details: {
          kind: "cpanel",
          fetchedAt: new Date().toISOString(),
          disk: { usedBytes: 19_748_552_704, limitBytes: 21_474_836_480, percent: 92 },
          inodes: { used: 63_964, limit: 300_000, percent: 21 },
          composition: [
            { label: "Website files", bytes: 4_916_000_000 },
            { label: "Databases", bytes: 0 },
            { label: "Email", bytes: 14_832_000_000 },
          ],
          bandwidth: {
            totalBytes: 5_120_000_000,
            byProtocol: { http: 4_052_514_287, imap: 871_339_492, smtp: 197_108_373 },
          },
          email: {
            count: 4,
            totalBytes: 14_832_000_000,
            top: [
              { login: "info@gigcottage.net", bytes: 14_700_000_000 },
              { login: "frontdesk@gigcottage.net", bytes: 27_652_407 },
              { login: "demawu@gigcottage.net", bytes: 93_415 },
            ],
          },
          counts: { addonDomains: "2/2", subdomains: "3", emailAccounts: "4", ftpAccounts: "0" },
          domains: {
            main: "gigconsult.net",
            addon: ["ccwimgh.net", "gigcottage.net"],
            sub: ["mails.gigcottage.net"],
          },
        },
        error: null,
      };
    },
    async listAssets(clientId) {
      await delay();
      return clientAssets
        .filter((a) => a.clientId === clientId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async createAsset(clientId, input) {
      await delay();
      const asset: ClientAsset = {
        id: `ca_${crypto.randomUUID().slice(0, 8)}`,
        clientId,
        hostingServerId: input.hostingServerId,
        type: input.type,
        label: input.label,
        identifier: input.identifier,
        source: input.source ?? "manual",
        status: "unknown",
        expiryDate: input.expiryDate,
        renewalDate: input.renewalDate,
        renewalFee: input.renewalFee,
        renewalLeadDays: input.renewalLeadDays ?? 30,
        daysUntilExpiry: daysUntil(input.expiryDate),
        metrics: null,
        recommendation: input.recommendation,
        monitorEnabled: input.monitorEnabled,
        lastSyncedAt: null,
        lastError: null,
        createdAt: new Date().toISOString(),
      };
      clientAssets.push(asset);
      return asset;
    },
    async updateAsset(id, input) {
      await delay();
      const existing = found(
        clientAssets.find((a) => a.id === id),
        "Asset",
      );
      Object.assign(existing, {
        hostingServerId: input.hostingServerId,
        type: input.type,
        label: input.label,
        identifier: input.identifier,
        source: input.source ?? existing.source,
        expiryDate: input.expiryDate,
        renewalDate: input.renewalDate,
        renewalFee: input.renewalFee,
        renewalLeadDays: input.renewalLeadDays ?? 30,
        daysUntilExpiry: daysUntil(input.expiryDate),
        recommendation: input.recommendation,
        monitorEnabled: input.monitorEnabled,
      });
      return existing;
    },
    async removeAsset(id) {
      await delay();
      const idx = clientAssets.findIndex((a) => a.id === id);
      if (idx === -1) throw new ApiError(404, "Asset not found");
      clientAssets.splice(idx, 1);
    },
    async syncAsset(id) {
      await delay(700);
      return found(
        clientAssets.find((a) => a.id === id),
        "Asset",
      );
    },
    async syncAll() {
      await delay(1200);
      return this.overview();
    },
    async overview() {
      await delay();
      const rank: Record<string, number> = { down: 0, critical: 1, warn: 2, unknown: 3, ok: 4 };
      const rows: AssetOverviewRow[] = clientAssets
        .map((a) => ({ ...a, clientName: clients.find((c) => c.id === a.clientId)?.name ?? null }))
        .sort((a, b) => {
          const byStatus = (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
          if (byStatus !== 0) return byStatus;
          return (a.daysUntilExpiry ?? Infinity) - (b.daysUntilExpiry ?? Infinity);
        });
      return {
        attention: rows.filter((r) => ["down", "critical", "warn"].includes(r.status)),
        all: rows,
      };
    },
    async listCharges(clientId) {
      await delay();
      return infraCharges
        .filter((c) => c.clientId === clientId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async createCharge(clientId, input) {
      await delay();
      const charge: InfraCharge = {
        id: `ic_${crypto.randomUUID().slice(0, 8)}`,
        clientId,
        clientAssetId: input.clientAssetId,
        invoiceId: null,
        description: input.description,
        amount: input.amount,
        dueDate: input.dueDate,
        billedForDate: null,
        status: "pending",
        paidAt: null,
        createdAt: new Date().toISOString(),
      };
      infraCharges.push(charge);
      return charge;
    },
    async updateCharge(id, input) {
      await delay();
      const charge = found(
        infraCharges.find((c) => c.id === id),
        "Charge",
      );
      charge.clientAssetId = input.clientAssetId;
      charge.description = input.description;
      charge.amount = input.amount;
      charge.dueDate = input.dueDate;
      return charge;
    },
    async removeCharge(id) {
      await delay();
      const idx = infraCharges.findIndex((c) => c.id === id);
      if (idx === -1) throw new ApiError(404, "Charge not found");
      infraCharges.splice(idx, 1);
    },
    async payCharge(id) {
      await delay();
      const charge = found(
        infraCharges.find((c) => c.id === id),
        "Charge",
      );
      charge.status = "paid";
      charge.paidAt = new Date().toISOString();
      return charge;
    },
    async chargesOutstanding() {
      await delay();
      const items = infraCharges
        .filter((c) => c.status === "pending")
        .map((c) => ({ ...c, clientName: clients.find((cl) => cl.id === c.clientId)?.name ?? null }))
        .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
      return { total: items.reduce((s, c) => s + c.amount, 0), items };
    },
  },
  /**
   * In-memory standalone invoices. The money rules are the real ones (totals derived from the
   * lines, a cleared balance settles the invoice, closes the charges it bills and mints the
   * receipt) so the admin screens are exercised properly without the Laravel API running.
   */
  invoices: {
    async list(clientId) {
      await delay();
      return invoices
        .filter((i) => !clientId || i.clientId === clientId)
        .map(hydrateInvoice)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async get(id) {
      await delay();
      const invoice = invoices.find((i) => i.id === id);
      if (!invoice) throw new ApiError(404, "Invoice not found");
      return hydrateInvoice(invoice);
    },
    async create(clientId, input) {
      await delay();
      const charges = infraCharges.filter(
        (c) => input.chargeIds.includes(c.id) && c.clientId === clientId && c.status === "pending",
      );
      const items = [
        ...input.items.map((item, i) => ({ ...item, position: i })),
        ...charges.map((c, i) => ({
          description: c.description,
          quantity: 1,
          unitPrice: c.amount,
          position: input.items.length + i,
        })),
      ];
      if (items.length === 0) throw new ApiError(422, "An invoice needs at least one line item.");

      const invoice: Invoice = {
        id: `in_${crypto.randomUUID().slice(0, 8)}`,
        clientId,
        clientName: clients.find((c) => c.id === clientId)?.name ?? null,
        publicSlug: crypto.randomUUID(),
        title: input.title,
        memo: input.memo,
        documentId: null,
        reference: null,
        serial: null,
        receiptDocumentId: null,
        receiptReference: null,
        receiptSerial: null,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        status: "draft",
        issuedAt: null,
        paidAt: null,
        createdAt: new Date().toISOString(),
        items: items.map((item) => ({
          id: `ii_${crypto.randomUUID().slice(0, 8)}`,
          position: item.position,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })),
        payments: [],
        total: 0,
        paid: 0,
        balance: 0,
      };
      invoices.push(invoice);
      charges.forEach((c) => {
        c.invoiceId = invoice.id;
      });
      return hydrateInvoice(invoice);
    },
    async update(id, input) {
      await delay();
      const invoice = invoices.find((i) => i.id === id);
      if (!invoice) throw new ApiError(404, "Invoice not found");
      if (invoice.status !== "draft") {
        throw new ApiError(409, "This invoice has been issued. Void it and raise a new one.");
      }
      infraCharges.forEach((c) => {
        if (c.invoiceId === id) c.invoiceId = null;
      });
      const charges = infraCharges.filter(
        (c) => input.chargeIds.includes(c.id) && c.clientId === invoice.clientId && c.status === "pending",
      );
      invoice.title = input.title;
      invoice.memo = input.memo;
      invoice.issueDate = input.issueDate;
      invoice.dueDate = input.dueDate;
      invoice.items = [
        ...input.items,
        ...charges.map((c) => ({ description: c.description, quantity: 1, unitPrice: c.amount })),
      ].map((item, i) => ({
        id: `ii_${crypto.randomUUID().slice(0, 8)}`,
        position: i,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
      }));
      charges.forEach((c) => {
        c.invoiceId = invoice.id;
      });
      return hydrateInvoice(invoice);
    },
    async remove(id) {
      await delay();
      const at = invoices.findIndex((i) => i.id === id);
      if (at >= 0) {
        infraCharges.forEach((c) => {
          if (c.invoiceId === id) c.invoiceId = null;
        });
        invoices.splice(at, 1);
      }
    },
    async issue(id) {
      await delay();
      const invoice = invoices.find((i) => i.id === id);
      if (!invoice) throw new ApiError(404, "Invoice not found");
      if (invoice.documentId) return hydrateInvoice(invoice);

      const code = mockClientCode(invoice.clientId);
      const seq = String(invoices.filter((i) => i.documentId).length + 1).padStart(2, "0");
      const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      invoice.reference = `INV-${code}-${seq}`;
      invoice.documentId = `SAH-FIN-${ymd}-${invoice.reference}`;
      invoice.serial = mockSerial();
      invoice.status = "issued";
      invoice.issueDate ??= new Date().toISOString().slice(0, 10);
      invoice.issuedAt = new Date().toISOString();
      return hydrateInvoice(invoice);
    },
    async recordPayment(id, input) {
      await delay();
      const invoice = invoices.find((i) => i.id === id);
      if (!invoice) throw new ApiError(404, "Invoice not found");
      if (invoice.status === "draft") throw new ApiError(409, "Issue the invoice first.");
      if (invoice.status === "void") throw new ApiError(409, "That invoice has been voided.");

      invoice.payments.push({
        id: `pm_${crypto.randomUUID().slice(0, 8)}`,
        milestoneId: null,
        amount: input.amount,
        kind: "full",
        status: "success",
        paystackReference: input.reference,
        method: input.method,
        paidAt: input.paidAt ?? new Date().toISOString(),
      });

      const hydrated = hydrateInvoice(invoice);
      if (hydrated.balance <= 0 && hydrated.total > 0) {
        const code = mockClientCode(invoice.clientId);
        const seq = String(invoices.filter((i) => i.receiptDocumentId).length + 1).padStart(2, "0");
        const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        invoice.status = "paid";
        invoice.paidAt = new Date().toISOString();
        invoice.receiptReference = `RCP-${code}-${seq}`;
        invoice.receiptDocumentId = `SAH-FIN-${ymd}-${invoice.receiptReference}`;
        invoice.receiptSerial = mockSerial();
        infraCharges.forEach((c) => {
          if (c.invoiceId === invoice.id && c.status === "pending") {
            c.status = "paid";
            c.paidAt = invoice.paidAt;
          }
        });
      }
      return hydrateInvoice(invoice);
    },
    async void(id) {
      await delay();
      const invoice = invoices.find((i) => i.id === id);
      if (!invoice) throw new ApiError(404, "Invoice not found");
      if (invoice.status === "paid") throw new ApiError(409, "That invoice is already settled.");
      invoice.status = "void";
      infraCharges.forEach((c) => {
        if (c.invoiceId === id) c.invoiceId = null;
      });
      return hydrateInvoice(invoice);
    },
    async outstanding() {
      await delay();
      const items = invoices
        .filter((i) => i.status === "issued")
        .map(hydrateInvoice)
        .filter((i) => i.balance > 0)
        .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
      return { total: items.reduce((s, i) => s + i.balance, 0), items };
    },
    async getBySlug(slug) {
      await delay();
      const invoice = invoices.find((i) => i.publicSlug === slug);
      if (!invoice || invoice.status === "draft") throw new ApiError(404, "Invoice not found");
      const client = clients.find((c) => c.id === invoice.clientId);
      const contact = client?.contacts[0];
      return {
        ...hydrateInvoice(invoice),
        billTo: {
          name: client?.name ?? "",
          contactName: contact?.name ?? null,
          email: contact?.email ?? null,
          phone: contact?.phone ?? contact?.whatsapp ?? null,
        },
      };
    },
    async startPayment(slug) {
      await delay();
      const invoice = invoices.find((i) => i.publicSlug === slug);
      if (!invoice) throw new ApiError(404, "Invoice not found");
      const { balance: due } = hydrateInvoice(invoice);
      if (due <= 0) throw new ApiError(409, "This invoice is already settled. Thank you.");
      // No gateway in the mock: hand back the invoice page so the flow is still clickable.
      return {
        reference: `sbt-mock-${crypto.randomUUID().slice(0, 8)}`,
        accessCode: "mock",
        authorizationUrl: `/i/${slug}?mock-checkout=1`,
        publicKey: null,
        amount: due,
      };
    },
  },
  /**
   * In-memory vault. Real AES-GCM still runs in the browser against this, so the unlock,
   * rewrap and entry flows are genuinely exercised in dev. State is per server process and
   * dies with it, which is correct for a mock: nothing pretends to be durable storage.
   */
  vault: {
    async get() {
      await delay();
      return { key: vaultKey, entries: [...vaultEntries] };
    },
    async createKey(input) {
      await delay();
      if (vaultKey) throw new ApiError(409, "This vault is already set up.");
      const now = new Date().toISOString();
      vaultKey = { ...input, createdAt: now, updatedAt: now };
      return vaultKey;
    },
    async updateKey(input) {
      await delay();
      if (!vaultKey) throw new ApiError(404, "This vault has not been set up yet.");
      vaultKey = { ...vaultKey, ...input, updatedAt: new Date().toISOString() };
      return vaultKey;
    },
    async createEntry(input) {
      await delay();
      if (!vaultKey) throw new ApiError(409, "Set up the vault before adding entries.");
      const now = new Date().toISOString();
      const entry = { id: `ve_${crypto.randomUUID().slice(0, 8)}`, ...input, createdAt: now, updatedAt: now };
      vaultEntries.unshift(entry);
      return entry;
    },
    async updateEntry(id, input) {
      await delay();
      const entry = vaultEntries.find((e) => e.id === id);
      if (!entry) throw new ApiError(404, "That entry no longer exists.");
      Object.assign(entry, input, { updatedAt: new Date().toISOString() });
      return entry;
    },
    async removeEntry(id) {
      await delay();
      const i = vaultEntries.findIndex((e) => e.id === id);
      if (i >= 0) vaultEntries.splice(i, 1);
    },
    async destroy() {
      await delay();
      // The mock cannot check an account password, so it accepts and wipes.
      vaultKey = null;
      vaultEntries.length = 0;
    },
  },
  settings: {
    async getReminders() {
      await delay();
      return { rules: [...reminderRules], events: ["account_statement", "payment_reminder"] };
    },
    async saveReminders(rules) {
      await delay();
      reminderRules = rules.map((r) => ({ id: `rr_${crypto.randomUUID().slice(0, 8)}`, ...r }));
      return { rules: [...reminderRules], events: ["account_statement", "payment_reminder"] };
    },
    async wipeTestData() {
      await delay();
      return { message: "Test data cleared." };
    },
  },
  track: {
    async request() {
      await delay();
      return { message: "If that number is on file, a code has been sent." };
    },
    async verify(_phone, code) {
      await delay();
      // Mock: the code 123456 always verifies and returns the first client's packages.
      if (code !== "123456") throw new ApiError(422, "That code is invalid or has expired.");
      const client = clients[0];
      return {
        token: "mock-track-token",
        client: { id: client.id, name: client.name },
        packages: packages.filter((p) => p.clientId === client.id),
      };
    },
  },
};

let vaultKey: VaultKeyRecord | null = null;
const vaultEntries: VaultEntryRecord[] = [];

let reminderRules: ReminderRule[] = [
  { id: "rr_seed1", dayOfMonth: 25, event: "payment_reminder", enabled: true },
  { id: "rr_seed2", dayOfMonth: 1, event: "account_statement", enabled: true },
];

/** Whole days from today until an ISO date (negative = past); null if no date. */
function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const ms = new Date(`${date}T00:00:00Z`).getTime() - new Date().setUTCHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

const iso = (daysFromNow: number) =>
  new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);

const hostingServers: HostingServer[] = [
  {
    id: "hs_seed_vps",
    clientId: null,
    label: "Sahara VPS (Hostinger)",
    kind: "vps",
    authType: "ssh",
    hostname: "vps.saharabasetech.com",
    port: 22,
    username: "sahara",
    docroot: null,
    scope: "readonly",
    hasSecret: true,
    createdAt: "2026-06-01T09:00:00Z",
  },
  {
    id: "hs_seed_shared",
    clientId: "cl_1",
    label: "Ama — cPanel (shared)",
    kind: "shared",
    authType: "cpanel",
    hostname: "server42.host.com",
    port: 2083,
    username: "amaboat",
    docroot: null,
    scope: "readonly",
    hasSecret: true,
    createdAt: "2026-06-02T09:00:00Z",
  },
];

const clientAssets: ClientAsset[] = [
  {
    id: "ca_seed_1",
    clientId: "cl_1",
    hostingServerId: null,
    type: "domain",
    label: "Primary domain",
    identifier: "amaboateng.com",
    source: "website",
    status: "warn",
    expiryDate: iso(21),
    renewalDate: null,
    renewalFee: null,
    renewalLeadDays: 30,
    daysUntilExpiry: 21,
    metrics: {
      regStatus: "warn",
      sslStatus: "ok",
      sslDays: 74,
      siteStatus: "ok",
      siteUp: 1,
      httpStatus: 200,
    },
    recommendation: "Domain amaboateng.com expires in 21 days. Plan the renewal.",
    monitorEnabled: true,
    lastSyncedAt: "2026-07-10T06:00:00Z",
    lastError: null,
    createdAt: "2026-06-02T09:10:00Z",
  },
  {
    id: "ca_seed_2",
    clientId: "cl_1",
    hostingServerId: "hs_seed_shared",
    type: "hosting",
    label: "cPanel storage",
    identifier: "amaboat",
    source: "cpanel",
    status: "ok",
    expiryDate: null,
    renewalDate: null,
    renewalFee: null,
    renewalLeadDays: 30,
    daysUntilExpiry: null,
    metrics: { diskUsed: 4_200_000_000, diskLimit: 10_000_000_000 },
    recommendation: null,
    monitorEnabled: true,
    lastSyncedAt: "2026-07-10T06:00:00Z",
    lastError: null,
    createdAt: "2026-06-02T09:12:00Z",
  },
  {
    id: "ca_seed_3",
    clientId: "cl_2",
    hostingServerId: null,
    type: "site",
    label: "Marketing site",
    identifier: "https://kojomensah.com",
    source: "http",
    status: "down",
    expiryDate: null,
    renewalDate: null,
    renewalFee: null,
    renewalLeadDays: 30,
    daysUntilExpiry: null,
    metrics: null,
    recommendation: "Site is not responding — check hosting.",
    monitorEnabled: true,
    lastSyncedAt: "2026-07-10T06:00:00Z",
    lastError: "HTTP 502",
    createdAt: "2026-06-05T09:00:00Z",
  },
];
