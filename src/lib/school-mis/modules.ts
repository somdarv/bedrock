/**
 * Sellable modules — the only things on the configurator that add money.
 *
 * The feature catalogue has ~350 items. Pricing them individually would make every
 * one of them negotiable, and would let a school assemble a broken permutation (the
 * family statement without billing). So features are never priced: each Advanced
 * item belongs to exactly one module, and the module carries the price.
 *
 * A module's price is derived from the complexity weights of the items inside it
 * (see pricing.ts) and never hand-set, so "why does Library cost that?" has an answer.
 */

export type ModuleId =
  | "admissions"
  | "welfare"
  | "hr"
  | "exams"
  | "teaching"
  | "library"
  | "feesPlus"
  | "books"
  | "payroll"
  | "portal"
  | "whatsapp"
  | "attendanceAuto"
  | "analytics"
  | "platform"
  | "offline"
  | "offlineFees";

export type ModuleFamily = "people" | "academic" | "money" | "communication" | "platform";

export const FAMILIES: Record<ModuleFamily, { name: string; blurb: string }> = {
  people: {
    name: "People",
    blurb: "The child and the staff member, beyond the mark sheet.",
  },
  academic: {
    name: "Academic",
    blurb: "Teaching, timetabling, and the road out to BECE.",
  },
  money: {
    name: "Money",
    blurb: "Fees, books and salaries.",
  },
  communication: {
    name: "Communication & access",
    blurb: "How the school reaches a parent, and what a parent can see.",
  },
  platform: {
    name: "Platform",
    blurb: "Insight, control, and working when the network does not.",
  },
};

/** The base package a module needs underneath it. Undefined means it works on Core. */
export type RequiredTier = "standard";

export interface SchoolModule {
  id: ModuleId;
  name: string;
  family: ModuleFamily;
  /** One line, said the way a head teacher would say it. */
  tagline: string;
  /** What the school loses by skipping it. Shown on Skip, as information rather than a scold. */
  ifSkipped: string;
  /** Base package this module sits on top of. */
  requiresTier?: RequiredTier;
  /** Modules that must also be selected. Resolved in the UI, never in the client's head. */
  requiresModules?: ModuleId[];
  /** Annual care surcharge in GHS. Only modules with a real running cost carry one. */
  careSurcharge?: number;
  /** Flagged in the UI as carrying costs that are metered, not fixed. */
  passThrough?: "sms" | "whatsapp";
  /** Extra caution shown on the card, used where the risk is real. */
  caution?: string;
}

