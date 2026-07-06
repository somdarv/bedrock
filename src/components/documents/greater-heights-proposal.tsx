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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-base leading-7 text-gray-700">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}

/** A single lead point: a soft number badge, a warm title, and a short line. */
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{children}</p>
  );
}

const DISCOVERY: { heading: string; questions: string[] }[] = [
  {
    heading: "Talking to your parents",
    questions: [
      "How do you send messages, notices, and letters home right now? What works well, and what tends to go wrong?",
      "When something urgent comes up, like a closure or an emergency, how do you reach parents fast?",
      "Do you have good phone or WhatsApp contacts for every parent or guardian?",
    ],
  },
  {
    heading: "Your fees and finances",
    questions: [
      "How do you invoice, collect, and record fees today? Cash, Mobile Money, bank?",
      "How do you keep track of who has paid, who still owes, and how do you send reminders?",
      "Where do payments cost your staff the most time each term?",
    ],
  },
  {
    heading: "Your records and results",
    questions: [
      "How do you record attendance, and do you ever look back at it for patterns?",
      "How do you put together terminal reports and report cards today?",
      "How do you keep and find your admissions and enrolment records?",
    ],
  },
  {
    heading: "Your staff and admin",
    questions: [
      "How do you handle staff records, timetables, and payroll right now?",
      "If one admin task got easier tomorrow, which one would make the biggest difference to you?",
    ],
  },
  {
    heading: "Your presence and reputation",
    questions: [
      "Do you have a website or any presence online yet? If not, that is a quick and powerful place for us to start.",
      "When a parent goes looking for a school like yours, what do you want them to find?",
    ],
  },
];

/**
 * Greater Heights International School, collaboration proposal. Bespoke body authored
 * locally; system metadata (ID, dates, system, timestamp, verify QR) is driven by the
 * registry record so it stays in sync with what /verify/{id} confirms. Unlike a fee
 * schedule, this proposal carries no pricing. It proposes a collaboration, not a sale.
 */
