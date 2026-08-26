/**
 * What sits in the Foundation, and what only Complete adds.
 *
 * The proposal's appendix is generated from this, not typed by hand, so the list a
 * school reads and the list we build from can never drift apart.
 *
 * Foundation = every Core item, plus the Standard items a school genuinely cannot run
 * a JHS without. The Standard items held back below are the ones that make Complete
 * worth buying: Mobile Money, payroll, and the admissions marketing pipeline.
 */

import { CATALOGUE, type CatalogueItem } from "./catalogue";

/**
 * Standard items deliberately kept out of the Foundation.
 * Mobile Money is the big one: it is what the office wants most, which makes it the
 * clearest reason to move up rather than a gap that feels mean.
 */
const HELD_BACK = new Set<string>([
  // Mobile Money, the strongest single reason to upgrade
  "momo",
  "momo-refs",
  // Payroll: a separate job from running the school
  "salary-structure",
  "payroll-run",
  // Admissions marketing: useful, but not needed to run the school day to day
  "enquiry-form",
  "walkin",
  "pipeline",
  "followup",
  "source",
  "app-fee",
  "app-config",
  "app-sibling",
  "assess-schedule",
  "assess-score",
  "assess-place",
  // Nice to have, not needed on day one
  "room-alloc",
  "permission-slips",
  "alumni-register",
  "records-request",
]);

export function isInFoundation(item: CatalogueItem): boolean {
  if (item.tier === "core") return true;
  if (item.tier === "standard") return !HELD_BACK.has(item.id);
  return false;
}

export interface PackageListSection {
  name: string;
  items: string[];
}

/** Everything the Foundation includes, grouped by category, for the appendix. */
export function foundationList(): PackageListSection[] {
  return listBy((item) => isInFoundation(item));
}

/** Everything Complete adds on top of the Foundation. */
export function completeAddsList(): PackageListSection[] {
  return listBy((item) => !isInFoundation(item));
}

function listBy(predicate: (item: CatalogueItem) => boolean): PackageListSection[] {
  return CATALOGUE.map((category) => ({
    name: category.name,
    items: category.groups.flatMap((g) => g.items.filter(predicate).map((i) => i.label)),
  })).filter((section) => section.items.length > 0);
}

export function countIn(sections: PackageListSection[]): number {
  return sections.reduce((sum, s) => sum + s.items.length, 0);
}
