import { ApiError, type BedrockApi } from "./contract";
import type {
  AdminSession,
  Client,
  ClientActivity,
  ClientAsset,
  FxState,
  HostingServer,
  InfraCharge,
  InfraChargesOutstanding,
  InfrastructureOverview,
  Invoice,
  InvoicesOutstanding,
  PaymentSession,
  PublicInvoice,
  ReminderSettings,
  ServerMetrics,
  SessionUser,
  TestServerResult,
  TrackResult,
  VaultEntryRecord,
  VaultKeyRecord,
  VaultState,
  WorkPackage,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Attach the Sanctum bearer token for authenticated calls. The token lives in the
 * httpOnly session cookie; these API calls run server-side (server components /
 * actions), so we read it from the request cookies and forward it as a bearer.
 */
async function authHeaders(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") return {};
  try {
    const { cookies } = await import("next/headers");
    const token = (await cookies()).get("bedrock_token")?.value;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(await authHeaders()),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // non-JSON error body; keep statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Live client against the Laravel API. Selected when NEXT_PUBLIC_API_SOURCE=live. */
export const httpApi: BedrockApi = {
  auth: {
    login: (email, password) =>
      request<AdminSession>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: (token) =>
      request<SessionUser>("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    logout: () => request<void>("/api/admin/logout", { method: "POST" }),
  },
  clients: {
    list: () => request<Client[]>("/api/admin/clients"),
    get: (id) => request<Client>(`/api/admin/clients/${id}`),
    create: (input) =>
      request<Client>("/api/admin/clients", { method: "POST", body: JSON.stringify(input) }),
    update: (id, input) =>
      request<Client>(`/api/admin/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    remove: (id) => request<void>(`/api/admin/clients/${id}`, { method: "DELETE" }),
    activity: (id) => request<ClientActivity>(`/api/admin/clients/${id}/activity`),
  },
  packages: {
    list: (params) => {
      const qs = params?.clientId ? `?clientId=${encodeURIComponent(params.clientId)}` : "";
      return request<WorkPackage[]>(`/api/admin/packages${qs}`);
    },
    get: (id) => request<WorkPackage>(`/api/admin/packages/${id}`),
    getBySlug: (slug) => request<WorkPackage>(`/api/p/${slug}`),
    startPayment: (slug, milestoneId) =>
      request<PaymentSession>(`/api/p/${slug}/pay`, {
        method: "POST",
        body: JSON.stringify({ milestoneId: milestoneId ?? null }),
      }),
    create: (clientId, input) =>
      request<WorkPackage>(`/api/admin/clients/${clientId}/packages`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id, input) =>
      request<WorkPackage>(`/api/admin/packages/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    remove: (id) => request<void>(`/api/admin/packages/${id}`, { method: "DELETE" }),
    addLineItem: (packageId, input) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/items`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateLineItem: (packageId, itemId, input) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    removeLineItem: (packageId, itemId) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/items/${itemId}`, {
        method: "DELETE",
      }),
    setStatus: (id, status) =>
      request<WorkPackage>(`/api/admin/packages/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    send: (id) => request<WorkPackage>(`/api/admin/packages/${id}/send`, { method: "POST" }),
    notify: (id, event) =>
      request<WorkPackage>(`/api/admin/packages/${id}/notify`, {
        method: "POST",
        body: JSON.stringify({ event }),
      }),
    setLineItemDone: (packageId, itemId, done) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/items/${itemId}/done`, {
        method: "POST",
        body: JSON.stringify({ done }),
      }),
    addDeliverable: async (packageId, file) => {
      // Multipart upload — no Content-Type so the boundary is set automatically.
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BASE_URL}/api/admin/packages/${packageId}/deliverables`, {
        method: "POST",
        body: form,
        headers: { Accept: "application/json", ...(await authHeaders()) },
        cache: "no-store",
      });
      if (!res.ok) throw new ApiError(res.status, res.statusText);
      return (await res.json()) as WorkPackage;
    },
    removeDeliverable: (packageId, deliverableId) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/deliverables/${deliverableId}`, {
        method: "DELETE",
      }),
    purgeDeliverables: (packageId) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/deliverables/purge`, {
        method: "POST",
      }),
    recordPayment: (packageId, input) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/payments`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    addMilestone: (packageId, input) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/milestones`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateMilestone: (packageId, milestoneId, input) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/milestones/${milestoneId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    removeMilestone: (packageId, milestoneId) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/milestones/${milestoneId}`, {
        method: "DELETE",
      }),
    payMilestone: (packageId, milestoneId, method) =>
      request<WorkPackage>(`/api/admin/packages/${packageId}/milestones/${milestoneId}/pay`, {
        method: "POST",
        body: JSON.stringify({ method }),
      }),
  },
  infrastructure: {
    listServers: async (clientId) => {
      const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
      const res = await request<{ servers: HostingServer[] }>(`/api/admin/servers${qs}`);
      return res.servers;
    },
    createServer: (input) =>
      request<HostingServer>(`/api/admin/servers`, { method: "POST", body: JSON.stringify(input) }),
    updateServer: (id, input) =>
      request<HostingServer>(`/api/admin/servers/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    removeServer: (id) => request<void>(`/api/admin/servers/${id}`, { method: "DELETE" }),
    testServer: (input) =>
      request<TestServerResult>(`/api/admin/servers/test`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    serverMetrics: (id) => request<ServerMetrics>(`/api/admin/servers/${id}/metrics`),
    listAssets: async (clientId) => {
      const res = await request<{ assets: ClientAsset[] }>(`/api/admin/clients/${clientId}/assets`);
      return res.assets;
    },
    createAsset: (clientId, input) =>
      request<ClientAsset>(`/api/admin/clients/${clientId}/assets`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateAsset: (id, input) =>
      request<ClientAsset>(`/api/admin/assets/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    removeAsset: (id) => request<void>(`/api/admin/assets/${id}`, { method: "DELETE" }),
    overview: () => request<InfrastructureOverview>(`/api/admin/infrastructure`),
    syncAsset: (id) => request<ClientAsset>(`/api/admin/assets/${id}/sync`, { method: "POST" }),
    syncAll: () =>
      request<InfrastructureOverview>(`/api/admin/infrastructure/sync`, { method: "POST" }),
    listCharges: async (clientId) => {
      const res = await request<{ charges: InfraCharge[] }>(
        `/api/admin/clients/${clientId}/infra-charges`,
      );
      return res.charges;
    },
    createCharge: (clientId, input) =>
      request<InfraCharge>(`/api/admin/clients/${clientId}/infra-charges`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateCharge: (id, input) =>
      request<InfraCharge>(`/api/admin/infra-charges/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    removeCharge: (id) => request<void>(`/api/admin/infra-charges/${id}`, { method: "DELETE" }),
    payCharge: (id) =>
      request<InfraCharge>(`/api/admin/infra-charges/${id}/pay`, { method: "POST" }),
    chargesOutstanding: () =>
      request<InfraChargesOutstanding>(`/api/admin/infra-charges/outstanding`),
  },
  invoices: {
    list: async (clientId) => {
      const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
      const res = await request<{ invoices: Invoice[] }>(`/api/admin/invoices${qs}`);
      return res.invoices;
    },
    get: (id) => request<Invoice>(`/api/admin/invoices/${id}`),
    create: (clientId, input) =>
      request<Invoice>(`/api/admin/clients/${clientId}/invoices`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id, input) =>
      request<Invoice>(`/api/admin/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    remove: (id) => request<void>(`/api/admin/invoices/${id}`, { method: "DELETE" }),
    issue: (id) => request<Invoice>(`/api/admin/invoices/${id}/issue`, { method: "POST" }),
    recordPayment: (id, input) =>
      request<Invoice>(`/api/admin/invoices/${id}/payments`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    void: (id) => request<Invoice>(`/api/admin/invoices/${id}/void`, { method: "POST" }),
    outstanding: () => request<InvoicesOutstanding>(`/api/admin/invoices/outstanding`),
    getBySlug: (slug) => request<PublicInvoice>(`/api/i/${slug}`),
    startPayment: (slug) => request<PaymentSession>(`/api/i/${slug}/pay`, { method: "POST" }),
    fx: () => request<FxState>(`/api/admin/fx`),
    saveFx: (input) =>
      request<FxState>(`/api/admin/fx`, { method: "PUT", body: JSON.stringify(input) }),
  },
  vault: {
    get: () => request<VaultState>(`/api/admin/vault`),
    createKey: (input) =>
      request<VaultKeyRecord>(`/api/admin/vault/key`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateKey: (input) =>
      request<VaultKeyRecord>(`/api/admin/vault/key`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    createEntry: (input) =>
      request<VaultEntryRecord>(`/api/admin/vault/entries`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateEntry: (id, input) =>
      request<VaultEntryRecord>(`/api/admin/vault/entries/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    removeEntry: (id) => request<void>(`/api/admin/vault/entries/${id}`, { method: "DELETE" }),
    destroy: (password) =>
      request<void>(`/api/admin/vault`, {
        method: "DELETE",
        body: JSON.stringify({ password }),
      }),
  },
  settings: {
    getReminders: () => request<ReminderSettings>(`/api/admin/settings/reminders`),
    saveReminders: (rules) =>
      request<ReminderSettings>(`/api/admin/settings/reminders`, {
        method: "PUT",
        body: JSON.stringify({ rules }),
      }),
    wipeTestData: () => request<{ message: string }>(`/api/admin/settings/wipe`, { method: "POST" }),
  },
  track: {
    request: (phone) =>
      request<{ message: string }>(`/api/track/request`, {
        method: "POST",
        body: JSON.stringify({ phone }),
      }),
    verify: (phone, code) =>
      request<TrackResult>(`/api/track/verify`, {
        method: "POST",
        body: JSON.stringify({ phone, code }),
      }),
  },
};
