import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/quote/print-button";
import { decodeConfig, itemStatus } from "@/lib/school-mis/config";
import { CATALOGUE, itemsInModule } from "@/lib/school-mis/catalogue";
import { MODULE_BY_ID } from "@/lib/school-mis/modules";
import {
  MODULE_PRICES,
  PACKAGES,
  PRICING,
  careBandFor,
  paymentPlan,
  priceConfiguration,
} from "@/lib/school-mis/pricing";
import { getProspect } from "@/lib/school-mis/prospects";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prospect = getProspect(slug);
  return {
    title: prospect ? `Configured Quote · ${prospect.school}` : "Configured Quote",
    robots: { index: false, follow: false },
  };
}

const cedis = (n: number) => `₵${Math.round(n).toLocaleString("en-GH")}`;
const cedisExact = (n: number) =>
  `₵${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">{children}</p>
  );
}

function Line({
  label,
  detail,
  value,
  muted,
}: {
  label: string;
  detail?: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between gap-6 border-b border-gray-100 py-2.5 last:border-b-0">
      <div className="min-w-0">
        <p className={`text-sm ${muted ? "text-gray-500" : "font-medium text-gray-800"}`}>{label}</p>
        {detail && <p className="mt-0.5 text-xs leading-5 text-gray-500">{detail}</p>}
      </div>
      <p
        className={`shrink-0 text-sm tabular-nums ${
          muted ? "text-gray-500" : "font-semibold text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function ConfiguredQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { slug } = await params;
  const { c } = await searchParams;
  const prospect = getProspect(slug);
  if (!prospect) notFound();

  const config = c ? decodeConfig(c, prospect.preset) : prospect.preset;
  const quote = priceConfiguration(config);
  const pkg = PACKAGES.find((p) => p.id === config.tier)!;
  const plan = paymentPlan(config.plan);
  const band = careBandFor(config.enrolment);
  const complete = config.tier === "complete";
  const code = c ?? "";

  const issued = new Date();
  const validUntil = new Date(issued.getTime() + PRICING.validityDays * 86400000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const includedCount = CATALOGUE.flatMap((cat) => cat.groups.flatMap((g) => g.items)).filter(
    (i) => itemStatus(i, config) === "included",
  ).length;

  const addedModules = complete ? [] : config.added;
  const deferred = complete ? [] : config.phase2;

  return (
    <div className="doc-page">
      {/* Controls — never printed */}
      <div className="no-print mx-auto mb-4 flex max-w-[8.27in] flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <div>
          <div className="eyebrow">Configured quote</div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Built from the selection on the configurator. Change anything and this page follows.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/q/${prospect.slug}${code ? `?c=${code}` : ""}`}
            className="inline-flex h-10 items-center rounded-md border border-input bg-surface px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Back to the configurator
          </Link>
          <PrintButton filename={`${prospect.refStem}-school-mis-quote`} />
        </div>
      </div>

      <div className="doc-sheet">
        {/* Letterhead */}
        <div className="mb-8 flex items-start justify-between gap-6 rounded-lg bg-gray-100 p-6">
          <div>
            <h1 className="mb-4 text-3xl font-semibold leading-none text-black">
              Saharabase Technologies
            </h1>
            <p className="text-sm text-gray-600">17 Alhaji Sulley Road,</p>
            <p className="text-sm text-gray-600">Abelemkpe, Accra</p>
            <p className="mt-1 text-sm text-gray-600">
              059 212 3054&nbsp;&nbsp;·&nbsp;&nbsp;050 988 6584
            </p>
            <p className="mt-1 text-sm text-gray-600">www.saharabasetech.com</p>
          </div>
          <div className="w-64 text-right">
            <h2 className="mb-2 whitespace-nowrap text-xl font-semibold text-gray-800">
              Configured Quote
            </h2>
            <p className="text-sm text-gray-600">Ref: QUO-{prospect.refStem}-DRAFT</p>
            <p className="text-sm text-gray-600">Issue Date: {fmt(issued)}</p>
            <p className="text-sm text-gray-600">Valid Until: {fmt(validUntil)}</p>
          </div>
        </div>

        {/* Prepared for */}
        <div className="mb-8">
          <Eyebrow>Prepared For</Eyebrow>
          <p className="mt-2 text-lg font-semibold text-gray-900">{prospect.school}</p>
          <p className="text-base text-gray-600">
            {prospect.descriptor} · {prospect.town}
          </p>
        </div>

        {/* Headline */}
        <div className="mb-8 rounded-lg border border-gray-200 p-6">
          <Eyebrow>The Configuration</Eyebrow>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-2xl font-semibold leading-tight text-gray-900">
                {pkg.name} foundation
                {addedModules.length > 0 &&
                  ` with ${addedModules.length} module${addedModules.length === 1 ? "" : "s"}`}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {includedCount} features included · {config.enrolment.toLocaleString()} pupils ·{" "}
                {band.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold tabular-nums text-gray-900">
                {cedis(quote.oneTimeTotal)}
              </p>
              <p className="text-sm text-gray-600">
                {quote.instalments > 1
                  ? `${quote.instalments} payments of ${cedis(quote.instalmentAmount)}`
                  : "one payment"}
              </p>
            </div>
          </div>
        </div>

        {/* One-time build */}
        <div className="mb-8">
          <Eyebrow>One-Time Build</Eyebrow>
          <div className="mt-3">
            <Line
              label={`${pkg.name} foundation`}
              detail={pkg.includes}
              value={cedis(quote.basePrice)}
            />
            {addedModules.map((id) => (
              <Line
                key={id}
                label={MODULE_BY_ID[id].name}
                detail={`${itemsInModule(id).length} features · ${MODULE_BY_ID[id].tagline}`}
                value={cedis(MODULE_PRICES[id])}
              />
            ))}
            {quote.bundleDiscountAmount > 0 && (
              <Line
                label={`Bundle discount, ${Math.round(quote.bundleDiscountRate * 100)}%`}
                detail="The shared work underneath the modules is only paid for once."
                value={`-${cedis(quote.bundleDiscountAmount)}`}
                muted
              />
            )}
            {quote.planAdjustmentAmount !== 0 && (
              <Line
                label={plan.name}
                detail={plan.blurb}
                value={`${quote.planAdjustmentAmount > 0 ? "+" : "-"}${cedis(Math.abs(quote.planAdjustmentAmount))}`}
                muted
              />
            )}
          </div>
          <div className="mt-3 flex justify-between gap-6 border-t-2 border-gray-800 pt-3">
            <p className="text-base font-semibold text-gray-900">Total, one time</p>
            <p className="text-base font-semibold tabular-nums text-gray-900">
              {cedis(quote.oneTimeTotal)}
            </p>
          </div>
          {quote.instalments > 1 && (
            <p className="mt-2 text-sm text-gray-600">
              Payable as {quote.instalments} payments of {cedis(quote.instalmentAmount)}.{" "}
              {config.plan === "termly"
                ? "One at the start of each term, matched to when fees come in."
                : "A deposit begins the work; the balance falls due on handover."}
            </p>
          )}
        </div>

        {/* Recurring */}
        <div className="mb-8 avoid-break">
          <Eyebrow>Annual Care</Eyebrow>
          <div className="mt-3">
            <Line
              label={`Care plan, ${band.label.toLowerCase()}`}
              detail="Hosting, encrypted backups, updates, support, and the statutory changes that arrive each year."
              value={cedis(quote.careBase)}
            />
            {quote.careSurcharge > 0 && (
              <Line
                label="Module running costs"
                detail="Only the modules that genuinely cost something to keep running carry a surcharge."
                value={cedis(quote.careSurcharge)}
              />
            )}
          </div>
          <div className="mt-3 flex justify-between gap-6 border-t border-gray-300 pt-3">
            <p className="text-sm font-semibold text-gray-900">Per year</p>
            <p className="text-sm font-semibold tabular-nums text-gray-900">
              {cedis(quote.careAnnual)}
            </p>
          </div>
        </div>

        {/* Pass-through */}
        <div className="mb-8 avoid-break">
          <Eyebrow>Metered Costs, Estimated</Eyebrow>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            These are not ours to fix. They are charged per message or per transaction by the
            networks and by Meta, and passed to you at cost plus a handling margin. The figures
            below are an estimate at {config.enrolment.toLocaleString()} pupils, not a fee. Current
            per-unit rates are in the annexe so they can be updated without reissuing this quote.
          </p>
          <div className="mt-3">
            {quote.passThroughMonthly.map((p) => (
              <Line key={p.label} label={p.label} detail={p.detail} value={cedisExact(p.amount)} />
            ))}
          </div>
          <div className="mt-3 flex justify-between gap-6 border-t border-gray-300 pt-3">
            <p className="text-sm font-semibold text-gray-900">Estimated per month</p>
            <p className="text-sm font-semibold tabular-nums text-gray-900">
              {cedisExact(quote.passThroughMonthlyTotal)}
            </p>
          </div>
        </div>

        {/* Phase 2 */}
        {deferred.length > 0 && (
          <div className="mb-8 avoid-break">
            <Eyebrow>Held For Phase 2</Eyebrow>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Not in the price above. Priced here at today&rsquo;s rates and held for the validity
              of this quote, so nothing has to be decided now.
            </p>
            <div className="mt-3">
              {deferred.map((id) => (
                <Line
                  key={id}
                  label={MODULE_BY_ID[id].name}
                  detail={MODULE_BY_ID[id].tagline}
                  value={cedis(MODULE_PRICES[id])}
                  muted
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between gap-6 border-t border-gray-300 pt-3">
              <p className="text-sm font-semibold text-gray-900">If taken later, in full</p>
              <p className="text-sm font-semibold tabular-nums text-gray-900">
                {cedis(quote.phase2Total)}
              </p>
            </div>
          </div>
        )}

        {/* How the price was arrived at */}
        <div className="mb-8 avoid-break rounded-lg bg-gray-50 p-5">
          <Eyebrow>How This Price Was Arrived At</Eyebrow>
          <p className="mt-2.5 text-sm leading-6 text-gray-700">
            No single feature carries a price. Each of the {includedCount} features included here
            is scored for build complexity, and a module is priced from the complexity of what sits
            inside it. That is why a module costs what it costs, and why removing one feature from
            inside a package does not change the total: the work underneath it is shared.
          </p>
          <p className="mt-2.5 text-sm leading-6 text-gray-700">
            The price moves in two ways only: the foundation you choose, and the modules you add.
            Adding more modules lowers the rate on all of them.
          </p>
        </div>

        {/* Terms */}
        <div className="avoid-break">
          <Eyebrow>Terms</Eyebrow>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700">
            <li>
              This quote is indicative and holds for {PRICING.validityDays} days, until{" "}
              {fmt(validUntil)}. Final scope is confirmed in a session with the head teacher and
              the accounts office before anything is signed.
            </li>
            <li>
              Delivery is staged. Nothing is withheld once paid for, and the school owns its data
              throughout, with bulk export available at any time.
            </li>
            <li>
              Migration of existing pupil, staff and fee records off the current spreadsheets and
              registers is included in the foundation price.
            </li>
            <li>
              Gate hardware, biometric readers and cards, where selected, are quoted separately.
            </li>
            <li>
              Metered costs are billed as incurred. WhatsApp rates are set by Meta and revised
              quarterly.
            </li>
          </ul>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-4">
          <p className="text-[10px] leading-5 text-gray-400">
            Configuration reference {code || "default"} · generated {fmt(issued)}. This page is a
            working quote produced by the configurator, not yet a stamped document. On acceptance it
            is issued as a verifiable SaharaBase document with its own reference and QR
            verification.
          </p>
        </div>
      </div>
    </div>
  );
}
