import Link from "next/link";
import { api, effectiveTotal, unbilled, type WorkPackage } from "@/lib/api";
import { statusMeta } from "@/lib/status";
import { invoiceStatusMeta, outstandingCedis } from "@/lib/invoices/display";
import {
  CHASEABLE_STATUSES,
  chargeCedis,
  outstandingTotals,
} from "@/lib/receivables";
import { formatCedis, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { STATUS_VARIANT, expiryLabel } from "@/lib/infrastructure/display";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const ACTIVE_STATUSES: WorkPackage["status"][] = [
  "sent",
  "awaiting_deposit",
  "in_progress",
  "review",
  "awaiting_final_payment",
];

/** How many rows the chase list shows before deferring to Receivables. */
const CHASE_LIMIT = 8;

export default async function AdminDashboard() {
  const [packages, clients, infra, charges, invoices, fx] = await Promise.all([
    api.packages.list(),
    api.clients.list(),
    api.infrastructure.overview().catch(() => ({ attention: [], all: [] })),
    api.infrastructure.chargesOutstanding().catch(() => ({ total: 0, items: [] })),
    api.invoices.outstanding().catch(() => ({ total: 0, items: [] })),
    api.invoices.fx().catch(() => null),
  ]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const rate = fx?.effectiveRate ?? null;

  // One outstanding figure, struck across all three routes money reaches us by. Same function
  // Receivables reads, so the two pages cannot drift apart.
  const owed = outstandingTotals({
    packages,
    charges: charges.items,
    invoices: invoices.items,
    fxRate: rate,
  });

  const active = packages.filter((p) => ACTIVE_STATUSES.includes(p.status));

  // What can be chased today, in one list: jobs gated on a payment, invoices already issued and
  // unpaid, and account fees still to be billed. Sorted by size, because that is the order an
  // operator works through them in.
  const chase: ChaseRow[] = [
    ...packages
      .filter((p) => CHASEABLE_STATUSES.includes(p.status) && unbilled(p) > 0)
      .map((p): ChaseRow => {
        const meta = statusMeta(p.status);
        return {
          key: `pkg_${p.id}`,
          href: `/admin/packages/${p.id}`,
          title: p.title,
          subtitle: clientName.get(p.clientId) ?? "Unknown client",
          amount: unbilled(p),
          display: formatCedis(unbilled(p)),
          caption: "balance",
          badge: meta.label,
          variant: meta.variant,
        };
      }),
    ...invoices.items.map((invoice): ChaseRow => {
      const meta = invoiceStatusMeta(invoice);
      const cedis = outstandingCedis(invoice);
      return {
        key: `inv_${invoice.id}`,
        href: `/admin/invoices/${invoice.id}`,
        title: invoice.title,
        subtitle: [
          invoice.clientName ?? "Unknown client",
          invoice.reference,
          invoice.dueDate ? `due ${new Date(invoice.dueDate).toLocaleDateString()}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        amount: cedis,
        display: formatMoney(Math.max(0, invoice.balance), invoice.currency),
        // A dollar invoice shows what it is billed in and what it costs in cedis — the figure
        // that leaves the client's account either way.
        caption: invoice.currency === "USD" ? `${formatCedis(cedis)} owed` : "owed",
        badge: meta.label,
        variant: meta.variant,
      };
    }),
    ...charges.items.map((charge): ChaseRow => {
      const cedis = chargeCedis(charge, rate);
      const overdue = charge.dueDate ? new Date(charge.dueDate) < startOfToday() : false;
      return {
        key: `chg_${charge.id}`,
        href: `/admin/clients/${charge.clientId}`,
        title: charge.description,
        subtitle: [
          charge.clientName ?? "Unknown client",
          charge.dueDate ? `due ${new Date(charge.dueDate).toLocaleDateString()}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        amount: cedis ?? 0,
        display: formatMoney(charge.amount, charge.currency ?? "GHS"),
        caption:
          charge.currency === "USD"
            ? cedis === null
              ? "no rate set"
              : `${formatCedis(cedis)} to bill`
            : "to bill",
        badge: overdue ? "Overdue fee" : "Not yet billed",
        variant: overdue ? "danger" : "default",
      };
    }),
  ].sort((a, b) => b.amount - a.amount);

  const stats = [
    {
      label: "Outstanding",
      value: formatCedis(owed.total),
      sub: `${formatCedis(owed.jobs)} jobs · ${formatCedis(owed.invoices)} invoices · ${formatCedis(owed.accounts)} accounts`,
      hint: "everything owed, one figure",
      href: "/admin/receivables",
    },
    {
      label: "Active packages",
      value: String(active.length),
      sub: null,
      hint: "in flight",
      href: "/admin/packages",
    },
    {
      label: "To chase",
      value: String(chase.length),
      sub: null,
      hint: "jobs, invoices & fees",
      href: "/admin/receivables",
    },
    {
      label: "Clients",
      value: String(clients.length),
      sub: null,
      hint: "on the books",
      href: "/admin/clients",
    },
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
          <Link
            key={s.label}
            href={s.href}
            className="flex flex-col justify-between bg-surface px-5 py-6 transition-colors hover:bg-muted/50 md:px-6 md:py-7"
          >
            <div className="eyebrow">{s.label}</div>
            <div className="mt-6 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
              {s.value}
            </div>
            {s.sub && <div className="mt-1.5 text-xs text-muted-foreground">{s.sub}</div>}
            <div className="mt-1.5 text-xs text-subtle">{s.hint}</div>
          </Link>
        ))}
      </section>

      {owed.unconvertedUsd > 0 && (
        <p className="-mt-8 text-xs text-subtle">
          {formatMoney(owed.unconvertedUsd, "USD")} of account fees is billed in dollars and no
          exchange rate is set, so it is not in the figure above.{" "}
          <Link href="/admin/settings" className="underline underline-offset-4">
            Set a rate
          </Link>
          .
        </p>
      )}

      {/* Needs attention — jobs, invoices and account fees in one list */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Needs attention</div>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
              Waiting on payment
            </h2>
          </div>
          <Link
            href="/admin/receivables"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            All receivables
          </Link>
        </div>

        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-subtle">
          Jobs gated on a payment, invoices issued and unpaid, and account fees still to be billed.
          Proposals awaiting a decision are pipeline, not money owed, so they sit in Receivables.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
          {chase.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-muted-foreground">
              Nothing is waiting on a payment right now.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {chase.slice(0, CHASE_LIMIT).map((row) => (
                <li key={row.key}>
                  <Link
                    href={row.href}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50 md:px-6"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{row.title}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {row.subtitle}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <div className="font-display text-sm font-semibold tracking-tight">
                          {row.display}
                        </div>
                        <div className="text-[11px] text-subtle">{row.caption}</div>
                      </div>
                      <Badge variant={row.variant}>{row.badge}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {chase.length > CHASE_LIMIT && (
          <div className="mt-3 text-right">
            <Link
              href="/admin/receivables"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {chase.length - CHASE_LIMIT} more in Receivables
            </Link>
          </div>
        )}
      </section>

      {/* Infrastructure attention */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Infrastructure</div>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
              Domains &amp; hosting to watch
            </h2>
          </div>
          <Link
            href="/admin/infrastructure"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            All infrastructure
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-surface">
          {infra.attention.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-muted-foreground">
              Everything monitored is healthy.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {infra.attention.map((row) => {
                const when = expiryLabel(row);
                return (
                  <li key={row.id}>
                    <Link
                      href="/admin/infrastructure"
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50 md:px-6"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{row.identifier}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {row.clientName ?? "—"}
                          {when ? ` · ${when}` : ""}
                        </div>
                      </div>
                      <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
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

/** A single thing to chase, whatever produced it: a job, an invoice or an account fee. */
interface ChaseRow {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  /** Cedis, for ordering the list — never shown, so mixed currencies still sort honestly. */
  amount: number;
  /** The figure as it should read, in the currency the thing is actually billed in. */
  display: string;
  caption: string;
  badge: string;
  variant: BadgeVariant;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
