import Link from "next/link";
import { api, balance, effectiveTotal, type WorkPackage } from "@/lib/api";
import { statusMeta } from "@/lib/status";
import { formatCedis } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

const ATTENTION_STATUSES: WorkPackage["status"][] = [
  "sent",
  "awaiting_deposit",
  "awaiting_final_payment",
];
const ACTIVE_STATUSES: WorkPackage["status"][] = [
  "sent",
  "awaiting_deposit",
  "in_progress",
  "review",
  "awaiting_final_payment",
];

export default async function AdminDashboard() {
  const [packages, clients] = await Promise.all([api.packages.list(), api.clients.list()]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  const active = packages.filter((p) => ACTIVE_STATUSES.includes(p.status));
  const outstanding = active.reduce((sum, p) => sum + Math.max(0, balance(p)), 0);
  const awaitingPayment = packages.filter((p) => ATTENTION_STATUSES.includes(p.status));
  const attention = [...awaitingPayment].sort((a, b) => balance(b) - balance(a));

  const stats = [
    { label: "Outstanding", value: formatCedis(outstanding), hint: "across live jobs" },
    { label: "Active packages", value: String(active.length), hint: "in flight" },
    { label: "Awaiting payment", value: String(awaitingPayment.length), hint: "gated on money" },
    { label: "Clients", value: String(clients.length), hint: "on the books" },
  ];

  const recent = [...packages]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      {/* Header */}
      <header>
        <div className="eyebrow">Overview</div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
          Where the money and work stand
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Every job lives in one record. Nothing of value reaches a client until the gate for that
          stage is paid.
        </p>
      </header>

      {/* Stat strip — echoes the marketing site's stats block */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col justify-between bg-surface px-5 py-6 md:px-6 md:py-7">
            <div className="eyebrow">{s.label}</div>
            <div className="mt-6 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
              {s.value}
            </div>
            <div className="mt-1.5 text-xs text-subtle">{s.hint}</div>
          </div>
        ))}
      </section>

      {/* Needs attention */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Needs attention</div>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
              Waiting on payment
            </h2>
          </div>
          <Link
            href="/admin/packages"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            All packages
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-surface">
          {attention.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-muted-foreground">
              Nothing is waiting on a payment right now.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {attention.map((p) => {
                const meta = statusMeta(p.status);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/admin/packages/${p.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50 md:px-6"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.title}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {clientName.get(p.clientId) ?? "Unknown client"}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <div className="text-right">
                          <div className="font-display text-sm font-semibold tracking-tight">
                            {formatCedis(Math.max(0, balance(p)))}
                          </div>
                          <div className="text-[11px] text-subtle">balance</div>
                        </div>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Recent packages */}
      <section>
        <div className="eyebrow">Recent</div>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">Latest packages</h2>

        <div className="mt-5">
          {recent.length === 0 ? (
            <EmptyState
              title="No packages yet"
              description="Create a client, then build their first work package to see it here."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <ul className="divide-y divide-border">
                {recent.map((p) => {
                  const meta = statusMeta(p.status);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/admin/packages/${p.id}`}
                        className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50 md:px-6"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.title}</div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {clientName.get(p.clientId) ?? "Unknown client"}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          <div className="hidden font-display text-sm font-semibold tracking-tight text-muted-foreground sm:block">
                            {formatCedis(effectiveTotal(p))}
                          </div>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
