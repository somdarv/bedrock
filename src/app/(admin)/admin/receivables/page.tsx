import Link from "next/link";
import { api, effectiveTotal, unbilled, type WorkPackage } from "@/lib/api";
import { statusMeta } from "@/lib/status";
import { outstandingCedis } from "@/lib/invoices/display";
import { chargeCedis, outstandingTotals } from "@/lib/receivables";
import { formatCedis, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Money buckets, keyed off the work-package lifecycle. These are read-only views over
// existing data — nothing new is stored. A package's "owed" figure is its derived balance
// (effective total − successful payments); for an awaiting_deposit package with no payments
// yet, that is the full contract value, i.e. the first money we are waiting on.
const DEPOSIT_STATUSES: WorkPackage["status"][] = ["awaiting_deposit"];
const UNDERWAY_STATUSES: WorkPackage["status"][] = ["in_progress", "review"];
const FINAL_STATUSES: WorkPackage["status"][] = ["awaiting_final_payment"];
const PROPOSAL_STATUSES: WorkPackage["status"][] = ["sent"];

// Owed here means owed AS WORK: the balance minus anything already sitting on an issued
// invoice. Deferred billing raises a real invoice against a package, and counting that money
// both as an unpaid job and as an outstanding invoice would inflate every total on this page.
const owed = (p: WorkPackage) => unbilled(p);
const byOwedDesc = (a: WorkPackage, b: WorkPackage) => owed(b) - owed(a);

// Pending initial deposit: the unpaid deposit-kind milestones when a schedule is set,
// otherwise the full contract value not yet in (nothing to split it by yet).
const pendingDeposit = (p: WorkPackage) => {
  const dep = p.milestones.filter((m) => m.kind === "deposit" && m.status !== "paid");
  return dep.length > 0 ? dep.reduce((s, m) => s + m.amount, 0) : owed(p);
};
const hasDepositSchedule = (p: WorkPackage) => p.milestones.some((m) => m.kind === "deposit");

export default async function ReceivablesPage() {
  const [packages, clients, infra, billed, fx] = await Promise.all([
    api.packages.list(),
    api.clients.list(),
    api.infrastructure.chargesOutstanding().catch(() => ({ total: 0, items: [] })),
    // Issued invoices still owed. A charge billed on one drops out of `infra` above and shows
    // up here instead, so the same money is never counted in both.
    api.invoices.outstanding().catch(() => ({ total: 0, items: [] })),
    // Today's billing rate, to restate dollar account fees in cedis.
    api.invoices.fx().catch(() => null),
  ]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const rate = fx?.effectiveRate ?? null;

  // The same roll-up the dashboard's Outstanding figure is struck from, so the two agree.
  const totals = outstandingTotals({
    packages,
    charges: infra.items,
    invoices: billed.items,
    fxRate: rate,
  });

  const awaitingDeposit = packages.filter((p) => DEPOSIT_STATUSES.includes(p.status));
  const underway = packages.filter((p) => UNDERWAY_STATUSES.includes(p.status));
  const awaitingFinal = packages.filter((p) => FINAL_STATUSES.includes(p.status));
  const proposals = packages.filter((p) => PROPOSAL_STATUSES.includes(p.status));

  const depositTotal = awaitingDeposit.reduce((s, p) => s + pendingDeposit(p), 0);
  const underwayTotal = underway.reduce((s, p) => s + owed(p), 0);
  const finalTotal = awaitingFinal.reduce((s, p) => s + owed(p), 0);
  // Proposals sent but not yet accepted — potential, deliberately kept out of every total.
  const proposalTotal = proposals.reduce((s, p) => s + effectiveTotal(p), 0);

  // Invoice balances and account fees re-struck in cedis: the API totals each in whatever it is
  // priced in, so a dollar invoice would otherwise contribute its dollar figure to a cedi sum.
  const billedTotal = totals.invoices;
  const accountsTotal = totals.accounts;

  const stats = [
    { label: "Awaiting deposit", value: formatCedis(depositTotal), hint: "accepted, not started" },
    { label: "Work underway", value: formatCedis(underwayTotal), hint: "in progress + review" },
    { label: "Awaiting final payment", value: formatCedis(finalTotal), hint: "work done, tail unpaid" },
    // Everything owed, across all three routes below. The three tiles to its left are job-stage
    // slices of one of those routes, so this is larger than their sum, not equal to it.
    { label: "Total to come in", value: formatCedis(totals.total), hint: "jobs, fees & invoices" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      {/* Header */}
      <header>
        <div className="eyebrow">Receivables</div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
          Where your money is stuck
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          The money you are owed, grouped by the stage it is stuck at, so you know exactly whose
          account to chase, not just one flat outstanding figure.
        </p>
      </header>

      {/* Committed receivables — the three buckets add up to the total */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
        {stats.map((sstat) => (
          <div key={sstat.label} className="flex flex-col justify-between bg-surface px-5 py-6 md:px-6 md:py-7">
            <div className="eyebrow">{sstat.label}</div>
            <div className="mt-6 font-display text-2xl font-semibold tracking-tightest md:text-3xl">
              {sstat.value}
            </div>
            <div className="mt-1.5 text-xs text-subtle">{sstat.hint}</div>
          </div>
        ))}
      </section>

      {/* Accepted, awaiting deposit — the headline "pending initial deposits" bucket */}
      <ReceivableSection
        eyebrow="Accepted proposals"
        title="Awaiting deposit"
        total={depositTotal}
        note="The initial deposit due on each accepted proposal. Where a payment schedule is set, this is the exact deposit; where none is set yet, it falls back to the full contract value."
        empty="No accepted proposals are waiting on a deposit."
        rows={awaitingDeposit
          .sort((a, b) => pendingDeposit(b) - pendingDeposit(a))
          .map((p) => ({
            id: p.id,
            title: p.title,
            subtitle: clientName.get(p.clientId) ?? "Unknown client",
            amount: pendingDeposit(p),
            context: hasDepositSchedule(p)
              ? `deposit of ${formatCedis(effectiveTotal(p))} total`
              : "full value (no schedule set)",
            status: p.status,
          }))}
      />

      {/* Outstanding on live jobs — work already underway, distinct from deposits */}
      <ReceivableSection
        eyebrow="Live jobs"
        title="Outstanding on work underway"
        total={underwayTotal + finalTotal}
        note="Jobs already in progress with a balance still to clear, and not yet invoiced. This is separate from the deposits above; work that has been billed moves down to Invoices."
        empty="No live jobs have an outstanding balance."
        rows={[...underway, ...awaitingFinal].sort(byOwedDesc).map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: clientName.get(p.clientId) ?? "Unknown client",
          amount: owed(p),
          status: p.status,
        }))}
      />

      {/* Proposals still out — potential, not committed */}
      <ReceivableSection
        eyebrow="Pipeline"
        title="Proposals awaiting acceptance"
        total={proposalTotal}
        tone="muted"
        note="Sent but not yet accepted. Potential, not counted in the totals above."
        empty="No proposals are awaiting a decision."
        rows={proposals.sort((a, b) => effectiveTotal(b) - effectiveTotal(a)).map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: clientName.get(p.clientId) ?? "Unknown client",
          amount: effectiveTotal(p),
          status: p.status,
        }))}
      />

      {/* Infrastructure — its own bucket, separate from project work */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Infrastructure</div>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
              Hosting &amp; domain fees
            </h2>
          </div>
          <div className="text-right">
            <div className="font-display text-xl font-semibold tracking-tight">
              {formatCedis(accountsTotal)}
            </div>
            <div className="text-[11px] text-subtle">
              {infra.items.length} {infra.items.length === 1 ? "charge" : "charges"}
            </div>
          </div>
        </div>

        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-subtle">
          Hosting, domain and other fees, billed separately from project work. Add or clear these on
          each client&apos;s page. Once a charge is billed on an invoice it moves to the Invoices
          section below.
          {totals.unconvertedUsd > 0 && (
            <>
              {" "}
              {formatMoney(totals.unconvertedUsd, "USD")} of these is billed in dollars with no
              exchange rate set, so it is not in the cedi total.{" "}
              <Link href="/admin/settings" className="underline underline-offset-4">
                Set a rate
              </Link>
              .
            </>
          )}
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
          {infra.items.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No infrastructure charges outstanding.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {infra.items.map((c) => {
                // Hosting and domains are bought in dollars, so a fee shows in the currency it
                // is actually incurred in, with its cedi cost at today's billing rate underneath.
                const cedis = chargeCedis(c, rate);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/admin/clients/${c.clientId}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50 md:px-6"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{c.description}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {c.clientName ?? "Unknown client"}
                          {c.dueDate ? ` · due ${new Date(c.dueDate).toLocaleDateString()}` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-display text-sm font-semibold tracking-tight">
                          {formatMoney(c.amount, c.currency ?? "GHS")}
                        </div>
                        <div className="text-[11px] text-subtle">
                          {c.currency === "USD"
                            ? cedis === null
                              ? "no rate set"
                              : `${formatCedis(cedis)} owed`
                            : "owed"}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Standalone invoices — billing raised outside the work-package flow. */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Invoices</div>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
              Issued &amp; unpaid
            </h2>
          </div>
          <div className="text-right">
            <div className="font-display text-xl font-semibold tracking-tight">
              {formatCedis(billedTotal)}
            </div>
            <div className="text-[11px] text-subtle">
              {billed.items.length} {billed.items.length === 1 ? "invoice" : "invoices"}
            </div>
          </div>
        </div>

        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-subtle">
          Invoices raised directly against a client, outside the work-package flow. The client can
          pay these online from the invoice itself.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
          {billed.items.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No invoices outstanding.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {billed.items.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/admin/invoices/${invoice.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50 md:px-6"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{invoice.title}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {invoice.clientName ?? "Unknown client"}
                        {invoice.reference ? ` · ${invoice.reference}` : ""}
                        {invoice.dueDate
                          ? ` · due ${new Date(invoice.dueDate).toLocaleDateString()}`
                          : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display text-sm font-semibold tracking-tight">
                        {formatMoney(Math.max(0, invoice.balance), invoice.currency)}
                      </div>
                      <div className="text-[11px] text-subtle">
                        {invoice.currency === "USD"
                          ? `${formatCedis(outstandingCedis(invoice))} owed`
                          : "owed"}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- fragments */

type Row = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  /** Small caption under the amount (e.g. "deposit of GHS 10,000.00 total"). */
  context?: string;
  status: WorkPackage["status"];
};

function ReceivableSection({
  eyebrow,
  title,
  total,
  note,
  empty,
  rows,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  total: number;
  note: string;
  empty: string;
  rows: Row[];
  tone?: "default" | "muted";
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">{title}</h2>
        </div>
        <div className="text-right">
          <div
            className={
              tone === "muted"
                ? "font-display text-xl font-semibold tracking-tight text-muted-foreground"
                : "font-display text-xl font-semibold tracking-tight"
            }
          >
            {formatCedis(total)}
          </div>
          <div className="text-[11px] text-subtle">{rows.length} {rows.length === 1 ? "job" : "jobs"}</div>
        </div>
      </div>

      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-subtle">{note}</p>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">{empty}</div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const meta = statusMeta(row.status);
              return (
                <li key={row.id}>
                  <Link
                    href={`/admin/packages/${row.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50 md:px-6"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{row.title}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{row.subtitle}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <div className="font-display text-sm font-semibold tracking-tight">
                          {formatCedis(row.amount)}
                        </div>
                        <div className="text-[11px] text-subtle">
                          {row.context ?? (tone === "muted" ? "value" : "owed")}
                        </div>
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
  );
}
