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
    return { error: payError(e) };
  }
}

/**
 * The same, for a standalone invoice — the Pay button printed on the invoice PDF lands the
 * client on /i/{slug}, which calls this.
 */
export async function startInvoicePayment(slug: string): Promise<{ url?: string; error?: string }> {
  try {
    const session = await api.invoices.startPayment(slug);
    return { url: session.authorizationUrl };
  } catch (e) {
    return { error: payError(e) };
  }
}

/** Show the API's own refusal (already settled, gateway down) but never a raw stack. */
function payError(e: unknown): string {
  return e instanceof ApiError
    ? e.message
    : "We could not start that payment. Please try again in a moment.";
}
