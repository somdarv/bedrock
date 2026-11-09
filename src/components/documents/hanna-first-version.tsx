import { cn } from "@/lib/utils";
import { type DocumentRecord } from "@/lib/documents/registry";
import { DocumentFooter } from "./document-footer";
import {
  DetailList,
  DetailRow,
  Heading,
  Lead,
  Letterhead,
  Note,
  P,
  Panel,
  Section,
  VerifyLine,
} from "./doc-ui";
import {
  Arrow,
  BODY,
  Bridge,
  CLAY_TINT,
  DotList,
  Head,
  INK,
  MICRO,
  Part,
  SM,
  SOFT,
  STEP_BG,
  STEP_SOFT,
  Steps,
  TONE,
  TONE_SOFT,
  XS,
  type Step,
  type StepTone,
  type Tone,
} from "./plan-ui";

/**
 * What we recommend Hanna builds first, and why (PRO-HANNA-65). It answers the brief she sent on
 * 27 October 2026, form "hanna-bizflow". Question ids in the comments below are from that form.
 *
 * It carries no build fee on purpose. The owner has not set one, and her budget (L2) is unset.
 * The product has no settled name either (A1), so the paper says "your system", never BizFlow.
 */

/* Figures */

/** The middle of the GHS 100 to 250 she chose for the smallest plan (K3). */
const MONTHLY_PRICE = 175;
const BUSINESSES = 50;
const TOTAL = BUSINESSES * MONTHLY_PRICE;
/** The top of the 5 to 8% she offered (L2), so the sum is the kindest it can be. */
const OWNERSHIP = 8;
const OUR_SHARE = (TOTAL * OWNERSHIP) / 100;

const ghs = (n: number) => `GHS ${n.toLocaleString("en-GB")}`;

/* 01 What you told us */

const HEARD: { said: string; so: string }[] = [
  {
    said: "You want owners to track their money “at just a glance of a page”.",
    so: "So one home page shows every invoice, with its date and time.",
  },
  {
    said: "You want them to see it “even in their absence”.",
    so: "So the owner gets a message for every payment.",
  },
  {
    said: "You want receipts to go out by themselves after payment.",
    so: "So the system sends them. Nobody has to remember.",
  },
  { said: "You told us some clients have no email.", so: "So a phone number is enough." },
  {
    said: "You told us apps like HoneyBook favour the USA and the UK.",
    so: "So clients pay by MoMo from the first day.",
  },
  {
    said: "You would start with photographers, media agencies and others who take bookings.",
    so: "So we build for them first.",
  },
];

/* 02 Why six parts */

/** All 15 parts she ticked in C1, in the order we would build them. 6 + 4 + 3 + 2. */
const STAGES: { name: string; tone: StepTone; parts: string[]; also?: string }[] = [
  {
    name: "First",
    tone: "clay",
    parts: [
      "Customers",
      "Bookings calendar",
      "Quotes, invoices, receipts",
      "Payments and money owed",
      "Reports, as one home page",
      "Staff logins",
    ],
  },
  {
    name: "Next",
    tone: "date",
    parts: ["Proposals", "Jobs in stages", "Expenses", "Money set aside"],
    also: "Also payment reminders.",
  },
  {
    name: "Then",
    tone: "yours",
    parts: ["Stock", "The till", "Suppliers"],
    also: "Also full offline. This step opens the system to shops.",
  },
  {
    name: "Last",
    tone: "quiet",
    parts: ["Files", "A login page for customers"],
    also: "Also Excel reports, other currencies and AI.",
  },
];

/* 03 What the first version does */

const FLOW: Step[] = [
  { tone: "yoursLight", sub: "A client", title: "Books a shoot" },
  { tone: "yoursLight", sub: "The deposit", title: "Paid by MoMo or card" },
  { tone: "ours", sub: "By itself", title: "The receipt goes out" },
  { tone: "ours", sub: "By itself", title: "The calendar fills" },
  { tone: "clay", sub: "The owner", title: "Sees the payment" },
];

