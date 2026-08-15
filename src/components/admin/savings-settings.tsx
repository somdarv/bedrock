"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import type { SavingsState } from "@/lib/api";
import { setSavingsRate } from "@/lib/savings/actions";
import { formatCedis } from "@/lib/utils";

/**
 * How much of every payment received is held back from operating money.
 *
 * The rate is forward-looking only. Entries already in the ledger keep the rate they accrued at,
 * because a slice you have already transferred has to keep matching your bank statement — see
 * bedrock/docs/SAVINGS.md.
 */
export function SavingsSettings({ state }: { state: SavingsState }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  const [rate, setRate] = React.useState(String(state.ratePercent));
  const [error, setError] = React.useState<string | null>(null);

  const value = Number(rate);
  const valid = Number.isFinite(value) && value >= 0 && value <= 50;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valid) return setError("Enter a rate between 0 and 50 percent.");

    startTransition(async () => {
      const res = await setSavingsRate(value);
      if (res.error) setError(res.error);
      else {
        toast(value > 0 ? `Saving ${value}% of every payment.` : "Savings turned off.", "success");
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold tracking-tight">Savings set-aside</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        A slice of every payment received, held back from operating money. It accrues
        automatically the moment money lands, whichever way it arrives: a package payment, a
        milestone, an invoice, or an online payment through Paystack. Moving the cedis is still
        yours to do, and the{" "}
        <Link href="/admin/savings" className="font-medium text-foreground underline">
          savings ledger
        </Link>{" "}
        tracks what you have not moved yet.
      </p>

      <dl className="mt-5 grid gap-4 border-y border-border py-5 sm:grid-cols-3">
        <div>
          <dt className="eyebrow">Rate</dt>
          <dd className="mt-1 font-display text-lg font-semibold tracking-tight">
            {state.ratePercent > 0 ? `${state.ratePercent}%` : "Off"}
          </dd>
          <dd className="mt-0.5 text-xs text-muted-foreground">of every payment received</dd>
        </div>
        <div>
          <dt className="eyebrow">Still to move</dt>
          <dd className="mt-1 font-display text-lg font-semibold tracking-tight">
            {formatCedis(state.pending)}
          </dd>
          <dd className="mt-0.5 text-xs text-muted-foreground">accrued, not transferred</dd>
        </div>
        <div>
          <dt className="eyebrow">Saved in total</dt>
          <dd className="mt-1 font-display text-lg font-semibold tracking-tight">
            {formatCedis(state.accrued)}
          </dd>
          <dd className="mt-0.5 text-xs text-muted-foreground">since the rate was set</dd>
        </div>
      </dl>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Set aside (% of each payment)" htmlFor="savings-rate" required>
            <Input
              id="savings-rate"
              type="number"
              min={0}
              max={50}
              step="0.5"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          Changing this decides what future payments hold back. Entries already in the ledger keep
          the rate they accrued at, so anything you have already transferred goes on matching your
          bank. Set it to 0 to stop accruing without losing the history.
        </p>

        {valid && value > 0 && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            A {formatCedis(2000)} payment would put{" "}
            <span className="font-semibold">{formatCedis(2000 * (value / 100))}</span> aside.
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
