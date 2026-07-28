"use server";

import { api, ApiError } from "@/lib/api";

/**
 * Open a Paystack checkout for a portal visitor and hand back the URL to send them to.
 *
 * Runs server-side so the browser never talks to the Laravel API directly (the BFF pattern
 * the rest of the app uses). Nothing here marks anything paid: the returned URL is a place
 * to pay, and only the verified webhook turns that into money received.
 */
export async function startPortalPayment(
  slug: string,
  milestoneId: string | null = null,
): Promise<{ url?: string; error?: string }> {
  try {
    const session = await api.packages.startPayment(slug, milestoneId);
    return { url: session.authorizationUrl };
  } catch (e) {
    return {
      error:
        e instanceof ApiError
          ? e.message
          : "We could not start that payment. Please try again in a moment.",
    };
  }
}
