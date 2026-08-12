import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api, type Invoice } from "@/lib/api";
import { formatCedis, formatMoney } from "@/lib/utils";
import { cedisFor, invoiceStatusMeta, outstandingCedis } from "@/lib/invoices/display";

export const metadata = { title: "Invoices" };

/**
 * Standalone invoices — billing raised directly against a client, outside the work-package flow.
 * Infrastructure renewals are what this exists for: they recur per asset, on their own calendar,
 * and never belong to a project.
 */
export default async function InvoicesPage() {
  const invoices = await api.invoices.list().catch(() => [] as Invoice[]);

  const issued = invoices.filter((i) => i.status === "issued");
  const settled = invoices.filter((i) => i.status === "paid");
  const drafts = invoices.filter((i) => i.status === "draft").length;

  // Struck in cedis, because the list mixes dollar and cedi invoices and there is no other
  // common denominator. The dollar side is stated underneath rather than folded away: it is the
  // binding amount on those invoices, and the cedi figure only tracks it at the locked rate.
  const outstanding = issued.reduce((s, i) => s + outstandingCedis(i), 0);
  const outstandingUsd = issued
    .filter((i) => i.currency === "USD")
    .reduce((s, i) => s + Math.max(0, i.balance), 0);
  // Collected is the cedis that actually arrived, never the dollars they settled — this is the
  // figure that should reconcile against the bank.
  const collected = settled.reduce((s, i) => s + i.receivedGhs, 0);
  const collectedUsd = settled
    .filter((i) => i.currency === "USD")
    .reduce((s, i) => s + i.paid, 0);

  const stats = [
    {
      label: "Outstanding",
      value: formatCedis(outstanding),
      sub: outstandingUsd > 0 ? `${formatMoney(outstandingUsd, "USD")} of it billed in dollars` : null,
      hint: "issued, not yet settled",
    },
    {
      label: "Collected",
      value: formatCedis(collected),
      sub: collectedUsd > 0 ? `${formatMoney(collectedUsd, "USD")} settled` : null,
      hint: "settled in full",
    },
    { label: "Drafts", value: String(drafts), sub: null, hint: "not yet issued" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Billing</div>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tightest">Invoices</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Bill a client directly for infrastructure renewals, retainers, or anything that does not run
            through a work package. Issue it to mint its verifiable reference, send it, and the
            receipt is minted the moment it is settled.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/invoices/new">New invoice</Link>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface p-5">
            <div className="eyebrow">{stat.label}</div>
            <div className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {stat.value}
            </div>
            {stat.sub && <div className="mt-1 text-xs text-muted-foreground">{stat.sub}</div>}
            <div className="mt-1 text-xs text-subtle">{stat.hint}</div>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Raise one to bill a client for hosting, a domain renewal, or anything outside a work package."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Reference</TH>
              <TH>Client</TH>
              <TH>Invoice</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Balance</TH>
              <TH>Due</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {invoices.map((invoice) => {
              const meta = invoiceStatusMeta(invoice);
              const owed = Math.max(0, invoice.balance);
              // The cedi line under a dollar total: what actually came in once it is settled,
              // what the whole invoice comes to at the locked rate while it has not.
              const billedGhs = cedisFor(invoice, invoice.total);
              const totalGhs =
                invoice.currency !== "USD"
                  ? null
                  : owed <= 0 && invoice.receivedGhs > 0
                    ? `${formatCedis(invoice.receivedGhs)} received`
                    : billedGhs !== null
                      ? formatCedis(billedGhs)
                      : null;
              return (
                <TR key={invoice.id}>
                  <TD className="font-medium">
                    <Link href={`/admin/invoices/${invoice.id}`} className="hover:underline">
                      {invoice.reference ?? "Draft"}
                    </Link>
                  </TD>
                  <TD className="text-muted-foreground">{invoice.clientName ?? "—"}</TD>
                  <TD>{invoice.title}</TD>
                  <TD className="text-right">
                    {formatMoney(invoice.total, invoice.currency)}
                    {totalGhs && (
                      <div className="text-xs font-normal text-muted-foreground">{totalGhs}</div>
                    )}
                  </TD>
                  <TD className="text-right">
                    {owed > 0 ? (
                      <>
                        {formatMoney(owed, invoice.currency)}
                        {invoice.currency === "USD" && (
                          <div className="text-xs font-normal text-muted-foreground">
                            {formatCedis(outstandingCedis(invoice))}
                          </div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD className="text-muted-foreground">
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}
                  </TD>
                  <TD>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
