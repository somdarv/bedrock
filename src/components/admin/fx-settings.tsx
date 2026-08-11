"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import type { FxState } from "@/lib/api";
import { saveFxSettings } from "@/lib/invoices/actions";
import { formatRate } from "@/lib/utils";

/**
 * The USD → GHS rate dollar-denominated invoices are billed at.
 *
 * The margin is ONE number on purpose. What our card costs us to settle a dollar bill from Ghana
 * — the issuer's FX markup, the international transaction fee, the spread — *is* the gap between
 * mid-market and what we actually get. Charging an FX margin and a separate card fee would bill
 * that same cost twice and put roughly 24% on a client's invoice instead of 11.5%.
 */
export function FxSettings({ state }: { state: FxState }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  const [margin, setMargin] = React.useState(String(state.marginPercent));
  const [manual, setManual] = React.useState(state.manualRate ? String(state.manualRate) : "");
  const [error, setError] = React.useState<string | null>(null);

  const marginValue = Number(margin);
  const manualValue = manual.trim() ? Number(manual) : null;
  const mid = manualValue ?? state.midRate;
  const preview =
    mid && Number.isFinite(marginValue) ? mid * (1 + marginValue / 100) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!Number.isFinite(marginValue) || marginValue < 0 || marginValue > 40) {
      return setError("Enter a margin between 0 and 40 percent.");
    }
    if (manual.trim() && (!Number.isFinite(manualValue!) || manualValue! <= 0)) {
      return setError("Enter a valid rate, or leave it blank to use the live feed.");
    }

    startTransition(async () => {
      const res = await saveFxSettings({ marginPercent: marginValue, manualRate: manualValue });
      if (res.error) setError(res.error);
      else {
        toast("Settlement rate saved.", "success");
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold tracking-tight">Settlement rate</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Used by invoices priced in US dollars. The client is charged in cedis at this rate on the
        day they pay, not the day the invoice was issued. Clients see it called a settlement rate,
        never an exchange rate, and the invoice explains up front why it sits above the mid-market
        figure they will find online.
      </p>

      {state.error && (
        <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.stale && !state.error && (
        <p className="mt-4 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
          The live rate could not be refreshed recently, so invoices are being billed at the last
          rate we obtained. Set a rate by hand below if this persists.
        </p>
      )}

      <dl className="mt-5 grid gap-4 border-y border-border py-5 sm:grid-cols-3">
        <div>
          <dt className="eyebrow">Mid-market</dt>
          <dd className="mt-1 font-display text-lg font-semibold tracking-tight">
            {state.midRate ? `₵${formatRate(state.midRate)}` : "—"}
          </dd>
          <dd className="mt-0.5 text-xs text-muted-foreground">
            {state.manualRate
              ? "set by hand"
              : state.ratedAt
                ? `updated ${new Date(state.ratedAt).toLocaleString()}`
                : "not yet fetched"}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Margin</dt>
          <dd className="mt-1 font-display text-lg font-semibold tracking-tight">
            {state.marginPercent}%
          </dd>
          <dd className="mt-0.5 text-xs text-muted-foreground">card, fees and spread</dd>
        </div>
        <div>
          <dt className="eyebrow">Billed at</dt>
          <dd className="mt-1 font-display text-lg font-semibold tracking-tight">
            {state.effectiveRate ? `₵${formatRate(state.effectiveRate)}` : "—"}
          </dd>
          <dd className="mt-0.5 text-xs text-muted-foreground">per $1</dd>
        </div>
      </dl>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Margin over mid-market (%)" htmlFor="margin" required>
            <Input
              id="margin"
              type="number"
              min={0}
              max={40}
              step="0.1"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
          </Field>
          <Field label="Mid-market rate by hand (optional)" htmlFor="manual">
            <Input
              id="manual"
              type="number"
              min={0}
              step="0.0001"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Blank = use the live feed"
            />
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          The margin is one figure covering what your card actually costs to settle a dollar bill
          from Ghana: the issuer&apos;s FX markup, the international transaction fee and the
          spread. Do not add a separate card fee on top of it: that bills the same cost twice, and
          the invoice tells clients there are no extra charges.
        </p>
        <p className="text-xs text-muted-foreground">
          Worth keeping in mind when you set it: a client who checks with their own bank is
          comparing against what a Ghanaian card costs them, not against the mid-market rate. The
          further above that this sits, the harder the conversation.
        </p>

        {preview !== null && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            A $100 invoice would be charged at{" "}
            <span className="font-semibold">₵{formatRate(preview * 100)}</span> today, at ₵
            {formatRate(preview)} to the dollar.
          </p>
        )}

        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner /> : null}
            Save
          </Button>
        </div>
      </form>
    </section>
  );
}
