import { ApiError, type BedrockApi } from "./contract";
import type { AdminSession, Client, SessionUser, WorkPackage } from "./types";

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
  },
  packages: {
    list: (params) => {
      const qs = params?.clientId ? `?clientId=${encodeURIComponent(params.clientId)}` : "";
      return request<WorkPackage[]>(`/api/admin/packages${qs}`);
    },
    get: (id) => request<WorkPackage>(`/api/admin/packages/${id}`),
    getBySlug: (slug) => request<WorkPackage>(`/api/p/${slug}`),
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
  },
};
