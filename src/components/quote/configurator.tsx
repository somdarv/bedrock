"use client";

import * as React from "react";
import {
  FAMILIES,
  MODULE_BY_ID,
  MODULES,
  modulesInFamily,
  type ModuleFamily,
  type ModuleId,
} from "@/lib/school-mis/modules";
import {
  MODULE_PRICES,
  PACKAGES,
  PACKAGE_PRICES,
  PRICING,
  careBandFor,
  priceConfiguration,
  type Configuration,
  type PackageTier,
  type PaymentPlanId,
} from "@/lib/school-mis/pricing";
import { encodeConfig } from "@/lib/school-mis/config";
import { itemsInModule } from "@/lib/school-mis/catalogue";
import type { Prospect } from "@/lib/school-mis/prospects";
import { CatalogueExplorer } from "./catalogue-explorer";

/* ── formatting ─────────────────────────────────────────────────────────── */

const cedis = (n: number) => `₵${Math.round(n).toLocaleString("en-GH")}`;
const cedisExact = (n: number) =>
  `₵${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ── small pieces ───────────────────────────────────────────────────────── */

function Step({
  n,
  title,
  blurb,
  children,
}: {
  n: number;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-medium tabular-nums text-subtle">
          {String(n).padStart(2, "0")}
        </span>
        <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{blurb}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`shrink-0 tabular-nums ${strong ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}

/* ── module card ────────────────────────────────────────────────────────── */

type ModuleState = "added" | "phase2" | "skipped";

