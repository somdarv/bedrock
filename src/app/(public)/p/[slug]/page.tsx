import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PortalPayButton } from "@/components/portal/portal-pay-button";
import { FileBrowser } from "@/components/files/file-browser";
import { PlanBoard } from "@/components/plan/plan-board";
import {
  api,
  ApiError,
  balance,
  effectiveTotal,
  itemDiscountTotal,
  lineGross,
  lineNet,
  packageDiscount,
  savings,
  subtotal,
} from "@/lib/api";
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

export default async function ClientPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const { slug: rawSlug } = await params;
  const { folder } = await searchParams;
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
  // Everything taken off the standard price, both levels together. With nothing discounted the
  // scope list stays exactly as plain as it was.
  const saved = savings(pkg);
  // Only the per-line reductions: what decides whether the scope list needs a Discount column.
  // The quote-wide one gets its own row under the list instead.
  const lineDiscounts = itemDiscountTotal(pkg);
  /*
   * What the client owes, wherever it was billed.
   *
   * A zero balance is not proof of payment. A project whose scope has no prices on it computes a
   * total of zero, and an invoice can be raised against it by hand: that money is owed even
   * though the project's own figures do not account for it. Reading "balance zero" as "paid in
   * full" told a client their ₵2,000 invoice was settled.
   */
  const invoiced = Math.max(0, pkg.invoicedOutstanding ?? 0);
  const owed = Math.max(due, invoiced);
  // Total, paid and balance still have to add up on screen when the money sits on an invoice.
  const billed = Math.max(total, paid + owed);
  // Settled means something was owed and none of it is left. Nothing paid is never settled.
  const settled = owed <= 0 && paid > 0;
  // Nothing priced, invoiced or paid: there is no bill to show yet, so show none.
  const unpriced = billed <= 0 && paid <= 0;
  const milestones = [...pkg.milestones].sort((a, b) => a.position - b.position);
  // With a schedule in place the client pays the next step, not the whole outstanding sum.
  const nextDue = milestones.find((m) => m.status === "pending") ?? null;
  const nextDueId = nextDue?.id ?? null;
  const payable = nextDue ? nextDue.amount : due;
  const canPayHere = payable > 0;
  const infraCharges = pkg.portalInfraCharges ?? [];
  const infraTotal = infraCharges.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <header>
        <div className="eyebrow">Project</div>
        <h1 className="font-display tracking-tightest mt-2 text-3xl font-semibold md:text-4xl">
          {pkg.title}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {pkg.estimatedDeliveryDate && (
            <span className="text-muted-foreground text-sm">
              Estimated delivery {new Date(pkg.estimatedDeliveryDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </header>

      {/* Payment status — the money, front and centre */}
      <section className="border-border bg-surface rounded-xl border p-6">
        {!unpriced && (
          // Three figures abreast collide on a phone once the amounts reach four digits, so
          // below `sm` each one takes its own row: label left, figure right.
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
            <div className="flex items-baseline justify-between gap-3 sm:block">
              <div className="eyebrow">Total</div>
              <div className="font-display text-xl font-semibold tracking-tight tabular-nums sm:mt-2">
                {formatCedis(billed)}
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-3 sm:block">
              <div className="eyebrow">Paid</div>
              <div className="font-display text-success text-xl font-semibold tracking-tight tabular-nums sm:mt-2">
                {formatCedis(paid)}
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-3 sm:block">
              <div className="eyebrow">Balance</div>
              <div
                className={`font-display text-xl font-semibold tracking-tight tabular-nums sm:mt-2 ${settled ? "text-success" : "text-warning"}`}
              >
                {formatCedis(owed)}
              </div>
            </div>
          </div>
        )}

        <div className={unpriced ? "" : "border-border mt-6 border-t pt-5"}>
          {settled ? (
            <p className="text-success flex items-center gap-2 text-sm font-medium">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {deferred
                ? "Paid in full. Thank you."
                : "Paid in full. Thank you. Your files are unlocked below."}
            </p>
          ) : unpriced ? (
            <p className="text-muted-foreground text-sm">
              No amount has been set for this project yet. We will send the invoice when it is
              ready.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-muted-foreground text-sm">
                  {nextDue
                    ? `${formatCedis(nextDue.amount)} due now for ${nextDue.label}.`
                    : !canPayHere
                      ? // The money is on an invoice, which is where it gets paid.
                        `${formatCedis(owed)} invoiced and not yet paid.`
                      : deferred
                        ? // Nothing is being held back, so do not imply otherwise.
                          `${formatCedis(owed)} invoiced on this project.`
                        : `${formatCedis(owed)} due to ${pkg.status === "draft" || pkg.status === "sent" ? "start work" : "unlock your files"}.`}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {canPayHere
                    ? "Pay by card, MTN MoMo, Telecel Cash, AirtelTigo Money or bank transfer."
                    : "Pay it from the invoice we sent you, by card, mobile money or bank transfer."}
                </p>
              </div>
              {canPayHere && (
                <PortalPayButton
                  slug={slug}
                  milestoneId={nextDueId}
                  label={`Pay ${formatCedis(payable)}`}
                />
              )}
            </div>
          )}
        </div>

        {/* Downloadable documents. The project invoice is drawn from the figures above, so it is
            only offered when there are figures: an unpriced project would hand the client a
            ₵0.00 invoice while the real one sits on its own link. */}
        <div className="border-border mt-5 flex flex-wrap gap-4 border-t pt-4 text-sm">
          {total > 0 && (
            <a
              href={`/p/${slug}/invoice`}
              target="_blank"
              rel="noopener"
              className="text-foreground inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M9 15l3 3 3-3" />
              </svg>
              Invoice (PDF)
            </a>
          )}
          {paid > 0 && (
            <a
              href={`/p/${slug}/receipt`}
              target="_blank"
              rel="noopener"
              className="text-foreground inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden
              >
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
          <p className="text-muted-foreground mt-1 text-sm">
            {pkg.deliveryMode === "milestones"
              ? "Your payments are staged. Each stage moves the project to its next phase."
              : "How your payments are split."}
          </p>
          <div className="border-border bg-surface mt-3 overflow-hidden rounded-xl border">
            <ul className="divide-border divide-y">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="text-sm font-medium">{m.label}</span>
                    {m.id === nextDueId && (
                      <span className="text-warning text-[11px] font-medium tracking-wider uppercase">
                        Due next
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium tabular-nums">
                      {formatCedis(m.amount)}
                    </span>
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

      {/* Scope. A project with nothing priced on it has no scope list and no total to show:
          printing "Project total ₵0.00" under an invoice for ₵2,000 reads as a contradiction. */}
      {(pkg.lineItems.length > 0 || total > 0) && (
        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            What&apos;s included
          </h2>
          <div className="border-border bg-surface mt-3 overflow-hidden rounded-xl border">
            {pkg.lineItems.length === 0 ? (
              <p className="text-muted-foreground px-5 py-6 text-sm">No scope included.</p>
            ) : (
              <>
                {/* A heading row only when there is a Discount column to name. Without it a bare
                  "- ₵50.00" beside a price is a figure the reader has to guess at. */}
                {lineDiscounts > 0 && (
                  <div className="border-border bg-muted/40 text-muted-foreground flex items-center justify-between gap-4 border-b px-5 py-2 text-xs font-medium">
                    <span>Item</span>
                    <span className="flex shrink-0 gap-6">
                      <span className="w-24 text-right">Discount</span>
                      <span className="w-24 text-right">Amount</span>
                    </span>
                  </div>
                )}
                <ul className="divide-border divide-y">
                  {pkg.lineItems.map((li) => (
                    <li key={li.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <span className="min-w-0 text-sm">{li.description}</span>
                      {/* Fixed mode shows a lump-sum total only — no per-line prices. */}
                      {!isFixed && (
                        <span className="flex shrink-0 items-baseline gap-6">
                          {/* What came off this line. Empty on an undiscounted row deliberately:
                            a dash in every row would be louder than the discounts. */}
                          {lineDiscounts > 0 && (
                            <span className="text-muted-foreground w-24 text-right text-sm tabular-nums">
                              {lineGross(li) > lineNet(li) && (
                                <>
                                  - {formatCedis(lineGross(li) - lineNet(li))}
                                  {li.discountType === "percent" && (
                                    <span className="ml-1 text-xs">({li.discountValue}%)</span>
                                  )}
                                </>
                              )}
                            </span>
                          )}
                          <span className="w-24 text-right text-sm font-medium tabular-nums">
                            {formatCedis(lineNet(li))}
                          </span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {/* The quote-wide discount gets its own row between the lines and the total, so the
              client can see the full price of the work and the reduction separately. */}
            {saved > 0 && (
              <>
                <div className="border-border flex items-center justify-between border-t px-5 py-3">
                  <span className="text-muted-foreground text-sm">Subtotal</span>
                  <span className="text-sm tabular-nums">{formatCedis(subtotal(pkg))}</span>
                </div>
                {packageDiscount(pkg) > 0 && (
                  <div className="border-border flex items-center justify-between border-t px-5 py-3">
                    <span className="text-muted-foreground text-sm">
                      {pkg.discountLabel?.trim() || "Discount"}
                      {pkg.discountType === "percent" && ` (${pkg.discountValue}%)`}
                    </span>
                    <span className="text-sm tabular-nums">
                      - {formatCedis(packageDiscount(pkg))}
                    </span>
                  </div>
                )}
              </>
            )}
            <div className="border-border bg-muted/40 flex items-center justify-between border-t px-5 py-3.5">
              <span className="text-sm font-medium">Project total</span>
              <span className="font-display text-base font-semibold tabular-nums">
                {formatCedis(total)}
              </span>
            </div>
          </div>
          {saved > 0 && (
            <p className="mt-3 text-sm font-medium">
              Includes {formatCedis(saved)} off our standard price.
            </p>
          )}
        </section>
      )}

      {/* Infrastructure fees — the client's outstanding hosting/domain charges */}
      {infraCharges.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight">Infrastructure fees</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Hosting, domain and related fees due, separate from the project above.
          </p>
          <div className="border-border bg-surface mt-3 overflow-hidden rounded-xl border">
            <ul className="divide-border divide-y">
              {infraCharges.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{c.description}</span>
                    {c.dueDate && (
                      <span className="text-muted-foreground ml-2 text-xs">
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
            <div className="border-border bg-muted/40 flex items-center justify-between border-t px-5 py-3.5">
              <span className="text-sm font-medium">Infrastructure total</span>
              <span className="font-display text-base font-semibold tabular-nums">
                {formatCedis(infraTotal)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* The plan: what we agreed, what is in hand, and what is waiting on them */}
      {pkg.planItems.length > 0 && <PlanBoard mode="client" pkg={pkg} slug={slug} />}

      {/* Files: previews for everyone, originals once the balance allows */}
      {pkg.deliverables.length > 0 && (
        <FileBrowser
          mode="client"
          pkg={pkg}
          slug={slug}
          apiBase={apiBase}
          initialFolderId={folder ?? null}
        />
      )}
    </div>
  );
}