export const MODULES: SchoolModule[] = [
  {
    id: "admissions",
    name: "Admissions Plus",
    family: "people",
    tagline: "Offer letters, admission packs, waiting lists, and re-admission of a former pupil.",
    ifSkipped: "Offers and admission packs stay a Word document retyped each time.",
  },
  {
    id: "welfare",
    name: "Welfare, Health & Safeguarding",
    family: "people",
    tagline:
      "Full health records, special needs plans, sick bay log, sanctions, and safeguarding flags.",
    ifSkipped:
      "Core still carries the critical medical alert and the incident log. The full health file and the sick bay record do not.",
  },
  {
    id: "hr",
    name: "HR, Performance & Recruitment",
    family: "people",
    tagline:
      "Qualifications, NTC licences, leave, duty rosters, appraisals, lesson observation, and hiring.",
    ifSkipped:
      "Staff records stay to the essentials: who they are, what they earn, whether they are in today.",
  },
  {
    id: "exams",
    name: "Exams, Progression & Alumni",
    family: "academic",
    tagline:
      "BECE candidate register, assessment portfolios, automatic repetition candidates, and SHS placement tracking.",
    requiresTier: "standard",
    ifSkipped:
      "Report cards and transcripts still work. The BECE register is compiled by hand each year.",
  },
  {
    id: "teaching",
    name: "Timetable & Teaching Operations",
    family: "academic",
    tagline:
      "Extra and vacation classes billed separately, substitute cover, lesson plan approval, automatic timetabling.",
    requiresTier: "standard",
    ifSkipped:
      "Timetables are built and printed, but cover and extra classes are arranged off-system.",
  },
  {
    id: "library",
    name: "Library & Learning Resources",
    family: "academic",
    tagline:
      "Book catalogue, issue and return, termly textbook issue, overdue fines onto the fee account.",
    ifSkipped: "The library keeps its exercise book.",
  },
  {
    id: "feesPlus",
    name: "Fees Plus",
    family: "money",
    tagline:
      "Sibling and staff discounts, scholarships, agreed instalment plans, printable family statements, bank reconciliation.",
    ifSkipped:
      "Core still shows a family's consolidated balance at the front desk. Discounts are applied by hand.",
  },
  {
    id: "books",
    name: "Books & Expenditure",
    family: "money",
    tagline:
      "Expenses, petty cash, suppliers, requisitions, budgets, cash book, and statements for the board.",
    ifSkipped: "The system tracks money coming in. Money going out stays in the ledger book.",
  },
  {
    id: "payroll",
    name: "Payroll Compliance",
    family: "money",
    tagline:
      "SSNIT Tier 1 and 2, PAYE on current GRA bands, salary advances, and a bulk bank or MoMo payment file.",
    requiresTier: "standard",
    ifSkipped: "Payslips still run. The statutory computation is done outside the system.",
  },
  {
    id: "portal",
    name: "Parent Portal & App",
    family: "communication",
    tagline:
      "One login per parent covering every child: attendance, results, balance, pay online, download report cards.",
    careSurcharge: 900,
    ifSkipped: "Parents receive news by SMS rather than looking it up themselves.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Channel",
    family: "communication",
    tagline: "Notices, reminders and report card alerts delivered over the WhatsApp Business API.",
    requiresTier: "standard",
    careSurcharge: 600,
    passThrough: "whatsapp",
    caution:
      "Meta charges per delivered message and revises its rate card quarterly. Quoted as a pass-through cost, never as a fixed monthly figure.",
    ifSkipped: "SMS remains the guaranteed channel, which every parent already has.",
  },
  {
    id: "attendanceAuto",
    name: "Attendance Automation & Gate",
    family: "communication",
    tagline:
      "Automatic SMS on an unexplained absence, chronic absence flags, and card or biometric check-in at the gate.",
    requiresTier: "standard",
    careSurcharge: 400,
    passThrough: "sms",
    caution: "Gate hardware (readers, cards) is quoted separately and is not part of this figure.",
    ifSkipped: "Attendance is marked and reported, but a parent is not told the same morning.",
  },
  {
    id: "analytics",
    name: "Analytics & Custom Reports",
    family: "platform",
    tagline:
      "Year-on-year trends, teacher and subject performance, board financial summaries, and a report builder.",
    requiresTier: "standard",
    careSurcharge: 400,
    ifSkipped:
      "Every standard report still exports to Excel and PDF. A new question needs a new report from us.",
  },
  {
    id: "platform",
    name: "Governance & Controls",
    family: "platform",
    tagline:
      "Who-changed-what audit viewer, two-factor authentication on finance, custom fields, and multiple campuses.",
    ifSkipped:
      "Core still keeps an immutable financial log that can be voided but never silently deleted. The browsable audit viewer is not included.",
  },
  {
    id: "offline",
    name: "True Offline: Attendance & Marks",
    family: "platform",
    tagline:
      "Mark a register and enter marks with no network at all, syncing when the connection returns.",
    careSurcharge: 500,
    ifSkipped:
      "Core is already resilient online: a dropped connection retries and nothing is lost mid-save.",
  },
  {
    id: "offlineFees",
    name: "Offline Fee Collection",
    family: "platform",
    tagline:
      "Receipt a payment with no network, on one designated device holding a reserved block of receipt numbers.",
    requiresModules: ["offline"],
    careSurcharge: 700,
    caution:
      "Restricted to one designated device by design. Two devices collecting offline can issue the same receipt number.",
    ifSkipped: "Fee collection needs a connection, which is what keeps receipt numbers unique.",
  },
];

export const MODULE_BY_ID: Record<ModuleId, SchoolModule> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
) as Record<ModuleId, SchoolModule>;

/** Stable order. The bitmask in a saved configuration code depends on it, so append only. */
export const MODULE_ORDER: ModuleId[] = MODULES.map((m) => m.id);

export function modulesInFamily(family: ModuleFamily): SchoolModule[] {
  return MODULES.filter((m) => m.family === family);
}
