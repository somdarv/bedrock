"use client";

import * as React from "react";
import { startPortalPayment } from "@/lib/portal/actions";

/**
 * Sends the client to Paystack's hosted checkout (card, mobile money, bank transfer).
 *
 * Deliberately assumes nothing on the way back. Paystack returns the payer to this same
 * portal page, which simply re-reads its state from the API — and that state only changes
 * once the webhook has verified the charge server-side. A payer who closes the tab, or who
 * types the return URL by hand, changes nothing.
 */
export function PortalPayButton({
  slug,
  label,
  milestoneId = null,
  variant = "primary",
}: {
  slug: string;
  label: string;
  milestoneId?: string | null;
  variant?: "primary" | "quiet";
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function pay() {
    setPending(true);
    setError(null);

    const { url, error } = await startPortalPayment(slug, milestoneId);

    if (!url) {
      setError(error ?? "We could not start that payment.");
      setPending(false);
      return;
    }

    // Leave `pending` set: the page is navigating away, and re-enabling the button first
    // would invite a second checkout for the same money.
    window.location.href = url;
  }

  const className =
    variant === "primary"
      ? "inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      : "inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className={variant === "primary" ? "text-right" : undefined}>
      <button type="button" onClick={pay} disabled={pending} className={className}>
        {pending ? "Opening secure checkout…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
