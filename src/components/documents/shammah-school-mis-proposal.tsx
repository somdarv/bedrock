import { VERIFY_BASE_URL, type DocumentRecord } from "@/lib/documents/registry";
import {
  completeAddsList,
  countIn,
  foundationList,
  type PackageListSection,
} from "@/lib/school-mis/packages";
import { DocumentFooter } from "./document-footer";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    // Stacks on a phone: several of these values are a full sentence of pricing, and
    // squeezed into a right-hand column they wrap to three or four ragged lines.
    <div className="flex flex-col gap-0.5 border-b border-gray-100 py-3 text-base last:border-b-0 sm:flex-row sm:justify-between sm:gap-6">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800 sm:text-right">{value}</span>
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
      className={`avoid-break mb-8 rounded-lg border p-5 sm:p-6 ${
        featured ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-white"
      }`}
    >
      {/* Name above the price on a phone, side by side from small up. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <Eyebrow>{label}</Eyebrow>
          <p className="mt-2 text-2xl font-semibold leading-tight text-gray-900">{name}</p>
        </div>
        <div className="sm:shrink-0 sm:text-right">
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

/** The appendix lists. Generated from the catalogue so they cannot drift from what we build. */
function FeatureList({ sections }: { sections: PackageListSection[] }) {
  return (
    <div className="mt-5 space-y-5">
      {sections.map((section) => (
        <div key={section.name} className="avoid-break">
          <p className="text-sm font-semibold text-gray-900">{section.name}</p>
          <ul className="mt-1.5 space-y-1">
            {section.items.map((item) => (
              <li key={item} className="flex gap-2 text-[13px] leading-5 text-gray-600">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Shammah Preparatory School, school management system proposal.
 *
 * Three ways to take one system: a GHS 6,000 Foundation build with GHS 2,000 a term,
 * the Complete system bought at GHS 18,000 with GHS 4,000 a term, or the Complete
 * system rented at GHS 20 a pupil a term with no build fee at all.
 *
 * Decisions worth remembering, because each one was reached the hard way:
 *
 *  - Care is billed per term, never per month. A school receives money three times a
 *    year and is empty through August, so monthly billing means chasing during vacation.
 *  - The rental meters pupils only, never staff. Charging per staff member would push
 *    the school to keep teachers off the system, killing attendance, payroll and leave.
 *  - The buy-out credits ONE THIRD of what has been paid, not all of it. At full credit
 *    a renting school owns the system outright inside a year and the rental collapses.
 *  - No figure in here estimates anything about this school. We have not been told its
 *    enrolment, so the only worked example is explicitly a round-number illustration.
 *
 * Language is deliberately plain: short sentences, no jargon, nothing a proprietor
 * would need explained. The appendix lists are generated from the feature catalogue
 * (lib/school-mis/packages.ts) so the list the school reads is the list we build from.
 */
export function ShammahSchoolMisProposal({ record }: { record: DocumentRecord }) {
  const foundation = foundationList();
  const completeAdds = completeAddsList();

  return (
    <>
      <p className="my-2 break-all text-[10px] tracking-wide text-gray-400">
        {VERIFY_BASE_URL.replace(/^https?:\/\//, "")}/verify/{record.id}
      </p>

      {/* Letterhead */}
      <div className="mb-8 flex flex-col gap-5 rounded-lg bg-primary/10 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-6">
        <div>
          <h1 className="mb-4 text-2xl font-semibold leading-tight text-black sm:text-3xl sm:leading-none">
            Saharabase Technologies
          </h1>
          <p className="text-sm text-gray-600">17 Alhaji Sulley Road,</p>
          <p className="text-sm text-gray-600">Abelemkpe, Accra</p>
          <p className="mt-1 text-sm text-gray-600">
            059 212 3054&nbsp;&nbsp;·&nbsp;&nbsp;050 988 6584
          </p>
          <p className="mt-1 text-sm text-gray-600">www.saharabasetech.com</p>
        </div>
        {/* Full width and left-aligned on a phone; the fixed 16rem column only from small up. */}
        <div className="w-full border-t border-primary/15 pt-4 sm:w-64 sm:border-0 sm:pt-0 sm:text-right">
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

        <div className="mt-4 rounded-lg border border-primary/10 bg-white p-4 sm:p-5">
          <DetailRow label="What we are offering" value="A computer system to run the school" />
          <DetailRow label="Option 1, Foundation" value="GHS 6,000 to build, GHS 2,000 a term" />
          <DetailRow label="Option 2, Complete" value="GHS 18,000 to build, GHS 4,000 a term" />
          <DetailRow label="Option 3, Complete, rented" value="Nothing to build, GHS 20 a pupil a term" />
          <DetailRow label="This offer holds for" value="21 days from the date above" />
        </div>
      </div>

      {/* Opening */}
      <div className="mb-10">
        <p className="text-base leading-8 text-gray-700">
          Shammah Preparatory School is opening a JHS. That means new subjects, a new report card,
          a new fee structure, and in three years your first BECE class.
        </p>
        <p className="mt-4 text-base leading-8 text-gray-700">
          It also means the same child now appears in more registers, more mark sheets and more fee
          books than one office can check by hand at the end of every term. That is not anybody
          doing the job badly. It is simply what happens when a school grows.
        </p>
        <p className="mt-4 text-base leading-8 text-gray-700">
          We would like to build you the system that carries it. There are three ways to take it.
          Pick the one that suits the school now. You can always move up later.
        </p>
      </div>

      {/* Promises */}
      <div className="mb-10">
        <Eyebrow>Four Promises</Eyebrow>
        <h3 className="mt-2 text-2xl font-semibold leading-snug text-gray-900">
          True whichever option you pick
        </h3>
        <ul className="mt-4 space-y-3">
          <Bullet>
            <strong>A child is entered once.</strong> From the day they apply to the day they
            leave, it is the same file. Basic 6 becomes JHS 1 with the same number and the same
            record. Nobody types anything twice.
          </Bullet>
          <Bullet>
            <strong>No limits, and no extra charge for growing.</strong> Add as many sections,
            classes and streams as you want. Opening the JHS is something you do yourself. You do
            not buy it from us.
          </Bullet>
          <Bullet>
            <strong>It works here.</strong> If the network drops, nothing you typed is lost. A
            register is marked in under a minute. Report cards come out the way GES expects them.
          </Bullet>
          <Bullet>
            <strong>Your records are yours.</strong> You can download everything, any day, without
            asking us. That is true on your first day and on your last.
          </Bullet>
        </ul>
      </div>

      {/* THE OPTIONS */}
      <div className="mb-6">
        <Eyebrow>The Three Options</Eyebrow>
      </div>

      {/* Option 1 */}
      <OptionCard
        label="Option One"
        name="The Foundation"
        headline="GHS 6,000"
        sub="once, to build it"
        recurring="GHS 2,000"
        recurringNote="a term after that"
      >
        <p className="text-base leading-7 text-gray-700">
          Enough to run the whole school from the first day of next term, JHS included. This is not
          a trial or a small version. It is a working school system.
        </p>
        <ul className="mt-4 space-y-2">
          <Bullet>
            <strong>Pupils.</strong> One file per child. Photo, details, every class they have been
            in, their documents, who to call in an emergency, who is allowed to collect them, and a
            warning note for any allergy or condition staff must know about.
          </Bullet>
          <Bullet>
            <strong>Parents.</strong> More than one guardian per child. The person you call, the
            person who pays, and the person to reach in an emergency can be three different people.
          </Bullet>
          <Bullet>
            <strong>Admissions.</strong> Apply online or on paper. One click turns an applicant
            into a pupil, carrying everything across. Admission numbers are created for you.
          </Bullet>
          <Bullet>
            <strong>Classes and the calendar.</strong> Your sections, levels, streams and subjects,
            set up your way. JHS subjects are different from Primary automatically. A full
            three-term calendar.
          </Bullet>
          <Bullet>
            <strong>Attendance.</strong> Mark a class in under a minute. The term percentage goes
            onto the report card by itself.
          </Bullet>
          <Bullet>
            <strong>Marks and report cards.</strong> Class work and exams with your own weightings.
            Totals, averages, grades and positions worked out for you. Report cards on your
            letterhead with both teachers&rsquo; remarks, attendance, position, the reopening date
            and the fee balance. Print a whole class at once.
          </Bullet>
          <Bullet>
            <strong>Fees.</strong> Your fee structure per class per term. Bills go out
            automatically and last term&rsquo;s balance carries forward. Record cash, Mobile Money,
            bank, cheque or POS. Receipts with numbers that cannot be reused. A debtors list by
            class. One total for a family with several children.
          </Bullet>
          <Bullet>
            <strong>Messages to parents.</strong> Send SMS to the whole school, one class, or just
            the parents who owe. Every message is saved on the child&rsquo;s file.
          </Bullet>
          <Bullet>
            <strong>Staff.</strong> Staff records, roles, contracts, bank details, who teaches what,
            and daily staff attendance.
          </Bullet>
          <Bullet>
            <strong>Timetable.</strong> Build it and the system warns you if a teacher or room is
            booked twice. Print it for each class and each teacher.
          </Bullet>
          <Bullet>
            <strong>Who sees what.</strong> Separate logins for you, the head teacher, teachers, the
            accountant and the front desk. The accountant cannot change marks. A teacher cannot see
            salaries. Backups run on their own.
          </Bullet>
        </ul>

        <div className="mt-5 rounded border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">The GHS 6,000 also covers</p>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            Moving your current pupil, staff and fee records into the system. Setting up your
            classes, subjects and fees. Putting your letterhead, stamp and signature in. Training
            your staff until they can use it without us in the room.
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            <strong className="text-gray-900">Hosting is separate on this option.</strong> The
            system runs on a computer online, and that costs a small amount each year. We set it up
            for you and you pay for it directly, at cost. We do not add anything on top.
          </p>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          The full list of everything in the Foundation is at the end of this document.
        </p>
      </OptionCard>

      {/* Option 2 */}
      <OptionCard
        label="Option Two"
        name="The Complete System"
        headline="GHS 18,000"
        sub="once, to build it"
        recurring="GHS 4,000"
        recurringNote="a term after that"
      >
        <p className="text-base leading-7 text-gray-700">
          Everything in the Foundation, plus everything else we build. It costs more because there
          is a lot more in it, and several parts of it connect to outside services like the mobile
          money networks. Hosting is included in the termly fee, so there is nothing else to pay.
        </p>
        <ul className="mt-4 space-y-2">
          <Bullet>
            <strong>Mobile Money, connected.</strong> MTN, Telecel and AT payments land against the
            right child on their own. The office stops matching payments by hand.
          </Bullet>
          <Bullet>
            <strong>A parent app.</strong> One login per parent covering all their children.
            Attendance, results, fee balance, pay online, download report cards. Parents can reply,
            and replies land in a staff inbox.
          </Bullet>
          <Bullet>
            <strong>WhatsApp.</strong> Send notices and reminders on WhatsApp as well as SMS.
          </Bullet>
          <Bullet>
            <strong>More on fees.</strong> Discounts for siblings, staff children and bursaries,
            with a reason and who approved it. Agreed payment plans for a family. A printed
            statement covering all a parent&rsquo;s children. Bank slips matched up.
          </Bullet>
          <Bullet>
            <strong>Money going out.</strong> Expenses, petty cash, suppliers, requests and
            approvals, budgets against what was actually spent, and accounts for the board.
          </Bullet>
          <Bullet>
            <strong>Payroll.</strong> Payslips, SSNIT, PAYE worked out on current GRA rates, salary
            advances recovered automatically, and a single file to pay everyone at once.
          </Bullet>
          <Bullet>
            <strong>BECE.</strong> The candidate register with index numbers, subjects and photos.
            Results recorded afterwards. SHS placement tracked.
          </Bullet>
          <Bullet>
            <strong>Who should repeat.</strong> Set your own pass rules and the system shows you
            which children fall below them at year end. The head teacher decides. The system never
            repeats a child by itself.
          </Bullet>
          <Bullet>
            <strong>Absence messages.</strong> A parent gets an SMS the same morning their child is
            absent without a reason. The system also flags children who are absent too often.
          </Bullet>
          <Bullet>
            <strong>At the gate.</strong> Card or fingerprint check-in, with a message to the parent
            when the child arrives and leaves.
          </Bullet>
          <Bullet>
            <strong>Health and welfare.</strong> Full health records, special needs plans, the sick
            bay book, medicine given with parent consent, good conduct recorded as well as bad, and
            custody rules enforced at pick-up.
          </Bullet>
          <Bullet>
            <strong>More on staff.</strong> Certificates, licences, leave requests and approvals,
            duty rosters, appraisals, lesson observation, and hiring.
          </Bullet>
          <Bullet>
            <strong>Extra classes.</strong> Run and charge for after-school and vacation classes
            separately from term fees. Arrange cover when a teacher is absent.
          </Bullet>
          <Bullet>
            <strong>The library.</strong> Books in and out, textbooks issued each term and returned
            at vacation, and fines that go onto the fee account.
          </Bullet>
          <Bullet>
            <strong>Reports for you.</strong> Enrolment year on year, how classes and teachers are
            performing, attendance patterns, money summaries for the board, and a dashboard on your
            phone.
          </Bullet>
          <Bullet>
            <strong>Extra safety.</strong> A record of who changed what and when. An extra code on
            top of the password for anyone touching money.
          </Bullet>
          <Bullet>
            <strong>Works with no network.</strong> Mark registers and enter marks with no internet
            at all. It catches up when the connection returns. Fees can also be collected offline on
            one chosen device.
          </Bullet>
        </ul>
      </OptionCard>

      {/* Option 3 */}
      <OptionCard
        label="Option Three"
        name="The Complete System, Rented"
        headline="GHS 20"
        sub="per pupil, per term"
        recurring="Nothing"
        recurringNote="to build, and no hosting fee"
        featured
      >
        <p className="text-base leading-7 text-gray-700">
          The same Complete System described above, with nothing left out. We pay for building it
          and we pay for keeping it running. The school pays nothing to start and instead pays once
          a term, based on how many pupils are actually in the school.
        </p>

        <ul className="mt-4 space-y-2">
          <Bullet>
            <strong>You pay GHS 20 for each pupil, each term.</strong> If pupil numbers go down, the
            bill goes down. There is a minimum of GHS 3,500 a term, so the bill never falls below
            that.
          </Bullet>
          <Bullet>
            <strong>Staff are free.</strong> We only count pupils. Put every teacher, cleaner and
            driver on the system. It does not change your bill.
          </Bullet>
          <Bullet>
            <strong>Everything is included.</strong> Every feature, hosting, backups, support,
            training and every update we make. There is no care plan on top. The termly fee is the
            only bill.
          </Bullet>
          <Bullet>
            <strong>How we count.</strong> The number we charge for is the number of pupils in the
            system on the Friday of the third week of term, after new admissions and withdrawals
            have settled. Neither of us guesses it.
          </Bullet>
          <Bullet>
            <strong>A commitment fee of GHS 3,000 to start.</strong> This is not an extra charge. It
            comes off your first termly payments. We ask for it because we are spending our own
            money to build the system before you have paid anything.
          </Bullet>
          <Bullet>
            <strong>Two school years to begin with.</strong> The school stays for six terms. After
            that you are free to stop at the end of any term, with nothing to pay. We ask for six
            terms because we paid for the build and need enough time to earn it back.
          </Bullet>
          <Bullet>
            <strong>Your records stay yours.</strong> You can download everything at any time. The
            system itself stays ours, and you use it for as long as you are paying.
          </Bullet>
        </ul>

        <div className="mt-5 rounded-lg border border-primary/20 bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-gray-900">You can buy it later if you want to</p>
          <p className="mt-1.5 text-base leading-7 text-gray-700">
            If you decide to own the system instead, we take a third of everything you have already
            paid off the GHS 18,000 price.
          </p>
          <p className="mt-3 text-base leading-7 text-gray-700">
            <strong>An example, using round numbers.</strong> Say a school has 300 pupils, so it
            pays GHS 6,000 a term. After three terms it has paid GHS 18,000. A third of that is GHS
            6,000. So the price to buy the system drops from GHS 18,000 to GHS 12,000, and after
            that there is no more termly rent, only the GHS 4,000 a term care plan.
          </p>
        </div>
      </OptionCard>

      {/* Care plan explained */}
      <div className="avoid-break mb-10 rounded-lg border border-gray-200 p-5 sm:p-6">
        <Eyebrow>About The Care Plan</Eyebrow>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-gray-900">
          Why there is still a termly fee on a system you own
        </h3>
        <p className="mt-3 text-base leading-8 text-gray-700">
          It is a fair question, so here is the plain answer.
        </p>
        <p className="mt-3 text-base leading-8 text-gray-700">
          <strong>Anything we get wrong, we fix free, for as long as you use the system.</strong>{" "}
          That is not what the care plan is for. The care plan is for the things that are nobody&rsquo;s
          mistake.
        </p>
        <ul className="mt-4 space-y-2">
          <Bullet>
            <strong>The rules change.</strong> GRA changes tax rates. GES changes the report card.
            SSNIT changes its percentages. Every year something moves, and somebody has to do that
            work so your system keeps up.
          </Bullet>
          <Bullet>
            <strong>The school changes.</strong> A new fee item. A new class. A new accountant who
            needs training. A teacher who forgets her password in the middle of exams week.
          </Bullet>
          <Bullet>
            <strong>It has to keep running.</strong> The system sits on a computer online, backed up
            every day and kept secure. That costs money every single month, whether anyone touches
            it or not.
          </Bullet>
          <Bullet>
            <strong>Small changes you ask for.</strong> A new report layout, a new user, a small
            adjustment to how something works. These are included rather than quoted for one by one.
          </Bullet>
        </ul>
        <p className="mt-4 text-base leading-8 text-gray-700">
          The simplest way to think about it: you can buy a school bus outright and the bus is
          yours. You still pay for fuel, servicing and a driver.
        </p>
      </div>

      {/* Which costs less */}
      <div className="avoid-break mb-10 rounded-lg border border-gray-200 p-5 sm:p-6">
        <Eyebrow>Which Costs Less</Eyebrow>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-gray-900">
          Renting is cheaper at first. Buying is cheaper if you stay long enough
        </h3>
        <p className="mt-3 text-base leading-8 text-gray-700">
          We would rather say this than have you work it out afterwards. Here it is with round
          numbers, for a school of 300 pupils. Your own figures will differ.
        </p>

        {/* Scrolls sideways on a phone rather than crushing three money columns. */}
        <div className="mt-4 overflow-x-auto rounded border border-gray-200">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2.5 sm:px-4 font-semibold text-gray-700">Total paid by the end of</th>
                <th className="px-3 py-2.5 sm:px-4 text-right font-semibold text-gray-700">Renting</th>
                <th className="px-3 py-2.5 sm:px-4 text-right font-semibold text-gray-700">Buying</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-3 py-2.5 sm:px-4 text-gray-600">Year 1</td>
                <td className="px-3 py-2.5 sm:px-4 text-right font-semibold tabular-nums text-gray-900">
                  GHS 18,000
                </td>
                <td className="px-3 py-2.5 sm:px-4 text-right tabular-nums text-gray-600">GHS 30,000</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 sm:px-4 text-gray-600">Year 2</td>
                <td className="px-3 py-2.5 sm:px-4 text-right font-semibold tabular-nums text-gray-900">
                  GHS 36,000
                </td>
                <td className="px-3 py-2.5 sm:px-4 text-right tabular-nums text-gray-600">GHS 42,000</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 sm:px-4 text-gray-600">Year 3</td>
                <td className="px-3 py-2.5 sm:px-4 text-right tabular-nums text-gray-600">GHS 54,000</td>
                <td className="px-3 py-2.5 sm:px-4 text-right tabular-nums text-gray-600">GHS 54,000</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 sm:px-4 text-gray-600">Year 4</td>
                <td className="px-3 py-2.5 sm:px-4 text-right tabular-nums text-gray-600">GHS 72,000</td>
                <td className="px-3 py-2.5 sm:px-4 text-right font-semibold tabular-nums text-gray-900">
                  GHS 66,000
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-base leading-8 text-gray-700">
          At that size the two come level after three years. Before then renting costs less and asks
          for nothing up front. After then buying costs less. Remember also that the rent follows
          your numbers: if the school grows, the rent grows with it.
        </p>
      </div>

      {/* Costs not included */}
      <div className="avoid-break mb-10">
        <Eyebrow>Costs That Are Not In These Prices</Eyebrow>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-gray-900">
          Things charged by the message or by the transaction
        </h3>
        <p className="mt-3 text-base leading-8 text-gray-700">
          A few things are charged each time they are used, so they cannot sit inside a fixed price.
        </p>
        <ul className="mt-4 space-y-2">
          <Bullet>
            <strong>SMS.</strong> Bought in bundles. We will price this for you once we know how
            many parents you have and how often you want to write to them.
          </Bullet>
          <Bullet>
            <strong>Paying online.</strong> A service charge of 3% applies to money collected
            through the system. This is the normal charge people are already used to when paying by
            Mobile Money. Many schools pass it on to the parent.
          </Bullet>
          <Bullet>
            <strong>WhatsApp.</strong> Charged by Meta for each message delivered, and the rate
            changes every few months, so it is quoted separately and kept up to date. WhatsApp also
            needs its own phone number that cannot be used on the normal WhatsApp app. We handle
            that setup with you.
          </Bullet>
          <Bullet>
            <strong>Gate equipment.</strong> If you want card or fingerprint check-in, the readers
            and cards are quoted separately once we know how many gates.
          </Bullet>
        </ul>
      </div>

      {/* Moving up */}
      <div className="avoid-break mb-10 rounded-lg bg-gray-50 p-5 sm:p-6">
        <Eyebrow>Moving Up Later</Eyebrow>
        <p className="mt-2.5 text-base leading-8 text-gray-700">
          If you start on the Foundation and later want the Complete System, you pay the difference,
          GHS 12,000. Nothing you have already paid is lost, and nothing already in the system has to
          be entered again. The termly fee then moves from GHS 2,000 to GHS 4,000.
        </p>
      </div>

      {/* Terms */}
      <div className="avoid-break mb-10">
        <Eyebrow>Terms</Eyebrow>
        <ul className="mt-3 space-y-2">
          <Bullet>
            <strong>Starting.</strong> On Option 1 and Option 2, half the build fee starts the work
            and the rest is due at handover. On Option 3 there is no build fee, only the GHS 3,000
            commitment fee, which comes back to you against your first payments.
          </Bullet>
          <Bullet>
            <strong>Care plans</strong> are billed each term, not each month, so they fall due when
            school fees do. We will agree the exact start of the first one with you.
          </Bullet>
          <Bullet>
            <strong>Delivery.</strong> The Foundation is ready within about eight weeks of our first
            planning meeting. The Complete System comes in two stages, with the Foundation working
            first, so you are never waiting for everything before you can use anything.
          </Bullet>
          <Bullet>
            <strong>Your records.</strong> Whichever option you choose, you can download all of your
            records at any time. Nothing is ever held back over a bill.
          </Bullet>
          <Bullet>
            <strong>This offer</strong> holds for 21 days from the date at the top. Before anything
            is signed we sit with the head teacher and the accounts office once, to agree exactly
            what is being built.
          </Bullet>
        </ul>
      </div>

      {/* Next steps */}
      <div className="avoid-break mb-12 rounded-lg bg-primary/5 p-5 sm:p-6">
        <Eyebrow>What Happens Next</Eyebrow>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-gray-900">
          One meeting, then we start
        </h3>
        <p className="mt-3 text-base leading-8 text-gray-700">
          Tell us which option suits the school. Then we sit with the head teacher and the accounts
          office once and go through your classes, your fees, your report card and how you talk to
          parents today. That meeting costs nothing and it is what we build from.
        </p>
        <div className="mt-4 flex flex-col gap-1 text-base font-semibold text-gray-900 sm:flex-row sm:gap-4">
          <span>059 212 3054</span>
          <span>050 988 6584</span>
          <span className="break-all">contact@saharabasetech.com</span>
        </div>
      </div>

      {/* ── APPENDIX A ───────────────────────────────────────────── */}
      <div className="mb-10 border-t-2 border-gray-800 pt-6">
        <Eyebrow>Appendix A</Eyebrow>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-gray-900">
          Everything in the Foundation
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          All {countIn(foundation)} items, listed in full, for GHS 6,000.
        </p>
        <FeatureList sections={foundation} />
      </div>

      {/* ── APPENDIX B ───────────────────────────────────────────── */}
      <div className="mb-10 border-t-2 border-gray-800 pt-6">
        <Eyebrow>Appendix B</Eyebrow>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-gray-900">
          What the Complete System adds
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          A further {countIn(completeAdds)} items on top of everything in Appendix A. Included in
          Option 2 and in Option 3.
        </p>
        <FeatureList sections={completeAdds} />
      </div>

      <DocumentFooter record={record} />
    </>
  );
}
