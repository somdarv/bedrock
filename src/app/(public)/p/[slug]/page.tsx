import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { api, ApiError, balance, effectiveTotal } from "@/lib/api";
import { statusMeta } from "@/lib/status";
import { formatCedis } from "@/lib/utils";

export const metadata = { title: "Your project" };

export default async function ClientPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const pkg = await api.packages.getBySlug(slug).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const meta = statusMeta(pkg.status);
  const total = effectiveTotal(pkg);
  const paid = pkg.payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0);
  const due = Math.max(0, balance(pkg));
  const isFixed = pkg.pricingMode === "fixed";
  const settled = due <= 0;

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
              <p className="text-sm text-muted-foreground">
                {formatCedis(due)} due to {pkg.status === "draft" || pkg.status === "sent" ? "start work" : "unlock your files"}.
              </p>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Pay {formatCedis(due)}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Scope */}
      <section>
        <h2 className="font-display text-lg font-semibold tracking-tight">What&apos;s included</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
          {pkg.lineItems.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Scope will appear here.</p>
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

      {/* Deliverables — watermarked previews; originals unlock at zero balance */}
      {pkg.deliverables.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold tracking-tight">Preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {settled
              ? "Your final files are ready to download."
              : "Watermarked previews. Clean originals unlock once the balance is cleared."}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pkg.deliverables.map((d) => (
              <div key={d.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                <div className="relative flex h-44 items-center justify-center bg-muted">
                  {d.previewUrl ? (
                    <Image src={d.previewUrl} alt={d.filename} fill unoptimized className="object-cover" />
                  ) : (
                    <span className="text-sm text-muted-foreground">Preparing…</span>
                  )}
                  {d.locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/40 text-white backdrop-blur-[1px]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden>
                        <rect x="4" y="11" width="16" height="9" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                      <span className="text-[11px] font-medium uppercase tracking-wider">Locked</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <span className="truncate text-sm font-medium">{d.filename}</span>
                  {d.archived ? (
                    <span className="shrink-0 text-xs text-muted-foreground">Archived</span>
                  ) : d.locked ? (
                    <span className="shrink-0 text-xs text-muted-foreground">Unlocks at GHS 0</span>
                  ) : (
                    <a
                      href={`${apiBase}/api/p/${slug}/deliverables/${d.id}/download`}
                      className="shrink-0 rounded-md border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