const SAMPLE_TOTALS: [string, string][] = [
  ["Cash collected this month", "GHS 18,400"],
  ["Money owed", "GHS 6,250"],
  ["Overdue", "GHS 1,200"],
];

const SAMPLE_INVOICES: { when: string; who: string; amount: string; state: string }[] = [
  {
    when: "9 Nov, 2:14 pm",
    who: "Wedding shoot, Ama K.",
    amount: "GHS 1,500",
    state: "Deposit paid by MoMo",
  },
  {
    when: "9 Nov, 11:02 am",
    who: "Church event, Kofi A.",
    amount: "GHS 2,400",
    state: "Paid in full by card",
  },
  {
    when: "8 Nov, 4:40 pm",
    who: "Birthday shoot, Efua M.",
    amount: "GHS 800",
    state: "Cash, typed in by Yaw",
  },
  {
    when: "7 Nov, 9:30 am",
    who: "Naming ceremony, Adwoa B.",
    amount: "GHS 1,200",
    state: "Overdue",
  },
];

const SIX_PARTS: { title: string; items: string[] }[] = [
  { title: "Customers", items: ["Name and phone number", "Email only if they have one"] },
  { title: "Bookings calendar", items: ["Jobs and shoots", "Fills from the month’s bookings"] },
  { title: "Quotes, invoices, receipts", items: ["In cedis", "With the business’s own logo"] },
  {
    title: "Payments and money owed",
    items: [
      "MoMo or card, by a link",
      "Deposits and part payments",
      "Cash and bank typed in by staff",
    ],
  },
  {
    title: "The home page",
    items: ["Every invoice, with date and time", "Cash collected", "Money owed", "Overdue"],
  },
  {
    title: "Two logins",
    items: [
      "Owner and staff",
      "Nothing is deleted",
      "The owner cancels, with a reason",
      "Every change is recorded",
    ],
  },
];

/* 04 Where we would change your answers */

const CHANGES: { ask: string; we: string; why: string }[] = [
  {
    ask: "Everything keeps working with no internet.",
    we: "The calendar and the invoice list open with no internet. New entries wait for the connection.",
    why: "Full offline is the biggest single piece of work. MoMo and card links need the internet anyway. So full offline comes with the till, where it matters most.",
  },
  {
    ask: "Documents go out by themselves, from the business’s own WhatsApp.",
    we: "Documents go out by themselves by SMS and email. Staff send WhatsApp with one tap.",
    why: "WhatsApp allows automatic messages only through Meta’s business system. Every business would need its own set-up. Each SMS has a small cost, so the monthly price must cover it.",
  },
  {
    ask: "Zero theft.",
    we: "Link payments go straight to the business. Every client gets a receipt. Nothing is deleted.",
    why: "No system can see cash that nobody types in. So we will not promise zero. We will promise what the system can prove.",
  },
];

/* 05 Who pays for the build */

const SUM: Step[] = [
  { tone: "raised", sub: "Say", title: `${BUSINESSES} businesses are paying` },
  { tone: "raised", sub: "Each pays", title: `${ghs(MONTHLY_PRICE)} a month` },
  { tone: "date", sub: "All together", title: `${ghs(TOTAL)} a month` },
  { tone: "clay", sub: `Our ${OWNERSHIP}%`, title: `${ghs(OUR_SHARE)} a month` },
];

const WAYS: { title: string; tone: Tone; items: string[] }[] = [
  {
    title: "Way 1. You pay for the build.",
    tone: "yoursLight",
    items: [
      "You pay one fixed price for the six parts.",
      "You own the product, its name and its customers.",
      "You keep the subscriptions.",
      "You pay for the hosting and the SMS.",
      "You pay us a monthly fee for support.",
      "The tools we already own stay ours. You hold a licence to use them.",
    ],
  },
  {
    title: "Way 2. We pay for the build.",
    tone: "ours",
    items: [
      "We build it at our own cost.",
      "We own the system.",
      "You sell it to businesses.",
      "You earn a share of every subscription.",
      "Hosting, SMS and support come out of the subscriptions.",
      "We write your share into an agreement.",
    ],
  },
];

