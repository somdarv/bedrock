/**
 * Every number on the configurator, in one file.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  SET `pointRate`, `platformFee` AND THE CARE BANDS. EVERYTHING ELSE DERIVES.
 *  The values below are placeholders chosen to make the arithmetic legible, not
 *  a commercial recommendation. Change them here and the whole page reprices.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * How a price comes about:
 *
 *   module price  = complexity points inside the module × pointRate
 *                   (floored at moduleFloor, rounded to the nearest 50)
 *   base package  = points in its tiers × pointRate + platformFee
 *   Complete      = Standard + (every module at list × completeFactor)
 *   bundle curve  = the more modules added, the lower the effective rate, because
 *                   the shared infrastructure is only paid for once
 *
 * Two invariants the page depends on, both true by construction:
 *   1. the sum of all modules at list always exceeds the Complete upgrade gap
 *   2. Complete is always cheaper than assembling every module onto Standard
 */

import { ALL_ITEMS, itemsInModule, points, type Tier } from "./catalogue";
import { MODULE_BY_ID, MODULE_ORDER, type ModuleId } from "./modules";

export type PackageTier = "core" | "standard" | "complete";
export type PaymentPlanId = "upfront" | "twoPayments" | "termly";

export const PRICING = {
  /** GHS per unit of build complexity. Roughly half a day of build, test and documentation. */
  pointRate: 55,

  /**
   * One-time, charged on every package regardless of size: discovery, data migration
   * off the existing spreadsheets and registers, staff training, and deployment.
   */
  platformFee: 5000,

  /** No module is worth selling below this, whatever its points say. Testing, training and support have a floor. */
  moduleFloor: 1000,

  /** Prices land on clean numbers. Nobody quotes GHS 3,847. */
  roundTo: 50,

  /**
   * Complete buys every module at this fraction of list. It is the deepest discount
   * on the page and the reason Complete exists.
   */
  completeFactor: 0.72,

  /**
   * Bundle curve. `from` is the number of modules added (Phase 2 does not count).
   * Read top-down, last match wins.
   */
  bundleCurve: [
    { from: 0, discount: 0 },
    { from: 3, discount: 0.08 },
    { from: 5, discount: 0.14 },
    { from: 8, discount: 0.2 },
  ],

  /**
   * Annual care: hosting, backups, updates, support and the statutory changes that
   * arrive every year. Scaled by enrolment, never by feature count.
   */
  careBands: [
    { upTo: 300, price: 3600, label: "Up to 300 pupils" },
    { upTo: 700, price: 5400, label: "301 to 700 pupils" },
    { upTo: 1200, price: 7800, label: "701 to 1,200 pupils" },
    { upTo: Infinity, price: 10800, label: "Over 1,200 pupils" },
  ],

  /**
   * Metered costs, passed through at cost plus a handling margin. Never folded into
   * a fixed figure, and never quoted from the body of a proposal: they move.
   */
  passThrough: {
    sms: {
      label: "SMS",
      unit: "per message",
      rate: 0.06,
      /** Messages per pupil per month on a normal term. Drives the estimate only. */
      perPupilPerMonth: 2.5,
      note: "Bulk SMS credits, bought in blocks. The guaranteed channel.",
    },
    whatsapp: {
      label: "WhatsApp",
      unit: "per delivered message",
      rate: 0.11,
      perPupilPerMonth: 1.5,
      note: "Meta's Utility rate plus the provider's margin. Revised quarterly, so it lives in an annexe.",
    },
    momo: {
      label: "Mobile Money",
      unit: "of each payment collected",
      rate: 0.0195,
      note: "Charged by the network on collection. Some schools pass it to the parent instead.",
    },
  },

  /** Handling margin added on top of the raw pass-through rates above. */
  passThroughMargin: 0.15,

  /**
   * A school pays out of termly fee income. Paying in full up front costs us nothing
   * to finance, so it earns a discount; spreading across the year does, so it does not.
   */
  paymentPlans: [
    {
      id: "upfront" as PaymentPlanId,
      name: "In full, up front",
      adjustment: -0.05,
      blurb: "One payment before work begins.",
      instalments: 1,
    },
    {
      id: "twoPayments" as PaymentPlanId,
      name: "Half now, half on delivery",
      adjustment: 0,
      blurb: "Deposit starts the work. Balance on handover.",
      instalments: 2,
    },
    {
      id: "termly" as PaymentPlanId,
      name: "Three termly payments",
      adjustment: 0.06,
      blurb: "Matched to when school fees actually come in.",
      instalments: 3,
    },
  ],

  /** How long a configured quote holds. */
  validityDays: 21,
} as const;

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Complexity points contained in each tier. Core is cumulative into Standard. */
export const TIER_POINTS: Record<Tier, number> = {
  core: points(ALL_ITEMS.filter((i) => i.tier === "core")),
  standard: points(ALL_ITEMS.filter((i) => i.tier === "standard")),
  advanced: points(ALL_ITEMS.filter((i) => i.tier === "advanced")),
};

