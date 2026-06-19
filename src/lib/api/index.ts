import type { BedrockApi } from "./contract";
import { httpApi } from "./http";
import { mockApi } from "./mock";

/**
 * Selects the backend at module load. Defaults to the mock unless explicitly set
 * to "live" with a configured base URL, so the frontend runs standalone in dev.
 */
const source = process.env.NEXT_PUBLIC_API_SOURCE ?? "mock";

export const api: BedrockApi = source === "live" ? httpApi : mockApi;

export * from "./contract";
export * from "./types";
