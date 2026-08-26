/**
 * A configuration, encoded so it survives a URL.
 *
 * The point of the code is that what the school configured and what we quote are the
 * same thing. A parent-facing link, a saved quote and a printed proposal all resolve
 * from one short string, so nobody re-keys a selection and nobody argues about what
 * was on screen.
 *
 * Format:  <tier>.<enrolment>.<plan>.<addedMask>.<phase2Mask>.<avgTermlyFee>
 * Masks are base-36 bitfields over MODULE_ORDER, which is therefore append-only.
 */

import type { CatalogueItem } from "./catalogue";
import { MODULE_ORDER, type ModuleId } from "./modules";
import type { Configuration, PackageTier, PaymentPlanId } from "./pricing";

const TIER_CODE: Record<PackageTier, string> = { core: "c", standard: "s", complete: "x" };
const CODE_TIER: Record<string, PackageTier> = { c: "core", s: "standard", x: "complete" };

const PLAN_CODE: Record<PaymentPlanId, string> = {
  upfront: "u",
  twoPayments: "h",
  termly: "t",
};
const CODE_PLAN: Record<string, PaymentPlanId> = { u: "upfront", h: "twoPayments", t: "termly" };

function toMask(ids: ModuleId[]): string {
  let mask = 0;
  for (const id of ids) {
    const bit = MODULE_ORDER.indexOf(id);
    if (bit >= 0) mask |= 1 << bit;
  }
  return mask.toString(36);
}

function fromMask(code: string): ModuleId[] {
  const mask = parseInt(code, 36);
  if (!Number.isFinite(mask)) return [];
  return MODULE_ORDER.filter((_, bit) => (mask & (1 << bit)) !== 0);
}

export function encodeConfig(config: Configuration): string {
  return [
    TIER_CODE[config.tier],
    config.enrolment,
    PLAN_CODE[config.plan],
    toMask(config.added),
    toMask(config.phase2),
    Math.round(config.avgTermlyFee),
  ].join(".");
}

export function decodeConfig(code: string, fallback: Configuration): Configuration {
  const parts = code.split(".");
  if (parts.length < 6) return fallback;
  const [tier, enrolment, plan, added, phase2, fee] = parts;

  const parsedEnrolment = Number(enrolment);
  const parsedFee = Number(fee);
  const addedIds = fromMask(added);
  // A module can never be both bought and deferred.
  const phase2Ids = fromMask(phase2).filter((id) => !addedIds.includes(id));

  return {
    tier: CODE_TIER[tier] ?? fallback.tier,
    enrolment:
      Number.isFinite(parsedEnrolment) && parsedEnrolment > 0 ? parsedEnrolment : fallback.enrolment,
    plan: CODE_PLAN[plan] ?? fallback.plan,
    added: addedIds,
    phase2: phase2Ids,
    avgTermlyFee:
      Number.isFinite(parsedFee) && parsedFee >= 0
        ? parsedFee
        : fallback.avgTermlyFee,
  };
}

export type ItemStatus = "included" | "phase2" | "available";

/**
 * Whether a given catalogue item is in the school's system as configured.
 * Drives the catalogue explorer, which shows all ~350 items and never a price
 * against any one of them.
 */
export function itemStatus(item: CatalogueItem, config: Configuration): ItemStatus {
  if (item.tier === "core") return "included";
  if (item.tier === "standard") return config.tier === "core" ? "available" : "included";
  if (config.tier === "complete") return "included";
  if (item.module && config.added.includes(item.module)) return "included";
  if (item.module && config.phase2.includes(item.module)) return "phase2";
  return "available";
}

export function countIncluded(items: CatalogueItem[], config: Configuration): number {
  return items.filter((i) => itemStatus(i, config) === "included").length;
}