/* 06 What we need from you */

const NEEDS: { you: string; so: string; otherwise: string }[] = [
  {
    you: "Choose Way 1 or Way 2.",
    so: "We write the agreement.",
    otherwise: "Nobody has agreed who carries the cost, so we cannot start.",
  },
  {
    you: "Name one real business that takes bookings.",
    so: "We build around its real work.",
    otherwise: "We build on guesses.",
  },
  {
    you: "Choose a name for the system.",
    so: "It goes on every screen and document.",
    otherwise: "Businesses have nothing to remember it by.",
  },
];

const NEXT: Step[] = [
  { tone: "raised", sub: "1", title: "You read this" },
  { tone: "raised", sub: "2", title: "You send us your three answers" },
  { tone: "raised", sub: "3", title: "We send the agreement" },
  { tone: "raised", sub: "4", title: "We start building" },
];

const CONTACTS = [
  ["WhatsApp", "050 988 6584"],
  ["Phone", "+233 59 212 3054"],
  ["Email", "hello@saharabasetech.com"],
];

/* Diagrams */

function Box({
  tone,
  bg,
  label,
  children,
}: {
  tone?: StepTone;
  /** A fill outside the tone code, such as the clay tint. */
  bg?: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-[var(--doc-r-inset)] px-4 py-3.5",
        tone ? STEP_BG[tone] : bg,
      )}
    >
      {label && <p className={cn(MICRO, tone ? STEP_SOFT[tone] : BODY)}>{label}</p>}
      <p className={cn("font-semibold", label && "mt-0.5", XS, INK)}>{children}</p>
    </div>
  );
}

const JOIN = "mx-auto rotate-90 sm:mx-0 sm:rotate-0 sm:self-center";

function HeardRows() {
  return (
    <div className="mt-7 space-y-2">
      {HEARD.map((row) => (
        <div
          key={row.said}
          className="avoid-break flex flex-col gap-2 sm:flex-row sm:items-stretch"
        >
          <Box tone="yoursLight">{row.said}</Box>
          <Arrow className={JOIN} />
          <Box tone="ours">{row.so}</Box>
        </div>
      ))}
    </div>
  );
}

/** Four columns that step down, 6 then 4 then 3 then 2, so the order reads at a glance. */
function PartsBoard() {
  return (
    <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4">
      {STAGES.map((stage) => (
        <div key={stage.name}>
          <p className={cn("font-bold", SM, INK)}>{stage.name}</p>
          <p className={cn(MICRO, SOFT)}>{stage.parts.length} parts</p>
          <div className="mt-2.5 space-y-1.5">
            {stage.parts.map((part) => (
              <div
                key={part}
                className={cn(
                  "rounded-[var(--doc-r-inset)] px-3 py-2.5 font-semibold",
                  XS,
                  INK,
                  STEP_BG[stage.tone],
                )}
              >
                {part}
              </div>
            ))}
          </div>
          {stage.also && <p className={cn("mt-2.5", MICRO, SOFT)}>{stage.also}</p>}
        </div>
      ))}
    </div>
  );
}

