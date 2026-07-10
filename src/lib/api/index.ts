import type { BedrockApi } from "./contract";
import { httpApi } from "./http";
import { mockApi } from "./mock";

/**
 * Backend selection, per domain. Lets us bring the API online one slice at a time:
 * a domain listed in NEXT_PUBLIC_API_LIVE (or all, when NEXT_PUBLIC_API_SOURCE=live)
 * uses the live Laravel client; the rest stay on the in-memory mock. Interrelated
 * domains (clients ↔ packages) should be flipped together to stay coherent.
 *
 *   NEXT_PUBLIC_API_SOURCE = "live" | "mock"   (all-live shortcut; default mock)
 *   NEXT_PUBLIC_API_LIVE   = "auth,clients"    (comma-separated live domains)
 */
const allLive = process.env.NEXT_PUBLIC_API_SOURCE === "live";
const liveDomains = new Set(
  (process.env.NEXT_PUBLIC_API_LIVE ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

const isLive = (domain: string) => allLive || liveDomains.has(domain);

export const api: BedrockApi = {
  auth: isLive("auth") ? httpApi.auth : mockApi.auth,
  clients: isLive("clients") ? httpApi.clients : mockApi.clients,
  packages: isLive("packages") ? httpApi.packages : mockApi.packages,
  // Infrastructure monitoring (domains/SSL/hosting). Rides the clients switch (same admin surface).
  infrastructure:
    isLive("infrastructure") || isLive("clients") ? httpApi.infrastructure : mockApi.infrastructure,
  // Settings ride the packages switch (same admin surface) unless flipped on their own.
  settings: isLive("settings") || isLive("packages") ? httpApi.settings : mockApi.settings,
  // Track (public phone+OTP) rides the packages switch too.
  track: isLive("track") || isLive("packages") ? httpApi.track : mockApi.track,
};

export * from "./contract";
export * from "./types";
