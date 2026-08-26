import { VERIFY_BASE_URL, type DocumentRecord } from "@/lib/documents/registry";
import { DocumentFooter } from "./document-footer";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-gray-100 py-3 text-base last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{children}</p>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-base leading-7 text-gray-700">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}

function MiniBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm leading-6 text-gray-600">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
      <span>{children}</span>
    </li>
  );
}

/** A lead point: soft number badge, warm title, short line. */
function LeadPoint({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="avoid-break flex gap-4 py-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold tabular-nums text-primary">
        {n}
      </span>
      <div>
        <p className="text-lg font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-base leading-7 text-gray-600">{children}</p>
      </div>
    </div>
  );
}

/** One of the three ways to take the system. */
function OptionCard({
  label,
  name,
  headline,
  sub,
  recurring,
  recurringNote,
  children,
  featured,
}: {
  label: string;
  name: string;
  headline: string;
  sub: string;
  recurring: string;
  recurringNote: string;
  children: React.ReactNode;
  featured?: boolean;
}) {
  return (
    <div
      className={`avoid-break mb-8 rounded-lg border p-6 ${
        featured ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <Eyebrow>{label}</Eyebrow>
          <p className="mt-2 text-2xl font-semibold leading-tight text-gray-900">{name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-3xl font-bold leading-none tabular-nums text-gray-900">{headline}</p>
          <p className="mt-1.5 text-sm text-gray-600">{sub}</p>
          <p className="mt-3 text-lg font-semibold tabular-nums text-primary">{recurring}</p>
          <p className="text-sm text-gray-600">{recurringNote}</p>
        </div>
      </div>
      <div className="mt-5 border-t border-gray-200 pt-5">{children}</div>
    </div>
  );
}

/**
 * Shammah Preparatory School, School Management System proposal.
 *
 * Three ways to take the same system, deliberately: a Foundation build at GHS 6,000
 * that runs the school from day one, the Complete system bought outright at GHS 18,000,
 * and the Complete system rented at GHS 15 per pupil per term with no build fee at all.
 *
 * Two decisions worth remembering. Care is billed **per term, not per month**, because a
 * school receives money three times a year and is empty in August. And the rented option
 * is metered **per pupil only, never per staff member** — metering staff would push the
 * school to keep teachers out of the system, which would kill attendance, payroll,
 * teaching load and appraisals. Never meter what you want them to use more of.
 *
 * Bespoke body authored locally; system metadata (ID, dates, system, timestamp, verify QR)
 * is driven by the registry record so it stays in sync with what /verify/{id} confirms.
 */
export function ShammahSchoolMisProposal({ record }: { record: DocumentRecord }) {
  return (
    <>
      <p className="my-2 break-all text-[10px] tracking-wide text-gray-400">
        {VERIFY_BASE_URL.replace(/^https?:\/\//, "")}/verify/{record.id}
      </p>

      {/* Letterhead */}
      <div className="mb-8 flex items-start justify-between gap-6 rounded-lg bg-primary/10 p-6">
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
            {record.type}
          </h2>
          <p className="text-sm text-gray-600">Ref: {record.reference}</p>
          <p className="text-sm text-gray-600">Issue Date: {record.issueDate}</p>
          {record.validUntil && (
            <p className="text-sm text-gray-600">Valid Until: {record.validUntil}</p>
          )}
        </div>
      </div>

      {/* Prepared For */}
      <div className="mb-10">
        <Eyebrow>Prepared For</Eyebrow>
        <p className="mt-2 text-lg font-semibold text-gray-900">Shammah Preparatory School</p>
        <p className="text-base text-gray-600">Preparatory School, Tamale, Northern Region</p>

        <div className="mt-4 rounded-lg border border-primary/10 bg-white p-5">
          <DetailRow label="What we propose" value="A school management system, built for the school" />
          <DetailRow label="Foundation build" value="GHS 6,000, one time" />
          <DetailRow label="Foundation care plan" value="GHS 2,000 per term" />
          <DetailRow label="Complete system, bought" value="GHS 18,000 build, GHS 4,000 per term" />
          <DetailRow label="Complete system, rented" value="No build fee, GHS 15 per pupil per term" />
          <DetailRow label="This offer holds" value="21 days from the issue date above" />
        </div>
      </div>

      {/* Opening */}
      <div className="mb-10">
        <p className="text-base leading-8 text-gray-700">
          Shammah Preparatory School already runs well. What is changing is the JHS. That means a
          second set of subjects, a second report card format, a second fee structure, and in three
          years a first BECE cohort. All of it on the same children, who must carry one record from
          KG through to the day they leave.
        </p>
        <p className="mt-4 text-base leading-8 text-gray-700">
          That is the moment a paper system stops holding. Not because anyone is doing it badly, but
          because the same pupil now exists in more registers, more mark sheets and more fee books
          than one office can reconcile by hand at the end of every term.
        </p>
        <p className="mt-4 text-base leading-8 text-gray-700">
          We would like to build you the system that carries it. Below are three ways to take it,
          priced so that the school can start at a level it is comfortable with and move up when it
          chooses to.
        </p>
      </div>

      {/* What the system rests on */}
      <div className="mb-10">
        <Eyebrow>What The System Rests On</Eyebrow>
        <h3 className="mt-2 text-2xl font-semibold leading-snug text-gray-900">
          Four commitments, whichever option you choose
        </h3>
        <div className="mt-2 divide-y divide-gray-100">
          <LeadPoint n={1} title="One record, one lifetime">
            A pupil is created once at application and the same record carries them through every
            class, term, payment and report card, out to graduation or transfer. Basic 6 becomes JHS
            1 without a re-admission: same ID, same file. Nothing is re-keyed and nothing is
            orphaned.
          </LeadPoint>
          <LeadPoint n={2} title="No structural limits, and no structural billing">
            The school defines its own sections, levels and classes without limit. Preschool,
            Primary, the new JHS, and anything you add in ten years. Opening the JHS is a
            configuration change you make yourself, not something you buy from us.
          </LeadPoint>
          <LeadPoint n={3} title="Built for Tamale, not for a brochure">
            A dropped connection never loses a save. The register is marked in under a minute. Every
            printed report follows GES practice, with SBA continuous assessment, familiar terminal
            report formats, Mobile Money, SSNIT and PAYE, and compliance with the Data Protection
            Act, 2012 (Act 843).
          </LeadPoint>
          <LeadPoint n={4} title="The school owns its data, always">
            Every record can be exported in full, at any time, without asking us. That is true on
            the day you start and on the day you might leave.
          </LeadPoint>
        </div>
      </div>

      {/* THE OPTIONS */}
      <div className="mb-6">
        <Eyebrow>The Three Ways To Take It</Eyebrow>
        <h3 className="mt-2 text-2xl font-semibold leading-snug text-gray-900">
          Start where you are comfortable
        </h3>
        <p className="mt-3 text-base leading-8 text-gray-700">
          The same system underneath, offered three ways. Option one is a complete, working school
          system at a price a school can decide on this term. Option two is everything we build.
          Option three is everything we build, with nothing to pay for the build at all.
        </p>
      </div>

      {/* Option 1 */}
      <OptionCard
        label="Option One"
        name="The Foundation"
        headline="GHS 6,000"
        sub="one time, to build"
        recurring="GHS 2,000"
        recurringNote="per term thereafter"
      >
        <p className="text-base leading-7 text-gray-700">
          Everything needed to run Shammah from the first day of next term, including the JHS. This
          is not a trial or a cut-down version. It is a whole school system.
        </p>
        <ul className="mt-4 space-y-2">
          <Bullet>
            <strong>Pupils and guardians.</strong> One file per child holding biodata, photograph,
            enrolment history across every year, documents, emergency contacts and authorised
            pick-up persons, and a critical medical alert for allergies and conditions staff must
            know about. Several guardians per child, with the primary contact, the fee payer and the
            emergency contact allowed to be three different people.
          </Bullet>
          <Bullet>
            <strong>Admissions to enrolment.</strong> Online or paper application, document upload,
            and one-click conversion of an applicant into a pupil carrying every field forward.
            Admission numbers generated automatically in your own format.
          </Bullet>
          <Bullet>
            <strong>Classes, subjects and the calendar.</strong> Unlimited sections, levels and
            streams. Subjects mapped per level so JHS subjects differ from Primary automatically.
            Period structures that differ between Creche and JHS. A full three-term calendar.
          </Bullet>
          <Bullet>
            <strong>Attendance.</strong> A class register marked in under a minute, with the term
            percentage carried onto the report card by itself.
          </Bullet>
          <Bullet>
            <strong>Assessment and report cards.</strong> SBA continuous assessment plus end-of-term
            examination with your own weightings. Automatic totals, averages, grades and positions.
            Terminal report cards on your letterhead with both teachers&rsquo; remarks, attendance,
            position, the reopening date and the fee balance. Bulk printing for a whole class, and a
            broadsheet for the head teacher.
          </Bullet>
          <Bullet>
            <strong>Fees.</strong> Fee structures per level per term with unlimited items, automatic
            termly billing that carries arrears forward, payments recorded by cash, Mobile Money,
            bank transfer, cheque or POS, receipts with numbers that can never be reused, per-pupil
            statements, a debtors list by class, and one consolidated balance for a family with
            several children.
          </Bullet>
          <Bullet>
            <strong>Parent communication.</strong> Bulk SMS to the whole school, a section, a class,
            or a filtered group such as every debtor. Individual messages logged against the
            pupil&rsquo;s file, saved templates, and a full communication history.
          </Bullet>
          <Bullet>
            <strong>Staff.</strong> Full staff records, roles, contracts, bank and MoMo details,
            class and subject assignments, teaching load, and daily staff attendance.
          </Bullet>
          <Bullet>
            <strong>Behaviour and exit.</strong> An incident log, a conduct summary on reports and
            leaving certificates, transfer letters, testimonials, and end-of-year bulk promotion,
            repetition and graduation.
          </Bullet>
          <Bullet>
            <strong>Control and safety.</strong> Separate accounts for the Proprietor, Head Teacher,
            Class Teachers, the Accountant and the Front Desk, with permissions so an accountant
            cannot edit marks and a teacher cannot see salaries. Automated encrypted backups. An
            immutable financial log where a payment can be voided with a reason but never silently
            deleted.
          </Bullet>
        </ul>

        <p className="mt-5 text-base font-semibold text-gray-900">Also included at this level</p>
        <ul className="mt-2 space-y-1.5">
          <MiniBullet>
            Timetable builder with clash detection, so no teacher or room is double-booked, plus
            per-class, per-teacher and whole-school printable timetables.
          </MiniBullet>
          <MiniBullet>
            Curriculum tagging, so KG to Basic 6 follows the Standards-Based Curriculum and JHS
            follows the Common Core Programme, and report formats follow the level automatically.
          </MiniBullet>
          <MiniBullet>Subject and period attendance for the JHS.</MiniBullet>
          <MiniBullet>Mid-term and mock examination cycles.</MiniBullet>
          <MiniBullet>
            Report card release control, so the head teacher approves before parents see anything.
          </MiniBullet>
          <MiniBullet>
            A cumulative transcript covering a pupil&rsquo;s entire time at the school.
          </MiniBullet>
          <MiniBullet>
            Preschool developmental checklists instead of marks, for the youngest classes.
          </MiniBullet>
          <MiniBullet>
            SMS delivery reports, automated fee reminders and report-card-ready alerts.
          </MiniBullet>
          <MiniBullet>Fee ageing analysis and printable class and contact lists.</MiniBullet>
          <MiniBullet>
            Cloning a whole year&rsquo;s structure into the next year in a single action.
          </MiniBullet>
          <MiniBullet>
            Data Protection Act alignment, session timeouts and login history.
          </MiniBullet>
        </ul>

        <div className="mt-5 rounded border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">
            The GHS 6,000 also covers the work around the software
          </p>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            Moving your existing pupil, staff and fee records off the current registers and
            spreadsheets, setting up your sections, levels, classes, subjects and fee structures,
            loading your letterhead, stamp and signature, and training your staff until they are
            using it without us in the room.
          </p>
        </div>
      </OptionCard>

      {/* Option 2 */}
      <OptionCard
        label="Option Two"
        name="The Complete System"
        headline="GHS 18,000"
        sub="one time, to build"
        recurring="GHS 4,000"
        recurringNote="per term thereafter"
      >
        <p className="text-base leading-7 text-gray-700">
          Everything in the Foundation, and everything else we build. Bought outright, so the system
          is yours.
        </p>
        <ul className="mt-4 space-y-2">
          <Bullet>
            <strong>Mobile Money, integrated.</strong> MTN MoMo, Telecel Cash and AT Money matched
            automatically to a pupil&rsquo;s account by payment reference, so the office stops
            reconciling by hand.
          </Bullet>
          <Bullet>
            <strong>A parent portal and app.</strong> One login for a parent covering every one of
            their children across every level. Attendance, results, fee balance, pay online,
            download report cards. Two-way messages landing in a staff inbox, and parent-teacher
            meeting booking.
          </Bullet>
          <Bullet>
            <strong>WhatsApp.</strong> Notices, reminders and report card alerts delivered on
            WhatsApp Business, alongside SMS rather than instead of it.
          </Bullet>
          <Bullet>
            <strong>Fees, in full.</strong> Sibling, staff-child and bursary discounts with a reason
            and an approver, agreed instalment plans per family, printable family statements, and
            bank deposit reconciliation.
          </Bullet>
          <Bullet>
            <strong>The books.</strong> Expenses, petty cash with float and retirement, suppliers
            and payables, requisitions and approvals, budgets against actuals, cash book, and an
            income statement, balance sheet and cash flow for the board.
          </Bullet>
          <Bullet>
            <strong>Payroll, properly.</strong> SSNIT Tier 1 and 2 and PAYE on current GRA bands,
            salary advances recovered automatically, payroll posted to expenses, and a bulk bank or
            MoMo payment file.
          </Bullet>
          <Bullet>
            <strong>The road to BECE.</strong> The candidate register with index numbers, subject
            entries and photographs, continuous assessment portfolios, predicted grades and
            intervention flags, BECE results captured against the alumni record, and SHS placement
            tracking.
          </Bullet>
          <Bullet>
            <strong>Automatic repetition candidates.</strong> Set your promotion criteria and the
            system flags the pupils who fall below them at year end. The head teacher confirms,
            overrides or clears each one. The system never repeats a child by itself.
          </Bullet>
          <Bullet>
            <strong>Attendance that reaches the parent.</strong> Automatic SMS on an unexplained
            absence, chronic absence pattern flags, and card or biometric check-in at the gate with
            arrival and departure messages.
          </Bullet>
          <Bullet>
            <strong>Welfare and safeguarding.</strong> Full health records, special needs plans, the
            sick bay and medication log, merits alongside sanctions, custody restrictions enforced
            at pick-up, and safeguarding flags with tightly controlled visibility.
          </Bullet>
          <Bullet>
            <strong>Staff, in full.</strong> Qualifications, NTC licences, document collection,
            onboarding checklists, leave with approvals and balances, duty rosters, appraisals,
            lesson observation, CPD records and recruitment.
          </Bullet>
          <Bullet>
            <strong>Teaching operations.</strong> Extra and vacation classes enrolled and billed
            separately from term fees, automatic substitute cover listing the day&rsquo;s affected
            periods, and lesson plan approval.
          </Bullet>
          <Bullet>
            <strong>The library.</strong> Book catalogue, issue and return, termly textbook issue
            and vacation return, overdue reminders, and fines that land on the fee account.
          </Bullet>
          <Bullet>
            <strong>Insight.</strong> Year-on-year enrolment trends, teacher and subject performance
            across terms, attendance analytics, board financial summaries, a custom report builder,
            and a dashboard on the proprietor&rsquo;s phone.
          </Bullet>
          <Bullet>
            <strong>Control.</strong> A full audit trail viewer showing who changed which field and
            when, with before and after values, two-factor authentication on finance, custom fields
            you add yourself, and support for a second campus.
          </Bullet>
          <Bullet>
            <strong>Works with no network at all.</strong> Registers marked and marks entered
            offline, syncing when the connection returns. Offline fee collection on one designated
            device holding a reserved block of receipt numbers, so two receipts can never share a
            number.
          </Bullet>
        </ul>
      </OptionCard>

      {/* Option 3 */}
      <OptionCard
        label="Option Three"
        name="The Complete System, Rented"
        headline="No build fee"
        sub="nothing to pay to start"
        recurring="GHS 15"
        recurringNote="per pupil, per term"
        featured
      >
        <p className="text-base leading-7 text-gray-700">
          Exactly the Complete System described above, with every advanced feature. We carry the
          entire cost of building it and of the infrastructure it runs on. The school pays nothing
          for the build, and instead pays one termly subscription based on how many pupils are
          actually enrolled.
        </p>

        <div className="mt-5 rounded-lg border border-primary/20 bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            At today&rsquo;s enrolment
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-3xl font-bold leading-none tabular-nums text-gray-900">
                GHS 6,300
              </p>
              <p className="mt-1.5 text-sm text-gray-600">
                per term, at 420 pupils. GHS 18,900 across the school year.
              </p>
            </div>
            <p className="max-w-xs text-sm leading-6 text-gray-600">
              That is roughly <strong className="text-gray-900">2% of the fees</strong> the school
              already collects each term, and nothing at all to begin.
            </p>
          </div>
        </div>

        <p className="mt-5 text-base font-semibold text-gray-900">What the subscription covers</p>
        <ul className="mt-2 space-y-1.5">
          <MiniBullet>Every feature in the Complete System, with nothing held back.</MiniBullet>
          <MiniBullet>
            Hosting, encrypted backups, security, and every update we release, at no extra charge.
          </MiniBullet>
          <MiniBullet>
            Support for your staff, and the statutory changes that arrive each year, such as new GRA
            bands.
          </MiniBullet>
          <MiniBullet>
            <strong>Unlimited staff accounts.</strong> We charge per pupil only. Teachers,
            non-teaching staff and management are never counted, so nothing discourages the school
            from putting every member of staff on the system.
          </MiniBullet>
          <MiniBullet>
            No care plan on top. The subscription is the only recurring figure.
          </MiniBullet>
        </ul>

        <p className="mt-5 text-base font-semibold text-gray-900">How the count is taken</p>
        <ul className="mt-2 space-y-1.5">
          <MiniBullet>
            The billed figure is the number of <strong>active pupils the system itself records</strong>{" "}
            on the Friday of week three of each term, once admissions have settled and withdrawals
            have cleared. Neither party estimates it, and it is never in dispute.
          </MiniBullet>
          <MiniBullet>
            A minimum of GHS 3,500 per term applies, whatever the enrolment.
          </MiniBullet>
          <MiniBullet>
            The rental runs for a minimum of six terms, being two academic years, after which it
            continues term by term.
          </MiniBullet>
          <MiniBullet>
            The school owns its data throughout and can export all of it at any moment. The software
            itself remains ours and is licensed to the school for as long as the subscription runs.
          </MiniBullet>
          <MiniBullet>
            At any point the school may buy the system outright, and every subscription payment
            already made is credited in full against the GHS 18,000 build fee.
          </MiniBullet>
        </ul>
      </OptionCard>

      {/* Honest comparison */}
      <div className="avoid-break mb-10 rounded-lg border border-gray-200 p-6">
        <Eyebrow>Which Costs Less</Eyebrow>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-gray-900">
          Renting is cheaper for about two and a half years. After that, owning is
        </h3>
        <p className="mt-3 text-base leading-7 text-gray-700">
          We would rather say this plainly than have you work it out later. Comparing the Complete
          System bought against the Complete System rented, at 420 pupils:
        </p>

        <div className="mt-4 overflow-hidden rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2.5 font-semibold text-gray-700">Total paid by the end of</th>
                <th className="px-4 py-2.5 text-right font-semibold text-gray-700">Rented</th>
                <th className="px-4 py-2.5 text-right font-semibold text-gray-700">Bought</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Year one</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray-900">
                  GHS 18,900
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">GHS 30,000</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Year two</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray-900">
                  GHS 37,800
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">GHS 42,000</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Year three</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">GHS 56,700</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray-900">
                  GHS 54,000
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-base leading-7 text-gray-700">
          If the school can find GHS 18,000 now and intends to keep the system for many years,
          buying wins in the end. If it would rather keep that money in the school and start
          immediately, renting costs less for the first two and a half years and asks for nothing up
          front. Note also that the rented figure rises as the school grows: at 700 pupils it would
          be GHS 10,500 a term. That is the honest trade, and it is why the buy-out credit above
          exists.
        </p>
      </div>

      {/* Not included */}
      <div className="avoid-break mb-10">
        <Eyebrow>What Is Not In These Figures</Eyebrow>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-gray-900">
          The costs that are metered, and are not ours to fix
        </h3>
        <p className="mt-3 text-base leading-7 text-gray-700">
          Some costs are charged per message or per transaction by the networks. We pass them to the
          school at cost plus a small handling margin, and we do not fold them into a fixed fee,
          because doing so would mean either overcharging you or absorbing a loss when the rates
          move.
        </p>
        <ul className="mt-4 space-y-2">
          <Bullet>
            <strong>SMS credits</strong>, bought in blocks. At around 1,000 messages a month a school
            of this size should budget roughly GHS 70 a month.
          </Bullet>
          <Bullet>
            <strong>Mobile Money charges</strong>, levied by the network on each collection, at
            roughly 2% of the amount collected. Many schools choose to pass this to the parent
            instead.
          </Bullet>
          <Bullet>
            <strong>WhatsApp messages</strong>, where selected. Meta charges per delivered message
            and revises its rate card every quarter, so the current per-message rate is given in a
            separate annexe that can be updated without reissuing this proposal. Note that WhatsApp
            also requires a dedicated phone number that cannot be used on the ordinary WhatsApp app,
            and Meta business verification, both of which we will handle with you.
          </Bullet>
          <Bullet>
            <strong>Gate hardware</strong>, where card or biometric check-in is taken. Readers and
            cards are quoted separately once the number of gates is known.
          </Bullet>
        </ul>
      </div>

      {/* Terms */}
      <div className="avoid-break mb-10">
        <Eyebrow>Terms</Eyebrow>
        <ul className="mt-3 space-y-2">
          <Bullet>
            <strong>To begin.</strong> On the Foundation or the Complete System, half of the build
            fee begins the work and the balance falls due on handover. On the rented option there is
            nothing to pay to begin; the first subscription falls due in week three of the first
            term of use.
          </Bullet>
          <Bullet>
            <strong>Care plans</strong> are billed per term, not per month, so they fall due when
            school fees do. They begin the term after handover, never during the build.
          </Bullet>
          <Bullet>
            <strong>Delivery.</strong> The Foundation is delivered within eight weeks of the
            discovery session, in stages you can see. The Complete System is delivered in two
            phases, with everything in the Foundation live first so the school is never waiting on
            the whole thing before it can use any of it.
          </Bullet>
          <Bullet>
            <strong>Your data is yours.</strong> Under every option, the school can export all of
            its records at any time without asking us, and nothing is ever held hostage to an
            invoice.
          </Bullet>
          <Bullet>
            <strong>Moving up.</strong> A school that starts on the Foundation can move to the
            Complete System at any time for the difference of GHS 12,000. Nothing already paid is
            lost, and nothing already entered is re-keyed.
          </Bullet>
          <Bullet>
            <strong>This offer</strong> holds for 21 days from the issue date shown above. Final
            scope is confirmed in one session with the head teacher and the accounts office before
            anything is signed.
          </Bullet>
        </ul>
      </div>

      {/* Next steps */}
      <div className="avoid-break mb-10 rounded-lg bg-primary/5 p-6">
        <Eyebrow>Next Steps</Eyebrow>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-gray-900">
          One conversation, then we begin
        </h3>
        <p className="mt-3 text-base leading-7 text-gray-700">
          Tell us which of the three options fits the school, and we will sit with the head teacher
          and the accounts office for one session. We will walk through your sections and levels,
          your fee structure, your report card format and how you currently talk to parents. That
          session is what we build from, and it costs nothing.
        </p>
        <p className="mt-4 text-base leading-8 text-gray-700">
          If it would help to see the system before deciding, we will show you a working one, with
          real report cards and a real register, on a screen, in Tamale.
        </p>
        <p className="mt-4 text-base font-semibold text-gray-900">
          059 212 3054&nbsp;&nbsp;·&nbsp;&nbsp;050 988 6584&nbsp;&nbsp;·&nbsp;&nbsp;contact@saharabasetech.com
        </p>
      </div>

      <DocumentFooter record={record} />
    </>
  );
}
