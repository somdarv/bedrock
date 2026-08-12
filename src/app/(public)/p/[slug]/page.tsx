import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PortalPayButton } from "@/components/portal/portal-pay-button";
import { PortalPreviews } from "@/components/portal/portal-previews";
import { api, ApiError, balance, effectiveTotal } from "@/lib/api";
import { gatesApply, paidTotal } from "@/lib/payments";
import { statusMeta } from "@/lib/status";
import { formatCedis } from "@/lib/utils";

export const metadata = { title: "Your project" };

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * The portal slug is a UUID. Tolerate a junk prefix on the incoming path — e.g. a WhatsApp
 * button that renders "/p/{{1}}<uuid>" from a mis-authored dynamic-URL template — by pulling
 * the embedded UUID out. A clean slug passes straight through.
 */
function extractSlug(raw: string): string {
  const match = raw.match(UUID_RE);
  return match ? match[0] : raw;
}

export default async function ClientPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = extractSlug(rawSlug);

  const pkg = await api.packages.getBySlug(slug).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const meta = statusMeta(pkg.status);
  const total = effectiveTotal(pkg);
  // Money that arrived on an invoice raised for this project counts here too, or a client who
  // has settled in full would be shown a bill they already paid.
  const paid = paidTotal(pkg);
  const due = Math.max(0, balance(pkg));
  // Deferred billing: nothing is withheld, and the balance is chased on its own invoice.
  const deferred = !gatesApply(pkg);
  const isFixed = pkg.pricingMode === "fixed";
  const settled = due <= 0;
  const milestones = [...pkg.milestones].sort((a, b) => a.position - b.position);
  // With a schedule in place the client pays the next step, not the whole outstanding sum.
  const nextDue = milestones.find((m) => m.status === "pending") ?? null;
  const nextDueId = nextDue?.id ?? null;
  const payable = nextDue ? nextDue.amount : due;
  const infraCharges = pkg.portalInfraCharges ?? [];
  const infraTotal = infraCharges.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <header>
        <div className="eyebrow">Project</div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
          {pkg.title}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {pkg.estimatedDeliveryDate && (
            <span className="text-sm text-muted-foreground">
              Estimated delivery {new Date(pkg.estimatedDeliveryDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </header>

      {/* Payment status — the money, front and centre */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="eyebrow">Total</div>
            <div className="mt-2 font-display text-xl font-semibold tracking-tight">
              {formatCedis(total)}
            </div>
          </div>
          <div>
            <div className="eyebrow">Paid</div>
            <div className="mt-2 font-display text-xl font-semibold tracking-tight text-success">
              {formatCedis(paid)}
            </div>
          </div>
          <div>
            <div className="eyebrow">Balance</div>
            <div
              className={`mt-2 font-display text-xl font-semibold tracking-tight ${settled ? "text-success" : "text-warning"}`}
            >
              {formatCedis(due)}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          {settled ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Paid in full — thank you. Your files are unlocked below.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {nextDue
                    ? `${formatCedis(nextDue.amount)} due now for ${nextDue.label}.`
                    : deferred
                      ? // Nothing is being held back, so do not imply otherwise.
                        pkg.invoicedOutstanding > 0
                        ? `${formatCedis(pkg.invoicedOutstanding)} invoiced on this project.`
                        : `${formatCedis(due)} outstanding on this project.`
                      : `${formatCedis(due)} due to ${pkg.status === "draft" || pkg.status === "sent" ? "start work" : "unlock your files"}.`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pay by card, MTN MoMo, Telecel Cash, AirtelTigo Money or bank transfer.
                </p>
              </div>
              <PortalPayButton
                slug={slug}
                milestoneId={nextDueId}
                label={`Pay ${formatCedis(payable)}`}
              />
            </div>
          )}
        </div>

        {/* Downloadable documents */}
        <div className="mt-5 flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
          <a
            href={`/p/${slug}/invoice`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M9 15l3 3 3-3" />
            </svg>
            Invoice (PDF)
          </a>
          {paid > 0 && (
            <a
              href={`/p/${slug}/receipt`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M9 15l3 3 3-3" />
              </svg>
              Receipt (PDF)
            </a>
          )}
        </div>
      </section>

      {/* Payment schedule — the client's staged milestones (paid vs due) */}
      {milestones.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight">Payment schedule</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {pkg.deliveryMode === "milestones"
              ? "Your payments are staged. Each stage moves the project to its next phase."
              : "How your payments are split."}
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
            <ul className="divide-y divide-border">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="text-sm font-medium">{m.label}</span>
                    {m.id === nextDueId && (
                      <span className="text-[11px] font-medium uppercase tracking-wider text-warning">
                        Due next
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium tabular-nums">{formatCedis(m.amount)}</span>
                    <Badge variant={m.status === "paid" ? "success" : "warning"}>
                      {m.status === "paid" ? "Paid" : "Due"}
                    </Badge>
                    {m.id === nextDueId && (
                      <PortalPayButton slug={slug} milestoneId={m.id} label="Pay" variant="quiet" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Scope */}
      <section>
        <h2 className="font-display text-lg font-semibold tracking-tight">What&apos;s included</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
          {pkg.lineItems.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No scope included.</p>
          ) : (
            <ul className="divide-y divide-border">
              {pkg.lineItems.map((li) => (
                <li key={li.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <span className="text-sm">{li.description}</span>
                  {/* Fixed mode shows a lump-sum total only — no per-line prices. */}
                  {!isFixed && (
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatCedis(li.quantity * li.unitPrice)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-3.5">
            <span className="text-sm font-medium">Project total</span>
            <span className="font-display text-base font-semibold tabular-nums">{formatCedis(total)}</span>
          </div>
        </div>
      </section>

      {/* Infrastructure fees — the client's outstanding hosting/domain charges */}
      {infraCharges.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight">Infrastructure fees</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hosting, domain and related fees due, separate from the project above.
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
            <ul className="divide-y divide-border">
              {infraCharges.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{c.description}</span>
                    {c.dueDate && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        due {new Date(c.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatCedis(c.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-3.5">
              <span className="text-sm font-medium">Infrastructure total</span>
              <span className="font-display text-base font-semibold tabular-nums">
                {formatCedis(infraTotal)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Deliverables — watermarked previews; originals unlock at zero balance */}
      {pkg.deliverables.length > 0 && (
        <PortalPreviews
          deliverables={pkg.deliverables}
          slug={slug}
          apiBase={apiBase}
          settled={settled}
        />
      )}
    </div>
  );
}