function ModuleCard({
  id,
  state,
  locked,
  blockedByTier,
  onChange,
  onUpgrade,
}: {
  id: ModuleId;
  state: ModuleState;
  /** Complete includes every module, so the control has nothing to decide. */
  locked: boolean;
  blockedByTier: boolean;
  onChange: (state: ModuleState) => void;
  onUpgrade: () => void;
}) {
  const m = MODULE_BY_ID[id];
  const price = MODULE_PRICES[id];
  const itemCount = itemsInModule(id).length;

  const options: { value: ModuleState; label: string }[] = [
    { value: "added", label: "Add" },
    { value: "phase2", label: "Phase 2" },
    { value: "skipped", label: "Skip" },
  ];

  return (
    <div
      className={`flex flex-col rounded-lg border bg-surface p-5 transition-colors ${
        state === "added" && !locked
          ? "border-foreground/25 shadow-[0_1px_0_0_rgba(10,10,10,0.06)]"
          : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-semibold leading-snug">{m.name}</h3>
        <div className="shrink-0 text-right">
          <div className="text-base font-semibold tabular-nums">{cedis(price)}</div>
          <div className="text-[11px] text-subtle">{itemCount} features</div>
        </div>
      </div>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">{m.tagline}</p>

      {m.caution && (
        <p className="mt-3 rounded border border-warning/25 bg-warning-soft px-3 py-2 text-xs leading-5 text-warning">
          {m.caution}
        </p>
      )}

      {m.careSurcharge && (
        <p className="mt-3 text-xs text-subtle">
          Adds {cedis(m.careSurcharge)} a year to care
          {m.passThrough ? `, plus metered ${m.passThrough === "sms" ? "SMS" : "WhatsApp"} costs` : ""}.
        </p>
      )}

      <div className="mt-4 grow" />

      {locked ? (
        <p className="rounded border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          Included in Complete.
        </p>
      ) : blockedByTier ? (
        <div className="rounded border border-border bg-muted px-3 py-2.5">
          <p className="text-xs leading-5 text-muted-foreground">
            Sits on the Standard foundation. It needs timetabling and Mobile Money underneath it.
          </p>
          <button
            onClick={onUpgrade}
            className="mt-2 text-xs font-medium underline underline-offset-4 hover:text-foreground"
          >
            Move up to Standard
          </button>
        </div>
      ) : (
        <>
          <div
            role="group"
            aria-label={`${m.name} selection`}
            className="grid grid-cols-3 gap-1 rounded-md border border-input bg-background p-1"
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => onChange(o.value)}
                aria-pressed={state === o.value}
                className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                  state === o.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {state === "skipped" && (
            <p className="mt-3 text-xs leading-5 text-subtle">{m.ifSkipped}</p>
          )}
          {state === "phase2" && (
            <p className="mt-3 text-xs leading-5 text-subtle">
              Kept out of the price now, quoted at {cedis(price)} for later.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ── the configurator ───────────────────────────────────────────────────── */

const WHATSAPP_NUMBER = "233592123054";

export function Configurator({
  prospect,
  initialConfig,
}: {
  prospect: Prospect;
  initialConfig: Configuration;
}) {
  const [config, setConfig] = React.useState<Configuration>(initialConfig);
  const [copied, setCopied] = React.useState(false);

  const quote = React.useMemo(() => priceConfiguration(config), [config]);
  const code = React.useMemo(() => encodeConfig(config), [config]);
  const complete = config.tier === "complete";

  // Keep the address bar holding the current configuration, so the link is the quote.
  React.useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("c", code);
    window.history.replaceState(null, "", url.toString());
  }, [code]);

  const quoteUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/q/${prospect.slug}/quote?c=${code}`;
  }, [code, prospect.slug]);

  function stateOf(id: ModuleId): ModuleState {
    if (config.added.includes(id)) return "added";
    if (config.phase2.includes(id)) return "phase2";
    return "skipped";
  }

  function setModuleState(id: ModuleId, next: ModuleState) {
    setConfig((prev) => {
      let added = prev.added.filter((x) => x !== id);
      let phase2 = prev.phase2.filter((x) => x !== id);

      if (next === "added") {
        added = [...added, id];
        // Pull in what this module sits on, rather than letting a broken pick through.
        for (const dep of MODULE_BY_ID[id].requiresModules ?? []) {
          if (!added.includes(dep)) {
            added = [...added, dep];
            phase2 = phase2.filter((x) => x !== dep);
          }
        }
      } else {
        if (next === "phase2") phase2 = [...phase2, id];
        // Anything that sits on this module cannot stay bought without it.
        for (const other of MODULES) {
          if ((other.requiresModules ?? []).includes(id) && added.includes(other.id)) {
            added = added.filter((x) => x !== other.id);
            phase2 = [...phase2.filter((x) => x !== other.id), other.id];
          }
        }
      }

      return { ...prev, added, phase2 };
    });
  }

  function setTier(tier: PackageTier) {
    setConfig((prev) => {
      if (tier !== "core") return { ...prev, tier };
      // Dropping to Core: anything needing Standard is deferred rather than silently priced.
      const demoted = prev.added.filter((id) => MODULE_BY_ID[id].requiresTier === "standard");
      return {
        ...prev,
        tier,
        added: prev.added.filter((id) => !demoted.includes(id)),
        phase2: [...prev.phase2.filter((id) => !demoted.includes(id)), ...demoted],
      };
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(quoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hello SaharaBase. This is ${prospect.school}. We have configured our school management system and would like to discuss it.\n\n${quoteUrl}`,
  )}`;

  const band = careBandFor(config.enrolment);
  const addedCount = complete ? MODULES.length : config.added.length;
  const isPreset =
    JSON.stringify({ ...config }) === JSON.stringify({ ...prospect.preset });

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
      {/* ── the choices ─────────────────────────────────────────────── */}
      <div className="space-y-12">
        <Step
          n={1}
          title="Choose the foundation"
          blurb="One of three. Everything inside a package is included, not itemised, so nothing here is priced feature by feature."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {PACKAGES.map((p) => {
              const selected = config.tier === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setTier(p.id)}
                  aria-pressed={selected}
                  className={`rounded-lg border p-5 text-left transition-colors ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-surface hover:border-foreground/30"
                  }`}
                >
                  <div className="font-display text-lg font-semibold">{p.name}</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">
                    {cedis(PACKAGE_PRICES[p.id])}
                  </div>
                  <p
                    className={`mt-3 text-xs leading-5 ${
                      selected ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {p.tagline}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-5 text-subtle">
            {PACKAGES.find((p) => p.id === config.tier)?.includes}
          </p>
        </Step>

        <Step
          n={2}
          title="Add what the school needs"
          blurb={
            complete
              ? "Complete already carries every module. Move down to Standard if you would rather pick."
              : "Sixteen modules, one price each. Adding more lowers the rate on all of them, because the shared work underneath is only paid for once."
          }
        >
          {!complete && (
            <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 text-xs">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{addedCount}</span> added
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{config.phase2.length}</span> kept
                for Phase 2
              </span>
              <span className="text-muted-foreground">
                Bundle rate{" "}
                <span className="font-semibold text-foreground">
                  {Math.round(quote.bundleDiscountRate * 100)}% off
                </span>
                {quote.bundleDiscountRate < 0.2 && (
                  <span className="text-subtle">
                    {" "}
                    · {nextBandHint(addedCount)}
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="space-y-10">
            {(Object.keys(FAMILIES) as ModuleFamily[]).map((family) => (
              <div key={family}>
                <div className="eyebrow">{FAMILIES[family].name}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">{FAMILIES[family].blurb}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {modulesInFamily(family).map((m) => (
                    <ModuleCard
                      key={m.id}
                      id={m.id}
                      state={complete ? "added" : stateOf(m.id)}
                      locked={complete}
                      blockedByTier={
                        !complete && config.tier === "core" && m.requiresTier === "standard"
                      }
                      onChange={(s) => setModuleState(m.id, s)}
                      onUpgrade={() => setTier("standard")}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Step>

        <Step
          n={3}
          title="Tell us the size of the school"
          blurb="Enrolment sets the annual care band and the message estimate. It never changes the build price: a bigger school does not mean a bigger system."
        >
          <div className="grid gap-6 rounded-lg border border-border bg-surface p-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Pupils enrolled</span>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {config.enrolment.toLocaleString()}
                </span>
                <span className="text-xs text-subtle">{band.label}</span>
              </div>
              <input
                type="range"
                min={50}
                max={2000}
                step={10}
                value={config.enrolment}
                onChange={(e) => setConfig((p) => ({ ...p, enrolment: Number(e.target.value) }))}
                className="mt-3 w-full accent-[color:var(--color-foreground)]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Average fee per pupil, per term</span>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {cedis(config.avgTermlyFee)}
                </span>
                <span className="text-xs text-subtle">
                  about {cedis(config.enrolment * config.avgTermlyFee)} a term
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={3000}
                step={50}
                value={config.avgTermlyFee}
                onChange={(e) => setConfig((p) => ({ ...p, avgTermlyFee: Number(e.target.value) }))}
                className="mt-3 w-full accent-[color:var(--color-foreground)]"
              />
              <span className="mt-2 block text-xs text-subtle">
                Used only to estimate Mobile Money charges. Nothing else on this page depends on it.
              </span>
            </label>
          </div>
        </Step>

        <Step
          n={4}
          title="Choose how to pay"
          blurb="A school pays out of termly fee income. Paying up front costs us nothing to finance, so it costs you less; spreading it across the year does, so it costs a little more."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {PRICING.paymentPlans.map((p) => {
              const selected = config.plan === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setConfig((prev) => ({ ...prev, plan: p.id as PaymentPlanId }))}
                  aria-pressed={selected}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-surface hover:border-foreground/30"
                  }`}
                >
                  <div className="text-sm font-semibold">{p.name}</div>
                  <p
                    className={`mt-1.5 text-xs leading-5 ${
                      selected ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {p.blurb}
                  </p>
                  <div className="mt-3 text-xs font-medium tabular-nums">
                    {p.adjustment === 0
                      ? "No adjustment"
                      : p.adjustment < 0
                        ? `${Math.round(Math.abs(p.adjustment) * 100)}% off`
                        : `+${Math.round(p.adjustment * 100)}%`}
                  </div>
                </button>
              );
            })}
          </div>
        </Step>

        <Step
          n={5}
          title="Everything in the catalogue"
          blurb="All two hundred and thirty-three features, and exactly which of them your current configuration includes. No feature carries its own price, which is why none of them is negotiable on its own."
        >
          <CatalogueExplorer config={config} />
        </Step>
      </div>

      {/* ── the money ───────────────────────────────────────────────── */}
      <aside className="mt-12 lg:mt-0">
        <div className="lg:sticky lg:top-6">
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="eyebrow">One-time</div>
            <div className="mt-1.5 font-display text-4xl font-semibold tracking-tight tabular-nums">
              {cedis(quote.oneTimeTotal)}
            </div>
            {quote.instalments > 1 && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {quote.instalments} payments of {cedis(quote.instalmentAmount)}
              </p>
            )}

            <div className="mt-5 border-t border-border pt-3">
              <Row label={`${PACKAGES.find((p) => p.id === config.tier)?.name} foundation`} value={cedis(quote.basePrice)} />
              {!complete && quote.modulesAtList > 0 && (
                <Row
                  label={`${config.added.length} module${config.added.length === 1 ? "" : "s"}`}
                  value={cedis(quote.modulesAtList)}
                />
              )}
              {quote.bundleDiscountAmount > 0 && (
                <Row
                  label={`Bundle discount, ${Math.round(quote.bundleDiscountRate * 100)}%`}
                  value={`-${cedis(quote.bundleDiscountAmount)}`}
                  muted
                />
              )}
              {quote.planAdjustmentAmount !== 0 && (
                <Row
                  label={
                    quote.planAdjustmentRate < 0 ? "Paid up front" : "Spread across three terms"
                  }
                  value={`${quote.planAdjustmentAmount > 0 ? "+" : "-"}${cedis(Math.abs(quote.planAdjustmentAmount))}`}
                  muted
                />
              )}
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <div className="eyebrow">Every year</div>
              <div className="mt-1.5 text-2xl font-semibold tabular-nums">
                {cedis(quote.careAnnual)}
              </div>
              <p className="mt-1 text-xs leading-5 text-subtle">
                Hosting, backups, updates and support. {band.label}.
                {quote.careSurcharge > 0 && ` Includes ${cedis(quote.careSurcharge)} for the modules that carry a running cost.`}
              </p>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <div className="eyebrow">Estimated, monthly</div>
              <div className="mt-1.5 text-2xl font-semibold tabular-nums">
                {cedisExact(quote.passThroughMonthlyTotal)}
              </div>
              <div className="mt-2 space-y-1">
                {quote.passThroughMonthly.map((p) => (
                  <div key={p.label} className="flex justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {p.label}
                      <span className="block text-subtle">{p.detail}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{cedisExact(p.amount)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-xs leading-5 text-subtle">
                Metered, passed through at cost plus handling. An estimate, never a fixed fee, and
                it moves when the networks move.
              </p>
            </div>

            {quote.phase2Total > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <Row
                  label={<span className="text-muted-foreground">Kept for Phase 2</span>}
                  value={<span className="text-muted-foreground">{cedis(quote.phase2Total)}</span>}
                />
                <p className="text-xs leading-5 text-subtle">
                  Held at today&rsquo;s prices for the validity of this quote.
                </p>
              </div>
            )}

            {quote.completeIsCheaper && (
              <button
                onClick={() => setTier("complete")}
                className="mt-4 w-full rounded-md border border-success/30 bg-success-soft px-3 py-2.5 text-left text-xs leading-5 text-success"
              >
                Complete costs {cedis(quote.completeIsCheaper.saving)} less than what you have
                assembled, and carries every module. Move up?
              </button>
            )}

            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Send this to SaharaBase
              </a>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`/q/${prospect.slug}/quote?c=${code}`}
                  className="flex h-10 items-center justify-center rounded-md border border-input bg-surface px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  See the quote
                </a>
                <button
                  onClick={copyLink}
                  className="flex h-10 items-center justify-center rounded-md border border-input bg-surface px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {copied ? "Link copied" : "Copy link"}
                </button>
              </div>
              {!isPreset && (
                <button
                  onClick={() => setConfig(prospect.preset)}
                  className="w-full pt-1 text-xs text-subtle underline underline-offset-4 hover:text-foreground"
                >
                  Back to what we recommend
                </button>
              )}
            </div>

            <p className="mt-4 text-[11px] leading-5 text-subtle">
              Indicative and valid {PRICING.validityDays} days. Final scope is confirmed in a
              session with the head teacher and the accounts office before anything is signed.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** How many more modules until the rate improves. Adding is meant to feel like winning. */
function nextBandHint(count: number): string {
  const next = PRICING.bundleCurve.find((b) => b.from > count);
  if (!next) return "best rate reached";
  const need = next.from - count;
  return `${need} more for ${Math.round(next.discount * 100)}%`;
}
