import { type DocumentRecord } from "@/lib/documents/registry";
import { countIn, fullList, type PackageListSection } from "@/lib/school-mis/packages";
import { DocumentFooter } from "./document-footer";
import {
  Bullet,
  BulletList,
  Chip,
  DetailList,
  DetailRow,
  Divider,
  Eyebrow,
  Figure,
  Heading,
  Inset,
  Lead,
  Letterhead,
  Note,
  P,
  Panel,
  Section,
  VerifyLine,
} from "./doc-ui";

const DEMO_URL = "https://shammah.saharabasetech.com";

/** The appendix list. Generated from the catalogue so it cannot drift from what we build. */
function FeatureList({ sections }: { sections: PackageListSection[] }) {
  return (
    <div className="mt-8 space-y-7">
      {sections.map((section) => (
        <div key={section.name}>
          {/*
           * A filled band rather than a boxed group: a category that runs past the
           * bottom of a page still prints cleanly, because nothing is enclosed.
           */}
          <div className="avoid-break rounded-[var(--doc-r-chip)] bg-[var(--doc-fill)] px-5 py-2.5">
            <p className="text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink)]">
              {section.name}
            </p>
          </div>
          <ul className="mt-3 pl-1 sm:columns-2 sm:gap-10">
            {section.items.map((item) => (
              <li
                key={item}
                className="mb-2 flex break-inside-avoid gap-2.5 text-[length:var(--doc-t-xs)] leading-[1.6] text-[var(--doc-ink-body)]"
              >
                <span
                  className="flex h-[1.6em] w-2 shrink-0 items-center justify-center"
                  aria-hidden
                >
                  <span className="h-[3px] w-[3px] rounded-full bg-[var(--doc-ink-soft)]" />
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Stellar Edge School, Techiman. School management system proposal.
 *
 * One system, two ways to pay for it, and the rental leads. GHS 25 a pupil a term with
 * nothing to build, or GHS 22,200 once to own it outright with a GHS 4,000 a term care
 * plan after that.
 *
 * How this differs from the Shammah proposal it grew out of, and why:
 *
 *  - There is no Foundation/Complete split and no build fee at the top. Stellar Edge is
 *    a young school. Asking it to choose between two half-systems before it has seen
 *    either one is a worse conversation than showing it the whole thing on a rental.
 *  - The rental comes first and the buy-out comes last, after every feature has been
 *    read. The price to own only means something once you know what you are owning.
 *  - The GHS 22,200 is itemised. A round number reads as a guess; a total reads as work.
 *  - Care is billed per term, never per month. A school receives money three times a
 *    year and is empty through August, so monthly billing means chasing during vacation.
 *  - The rental meters pupils only, never staff. Charging per staff member would push
 *    the school to keep teachers off the system, killing attendance, payroll and leave.
 *  - Nothing in here estimates this school's enrolment. We have not been told it, so the
 *    only worked example is explicitly a round-number illustration.
 *
 * Voice: we and you, short sentences, plain words, no jargon. The document is asking for
 * a long relationship, not closing a sale, so it says so and then behaves that way.
 */
export function StellarEdgeSchoolProposal({ record }: { record: DocumentRecord }) {
  const everything = fullList();

  return (
    <>
      <VerifyLine record={record} />
      <Letterhead record={record} />

      {/* Prepared For */}
      <Section>
        <Eyebrow>Prepared For</Eyebrow>
        <Heading size="h2" className="mt-3">
          Stellar Edge School
        </Heading>
        <Note className="mt-2">New Sisirease, Techiman, Bono East Region</Note>

        <div className="mt-6">
          <DetailList>
            <DetailRow label="What we are offering" value="One system to run the whole school" />
            <DetailRow label="What it costs to start" value="Nothing to build" />
            <DetailRow label="What you pay" value="GHS 25 a pupil, a term" />
            <DetailRow
              label="If you would rather own it"
              value="GHS 22,200 once, then GHS 4,000 a term"
            />
            <DetailRow label="See it working today" value="shammah.saharabasetech.com" />
            <DetailRow label="This offer holds for" value="21 days from the date above" />
          </DetailList>
        </div>
      </Section>

      {/* Opening */}
      <Section>
        <Lead>
          Stellar Edge School is young, and it is growing. You take children from creche all the way
          through to lower primary, and each one of them already sits in a register, a mark sheet
          and a fee book somewhere.
        </Lead>
        <P className="mt-5">
          Right now that is manageable. It usually stops being manageable quietly, in the term you
          add one more class. Nobody notices until the end of term, when the totals have to be
          checked by hand.
        </P>
        <P className="mt-5">
          We would like to build you the system that carries the school as it grows, and we would
          like to be the people who look after it for you for years. That is what we are proposing.
          Not a piece of software we hand over and leave you with.
        </P>
      </Section>

      {/* See it working */}
      <Section avoidBreak>
        <Panel>
          <Eyebrow>See It Working</Eyebrow>
          <Heading className="mt-3">Open it before you read another line</Heading>
          <P className="mt-5">
            This is a demo. It is a real school system you can click around in, and it will show you
            a good part of what we build and how it feels to use.
          </P>
          <P className="mt-4">
            It is not what you would be handed. Yours would be set up around your classes, your fee
            structure and your report card. Take this as the direction, not the finished thing.
          </P>
          <Inset className="mt-6">
            <p className="text-[length:var(--doc-t-lead)] font-semibold break-all text-[var(--doc-ink)]">
              shammah.saharabasetech.com
            </p>
            <Note className="mt-2">
              We will walk you through it on a call, or sit with you in Techiman. Whichever you
              prefer.
            </Note>
          </Inset>
        </Panel>
      </Section>

      {/* Promises */}
      <Section>
        <Eyebrow>Four Promises</Eyebrow>
        <Heading className="mt-3">True however you decide to pay for it</Heading>
        <BulletList className="mt-6">
          <Bullet>
            <strong>A child is entered once.</strong> From the day they apply to the day they leave,
            it is the same file. Creche becomes nursery becomes Basic 1, with the same number and
            the same record. Nobody types anything twice.
          </Bullet>
          <Bullet>
            <strong>No limits, and no extra charge for growing.</strong> Add as many sections,
            classes and streams as you want. When you open upper primary, you do that yourself. You
            do not buy it from us.
          </Bullet>
          <Bullet>
            <strong>It works here.</strong> If the network drops, nothing you typed is lost. A
            register is marked in under a minute. Report cards come out the way GES expects them.
          </Bullet>
          <Bullet>
            <strong>Your records are yours.</strong> You can download everything, any day, without
            asking us. That is true on your first day and on your last.
          </Bullet>
        </BulletList>
      </Section>

      {/* ── THE RENTAL ───────────────────────────────────────────── */}
      <Section avoidBreak className="mb-8">
        <Eyebrow>How We Suggest You Start</Eyebrow>
        <Panel tone="strong" className="mt-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="min-w-0">
              <Chip tone="ink">The Rental</Chip>
              <Heading size="h2" className="mt-4">
                The whole system, nothing to build
              </Heading>
            </div>
            <div className="doc-invert shrink-0 overflow-hidden rounded-[var(--doc-r-inset)] sm:w-[17rem]">
              <div className="bg-[var(--doc-paper)] px-5 py-5">
                <Figure value="GHS 25" caption="per pupil, per term" />
              </div>
              <div className="bg-[var(--doc-fill-quiet)] px-5 py-4">
                <p className="text-[length:var(--doc-t-lead)] leading-none font-semibold text-[var(--doc-ink)] tabular-nums">
                  Nothing
                </p>
                <p className="mt-1.5 text-[length:var(--doc-t-sm)] text-[var(--doc-ink-soft)]">
                  to build, and no hosting fee
                </p>
              </div>
            </div>
          </div>

          <P className="mt-8">
            We pay to build it and we pay to keep it running. You pay nothing to start, and then
            once a term, based on how many pupils are actually in the school.
          </P>

          <BulletList className="mt-6">
            <Bullet>
              <strong>You pay GHS 25 for each pupil, each term.</strong> If pupil numbers go down,
              the bill goes down with them. There is a minimum of GHS 3,500 a term, so the bill
              never falls below that.
            </Bullet>
            <Bullet>
              <strong>Staff are free.</strong> We only count pupils. Put every teacher, cleaner and
              driver on the system. It does not change your bill.
            </Bullet>
            <Bullet>
              <strong>Everything is included.</strong> Every feature listed below, hosting, backups,
              support, training, every update we make, and the care plan. The termly fee is the only
              bill.
            </Bullet>
            <Bullet>
              <strong>How we count.</strong> The number we charge for is the number of pupils in the
              system on the Friday of the third week of term, after new admissions and withdrawals
              have settled. Neither of us guesses it.
            </Bullet>
            <Bullet>
              <strong>A commitment fee of GHS 3,000 to start.</strong> This is not an extra charge.
              It comes off your first termly payments. We ask for it because we are spending our own
              money to build the system before you have paid anything.
            </Bullet>
            <Bullet>
              <strong>Two school years to begin with.</strong> You stay for six terms. After that
              you are free to stop at the end of any term, with nothing to pay. We ask for six terms
              because we paid for the build and need enough time to earn it back.
            </Bullet>
            <Bullet>
              <strong>Your records stay yours.</strong> You can download everything at any time. The
              system itself stays ours, and you use it for as long as you are paying.
            </Bullet>
          </BulletList>
        </Panel>
      </Section>

      {/* What you get, part one */}
      <Section>
        <Eyebrow>What You Get</Eyebrow>
        <Heading className="mt-3">Running the school, day to day</Heading>
        <P className="mt-5">
          This is the part your office touches every morning. All of it is included from the first
          day of term.
        </P>
        <BulletList className="mt-6">
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
            <strong>Admissions.</strong> Apply online or on paper. One click turns an applicant into
            a pupil, carrying everything across. Admission numbers are created for you.
          </Bullet>
          <Bullet>
            <strong>Classes and the calendar.</strong> Your sections, levels, streams and subjects,
            set up your way. Creche, nursery, kindergarten and primary each keep their own subjects.
            A full three-term calendar.
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
            <strong>Fees.</strong> Your fee structure per class per term. Bills go out automatically
            and last term&rsquo;s balance carries forward. Record cash, Mobile Money, bank, cheque
            or POS. Receipts with numbers that cannot be reused. A debtors list by class. One total
            for a family with several children.
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
        </BulletList>
      </Section>

      {/* What you get, part two */}
      <Section>
        <Heading className="mt-3">And everything else we build</Heading>
        <P className="mt-5">
          None of this is held back for a higher plan. There is no higher plan.
        </P>
        <BulletList className="mt-6">
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
            custody rules enforced at pick-up. This one matters more at your ages than at any other.
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
            performing, attendance patterns, money summaries, and a dashboard on your phone.
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
        </BulletList>
        <Note className="mt-6">The full list, every item, is at the end of this document.</Note>
      </Section>

      {/* ── BUYING IT OUTRIGHT ───────────────────────────────────── */}
      <Section avoidBreak className="mb-8">
        <Eyebrow>If You Would Rather Own It</Eyebrow>
        <Panel className="mt-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="min-w-0">
              <Chip tone="paper">Buying It Outright</Chip>
              <Heading size="h2" className="mt-4">
                The same system, yours to keep
              </Heading>
            </div>
            <div className="shrink-0 overflow-hidden rounded-[var(--doc-r-inset)] sm:w-[17rem]">
              <div className="bg-[var(--doc-paper)] px-5 py-5">
                <Figure value="GHS 22,200" caption="once, to build and hand over" />
              </div>
              <div className="bg-[var(--doc-fill-quiet)] px-5 py-4">
                <p className="text-[length:var(--doc-t-lead)] leading-none font-semibold text-[var(--doc-ink)] tabular-nums">
                  GHS 4,000
                </p>
                <p className="mt-1.5 text-[length:var(--doc-t-sm)] text-[var(--doc-ink-soft)]">
                  a term, care plan
                </p>
              </div>
            </div>
          </div>

          <P className="mt-8">
            Some schools would rather own the thing than rent it. If that is you, this is the same
            system described above, with nothing left out, built and handed over for a single price.
          </P>

          <P className="mt-5">
            The price covers the build itself, moving your current pupil, staff and fee records into
            it, setting up your classes, subjects and fee structure, putting your letterhead and
            your report card into it, and training your staff until they can use it without us in
            the room.
          </P>

          <Inset className="mt-7">
            <p className="text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink)]">
              Owning it does not mean you are on your own
            </p>
            <P className="mt-2.5">
              We stay with the system after you own it. We keep it online, backed up and protected,
              we watch it so you never have to, we are the ones fixing it the morning MTN or
              WhatsApp changes something, and every improvement we build from then on lands in your
              system too. That is the care plan, and it is GHS 4,000 a term.
            </P>
            <P className="mt-4">
              It starts the term after handover, and it is billed per term rather than per month so
              it falls due when school fees do.
            </P>
          </Inset>
        </Panel>
      </Section>

      {/* Proposed figures */}
      <Section avoidBreak>
        <Panel tone="quiet">
          <Eyebrow>About These Figures</Eyebrow>
          <P className="mt-4">
            Everything above is proposed, not fixed. That goes for the amounts and just as much for
            when they are paid. We put real numbers on paper because a proposal with no numbers
            wastes your time, but we would rather agree them with you than hand them to you.
          </P>
          <P className="mt-4">
            If the amount is wrong for the school, or the timing falls in the wrong week of term,
            say so and we will work out something that fits. We would rather start well than start
            on our own numbers.
          </P>
        </Panel>
      </Section>

      {/* Care plan explained */}
      <Section>
        <Panel tone="quiet">
          <Eyebrow>About The Care Plan</Eyebrow>
          <Heading className="mt-3">Why there is still a termly fee on a system you own</Heading>
          <P className="mt-5">It is a fair question, so here is the plain answer.</P>
          <P className="mt-4">
            <strong>First, what the care plan is not for.</strong> Adding a fee item, opening a
            class, changing a teacher, resetting a password: the system does all of that by itself
            and you never pay us for it. Anything we get wrong, we fix free, for as long as you use
            the system. None of that is what you are paying for here.
          </P>
          <P className="mt-4">
            What you are paying for is that the system is still alive, still safe, and still worth
            using in three years. That does not happen on its own.
          </P>
          <BulletList className="mt-6">
            <Bullet>
              <strong>It holds everything, so it has to be protected.</strong> Every child&rsquo;s
              name, photo, home, medical note and emergency contact is in there, and so is every
              cedi the school has collected. It sits on a computer online that has to be paid for,
              patched and watched every month. A school system nobody is watching is one dead disk
              away from losing a term of marks, and one weak password away from something far worse.
              We take that on so it is never a thing you have to think about.
            </Bullet>
            <Bullet>
              <strong>What it plugs into keeps moving, and it moves without warning.</strong> MTN,
              Telecel and AT change how payments come through. Meta changes what WhatsApp costs and
              what it will let you send. SMS providers change their rules. Any one of those can stop
              your fee collection or your parent messages working on a Monday morning, and somebody
              has to be watching for it and fixing it that same morning. That somebody is us.
            </Bullet>
            <Bullet>
              <strong>Someone picks up when it matters.</strong> The two times a school cannot wait
              are exams week and the first three weeks of term. Those are exactly the weeks
              something will go wrong. You are calling people who already know your school and your
              setup, not explaining yourself to a queue.
            </Bullet>
            <Bullet>
              <strong>You get everything we build next.</strong> We are still building this system
              and we will be for years. Whatever we add next term for any school on it lands in
              yours too, at no extra charge. You are not paying to stand still. You are paying to
              keep moving with us, and that is the part that is worth the most over time.
            </Bullet>
          </BulletList>
          <P className="mt-6">
            When GES changes the report card or GRA moves a tax rate, that work is covered too. It
            just is not the main reason, because it does not happen often enough to be one.
          </P>
          <P className="mt-4">
            The simplest way to think about it: you can buy a school bus outright and the bus is
            yours. You still pay for fuel, servicing and a driver.
          </P>
        </Panel>
      </Section>

      {/* Costs not included */}
      <Section avoidBreak>
        <Eyebrow>Costs That Are Not In These Prices</Eyebrow>
        <Heading className="mt-3">Things charged by the message or by the transaction</Heading>
        <P className="mt-5">
          A few things are charged each time they are used, so they cannot sit inside a fixed price.
        </P>
        <BulletList className="mt-6">
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
        </BulletList>
      </Section>

      {/* Terms */}
      <Section avoidBreak>
        <Eyebrow>Terms</Eyebrow>
        <BulletList className="mt-5">
          <Bullet>
            <strong>Starting on the rental.</strong> There is no build fee. A commitment fee of GHS
            3,000 starts the work and comes back to you against your first termly payments. Both the
            amount and when it falls are open to discussion.
          </Bullet>
          <Bullet>
            <strong>Starting on the purchase.</strong> As a starting point, half of the GHS 22,200
            begins the work and the rest is due at handover. If that shape does not suit your term,
            tell us. We will agree an amount and a schedule that the school can actually meet, and
            we are happy to spread it.
          </Bullet>
          <Bullet>
            <strong>Care plans</strong> are billed each term, not each month, so they fall due when
            school fees do. We will agree the exact start of the first one with you.
          </Bullet>
          <Bullet>
            <strong>Delivery.</strong> The school is running on it within about eight weeks of our
            first planning meeting. It comes in stages, with the parts your office uses daily
            working first, so you are never waiting for everything before you can use anything.
          </Bullet>
          <Bullet>
            <strong>Your records.</strong> Whichever way you go, you can download all of your
            records at any time. Nothing is ever held back over a bill.
          </Bullet>
          <Bullet>
            <strong>Nothing here is signed off yet.</strong> Before anything is, we sit down with
            you, the head teacher, whoever keeps your accounts and anyone else you want in the room.
            We go through exactly what is being built, exactly what it costs and exactly when it is
            paid, and we agree all three together. This offer holds for 21 days from the date at the
            top, and if you need longer than that, ask us.
          </Bullet>
        </BulletList>
      </Section>

      {/* Next steps */}
      <Section avoidBreak className="mb-14">
        <Panel tone="ink">
          <Eyebrow>What Happens Next</Eyebrow>
          <Heading size="h2" className="mt-3">
            Open the demo, then give us one meeting
          </Heading>
          <Lead className="mt-5">
            Look at {DEMO_URL.replace(/^https?:\/\//, "")} first. Then we sit down once with you,
            the head teacher and whoever keeps your accounts, and go through your classes, your
            fees, your report card and how you talk to parents today. We agree the numbers and the
            timing in that same meeting. It costs nothing and it is what we build from.
          </Lead>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">
            {["059 212 3054", "050 988 6584", "admin@saharabasetech.com"].map((c) => (
              <span
                key={c}
                className="rounded-[var(--doc-r-chip)] bg-[var(--doc-fill-strong)] px-5 py-2.5 text-center text-[length:var(--doc-t-sm)] font-medium whitespace-nowrap text-[var(--doc-ink)]"
              >
                {c}
              </span>
            ))}
          </div>
        </Panel>
      </Section>

      {/* ── APPENDIX ─────────────────────────────────────────────── */}
      <Divider />
      <Section>
        <Chip>Appendix</Chip>
        <Heading className="mt-4">Everything in the system</Heading>
        <Note className="mt-2">
          All {countIn(everything)} items, listed in full. You get every one of them on the rental,
          and every one of them if you buy it outright.
        </Note>
        <FeatureList sections={everything} />
      </Section>

      <DocumentFooter record={record} />
    </>
  );
}
