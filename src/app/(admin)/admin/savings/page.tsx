import Link from "next/link";
import { SavingsLedger } from "@/components/admin/savings-ledger";
import { api, type SavingsState } from "@/lib/api";
import { formatCedis } from "@/lib/utils";

/**
 * The savings pot: a fixed slice of every payment received, held back from operating money.
 *
 * Accrual is automatic on the API side the moment a payment succeeds, so this page never has to
 * be visited for the rule to apply. What it shows is the one thing the system cannot know for
 * itself — whether the cedis actually left the operating account — and the gap that opens up
 * when they have not.
 */
export default async function SavingsPage() {
  const savings = await api.savings.get().catch(
    (): SavingsState => ({
      ratePercent: 0,
      accrued: 0,
      moved: 0,
      pending: 0,
      receivedTotal: 0,
      entries: [],
    }),
  );

  const stats = [
    {
      label: "Still to move",
      value: formatCedis(savings.pending),
      hint: "accrued, not yet transferred",
    },
    { label: "Already moved", value: formatCedis(savings.moved), hint: "in the savings account" },
    { label: "Saved in total", value: formatCedis(savings.accrued), hint: "since the rate was set" },
    {
      label: "Rate",
      value: savings.ratePercent > 0 ? `${savings.ratePercent}%` : "Off",
      hint:
        savings.ratePercent > 0
          ? `of ${formatCedis(savings.receivedTotal)} received`
          : "nothing is accruing",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <header>
        <div className="eyebrow">Savings</div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
          What you owe yourself
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          A slice of every payment received, set aside the moment the money lands. The app can
          accrue it; only you can move it, so the figure that matters is what is still sitting in
          the operating account.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col justify-between bg-surface px-5 py-6 md:px-6 md:py-7"
          >
            <div className="eyebrow">{s.label}</div>
            <div className="mt-6 font-display text-2xl font-semibold tracking-tightest md:text-3xl">
              {s.value}
            </div>
            <div className="mt-1.5 text-xs text-subtle">{s.hint}</div>
          </div>
        ))}
      </section>

      {savings.ratePercent <= 0 && (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
          No rate is set, so nothing is being held back. Choose one in{" "}
          <Link href="/admin/settings" className="font-medium text-foreground underline">
            Settings
          </Link>{" "}
          and every payment after that accrues automatically.
        </p>
      )}

      <SavingsLedger state={savings} />
    </div>
  );
}