/** A picture of the page she keeps asking for. Every name and figure on it is invented. */
function SampleHome() {
  return (
    <Panel tone="base" className="mt-7">
      <div className="grid gap-2 sm:grid-cols-3">
        {SAMPLE_TOTALS.map(([label, value]) => (
          <div
            key={label}
            className="rounded-[var(--doc-r-inset)] bg-[var(--doc-paper)] px-4 py-3.5"
          >
            <p className={cn(MICRO, SOFT)}>{label}</p>
            <p className={cn("mt-1 font-bold tabular-nums", SM, INK)}>{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 overflow-hidden rounded-[var(--doc-r-inset)] [&>div:nth-child(even)]:bg-[var(--doc-fill-quiet)] [&>div:nth-child(odd)]:bg-[var(--doc-paper)]">
        {SAMPLE_INVOICES.map((row) => (
          <div
            key={row.when}
            className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[7.5rem_1fr_5.5rem_10.5rem] sm:items-baseline"
          >
            <p className={cn("col-span-2 sm:col-span-1", MICRO, SOFT)}>{row.when}</p>
            <p className={cn("col-span-2 font-semibold sm:col-span-1", XS, INK)}>{row.who}</p>
            <p className={cn("font-semibold tabular-nums sm:text-right", XS, INK)}>{row.amount}</p>
            <p className={cn("text-right sm:text-left", XS, BODY)}>{row.state}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PartCards() {
  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-3">
      {SIX_PARTS.map((part) => (
        <div
          key={part.title}
          className={cn("avoid-break rounded-[var(--doc-r-inset)] p-4", TONE.yoursLight)}
        >
          <p className={cn("font-bold", XS, INK)}>{part.title}</p>
          <DotList items={part.items} className="mt-2.5" />
        </div>
      ))}
    </div>
  );
}

function ChangeRows() {
  return (
    <div className="mt-7 space-y-6">
      {CHANGES.map((row) => (
        <div key={row.ask} className="avoid-break">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <Box tone="yoursLight" label="You asked for">
              {row.ask}
            </Box>
            <Arrow className={JOIN} />
            <Box tone="ours" label="We would do">
              {row.we}
            </Box>
          </div>
          <Note className="mt-2.5">{row.why}</Note>
        </div>
      ))}
    </div>
  );
}

function WayCards() {
  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-2">
      {WAYS.map((way) => (
        <div
          key={way.title}
          className={cn("avoid-break rounded-[var(--doc-r-panel)] p-6", TONE[way.tone])}
        >
          <p className={cn("font-bold", SM, INK)}>{way.title}</p>
          <DotList items={way.items} className={cn("mt-3", TONE_SOFT[way.tone])} />
        </div>
      ))}
    </div>
  );
}

function NeedRows() {
  return (
    <div className="mt-7 space-y-2">
      {NEEDS.map((row) => (
        <div key={row.you} className="avoid-break flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Box tone="yours" label="You">
            {row.you}
          </Box>
          <Box tone="ours" label="So">
            {row.so}
          </Box>
          <Box bg={CLAY_TINT} label="Otherwise">
            {row.otherwise}
          </Box>
        </div>
      ))}
    </div>
  );
}

/* The document */

export function HannaFirstVersion({ record }: { record: DocumentRecord }) {
  return (
    // Only the style: plain text-pretty also resets wrapping, which breaks the letterhead dates.
    <div className="[&_p]:[text-wrap-style:pretty]">
      <VerifyLine record={record} />
      <Letterhead record={record} />

      <Section>
        <Heading size="h2" className="leading-[1.12]">
          Six parts first, for businesses that take bookings
        </Heading>
        <div className="mt-6">
          <DetailList>
            <DetailRow label="Prepared for" value="Hanna" />
            <DetailRow label="What we recommend" value="Build six of your 15 parts first" />
            <DetailRow
              label="What we need from you"
              value="A way to pay for it, one real business and a name"
            />
          </DetailList>
        </div>
      </Section>

      <Section>
        <Lead>Hello Hanna. Thank you for your answers. We read every one.</Lead>
        <P className="mt-6">
          You asked for all 15 parts, working in a real business within one month. We would start
          differently.
        </P>
        <P className="mt-3">This paper says what we should do now, and why.</P>
      </Section>

      {/* 01 */}
      <Part>
        <div className="avoid-break">
          <Head n={1}>What you told us</Head>
          <P className="mt-4">Your own answers decide what comes first.</P>
          <HeardRows />
        </div>
      </Part>

      {/* 02 */}
      <Part>
        <div className="avoid-break">
          <Bridge>Those answers point to one place to start.</Bridge>
          <Head n={2}>Why we start with six parts</Head>
          <P className="mt-4">
            A shop needs stock and a till. A photographer needs a calendar and a deposit. These are
            two different products.
          </P>
          <P className="mt-3">
            We build six parts well, so a real business can rely on them. Otherwise you get 15 parts
            that half work.
          </P>
          <P className="mt-3">Our aim is four weeks for the six parts, from the day we start.</P>
          <PartsBoard />
          <Note className="mt-5">
            Real businesses use each step before we plan the next. We agree each step before we
            build it.
          </Note>
        </div>
      </Part>

      {/* 03 */}
      <Part>
        <div className="avoid-break">
          <Bridge>Here is how the six parts work together.</Bridge>
          <Head n={3}>What the first version does</Head>
          <P className="mt-4">This is one booking, from start to finish.</P>
          <Steps steps={FLOW} className="mt-7" />
        </div>

        <div className="avoid-break mt-10">
          <p className={cn("font-bold", SM, INK)}>The page the owner opens</p>
          <Note className="mt-1">A sample. The names and figures are made up.</Note>
          <SampleHome />
        </div>

        <div className="mt-10">
          <p className={cn("break-after-avoid font-bold", SM, INK)}>The six parts</p>
          <PartCards />
          <P className="mt-6">
            Each business connects its own Paystack account. So the money goes straight to that
            business. It never passes through you.
          </P>
          <P className="mt-3">
            You asked if the demo is different from the trial. In the first version there is one
            system. A new business tries it free, then pays monthly.
          </P>
        </div>
      </Part>

      {/* 04 */}
      <Part>
        <div className="avoid-break">
          <Bridge>We would change three of your answers.</Bridge>
          <Head n={4}>Where we would do it differently</Head>
          <P className="mt-4">You should know these before we start.</P>
        </div>
        <ChangeRows />
      </Part>

      {/* 05 */}
      <Part>
        <div className="avoid-break">
          <Bridge>All of this has a cost, so we must agree who carries it.</Bridge>
          <Head n={5}>Who pays for the build</Head>
          <P className="mt-4">
            You have not set a budget. You offered GHS 1,000 in instalments after launch. You also
            offered us 5 to 8% of the ownership. Thank you for that.
          </P>
          <P className="mt-3">It does not cover the work. Here is the sum.</P>
          <Steps steps={SUM} className="mt-7" />
          <Note className="mt-3">
            {ghs(MONTHLY_PRICE)} is the middle of the monthly price you chose.
          </Note>
          <P className="mt-5">
            That {ghs(OUR_SHARE)} would also have to pay for hosting, SMS and support. You asked us
            to do the support. And reaching {BUSINESSES} businesses takes time.
          </P>
          <P className="mt-3">We see two fair ways to do this. Either one works for us.</P>
        </div>
        <WayCards />
        <Note className="mt-4">If you choose Way 1, we will send you the fixed price.</Note>
      </Part>

      {/* 06 */}
      <Part>
        <div className="avoid-break">
          <Bridge>Three answers from you start the work.</Bridge>
          <Head n={6}>What we need from you</Head>
          <P className="mt-4">
            One of your answers says no business is ready to try it. Another says one is. If there
            is one, tell us which.
          </P>
          <NeedRows />
        </div>
      </Part>

      {/* Next steps */}
      <Section avoidBreak>
        <Panel tone="ink">
          <Heading size="h2" className="font-bold">
            What happens next
          </Heading>
          <Steps steps={NEXT} className="mt-6" />
          <P className="mt-6">Questions? Call or write to us any time.</P>
          <dl className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-8">
            {CONTACTS.map(([label, value]) => (
              <div key={label} className={cn("flex gap-2", XS)}>
                <dt className={SOFT}>{label}</dt>
                <dd className={cn("font-medium", INK)}>{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </Section>

      {/* Sign-off */}
      <Section avoidBreak className="mb-14">
        <p className="text-[length:var(--doc-t-body)] font-semibold text-[var(--doc-ink)]">
          Richard Somda
        </p>
        <Note className="mt-1">Creative Director</Note>
        <Note>Saharabase Technologies</Note>
      </Section>

      <DocumentFooter record={record} />
    </div>
  );
}
