/**
 * School Management System — the feature catalogue (v3, as data).
 *
 * Every item carries three things the configurator needs:
 *   tier    — which base package includes it (core / standard / advanced)
 *   weight  — build complexity, the basis of every price on the page
 *   module  — for advanced items only: the one sellable module it belongs to
 *
 * Weights are deliberately coarse. Precision here is false precision:
 *   1  a field or flag on a screen that is already being built
 *   2  a CRUD screen over an entity that already exists
 *   3  a screen plus workflow, approval, or state
 *   5  money-touching, cross-cutting, or a reporting engine
 *   8  an external integration carrying reconciliation or device risk
 *
 * Four items sit in Core that the v3 draft had elsewhere, on purpose: the immutable
 * financial log, the consolidated family balance, the critical medical alert, and the
 * incident log with its conduct summary. Each costs almost nothing to build, and each
 * is a hole that would otherwise be attached to our name. Moving the incident log down
 * also empties the ragged middle of the Behaviour category, so what remains sells as
 * one clean Welfare module.
 */

import type { ModuleId } from "./modules";

export type Tier = "core" | "standard" | "advanced";
export type Weight = 1 | 2 | 3 | 5 | 8;

export interface CatalogueItem {
  id: string;
  label: string;
  tier: Tier;
  weight: Weight;
  /** Required on advanced items, absent otherwise. */
  module?: ModuleId;
  /** Optional emphasis: the item is a headline capability worth calling out. */
  headline?: boolean;
}

export interface CatalogueCategory {
  id: string;
  /** Display number, matching the catalogue document. */
  number: number;
  name: string;
  blurb: string;
  groups: { name?: string; items: CatalogueItem[] }[];
}