/** List price of a module, before any bundle discount. */
export function modulePrice(id: ModuleId): number {
  const raw = points(itemsInModule(id)) * PRICING.pointRate;
  return roundTo(Math.max(raw, PRICING.moduleFloor), PRICING.roundTo);
}

export const MODULE_PRICES: Record<ModuleId, number> = Object.fromEntries(
  MODULE_ORDER.map((id) => [id, modulePrice(id)]),
) as Record<ModuleId, number>;

const ALL_MODULES_AT_LIST = MODULE_ORDER.reduce((sum, id) => sum + MODULE_PRICES[id], 0);

/** Base package price, before any module is added. */
export function packagePrice(tier: PackageTier): number {
  const core = TIER_POINTS.core * PRICING.pointRate + PRICING.platformFee;
  if (tier === "core") return roundTo(core, PRICING.roundTo);

  const standard = core + TIER_POINTS.standard * PRICING.pointRate;
  if (tier === "standard") return roundTo(standard, PRICING.roundTo);

  return roundTo(standard + ALL_MODULES_AT_LIST * PRICING.completeFactor, PRICING.roundTo);
}

export const PACKAGE_PRICES: Record<PackageTier, number> = {
  core: packagePrice("core"),
  standard: packagePrice("standard"),
  complete: packagePrice("complete"),
};

export const PACKAGES: {
  id: PackageTier;
  name: string;
  tagline: string;
  includes: string;
}[] = [
  {
    id: "core",
    name: "Core",
    tagline: "Lean, fast to build, complete enough to run the school from day one.",
    includes: "Everything marked Core, with no structural limits on sections, levels or classes.",
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Core, plus the things a growing school reaches for in the first year.",
    includes:
      "Everything in Core, plus timetabling, Mobile Money collection, transcripts, payroll and admissions enquiries.",
  },
  {
    id: "complete",
    name: "Complete",
    tagline: "The whole catalogue, every module included, at the deepest rate on this page.",
    includes: "Everything in Standard, plus all sixteen modules.",
  },
];

function bundleDiscount(count: number): number {
  let discount = 0;
  for (const band of PRICING.bundleCurve) if (count >= band.from) discount = band.discount;
  return discount;
}

export function careBandFor(enrolment: number) {
  return PRICING.careBands.find((b) => enrolment <= b.upTo) ?? PRICING.careBands[PRICING.careBands.length - 1];
}

export function paymentPlan(id: PaymentPlanId) {
  return PRICING.paymentPlans.find((p) => p.id === id) ?? PRICING.paymentPlans[1];
}

export interface Configuration {
  tier: PackageTier;
  /** Modules bought now. */
  added: ModuleId[];
  /** Modules deferred: shown in the quote with a price, excluded from every total. */
  phase2: ModuleId[];
  enrolment: number;
  plan: PaymentPlanId;
  /** Average fee per pupil per term. Drives the Mobile Money estimate and nothing else. */
  avgTermlyFee: number;
}

export interface Quote {
  basePrice: number;
  /** Modules bought now, at list, before the bundle discount. */
  modulesAtList: number;
  bundleDiscountRate: number;
  bundleDiscountAmount: number;
  /** Base + discounted modules, before the payment plan adjustment. */
  subtotal: number;
  planAdjustmentRate: number;
  planAdjustmentAmount: number;
  /** What the school pays, one time. */
  oneTimeTotal: number;
  instalmentAmount: number;
  instalments: number;
  /** Annual care: enrolment band plus the surcharge on modules that carry a running cost. */
  careBase: number;
  careSurcharge: number;
  careAnnual: number;
  careMonthly: number;
  /** Metered, estimated, and deliberately separate from every fixed figure. */
  passThroughMonthly: { label: string; detail: string; amount: number }[];
  passThroughMonthlyTotal: number;
  /** Deferred modules, priced but excluded from the totals above. */
  phase2Total: number;
  /** Set when Complete would cost less than the current assembly. */
  completeIsCheaper: { saving: number } | null;
  /** Modules the current tier cannot carry, and modules whose prerequisites are missing. */
  unmetTier: ModuleId[];
  unmetModules: { module: ModuleId; needs: ModuleId[] }[];
}

