"use client";

import * as React from "react";
import { startInvoicePayment } from "@/lib/portal/actions";

/**
 * Sends the client to Paystack's hosted checkout for a standalone invoice (card, mobile money,
 * bank transfer). The twin of PortalPayButton, which does the same for a work package.
 *
 * Deliberately assumes nothing on the way back. Paystack returns the payer to the invoice page,
 * which re-reads its state from the API — and that state only changes once the webhook has
 * verified the charge server-side. A payer who closes the tab, or who types the return URL by
 * hand, changes nothing.
 */
export function InvoicePayButton({ slug, label }: { slug: string; label: string }) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function pay() {
    setPending(true);
    setError(null);

    const { url, error } = await startInvoicePayment(slug);

    if (!url) {
      setError(error ?? "We could not start that payment.");
      setPending(false);
      return;
    }

    // Leave `pending` set: the page is navigating away, and re-enabling the button first
    // would invite a second checkout for the same money.
    window.location.href = url;
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={pay}
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
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