export const CATALOGUE: CatalogueCategory[] = [
  {
    id: "structure",
    number: 0,
    name: "School structure & configuration",
    blurb:
      "The school defines its own sections, levels and classes without limit. Adding the JHS is a configuration change, not a purchase.",
    groups: [
      {
        items: [
          { id: "sections", label: "Unlimited school sections (Preschool, Primary, JHS, anything added later)", tier: "core", weight: 3, headline: true },
          { id: "levels", label: "Unlimited levels or grades per section, custom names and display order", tier: "core", weight: 2 },
          { id: "classes", label: "Unlimited classes or streams per level (Basic 4 Gold, Basic 4 Green)", tier: "core", weight: 2 },
          { id: "capacity", label: "Class capacity limits and live enrolment counts", tier: "core", weight: 2 },
          { id: "teacher-assign", label: "Assign class teachers, assistant teachers and subject teachers per class", tier: "core", weight: 3 },
          { id: "promotion-paths", label: "Promotion paths, including cross-section transitions (KG2 to Basic 1, Basic 6 to JHS 1)", tier: "core", weight: 3, headline: true },
          { id: "repeat", label: "Repeat a pupil in the same class, with reason recorded and the repeated year preserved", tier: "core", weight: 3 },
          { id: "skip", label: "Skip or accelerate a pupil out of the normal sequence, with approval and reason", tier: "core", weight: 2 },
          { id: "transfer-midyear", label: "Manual class transfer mid-year, retaining full history", tier: "core", weight: 2 },
          { id: "year-terms", label: "Academic year and 3-term calendar with vacations and mid-term breaks", tier: "core", weight: 3 },
          { id: "subjects", label: "Subject catalogue mapped per level, so JHS subjects differ from Primary automatically", tier: "core", weight: 3 },
          { id: "profile", label: "School profile: name, GES code, logo, letterhead, stamp and signature images", tier: "core", weight: 2 },
          { id: "curriculum-tag", label: "Curriculum tagging: Standards-Based (KG to B6) against Common Core (B7 to B9)", tier: "standard", weight: 2 },
          { id: "clone-year", label: "Clone an entire year's structure into the next year in one action", tier: "standard", weight: 3 },
          { id: "auto-repeat", label: "Automatic repetition candidates flagged against promotion criteria, for the head teacher to confirm or override", tier: "advanced", weight: 5, module: "exams" },
          { id: "campuses", label: "Multiple campuses or branches under one account", tier: "advanced", weight: 5, module: "platform" },
          { id: "custom-fields", label: "Custom fields the school adds to students, staff or classes without calling us", tier: "advanced", weight: 5, module: "platform" },
        ],
      },
    ],
  },
  {
    id: "admissions",
    number: 1,
    name: "Admissions & enrolment",
    blurb:
      "A student is created once at application and the same record carries them out to graduation. Nothing re-keyed, nothing orphaned.",
    groups: [
      {
        name: "Enquiry & prospecting",
        items: [
          { id: "enquiry-form", label: "Public enquiry form on the school website or a shareable link", tier: "standard", weight: 2 },
          { id: "walkin", label: "Walk-in enquiry capture at the front desk", tier: "standard", weight: 1 },
          { id: "pipeline", label: "Enquiry pipeline: Enquired, Applied, Assessed, Offered, Accepted, Enrolled, Declined", tier: "standard", weight: 3 },
          { id: "followup", label: "Follow-up reminders for unconverted enquiries", tier: "standard", weight: 2 },
          { id: "source", label: "Source tracking (referral, radio, signboard, social media, word of mouth)", tier: "standard", weight: 1 },
        ],
      },
      {
        name: "Application",
        items: [
          { id: "app-online", label: "Online application form, mobile-friendly, works on low-end phones", tier: "core", weight: 3 },
          { id: "app-paper", label: "Offline or paper application entry by admin staff", tier: "core", weight: 2 },
          { id: "app-docs", label: "Document upload: birth certificate, guardian Ghana Card, photo, previous report, transfer letter", tier: "core", weight: 3 },
          { id: "app-fee", label: "Application fee capture, receipted, feeding into accounts", tier: "standard", weight: 2 },
          { id: "app-config", label: "Configurable application forms per section", tier: "standard", weight: 3 },
          { id: "app-sibling", label: "Sibling detection at application (finds the existing family)", tier: "standard", weight: 2 },
        ],
      },
      {
        name: "Assessment & selection",
        items: [
          { id: "assess-schedule", label: "Entrance assessment and interview scheduling with slots", tier: "standard", weight: 3 },
          { id: "assess-score", label: "Score entry and pass mark per level", tier: "standard", weight: 2 },
          { id: "assess-place", label: "Placement recommendation based on age and prior class", tier: "standard", weight: 2 },
          { id: "waitlist", label: "Waiting list management when a class is at capacity", tier: "advanced", weight: 3, module: "admissions" },
        ],
      },
      {
        name: "Offer & enrolment",
        items: [
          { id: "convert", label: "One-click conversion of applicant to student, carrying every document forward with zero re-entry", tier: "core", weight: 3, headline: true },
          { id: "studentid", label: "Automatic admission number generation, configurable format (SPS/2026/JHS/014)", tier: "core", weight: 2 },
          { id: "class-alloc", label: "Class allocation at enrolment", tier: "core", weight: 2 },
          { id: "offer-letter", label: "Offer letter on school letterhead with the fee schedule attached", tier: "advanced", weight: 3, module: "admissions" },
          { id: "accept-track", label: "Acceptance tracking and admission deposit capture", tier: "advanced", weight: 3, module: "admissions" },
          { id: "admission-pack", label: "Admission pack: welcome letter, prospectus, uniform list, term calendar, auto-generated", tier: "advanced", weight: 3, module: "admissions" },
          { id: "readmission", label: "Re-admission of a former pupil that reattaches their old record rather than duplicating it", tier: "advanced", weight: 3, module: "admissions" },
        ],
      },
    ],
  },
  {
    id: "students",
    number: 2,
    name: "Student & guardian records",
    blurb: "One record, one lifetime. Every class, every term, every payment, on one screen.",
    groups: [
      {
        name: "Student profile",
        items: [
          { id: "biodata", label: "Biodata: full name, date of birth, sex, place of birth, nationality, hometown, religion", tier: "core", weight: 2 },
          { id: "photo", label: "Photograph", tier: "core", weight: 1 },
          { id: "address", label: "Contact and residential address, including area or landmark description", tier: "core", weight: 1 },
          { id: "uid", label: "Unique student ID, permanent for life", tier: "core", weight: 1 },
          { id: "status", label: "Status: Active, Withdrawn, Graduated, Transferred, Suspended, with effective dates", tier: "core", weight: 2 },
          { id: "enrol-history", label: "Enrolment history: every class, every year, in order, with dates", tier: "core", weight: 3 },
          { id: "emergency", label: "Emergency contacts, ranked, and authorised pick-up persons with photos", tier: "core", weight: 3, headline: true },
          { id: "medical-alert", label: "Critical medical alert: allergies and conditions staff must know in an emergency", tier: "core", weight: 1, headline: true },
          { id: "national-ids", label: "Ghana Card, birth certificate and NHIS numbers as structured, searchable fields", tier: "advanced", weight: 2, module: "welfare" },
          { id: "siblings", label: "Sibling links within the school", tier: "advanced", weight: 3, module: "welfare" },
          { id: "health-record", label: "Full health record: blood group, chronic conditions, medications, disability, immunisation", tier: "advanced", weight: 3, module: "welfare" },
          { id: "sen", label: "Special educational needs plan and support log", tier: "advanced", weight: 3, module: "welfare" },
        ],
      },
      {
        name: "Parent & guardian records",
        items: [
          { id: "guardians-multi", label: "Multiple guardians per student with defined relationship and role", tier: "core", weight: 3 },
          { id: "guardian-roles", label: "Designated primary contact, fee payer and emergency contact, which can be three different people", tier: "core", weight: 2, headline: true },
          { id: "guardian-contacts", label: "Phone numbers (multiple), email if available, occupation, workplace", tier: "core", weight: 1 },
          { id: "guardian-login", label: "Guardian login covering all their children across all levels: one account, every child", tier: "advanced", weight: 5, module: "portal" },
          { id: "guardian-acl", label: "Guardian portal access control: who can see what", tier: "advanced", weight: 3, module: "portal" },
          { id: "literacy-flag", label: "Literacy and language preference flag for adjusting communications", tier: "advanced", weight: 1, module: "welfare" },
          { id: "custody", label: "Custody or access restrictions flagged and enforced at pick-up", tier: "advanced", weight: 3, module: "welfare" },
        ],
      },
      {
        name: "The lifecycle file",
        items: [
          { id: "unified-file", label: "Unified student file: academic history, attendance, fees, communications and documents across all years, on one screen", tier: "core", weight: 5, headline: true },
          { id: "doc-vault", label: "Document vault per student with upload dates", tier: "core", weight: 2 },
          { id: "fin-log", label: "Immutable financial transaction log: payments can be voided with a reason, never silently deleted", tier: "core", weight: 3, headline: true },
          { id: "family-balance", label: "Consolidated family balance at the front desk: one parent, several children, one number", tier: "core", weight: 2, headline: true },
          { id: "dossier", label: "Full printable and exportable student dossier", tier: "standard", weight: 3 },
          { id: "archive-search", label: "Archived students remain fully searchable and retrievable indefinitely", tier: "standard", weight: 2 },
        ],
      },
    ],
  },
  {
    id: "staff",
    number: 3,
    name: "Staff onboarding & management",
    blurb: "The same one-record-one-lifetime rule, applied to the people who run the school.",
    groups: [
      {
        name: "Core staff record",
        items: [
          { id: "staff-add", label: "Add a staff member: name, photo, contact details, unique staff ID", tier: "core", weight: 2 },
          { id: "staff-role", label: "Role and category (teaching, non-teaching, management, support, casual)", tier: "core", weight: 1 },
          { id: "staff-employment", label: "Employment details: appointment date, contract type, contract dates, salary grade", tier: "core", weight: 2 },
          { id: "staff-bank", label: "Bank and MoMo details for salary payment", tier: "core", weight: 1 },
          { id: "staff-nok", label: "Next of kin and emergency contact", tier: "core", weight: 1 },
          { id: "staff-status", label: "Status: Active, On leave, Exited, with dates", tier: "core", weight: 2 },
          { id: "staff-ssnit-tin", label: "SSNIT number and TIN", tier: "standard", weight: 1 },
          { id: "staff-quals", label: "Qualifications and teaching subjects or levels", tier: "advanced", weight: 2, module: "hr" },
          { id: "staff-ntc", label: "NTC licence number and expiry, GES staff ID", tier: "advanced", weight: 1, module: "hr" },
          { id: "staff-docs", label: "Document collection: CV, certificates, Ghana Card, photo, references, police clearance", tier: "advanced", weight: 2, module: "hr" },
          { id: "staff-onboarding", label: "Onboarding checklist: contract signed, documents collected, ID issued, account created, orientation done", tier: "advanced", weight: 3, module: "hr" },
        ],
      },
      {
        name: "Recruitment",
        items: [
          { id: "vacancy", label: "Vacancy posting and applicant tracking", tier: "advanced", weight: 3, module: "hr" },
          { id: "interview", label: "Interview scheduling and scoring", tier: "advanced", weight: 3, module: "hr" },
          { id: "applicant-convert", label: "Convert an applicant to a staff member with documents carried over", tier: "advanced", weight: 3, module: "hr" },
        ],
      },
      {
        name: "Deployment & workload",
        items: [
          { id: "teach-assign", label: "Class teacher and subject teacher assignments", tier: "core", weight: 2 },
          { id: "teach-load", label: "Teaching load view per teacher (periods per week)", tier: "core", weight: 2 },
          { id: "staff-attendance", label: "Staff attendance: daily present, absent, late marking", tier: "core", weight: 3 },
          { id: "duty-roster", label: "Duty roster: morning duty, break duty, assembly, exam invigilation", tier: "advanced", weight: 3, module: "hr" },
          { id: "leave", label: "Leave management: request, approval workflow, balances, leave calendar", tier: "advanced", weight: 5, module: "hr" },
          { id: "clock", label: "Clock-in and clock-out time capture", tier: "advanced", weight: 3, module: "hr" },
        ],
      },
      {
        name: "Development & performance",
        items: [
          { id: "appraisal", label: "Appraisal cycles with forms, scoring and sign-off", tier: "advanced", weight: 5, module: "hr" },
          { id: "observation", label: "Lesson observation records", tier: "advanced", weight: 3, module: "hr" },
          { id: "cpd", label: "Training and CPD log with certificates", tier: "advanced", weight: 2, module: "hr" },
          { id: "discipline-staff", label: "Disciplinary records, queries and warnings, with responses", tier: "advanced", weight: 3, module: "hr" },
          { id: "goals", label: "Goal setting and follow-up", tier: "advanced", weight: 2, module: "hr" },
        ],
      },
      {
        name: "Exit",
        items: [
          { id: "staff-exit", label: "Exit process: resignation or termination, effective date, reason", tier: "core", weight: 2 },
          { id: "staff-archive", label: "Staff record archived but permanently retrievable", tier: "core", weight: 1 },
          { id: "exit-checklist", label: "Exit checklist: handover, property returned, final dues", tier: "advanced", weight: 2, module: "hr" },
          { id: "service-cert", label: "Service certificate and reference letter generation", tier: "advanced", weight: 2, module: "hr" },
          { id: "final-settlement", label: "Final settlement calculation feeding into payroll", tier: "advanced", weight: 3, module: "payroll" },
        ],
      },
    ],
  },
  {
    id: "timetable",
    number: 4,
    name: "Classes, timetable & scheduling",
    blurb: "Creche and JHS run different days. The period structure follows the section, not the school.",
    groups: [
      {
        items: [
          { id: "class-register", label: "Class register with live enrolment list", tier: "core", weight: 2 },
          { id: "subject-teacher-assign", label: "Assign subjects to classes and teachers to subjects", tier: "core", weight: 2 },
          { id: "period-structure", label: "Period structure setup, configurable per section", tier: "core", weight: 3 },
          { id: "calendar", label: "School calendar: terms, holidays, exam weeks, PTA, speech day, public holidays including Eid", tier: "core", weight: 3 },
          { id: "timetable-builder", label: "Timetable builder with clash detection (teacher or room double-booked)", tier: "standard", weight: 5 },
          { id: "timetable-views", label: "Per-class, per-teacher and whole-school timetable views", tier: "standard", weight: 3 },
          { id: "timetable-print", label: "Printable and exportable timetables", tier: "standard", weight: 2 },
          { id: "room-alloc", label: "Room and facility allocation (ICT lab, library, hall)", tier: "standard", weight: 2 },
          { id: "extra-classes", label: "Extra and vacation classes: enrol pupils, assign teachers, and bill separately from term fees", tier: "advanced", weight: 5, module: "teaching" },
          { id: "substitute", label: "Substitute cover when a teacher is absent, listing the day's affected periods automatically", tier: "advanced", weight: 3, module: "teaching" },
          { id: "scheme-work", label: "Scheme of work and lesson plan upload, approved by the head teacher", tier: "advanced", weight: 3, module: "teaching" },
          { id: "auto-timetable", label: "Automatic timetable generation from constraints", tier: "advanced", weight: 8, module: "teaching" },
        ],
      },
    ],
  },
  {
    id: "attendance",
    number: 5,
    name: "Attendance",
    blurb: "A register marked in under a minute, and a percentage that lands on the report card by itself.",
    groups: [
      {
        items: [
          { id: "attendance-daily", label: "Daily student attendance marking per class, in under a minute", tier: "core", weight: 3, headline: true },
          { id: "attendance-states", label: "Present, Absent, Late, Excused, with reason capture", tier: "core", weight: 2 },
          { id: "attendance-pct", label: "Attendance percentage per student per term, printed on the report card", tier: "core", weight: 2 },
          { id: "attendance-registers", label: "Class and daily attendance registers, printable", tier: "core", weight: 2 },
          { id: "attendance-period", label: "Subject and period-level attendance for JHS", tier: "standard", weight: 3 },
          { id: "absence-sms", label: "Automatic SMS to a parent on an unexplained absence", tier: "advanced", weight: 3, module: "attendanceAuto" },
          { id: "absence-patterns", label: "Absence pattern flags: chronic absenteeism, frequent Mondays and Fridays", tier: "advanced", weight: 3, module: "attendanceAuto" },
          { id: "staff-punctuality", label: "Staff attendance and punctuality reporting", tier: "advanced", weight: 3, module: "attendanceAuto" },
          { id: "biometric", label: "Biometric or card-based check-in", tier: "advanced", weight: 8, module: "attendanceAuto" },
          { id: "gate-sms", label: "Arrival and departure SMS to parents on gate scan", tier: "advanced", weight: 5, module: "attendanceAuto" },
        ],
      },
    ],
  },
  {
    id: "assessment",
    number: 6,
    name: "Assessment, examinations & reporting",
    blurb:
      "SBA-based continuous assessment plus end-of-term examination, on the terminal report format parents already recognise.",
    groups: [
      {
        items: [
          { id: "assessment-structure", label: "Assessment structure per level following GES practice, with configurable weightings", tier: "core", weight: 5, headline: true },
          { id: "marks-entry", label: "Marks entry by subject teacher, per class, validated against maximum scores", tier: "core", weight: 5 },
          { id: "auto-totals", label: "Automatic totals, averages, grades and positions", tier: "core", weight: 3 },
          { id: "grading-scales", label: "Configurable grading scales per section: descriptive for preschool, numeric for Primary and JHS", tier: "core", weight: 3 },
          { id: "report-card", label: "Terminal report card on school letterhead with remarks, attendance, position, reopening date and fee balance", tier: "core", weight: 8, headline: true },
          { id: "bulk-print", label: "Bulk printing of report cards for a whole class", tier: "core", weight: 3 },
          { id: "broadsheet", label: "Broadsheet and class performance sheet for the head teacher", tier: "core", weight: 3 },
          { id: "preschool-checklists", label: "Preschool developmental checklists instead of marks (motor skills, social, language)", tier: "standard", weight: 3 },
          { id: "release-control", label: "Report card release control: the head teacher approves before parents see", tier: "standard", weight: 2 },
          { id: "midterm-mock", label: "Mid-term and mock examination cycles", tier: "standard", weight: 3 },
          { id: "transcript", label: "Cumulative transcript covering the pupil's entire time at the school", tier: "standard", weight: 3, headline: true },
          { id: "progress-track", label: "Progress tracking of a single student across all years", tier: "standard", weight: 3 },
          { id: "teacher-analytics", label: "Subject and teacher performance analytics across terms", tier: "advanced", weight: 5, module: "analytics" },
          { id: "bece-register", label: "BECE candidate register: index numbers, subject entries, candidate photos and data export", tier: "advanced", weight: 5, module: "exams" },
          { id: "ca-portfolio", label: "Continuous assessment portfolio with uploaded work samples", tier: "advanced", weight: 3, module: "exams" },
          { id: "predicted-grades", label: "Predicted grades and intervention flagging", tier: "advanced", weight: 3, module: "exams" },
        ],
      },
    ],
  },
  {
    id: "finance",
    number: 7,
    name: "Accounting & finance",
    blurb: "Fees in, salaries out, and a receipt number that can never be reused.",
    groups: [
      {
        name: "Fee setup",
        items: [
          { id: "fee-structure", label: "Fee structure per level per term, unlimited items (tuition, feeding, transport, PTA, exam, ICT, books)", tier: "core", weight: 5 },
          { id: "fee-optional", label: "Compulsory against optional fee items", tier: "core", weight: 2 },
          { id: "fee-per-section", label: "Different fee structures per section, applied automatically by the pupil's class", tier: "core", weight: 2 },
          { id: "fee-versioning", label: "Fee changes effective by term without breaking historical records", tier: "core", weight: 3 },
          { id: "discounts", label: "Discounts and scholarships: sibling, staff-child, bursary, full or partial, with reason and approver", tier: "advanced", weight: 5, module: "feesPlus" },
          { id: "instalments", label: "Instalment plans and agreed payment schedules per family", tier: "advanced", weight: 5, module: "feesPlus" },
        ],
      },
      {
        name: "Billing & collection",
        items: [
          { id: "billing-auto", label: "Automatic bill generation per student per term, carrying forward arrears", tier: "core", weight: 5, headline: true },
          { id: "payment-record", label: "Payment recording: cash, Mobile Money, bank transfer, cheque, POS", tier: "core", weight: 3 },
          { id: "receipt", label: "Instant printed or SMS receipt, with sequential non-reusable receipt numbers", tier: "core", weight: 3, headline: true },
          { id: "statement", label: "Per-student statement and balance", tier: "core", weight: 3 },
          { id: "debtors", label: "Debtors list and defaulter reports by class", tier: "core", weight: 3 },
          { id: "momo", label: "Mobile Money integration: MTN MoMo, Telecel Cash, AT Money, matched automatically to student accounts", tier: "standard", weight: 8, headline: true },
          { id: "momo-refs", label: "Payment reference codes so MoMo payments auto-reconcile", tier: "standard", weight: 3 },
          { id: "fee-reminder-sms", label: "Automated fee reminder SMS with the outstanding balance", tier: "standard", weight: 3 },
          { id: "ageing", label: "Fee ageing analysis", tier: "standard", weight: 2 },
          { id: "family-statement", label: "Formatted printable family statement across several children", tier: "advanced", weight: 3, module: "feesPlus" },
          { id: "bank-recon", label: "Bank deposit slip reconciliation", tier: "advanced", weight: 5, module: "feesPlus" },
        ],
      },
      {
        name: "Expenditure & books",
        items: [
          { id: "expenses", label: "Expense recording by category", tier: "advanced", weight: 3, module: "books" },
          { id: "petty-cash", label: "Petty cash with float and retirement", tier: "advanced", weight: 3, module: "books" },
          { id: "vendors", label: "Supplier and vendor records with payables", tier: "advanced", weight: 3, module: "books" },
          { id: "requisition", label: "Requisition and approval workflow", tier: "advanced", weight: 5, module: "books" },
          { id: "budget", label: "Budget setting with actual against budget tracking", tier: "advanced", weight: 5, module: "books" },
          { id: "cashbook", label: "Bank account and cash book management", tier: "advanced", weight: 5, module: "books" },
          { id: "financials", label: "Income statement, balance sheet and cash flow reports", tier: "advanced", weight: 8, module: "books" },
        ],
      },
      {
        name: "Payroll",
        items: [
          { id: "salary-structure", label: "Salary structure per staff member, allowances and deductions", tier: "standard", weight: 3 },
          { id: "payroll-run", label: "Monthly payroll run with payslip generation", tier: "standard", weight: 5 },
          { id: "ssnit-paye", label: "SSNIT (Tier 1 and 2) and PAYE computation on current GRA bands", tier: "advanced", weight: 8, module: "payroll" },
          { id: "loans", label: "Loans and salary advances with automatic recovery", tier: "advanced", weight: 3, module: "payroll" },
          { id: "payroll-journal", label: "Payroll journal posting to expenses", tier: "advanced", weight: 3, module: "payroll" },
          { id: "payroll-export", label: "Bulk bank or MoMo payment file export", tier: "advanced", weight: 3, module: "payroll" },
        ],
      },
      {
        name: "Controls",
        items: [
          { id: "txn-audit", label: "Every transaction tied to a user and timestamped; voided with a reason rather than deleted", tier: "core", weight: 2 },
          { id: "cashier-summary", label: "Daily collection summary per cashier for handover", tier: "core", weight: 2 },
        ],
      },
    ],
  },
  {
    id: "communications",
    number: 8,
    name: "Parent communications",
    blurb: "Every parent has a phone. SMS is the guaranteed channel; WhatsApp and the portal are enhancements.",
    groups: [
      {
        items: [
          { id: "bulk-sms", label: "Bulk SMS to the whole school, a section, a level, a class, or a filtered group (all debtors, all JHS 2 parents)", tier: "core", weight: 5, headline: true },
          { id: "individual-msg", label: "Individual messaging to a specific parent, logged against the student record", tier: "core", weight: 2 },
          { id: "templates", label: "Message templates for recurring notices (reopening, vacation, PTA, fees due)", tier: "core", weight: 2 },
          { id: "comms-history", label: "Full communication history retained on the student file", tier: "core", weight: 2 },
          { id: "noticeboard", label: "Announcements and events noticeboard", tier: "core", weight: 2 },
          { id: "delivery-reports", label: "Delivery reports and failed-number flagging", tier: "standard", weight: 3 },
          { id: "auto-triggers", label: "Automated triggers: fee reminder, report card ready, term reopening countdown", tier: "standard", weight: 3 },
          { id: "permission-slips", label: "Permission slips and consent collection", tier: "standard", weight: 3 },
          { id: "whatsapp", label: "WhatsApp integration over the WhatsApp Business API", tier: "advanced", weight: 8, module: "whatsapp" },
          { id: "wa-setup", label: "Meta Business verification, dedicated number onboarding and permanent token setup, done with the school", tier: "advanced", weight: 3, module: "whatsapp" },
          { id: "wa-templates", label: "Message template library, submitted to Meta for pre-approval and versioned", tier: "advanced", weight: 3, module: "whatsapp" },
          { id: "wa-delivery", label: "Per-message delivery receipts and failure handling (sent is not delivered)", tier: "advanced", weight: 3, module: "whatsapp" },
          { id: "wa-optout", label: "Opt-out handling and consent capture, per the Data Protection Act", tier: "advanced", weight: 2, module: "whatsapp" },
          { id: "parent-app", label: "Parent portal and app: attendance, results, fee balance, pay online, download report cards", tier: "advanced", weight: 8, module: "portal" },
          { id: "two-way", label: "Two-way messaging with replies landing in a staff inbox", tier: "advanced", weight: 5, module: "portal" },
          { id: "pt-booking", label: "Parent-teacher meeting booking with slot selection", tier: "advanced", weight: 3, module: "portal" },
        ],
      },
    ],
  },
  {
    id: "behaviour",
    number: 9,
    name: "Behaviour, discipline & welfare",
    blurb: "The incident log and conduct summary sit in Core. Everything beyond them is the Welfare module.",
    groups: [
      {
        items: [
          { id: "incident-log", label: "Incident log: what happened, when, who was involved, who reported it", tier: "core", weight: 3 },
          { id: "conduct-summary", label: "Conduct summary printed on terminal reports and leaving certificates", tier: "core", weight: 2 },
          { id: "merits", label: "Merit and commendation records as well as sanctions", tier: "advanced", weight: 2, module: "welfare" },
          { id: "sanctions", label: "Sanction tracking (detention, suspension, parent invitation) with outcomes", tier: "advanced", weight: 3, module: "welfare" },
          { id: "incident-notify", label: "Parent notification on incidents, logged", tier: "advanced", weight: 2, module: "welfare" },
          { id: "sickbay", label: "Sick bay and first aid log: complaint, treatment, whether a parent was called, whether the child went home", tier: "advanced", weight: 3, module: "welfare" },
          { id: "medication", label: "Medication administration record with parental consent", tier: "advanced", weight: 3, module: "welfare" },
          { id: "safeguarding", label: "Safeguarding flags with tightly controlled visibility", tier: "advanced", weight: 5, module: "welfare" },
        ],
      },
    ],
  },
  {
    id: "reports",
    number: 10,
    name: "Reports & dashboards",
    blurb: "What the head teacher needs before assembly, and what the proprietor needs before a board meeting.",
    groups: [
      {
        items: [
          { id: "head-dashboard", label: "Head teacher dashboard: enrolment, attendance today, fees collected, outstanding balance, staff present", tier: "core", weight: 5, headline: true },
          { id: "enrolment-reports", label: "Enrolment reports by section, level, class, sex and age", tier: "core", weight: 3 },
          { id: "export", label: "Export to Excel and PDF on every report", tier: "core", weight: 2 },
          { id: "class-lists", label: "Class lists, contact lists and register printouts", tier: "standard", weight: 2 },
          { id: "enrolment-trends", label: "Term-on-term and year-on-year enrolment trends", tier: "advanced", weight: 3, module: "analytics" },
          { id: "board-financials", label: "Financial summary reports for the proprietor and board", tier: "advanced", weight: 5, module: "analytics" },
          { id: "academic-analytics", label: "Academic performance analytics by class, subject and teacher", tier: "advanced", weight: 5, module: "analytics" },
          { id: "attendance-analytics", label: "Attendance analytics", tier: "advanced", weight: 3, module: "analytics" },
          { id: "report-builder", label: "Custom report builder", tier: "advanced", weight: 8, module: "analytics" },
          { id: "proprietor-mobile", label: "Proprietor mobile dashboard", tier: "advanced", weight: 5, module: "portal" },
        ],
      },
    ],
  },
  {
    id: "library",
    number: 11,
    name: "Library, books & learning resources",
    blurb: "Sold whole, as one module.",
    groups: [
      {
        items: [
          { id: "book-catalogue", label: "Book and resource catalogue with copies and condition", tier: "advanced", weight: 3, module: "library" },
          { id: "issue-return", label: "Issue and return against a student or staff ID", tier: "advanced", weight: 3, module: "library" },
          { id: "overdue", label: "Overdue tracking and reminders", tier: "advanced", weight: 2, module: "library" },
          { id: "textbook-term", label: "Textbook issue per term and return at vacation", tier: "advanced", weight: 3, module: "library" },
          { id: "library-fines", label: "Fines linked to the student's fee account", tier: "advanced", weight: 3, module: "library" },
          { id: "digital-library", label: "Digital resource library: notes, past questions, worksheets by class", tier: "advanced", weight: 5, module: "library" },
        ],
      },
    ],
  },
  {
    id: "admin",
    number: 12,
    name: "System administration, security & compliance",
    blurb: "An accountant cannot edit marks. A teacher cannot see salaries. The school owns its data and can take it out.",
    groups: [
      {
        items: [
          { id: "rbac", label: "Role-based access: Proprietor, Head Teacher, Section Head, Class Teacher, Subject Teacher, Accountant, Front Desk", tier: "core", weight: 5, headline: true },
          { id: "permissions", label: "Granular permissions: an accountant cannot edit marks, a teacher cannot see salaries", tier: "core", weight: 3 },
          { id: "accounts", label: "Individual user accounts with a password policy, and no shared logins", tier: "core", weight: 2 },
          { id: "backups", label: "Automated encrypted backups with restore capability", tier: "core", weight: 3 },
          { id: "retention", label: "Data retention across the full lifecycle and beyond", tier: "core", weight: 1 },
          { id: "import", label: "Bulk data import from existing spreadsheets and registers during setup", tier: "core", weight: 5, headline: true },
          { id: "export-all", label: "Bulk export: the school owns its data and can take it out", tier: "core", weight: 2 },
          { id: "dpa", label: "Data Protection Act, 2012 (Act 843) alignment: lawful basis, consent capture, access requests", tier: "standard", weight: 3 },
          { id: "session", label: "Session timeouts and login history", tier: "standard", weight: 2 },
          { id: "audit-viewer", label: "Full audit trail viewer: who changed what field, when, with before and after values", tier: "advanced", weight: 5, module: "platform" },
          { id: "twofa", label: "Two-factor authentication for finance and admin roles", tier: "advanced", weight: 3, module: "platform" },
          { id: "ip-restrict", label: "IP or device restriction for finance functions", tier: "advanced", weight: 3, module: "platform" },
        ],
      },
    ],
  },
  {
    id: "exit",
    number: 13,
    name: "Exit, alumni & transitions",
    blurb: "Basic 6 becomes JHS 1 without a re-admission. Same ID, same file.",
    groups: [
      {
        items: [
          { id: "withdrawal", label: "Withdrawal and transfer processing: reason, effective date, fee and property clearance", tier: "core", weight: 3 },
          { id: "transfer-letter", label: "Transfer letter and testimonial generation", tier: "core", weight: 2 },
          { id: "leaving-cert", label: "Leaving certificate with attendance and conduct summary", tier: "core", weight: 2 },
          { id: "bulk-promotion", label: "End-of-year bulk promotion, repetition and graduation processing", tier: "core", weight: 5 },
          { id: "b6-to-jhs", label: "Automatic transition of Basic 6 into JHS 1 without re-admission: same ID, same file", tier: "core", weight: 3, headline: true },
          { id: "alumni-register", label: "Graduate and alumni register with contact details and destination school", tier: "standard", weight: 2 },
          { id: "records-request", label: "Records request handling: a transcript produced years later, in minutes", tier: "standard", weight: 2 },
          { id: "bece-results", label: "BECE results capture against the alumni record", tier: "advanced", weight: 2, module: "exams" },
          { id: "cssps", label: "SHS placement (CSSPS) tracking", tier: "advanced", weight: 3, module: "exams" },
          { id: "alumni-comms", label: "Alumni communications and reunion or fundraising lists", tier: "advanced", weight: 3, module: "exams" },
        ],
      },
    ],
  },
  {
    id: "offline",
    number: 14,
    name: "Offline capability",
    blurb:
      "Built as an installable Progressive Web App, not an app-store application. One codebase serves the office computer and the teachers' phones.",
    groups: [
      {
        items: [
          { id: "resilient-online", label: "Resilient online: aggressive caching, auto-retry, nothing lost when a save fails mid-connection", tier: "core", weight: 5, headline: true },
          { id: "offline-attendance", label: "True offline attendance marking, syncing when the connection returns", tier: "advanced", weight: 8, module: "offline" },
          { id: "offline-marks", label: "True offline marks entry, append-only and safe to sync", tier: "advanced", weight: 5, module: "offline" },
          { id: "offline-fees", label: "Offline fee collection on one designated device with a reserved receipt number block", tier: "advanced", weight: 8, module: "offlineFees" },
          { id: "offline-receipt-blocks", label: "Reserved receipt number blocks issued per device, so two receipts can never share a number", tier: "advanced", weight: 3, module: "offlineFees" },
          { id: "offline-conflict", label: "Duplicate payment detection when an offline device rejoins the network", tier: "advanced", weight: 3, module: "offlineFees" },
          { id: "offline-device-lock", label: "Single designated device enforcement, which is what makes offline collection safe at all", tier: "advanced", weight: 2, module: "offlineFees" },
        ],
      },
    ],
  },
];

/** Every item, flattened. */
export const ALL_ITEMS: CatalogueItem[] = CATALOGUE.flatMap((c) =>
  c.groups.flatMap((g) => g.items),
);

export const ITEM_BY_ID: Record<string, CatalogueItem> = Object.fromEntries(
  ALL_ITEMS.map((i) => [i.id, i]),
);

export function itemsInTier(tier: Tier): CatalogueItem[] {
  return ALL_ITEMS.filter((i) => i.tier === tier);
}

export function itemsInModule(module: ModuleId): CatalogueItem[] {
  return ALL_ITEMS.filter((i) => i.module === module);
}

/** Sum of complexity weights, the basis of every derived price. */
export function points(items: CatalogueItem[]): number {
  return items.reduce((sum, i) => sum + i.weight, 0);
}
