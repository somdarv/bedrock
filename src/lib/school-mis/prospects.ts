/**
 * Schools this configurator has been prepared for.
 *
 * Each carries a recommended preset, because an empty cart is a bad opening position.
 * The preset is our commercial recommendation, and the page opens on it.
 */

import type { Configuration } from "./pricing";

export interface Prospect {
  slug: string;
  school: string;
  /** How the school is described under its name. */
  descriptor: string;
  town: string;
  /** The one sentence that says why this school, now. */
  situation: string;
  /** Why we recommend the preset we recommend, in the head teacher's terms. */
  recommendation: string;
  /** Reference stem for the quote this page mints, e.g. "SHM". */
  refStem: string;
  preset: Configuration;
}

export const PROSPECTS: Prospect[] = [
  {
    slug: "shammah",
    school: "Shammah Preparatory School",
    descriptor: "Preparatory school, expanding into JHS",
    town: "Tamale, Northern Region",
    situation:
      "A school that already runs well on paper, adding a JHS. That means a second set of subjects, a second report format, a second fee structure, and in three years a first BECE cohort. All of it on the same pupils, who must carry one record from KG through to the day they leave.",
    recommendation:
      "Standard as the foundation, because the JHS needs timetabling and the office needs Mobile Money. Then the five modules that earn their keep in the first year: the exam and progression path out to BECE, the fee handling that stops arguments at the front desk, welfare records, same-morning absence messages, and proper admissions paperwork.",
    refStem: "SHM",
    preset: {
      tier: "standard",
      added: ["exams", "feesPlus", "welfare", "attendanceAuto", "admissions"],
      phase2: ["portal", "whatsapp", "library", "hr", "books", "analytics"],
      enrolment: 420,
      plan: "termly",
      avgTermlyFee: 700,
    },
  },
];

export function getProspect(slug: string): Prospect | undefined {
  return PROSPECTS.find((p) => p.slug === slug);
}