export function GreaterHeightsProposal({ record }: { record: DocumentRecord }) {
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
          <p className="mt-1 text-sm text-gray-600">059 212 3054&nbsp;&nbsp;·&nbsp;&nbsp;050 988 6584</p>
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

      {/* Prepared For, with an at-a-glance summary */}
      <div className="mb-10">
        <Eyebrow>Prepared For</Eyebrow>
        <p className="mt-2 text-lg font-semibold text-gray-900">
          Greater Heights International School
        </p>
        <p className="text-base text-gray-600">Basic School, Tamale</p>

        <div className="mt-4 rounded-lg border border-primary/10 bg-white p-5">
          <DetailRow label="Focus" value="School operations, made digital" />
          <DetailRow label="Engagement" value="A collaborative build, made with you" />
          <DetailRow label="Data ownership" value="Retained fully by the school" />
          <DetailRow label="Getting started" value="A short, friendly conversation" />
        </div>
      </div>

      {/* Opening */}
      <div className="mb-10">
        <p className="text-base leading-8 text-gray-700">
          It is 2026, and so much of the daily work of running your school still happens on paper.
          Letters home to parents, fee records, attendance, terminal reports, admissions. Paper gets
          lost. It reaches only one parent. It leaves no record. And it eats up your staff&apos;s hours
          every term.
        </p>
        <p className="mt-4 text-base leading-8 text-gray-700">
          We would like to change that with you. Not to sell you a finished system, but to sit down
          together, learn how your school really runs, and build something that fits it.
        </p>
      </div>

      {/* The opportunity */}
      <div className="mb-10">
        <Eyebrow>The Opportunity</Eyebrow>
        <h3 className="mt-2 text-2xl font-semibold leading-snug text-gray-900 md:text-3xl">
          Move the daily work off paper, and you gain three things at once
        </h3>
        <div className="mt-4 divide-y divide-gray-100">
          <LeadPoint n={1} title="Smoother days">
            Less time lost to paperwork, chasing, and doing the same thing twice. Your staff get their
            hours back.
          </LeadPoint>
          <LeadPoint n={2} title="A stronger name">
            More and more, parents look a school up before they enrol. A school that runs on clear
            digital tools looks like one that is serious about their child.
          </LeadPoint>
          <LeadPoint n={3} title="Room to stand out">
            In a busy private school market, being the school in Tamale that leads on this is something
            families notice and remember.
          </LeadPoint>
        </div>
      </div>

      {/* What we bring */}
      <div className="avoid-break mb-10">
        <Eyebrow>What We Bring</Eyebrow>
        <div className="mt-4 space-y-5">
          <div>
            <p className="text-lg font-semibold text-gray-900">Work we have already done</p>
            <p className="mt-1 text-base leading-8 text-gray-700">
              We built and run a live learning platform called Slatebod, where professional training
              institutions teach and examine their students online, each with their own instructors,
              their own students, and their own admissions. This is not theory. It is running today,
              with real schools using it every day.
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">The right skills for what you need</p>
            <p className="mt-1 text-base leading-8 text-gray-700">
              Web development, design, and the full setup it takes to get a school system live and
              working in your hands.
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">A real partnership</p>
            <p className="mt-1 text-base leading-8 text-gray-700">
              We build around the way you already work, rather than handing you something rigid that
              you have to bend your school to fit.
            </p>
          </div>
        </div>
      </div>

      {/* What we are offering */}
      <div className="avoid-break mb-10">
        <Eyebrow>What We&apos;re Offering (and What We&apos;re Not)</Eyebrow>
        <p className="mt-2 text-base leading-8 text-gray-700">
          We are not selling you a finished system, and there is no big fee to pay up front. Here is
          what we offer instead.
        </p>
        <ul className="mt-4 space-y-3">
          <Bullet>
            We sit down together and map how your school really runs. The real day to day, not a tidy
            version of it.
          </Bullet>
          <Bullet>
            From there, we design and build a system that fits your school, and we refine it together
            as your staff start to use it.
          </Bullet>
          <Bullet>
            You end up with a tool built around your needs, on terms that work for you, that you can
            grow with over time.
          </Bullet>
        </ul>
      </div>

      {/* An honest word */}
      <div className="avoid-break mb-10 rounded-lg border border-primary/20 bg-primary/5 p-6">
        <Eyebrow>An Honest Word on How This Works</Eyebrow>
        <p className="mt-3 text-base leading-8 text-gray-700">
          We want to be straight with you about what each of us gets, so this feels like a fair
          partnership and not a pitch. You get a system built around your school, made with you, on
          terms that work for you. In return, building alongside a real, working school gives us a
          foundation we can carry into our future work. It is because your input matters so much to us
          that we can offer you the terms we are offering.
        </p>
        <p className="mt-4 text-base font-semibold leading-8 text-gray-900">
          And to be clear, your school&apos;s data stays yours. Your pupils, your parents, your staff,
          your records. All of it stays in your hands.
        </p>
      </div>

      {/* What this could mean for you */}
      <div className="avoid-break mb-10">
        <Eyebrow>What This Could Mean For You</Eyebrow>
        <div className="mt-4 divide-y divide-gray-100">
          <LeadPoint n={1} title="You would be among the first">
            Very few schools around you have taken this step yet. Being the one that does it first is
            the kind of thing parents notice and remember.
          </LeadPoint>
          <LeadPoint n={2} title="Gentle, and step by step">
            We build a little at a time, together, so nothing rests on one big decision made up front.
          </LeadPoint>
          <LeadPoint n={3} title="A partner beside you">
            You shape what gets built, and your records stay in your hands from the very first day.
          </LeadPoint>
        </div>
      </div>

      {/* Discovery, doubles as the meeting agenda */}
      <div className="mb-10">
        <Eyebrow>Getting to Know How You Work</Eyebrow>
        <p className="mt-2 text-base italic leading-7 text-gray-500">
          These are the questions we would love to talk through together in our first conversation.
          Your answers shape everything we build.
        </p>

        <div className="mt-4 divide-y divide-gray-200 border-y border-gray-300">
          {DISCOVERY.map((group) => (
            <div key={group.heading} className="avoid-break grid grid-cols-[210px_1fr] gap-8 py-5">
              <p className="text-base font-semibold text-primary">{group.heading}</p>
              <ol className="space-y-3">
                {group.questions.map((q, i) => (
                  <li key={i} className="flex gap-3 text-base leading-7 text-gray-700">
                    <span className="font-semibold tabular-nums text-gray-400">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* Where we go from here, with contact */}
      <div className="avoid-break mb-8 rounded-lg border border-gray-200 border-t-2 border-t-primary bg-white p-6">
        <Eyebrow>Where We Go From Here</Eyebrow>
        <p className="mt-3 text-base leading-8 text-gray-700">
          Let us sit down for a short session and talk through these questions together. After that,
          we will come back to you with a clear picture of what we could build first.
        </p>
        <p className="mt-4 text-base leading-8 text-gray-700">
          I am ready to have a conversation whenever you are. You can reach me directly.
        </p>
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="text-lg font-semibold text-gray-900">Richard Somda</p>
          <p className="mt-1 text-base text-gray-700">059 212 3054&nbsp;&nbsp;·&nbsp;&nbsp;050 988 6584</p>
          <p className="text-base text-gray-600">SaharaBase Technologies</p>
        </div>
      </div>

      {/* Footer, system metadata + verify QR (dynamic on prepare) */}
      <DocumentFooter record={record} />
    </>
  );
}