/** The one function that turns a configuration into money. */
export function priceConfiguration(config: Configuration): Quote {
  const basePrice = PACKAGE_PRICES[config.tier];
  const complete = config.tier === "complete";

  // Complete already contains every module, so nothing can be added on top of it.
  const added = complete ? [] : config.added;
  const phase2 = complete ? [] : config.phase2;

  const modulesAtList = added.reduce((sum, id) => sum + MODULE_PRICES[id], 0);
  const bundleDiscountRate = bundleDiscount(added.length);
  const bundleDiscountAmount = roundTo(modulesAtList * bundleDiscountRate, PRICING.roundTo);

  const subtotal = basePrice + modulesAtList - bundleDiscountAmount;

  const plan = paymentPlan(config.plan);
  const planAdjustmentRate = plan.adjustment;
  const planAdjustmentAmount = roundTo(subtotal * planAdjustmentRate, PRICING.roundTo);
  const oneTimeTotal = subtotal + planAdjustmentAmount;

  const band = careBandFor(config.enrolment);
  const careBase = band.price;
  const liveModules = complete ? MODULE_ORDER : added;
  const careSurcharge = liveModules.reduce(
    (sum, id) => sum + (MODULE_BY_ID[id].careSurcharge ?? 0),
    0,
  );
  const careAnnual = careBase + careSurcharge;

  const margin = 1 + PRICING.passThroughMargin;
  const passThroughMonthly: Quote["passThroughMonthly"] = [];

  const sms = PRICING.passThrough.sms;
  const smsVolume = Math.round(config.enrolment * sms.perPupilPerMonth);
  passThroughMonthly.push({
    label: sms.label,
    detail: `about ${smsVolume.toLocaleString()} messages a month`,
    amount: smsVolume * sms.rate * margin,
  });

  if (liveModules.includes("whatsapp")) {
    const wa = PRICING.passThrough.whatsapp;
    const waVolume = Math.round(config.enrolment * wa.perPupilPerMonth);
    passThroughMonthly.push({
      label: wa.label,
      detail: `about ${waVolume.toLocaleString()} delivered messages a month`,
      amount: waVolume * wa.rate * margin,
    });
  }

  if (config.tier !== "core") {
    const momo = PRICING.passThrough.momo;
    // Collection is termly; spread across the three months of that term.
    const monthlyCollection = (config.enrolment * config.avgTermlyFee) / 3;
    passThroughMonthly.push({
      label: momo.label,
      detail: `${(momo.rate * 100).toFixed(2)}% of roughly ${Math.round(monthlyCollection).toLocaleString()} a month`,
      amount: monthlyCollection * momo.rate,
    });
  }

  const passThroughMonthlyTotal = passThroughMonthly.reduce((sum, p) => sum + p.amount, 0);

  const phase2Total = phase2.reduce((sum, id) => sum + MODULE_PRICES[id], 0);

  // Would Complete cost less than what they have assembled? Say so rather than take the money.
  let completeIsCheaper: Quote["completeIsCheaper"] = null;
  if (!complete) {
    const completeSubtotal = PACKAGE_PRICES.complete;
    if (completeSubtotal < subtotal) {
      completeIsCheaper = { saving: subtotal - completeSubtotal };
    }
  }

  const unmetTier = added.filter(
    (id) => MODULE_BY_ID[id].requiresTier === "standard" && config.tier === "core",
  );
  const unmetModules = added
    .map((id) => ({
      module: id,
      needs: (MODULE_BY_ID[id].requiresModules ?? []).filter((dep) => !added.includes(dep)),
    }))
    .filter((r) => r.needs.length > 0);

  return {
    basePrice,
    modulesAtList,
    bundleDiscountRate,
    bundleDiscountAmount,
    subtotal,
    planAdjustmentRate,
    planAdjustmentAmount,
    oneTimeTotal,
    instalmentAmount: Math.round(oneTimeTotal / plan.instalments),
    instalments: plan.instalments,
    careBase,
    careSurcharge,
    careAnnual,
    careMonthly: Math.round(careAnnual / 12),
    passThroughMonthly,
    passThroughMonthlyTotal,
    phase2Total,
    completeIsCheaper,
    unmetTier,
    unmetModules,
  };
}
