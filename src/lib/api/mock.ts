import { ApiError, type BedrockApi } from "./contract";
import type { ActivityEntry, Client, LineItem, WorkPackage } from "./types";

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
      const all = [...packages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return params?.clientId ? all.filter((p) => p.clientId === params.clientId) : all;
    },
    async get(id) {
      await delay();
      return found(
        packages.find((p) => p.id === id),
        "Work package",
      );
    },
    async getBySlug(slug) {
      await delay();
      return found(
        packages.find((p) => p.publicSlug === slug),
        "Work package",
      );
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
  },
};
