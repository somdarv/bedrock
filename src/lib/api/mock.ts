import { ApiError, type BedrockApi } from "./contract";
import { balance, type ActivityEntry, type Client, type Deliverable, type DeliverableType, type LineItem, type Payment, type WorkPackage } from "./types";
import { ALLOWED_TRANSITIONS, statusMeta } from "@/lib/status";
import { deliverableTypeFromName, formatCedis } from "@/lib/utils";

/**
 * In-memory mock backend. Default in dev so the frontend is never blocked on the
 * separate Laravel repo. Fixtures mirror the DTO shapes; swap to `live` via
 * NEXT_PUBLIC_API_SOURCE once real endpoints exist.
 */

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const clients: Client[] = [
  {
    id: "cl_1",
    name: "Ama Boateng",
    whatsapp: "+233201234567",
    email: "ama@example.com",
    phone: "+233201234567",
    createdAt: "2026-06-10T09:00:00Z",
  },
  {
    id: "cl_2",
    name: "Kojo Mensah",
    whatsapp: "+233557654321",
    email: null,
    phone: "+233557654321",
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
    totalOverride: null,
    estimatedDeliveryDate: "2026-06-28",
    lineItems: [
      { id: "li_1", description: "Logo design", quantity: 1, unitPrice: 1200, done: true },
      { id: "li_2", description: "Business card", quantity: 1, unitPrice: 400, done: false },
    ],
    payments: [
      {
        id: "pm_1",
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
        ...input,
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
      Object.assign(existing, input);
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
      return pkg;
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
        totalOverride: input.pricingMode === "fixed" ? input.totalOverride : null,
        estimatedDeliveryDate: input.estimatedDeliveryDate,
        lineItems: [],
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
    async recordPayment(packageId, input) {
      await delay();
      const pkg = found(
        packages.find((p) => p.id === packageId),
        "Work package",
      );
      const payment: Payment = {
        id: `pm_${crypto.randomUUID().slice(0, 8)}`,
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
  },
};
