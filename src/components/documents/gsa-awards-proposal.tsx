import { cn } from "@/lib/utils";
import { type DocumentRecord } from "@/lib/documents/registry";
import { DocumentFooter } from "./document-footer";
import {
  DetailList,
  DetailRow,
  Eyebrow,
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
import {
  Arrow,
  BODY,
  Bridge,
  DotList,
  Head,
  INK,
  KeyItem,
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

/* ── Figures ────────────────────────────────────────────────────────── */

/**
 * The two totals, stated once and used by the cover, the price part and the first payment.
 * Both are the price sheet's sums on 2026-10-25, after the user's own edits. Our price is
 * what they pay, with no further discount: the user dropped the GHS 27,700 offer that day.
 * The parts in `PRICED` below must add up to these.
 */
const INDUSTRY_PRICE = 130900;
const PRICE = 52475;
const BELOW_INDUSTRY = Math.round((1 - PRICE / INDUSTRY_PRICE) * 100);

/** Plain pages only, inside the price. The user set it at GHS 2,000 on 2026-10-25. */
const WEBSITE_PRICE = 2000;
const VOTE_SETUP_PRICE = 2000;

const AWARDS = 50;
const NOMINEES_PER_AWARD = 5;
const NOMINEES = AWARDS * NOMINEES_PER_AWARD;
/** Winners only. The user took nominees' certificates out of the job on 2026-10-25. */
const WINNER_CERTS = AWARDS;
const COUNTDOWN_DAYS = 14;

/** Voting terms. The set-up sits inside the price; the share comes out of what voters pay. */
const VOTE_SHARE = 15;
const PAYMENT_FEE = 1.95;

/** Whole cedis bare, anything else to the pesewa: GHS 15, GHS 1.95, GHS 26,237.50. */
const ghs = (n: number) =>
  `GHS ${n.toLocaleString("en-GB", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/* ── Cover ──────────────────────────────────────────────────────────── */

const SCOPE = [
  `${AWARDS} awards and ${NOMINEES} nominees`,
  "A new brand identity",
  "A website, with our voting system joined to it",
  "Social media on five platforms for three months",
  "Flyers, certificates and print for the venue",
  "Screens and stage graphics for the night",
];

/* ── 01 What we understand ──────────────────────────────────────────── */

const UNDERSTAND: { see: string; so: string }[] = [
  {
    see: "Your own plan says past events fell short of what people expected.",
    so: "Every piece is planned, checked and on time.",
  },
  {
    see: "Many student awards live on paid votes. People see them as money schemes.",
    so: "Judges’ marks count beside the public vote, and the tally is open.",
  },
  { see: "There is no logo yet.", so: "We start with a new brand identity." },
  {
    see: "Your videographer films the awards.",
    so: "We edit the footage into a launch film, reels and a highlights video.",
  },
  {
    see: "The website is agreed, as pages about the awards.",
    so: "Nominations and voting run on our own system, joined to it.",
  },
  {
    see: `About ${AWARDS} awards, with ${NOMINEES_PER_AWARD} nominees each.`,
    so: `${NOMINEES} nominees, each with a flyer, a vote link and a USSD number.`,
  },
];

const QUESTIONS = [
  "When and where is the awards night?",
  "What is the final list of categories and awards?",
  "Who chooses the nominees, and who sits on the judging panel?",
  "How should judges’ marks and public votes be weighed?",
  "What will one vote cost?",
  "Which sponsors are confirmed?",
  "Who signs the certificates?",
  "Will the night be streamed live?",
];

/* ── 02 Our approach ────────────────────────────────────────────────── */

const APPROACH: { tone: Tone; title: string; how: string }[] = [
  { tone: "ours", title: "Be trusted", how: "A new brand, judges’ marks and an open tally" },
  { tone: "ours", title: "Be seen", how: "Three months of posts, press and campus kits" },
  {
    tone: "yours",
    title: "Bring people in",
    how: "Nominees campaign for votes. Sponsors come on board.",
  },
  {
    tone: "ours",
    title: "Deliver the night",
    how: "The opener, the stage screens, and winners posted as names are read",
  },
];

/* ── 03 The twelve weeks ────────────────────────────────────────────── */

const WEEKS: { when: string; stage: string; ours: string[]; yours: string[] }[] = [
  {
    when: "Weeks 1 and 2",
    stage: "Set up",
    ours: ["Brand identity", "Post templates", "The website", "Nominations and voting set up"],
    yours: ["Date and venue", "Award list", "Sponsors’ logos"],
  },
  {
    when: "Weeks 3 to 5",
    stage: "Launch and nominations",
    ours: ["Launch teasers", "Call for nominations", "Launch film", "Campus kit", "Press release"],
    yours: ["Launch footage", "Schools spread the word"],
  },
  {
    when: "Week 6",
    stage: "Nominees announced",
    ours: [`${NOMINEES} nominee flyers`, "Nominee pack", "Press release"],
    yours: ["Judges confirm the list", "Nominees send photos"],
  },
  {
    when: "Weeks 7 to 11",
    stage: "Voting and countdown",
    ours: ["Daily posts", "Reels", `A ${COUNTDOWN_DAYS} day countdown`, "Print designs"],
    yours: ["Nominees campaign", "Printing", "Venue"],
  },
  {
    when: "Week 12",
    stage: "The awards night",
    ours: ["Opener and stage screens", "Lower thirds", "Winners flyers, posted as names are read"],
    yours: ["The event", "Filming"],
  },
  {
    when: "After",
    stage: "Thank and report",
    ours: ["Highlights video", "Thank-you posts", "Impact report"],
    yours: ["Share the report with sponsors"],
  },
];

/* ── 04 Brand ───────────────────────────────────────────────────────── */

const BRAND: Step[] = [
  { tone: "ours", sub: "1", title: "A logo" },
  { tone: "ours", sub: "2", title: "Colours and fonts" },
  { tone: "oursLight", sub: "3", title: "A short guide" },
  { tone: "oursLight", sub: "4", title: "Templates for every post" },
];

/* ── 05 Website and voting ──────────────────────────────────────────── */

/** The website is plain pages. Anything that takes a form or a payment lives on our system. */
const SITE_PAGES = [
  "Home",
  "About the awards",
  "Categories and awards",
  "How to nominate and vote",
  "The awards night, with date and venue",
  "Sponsors",
  "News and press",
  "Contact",
];

const SYSTEM_PARTS = [
  "The nomination form",
  "A page for each nominee, with a vote link and USSD code",
  "Paid votes by MoMo, card or USSD",
  "Judges’ marks",
  "The live tally",
];

const VOTE_FLOW: Step[] = [
  { tone: "raised", sub: "A voter", title: "Opens the link or dials the code" },
  { tone: "raised", sub: "Pays", title: "With MoMo or card" },
  { tone: "ours", sub: "Our system", title: "Confirms the payment" },
  { tone: "ours", sub: "Then", title: "The vote counts" },
  { tone: "clay", sub: "You see", title: "The live tally" },
];

/** Of every GHS 100 voters pay. The payment fee is Paystack's, not ours. */
const SPLIT: { who: string; pct: number; tone: Tone }[] = [
  { who: "To you", pct: 100 - VOTE_SHARE - PAYMENT_FEE, tone: "clay" },
  { who: "To us", pct: VOTE_SHARE, tone: "ours" },
  { who: "Paystack’s fee", pct: PAYMENT_FEE, tone: "date" },
];

/* ── 06 Campaign ────────────────────────────────────────────────────── */

const CAMPAIGN_OURS = [
  "Social media on five platforms, for three months",
  "A short report each month",
  "Four press releases",
  "A campus ambassador kit",
  `A nominee pack for all ${NOMINEES} nominees`,
  "A sponsor deck",
  "Website upkeep for the three months",
];

const CAMPAIGN_YOURS = [
  "Approvals within two working days",
  "Your campus ambassadors",
  "Sponsor meetings",
  "Your media contacts",
];

/* ── 07 What we make ────────────────────────────────────────────────── */

/** Ceilings, not promises of volume: each is the most we make within the price. */
const MAKE: { n: number; what: string; sub?: string }[] = [
  { n: NOMINEES, what: "Nominee flyers" },
  { n: AWARDS, what: "Winners flyers" },
  { n: WINNER_CERTS, what: "Winners’ certificates" },
  { n: 8, what: "Call for nominations flyers" },
  { n: 6, what: "Speaker and guest flyers" },
  { n: 4, what: "Launch teasers" },
  { n: COUNTDOWN_DAYS, what: "Countdown flyers", sub: "One a day, feed and status sizes" },
  { n: 10, what: "Lower thirds" },
  { n: 3, what: "Backdrops", sub: "Stage, photo wall, sponsors" },
  { n: 3, what: "Pull up banners" },
  { n: 3, what: "Flags" },
  { n: 8, what: "Programme pages" },
];

/* ── 08 Footage ─────────────────────────────────────────────────────── */

const FOOTAGE_OUT = ["A launch film, 3 to 5 minutes", "6 reels", "A highlights video"];

/* ── 09 The night ───────────────────────────────────────────────────── */

const NIGHT_LIVE: Step[] = [
  { tone: "raised", sub: "On stage", title: "A winner’s name is read" },
  { tone: "ours", sub: "Already made", title: "Their winners flyer" },
  { tone: "clay", sub: "Online", title: "Posted straight away" },
];

const ON_STAGE = ["The event opener", "Stage screen visuals", "10 lower thirds", "Stream graphics"];

/* ── 10 After ───────────────────────────────────────────────────────── */

const AFTER: Step[] = [
  { tone: "ours", sub: "1", title: "A highlights video" },
  { tone: "ours", sub: "2", title: "Thank-you posts" },
  { tone: "clay", sub: "3", title: "An impact report for sponsors" },
];

/* ── 11 What we need ────────────────────────────────────────────────── */

const NEEDS: { you: string; so: string; otherwise: string }[] = [
  {
    you: "Approve each piece within two working days",
    so: "We keep to the twelve weeks",
    otherwise: "Dates slip",
  },
  {
    you: "Send final name lists before we design",
    so: "Names are right the first time",
    otherwise: "Changes after approval are billed per piece",
  },
  {
    you: "Share footage within a week of each shoot",
    so: "Reels go out on time",
    otherwise: "They go out late",
  },
  {
    you: "Confirm sponsors’ logos before print",
    so: "Backdrops are printed once",
    otherwise: "Reprints are at your cost",
  },
];

/* ── 12 The price ───────────────────────────────────────────────────── */

/**
 * A few single pieces at both rates, so the totals can be checked against something the
 * reader can picture. From the price sheet on 2026-10-25.
 */
const PIECES: { what: string; industry: number; ours: number }[] = [
  { what: "One nominee flyer", industry: 150, ours: 75 },
  { what: "The brand identity", industry: 3000, ours: 1000 },
  { what: "The website", industry: 6000, ours: WEBSITE_PRICE },
  { what: "Social media, one month", industry: 6000, ours: 1000 },
  { what: "One winner’s certificate", industry: 100, ours: 75 },
];

/**
 * Everything the price buys, in the groups of our price sheet, with each group's sum at
 * industry rates and ours. The sums add up to the two totals at the top. Counts match part 7.
 */
const PRICED: { group: string; industry: number; ours: number; items: string[] }[] = [
  {
    group: "Brand and set-up",
    industry: 6500,
    ours: 2800,
    items: [
      "Brand identity: logo, colours, fonts and a short guide",
      "Post templates",
      "Sponsor deck",
      "Campus ambassador kit",
      `Nominee pack for ${NOMINEES} nominees`,
    ],
  },
  {
    group: "Website and voting",
    industry: 19000,
    ours: 6700,
    items: [
      "The website, plain pages about the awards",
      "Website upkeep, three months",
      "Hosting and domain, one year",
      "Voting set-up, with the nomination form, judges’ marks and the live tally",
    ],
  },
  {
    group: "Running the campaign",
    industry: 22000,
    ours: 3400,
    items: [
      "Social media on five platforms, three months",
      "A short report each month",
      "Four press releases",
    ],
  },
  {
    group: "Campaign graphics",
    industry: 50700,
    ours: 25825,
    items: [
      `${NOMINEES} nominee flyers`,
      `${AWARDS} winners flyers`,
      "8 call for nominations flyers",
      "6 speaker and guest flyers",
      "4 launch teasers",
      `${COUNTDOWN_DAYS} countdown flyers, feed and status sizes`,
      "3 thank-you posts",
    ],
  },
  {
    group: "Print for the venue",
    industry: 12600,
    ours: 7550,
    items: [
      "3 backdrops",
      "3 pull up banners",
      "3 flags",
      "Invitations, tickets and name tags",
      "Certificate design",
      `${WINNER_CERTS} winners’ certificates`,
      "An 8 page programme",
    ],
  },
  {
    group: "Video and screens",
    industry: 16100,
    ours: 5700,
    items: [
      "Event opener",
      "Stage screen visuals",
      "10 lower thirds",
      "Stream graphics",
      "Launch film, 3 to 5 minutes",
      "6 reels",
      "Highlights video",
    ],
  },
  {
    group: "After the night",
    industry: 4000,
    ours: 500,
    items: ["Impact report for sponsors", "Project management, free"],
  },
];

const OUTSIDE = ["Printing", "Ad money, if you run ads", "Influencer fees", "Media fees"];

/* ── 13 How we start ────────────────────────────────────────────────── */

type Who = "You" | "Us" | "Both of us";
const WHO_TONE: Record<Who, StepTone> = { You: "yours", Us: "ours", "Both of us": "raised" };

const START: { who: Who; title: string; detail: string }[] = [
  {
    who: "You",
    title: "Accept this proposal",
    detail: "Tell us what to change first, if anything.",
  },
  { who: "You", title: "Pay half the fee", detail: `${ghs(PRICE / 2)} before work starts.` },
  {
    who: "Both of us",
    title: "A first meeting",
    detail: "Dates, venue, the award list and sponsors.",
  },
  { who: "Us", title: "Brand identity", detail: "Ready for your approval within two weeks." },
  { who: "Both of us", title: "A check-in every week", detail: "Until the awards night." },
];

const NEXT: Step[] = [
  { tone: "raised", sub: "1", title: "You read the plan" },
  { tone: "raised", sub: "2", title: "You tell us what to change" },
  { tone: "raised", sub: "3", title: "We start on your brand" },
];

const CONTACTS = [
  ["WhatsApp", "050 988 6584"],
  ["Phone", "+233 59 212 3054"],
  ["Email", "hello@saharabasetech.com"],
];

/* ── Diagrams ───────────────────────────────────────────────────────── */

/** A price as the reader should see it: the industry rate struck through, then ours. */
function Was({ from, to }: { from: number; to: number }) {
  return (
    <span className="whitespace-nowrap tabular-nums">
      <s className={cn("font-medium", SOFT)}>{ghs(from)}</s>{" "}
      <span className={cn("font-bold", INK)}>{ghs(to)}</span>
    </span>
  );
}

/**
 * A cover value in one left-aligned column. The offer and the scope run to several lines, and
 * right-aligned they would start at a different place on every row.
 */
function CoverValue({ children }: { children: React.ReactNode }) {
  return <span className="block sm:w-[26rem] sm:text-left">{children}</span>;
}

/** What we heard on the left, what the plan does about it on the right. */
function Understanding() {
  const row =
    "grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_1.25rem_minmax(0,1fr)] sm:items-stretch sm:gap-2.5";
  const head = "rounded-[var(--doc-r-inset)] px-4 py-2 font-semibold";
  return (
    <div className="mt-7 space-y-2">
      <div className={cn(row, "hidden break-after-avoid sm:grid")}>
        <span className={cn(head, XS, INK, TONE.yours)}>What we understand</span>
        <span />
        <span className={cn(head, XS, INK, TONE.ours)}>So the plan</span>
      </div>
      {UNDERSTAND.map((u) => (
        <div key={u.see} className={cn(row, "avoid-break")}>
          <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3", TONE.yoursLight)}>
            <p className={cn(XS, INK)}>{u.see}</p>
          </div>
          <Arrow className="mx-auto rotate-90 sm:mx-0 sm:rotate-0 sm:self-center" />
          <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3", TONE.oursLight)}>
            <p className={cn("font-semibold", XS, INK)}>{u.so}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Four steps drawn as a staircase going down, so the order reads before a word does. */
function ApproachStairs() {
  return (
    <div className="avoid-break mt-7">
      {APPROACH.map((s, i) => (
        <div
          key={s.title}
          className="sm:ml-[var(--indent)]"
          style={{ "--indent": `${i * 9}%` } as React.CSSProperties}
        >
          {i > 0 && <Arrow className="my-1 ml-6 h-4 w-4 rotate-90" />}
          <div
            className={cn(
              "flex flex-col gap-1 rounded-[var(--doc-r-inset)] px-5 py-3.5 sm:flex-row sm:items-center sm:gap-5",
              TONE[s.tone],
            )}
          >
            <p className="flex shrink-0 items-baseline gap-3 sm:w-52">
              <span className={cn("font-semibold tabular-nums", XS, TONE_SOFT[s.tone])}>
                {i + 1}
              </span>
              <span className={cn("text-[length:var(--doc-t-lead)] leading-tight font-bold", INK)}>
                {s.title}
              </span>
            </p>
            <p className={cn(XS, TONE_SOFT[s.tone])}>{s.how}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The twelve weeks, one stage a row: when, our jobs on the dark, theirs on the light. The jobs
 * are plain lines, not tags: the user found tags inside the boxes too busy on 2026-10-25.
 */
function WeekTrack() {
  const row =
    "grid gap-1.5 sm:grid-cols-[9.5rem_minmax(0,1.5fr)_minmax(0,1fr)] sm:items-stretch sm:gap-2";
  const cell = "rounded-[var(--doc-r-inset)] px-4 py-3";
  return (
    <div className="mt-7 space-y-2">
      <div className={cn(row, "hidden break-after-avoid sm:grid")}>
        <span />
        <span className={cn(cell, "py-2 font-semibold", XS, INK, TONE.ours)}>Our work</span>
        <span className={cn(cell, "py-2 font-semibold", XS, INK, TONE.yours)}>Your part</span>
      </div>
      {WEEKS.map((s) => (
        <div key={s.stage} className={cn(row, "avoid-break")}>
          <div className={cn(cell, "bg-[var(--doc-fill-strong)]")}>
            <p className={cn(MICRO, SOFT)}>{s.when}</p>
            <p className={cn("mt-0.5 font-bold", XS, INK)}>{s.stage}</p>
          </div>
          <div className={cn(cell, TONE.oursLight)}>
            <DotList items={s.ours} />
          </div>
          <div className={cn(cell, TONE.yoursLight)}>
            <DotList items={s.yours} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The website's pages on one side, what our system does on the other, joined by a link. */
function SiteAndSystem() {
  return (
    <div className="avoid-break mt-7 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
      <div className={cn("h-full rounded-[var(--doc-r-panel)] p-6", TONE.oursLight)}>
        <p className={cn(MICRO, SOFT)}>{ghs(WEBSITE_PRICE)}, inside the price</p>
        <p className={cn("mt-0.5 font-bold", SM, INK)}>The website</p>
        <DotList items={SITE_PAGES} className="mt-3" />
      </div>
      <div className="flex flex-col items-center gap-1 px-1">
        <Arrow className="rotate-90 sm:rotate-0" />
        <p className={cn("text-center", MICRO, SOFT)}>Links to</p>
      </div>
      <div className={cn("h-full rounded-[var(--doc-r-panel)] p-6", TONE.ours)}>
        <p className={cn(MICRO, SOFT)}>{ghs(VOTE_SETUP_PRICE)} set-up, inside the price</p>
        <p className={cn("mt-0.5 font-bold", SM, INK)}>Our voting system</p>
        <DotList items={SYSTEM_PARTS} className="mt-3" />
      </div>
    </div>
  );
}

/** Where every GHS 100 that voters pay ends up, drawn to scale, with each share named. */
function MoneySplit() {
  return (
    <div className="avoid-break mt-6 rounded-[var(--doc-r-panel)] bg-[var(--doc-fill-quiet)] p-6">
      <p className={cn("font-bold", SM, INK)}>Of every GHS 100 voters pay</p>
      <div className="mt-4 flex h-10 overflow-hidden rounded-[var(--doc-r-inset)]">
        {SPLIT.map((s) => (
          <span
            key={s.who}
            className={cn("h-full", TONE[s.tone])}
            style={{ width: `${Math.max(s.pct, 2)}%` }}
            aria-hidden
          />
        ))}
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {SPLIT.map((s) => (
          <div key={s.who} className="flex items-start gap-2.5">
            <span
              className={cn("mt-1 h-3.5 w-3.5 shrink-0 rounded-[4px]", TONE[s.tone])}
              aria-hidden
            />
            <div>
              <dt className={cn(XS, SOFT)}>
                {s.who}, {s.pct}%
              </dt>
              <dd className={cn("font-bold tabular-nums", SM, INK)}>{ghs(s.pct)}</dd>
            </div>
          </div>
        ))}
      </dl>
      <Note className="mt-4">
        Paystack is the payment company. Its fee is set by Paystack, not by us.
      </Note>
    </div>
  );
}

/** Our list on the dark, theirs on the light, side by side. */
function TwoSides({ ours, yours }: { ours: string[]; yours: string[] }) {
  return (
    <div className="avoid-break mt-7 grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className={cn("rounded-[var(--doc-r-panel)] p-6", TONE.ours)}>
        <p className={cn("font-bold", SM, INK)}>We do</p>
        <DotList items={ours} className="mt-3" />
      </div>
      <div className={cn("rounded-[var(--doc-r-panel)] p-6", TONE.yoursLight)}>
        <p className={cn("font-bold", SM, INK)}>You do</p>
        <DotList items={yours} className="mt-3" />
      </div>
    </div>
  );
}

/** Every ceiling in the price, as a grid of figures. */
function MakeGrid() {
  return (
    <div className="avoid-break mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MAKE.map((m) => (
        <div key={m.what} className={cn("rounded-[var(--doc-r-inset)] px-4 py-4", TONE.oursLight)}>
          <p className={cn(MICRO, SOFT)}>Up to</p>
          <p
            className={cn(
              "mt-1 text-[length:var(--doc-t-h2)] leading-none font-bold tabular-nums",
              INK,
            )}
          >
            {m.n}
          </p>
          <p className={cn("mt-2 font-semibold", XS, INK)}>{m.what}</p>
          {m.sub && <p className={cn("mt-0.5", MICRO, SOFT)}>{m.sub}</p>}
        </div>
      ))}
    </div>
  );
}

/** Their videographer's footage comes to us and leaves as three things. */
function FootageFlow() {
  return (
    <div className="avoid-break mt-7 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.3fr)] sm:items-center">
      <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3.5", TONE.yours)}>
        <p className={cn(MICRO, BODY)}>Your videographer</p>
        <p className={cn("mt-0.5 font-semibold", XS, INK)}>Films every stage</p>
      </div>
      <Arrow className="mx-auto rotate-90 sm:mx-0 sm:rotate-0" />
      <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3.5", TONE.ours)}>
        <p className={cn(MICRO, SOFT)}>We</p>
        <p className={cn("mt-0.5 font-semibold", XS, INK)}>Edit and finish</p>
      </div>
      <Arrow className="mx-auto rotate-90 sm:mx-0 sm:rotate-0" />
      <div className="space-y-1.5">
        {FOOTAGE_OUT.map((f) => (
          <div key={f} className={cn("rounded-[var(--doc-r-inset)] px-4 py-2", TONE.oursLight)}>
            <p className={cn("font-semibold", XS, INK)}>{f}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** You do this, so we can do that, otherwise this happens. One row per need. */
function NeedsRows() {
  const row = "grid gap-1.5 sm:grid-cols-3 sm:gap-2";
  const head = "rounded-[var(--doc-r-inset)] px-4 py-2 font-semibold";
  return (
    <div className="mt-7 space-y-2">
      <div className={cn(row, "hidden break-after-avoid sm:grid")}>
        <span className={cn(head, XS, INK, TONE.yours)}>You</span>
        <span className={cn(head, XS, INK, TONE.ours)}>So we</span>
        <span className={cn(head, XS, INK, "bg-[#f4e5dc]")}>Otherwise</span>
      </div>
      {NEEDS.map((n) => (
        <div key={n.you} className={cn(row, "avoid-break")}>
          <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3", TONE.yoursLight)}>
            <p className={cn("font-semibold", XS, INK)}>{n.you}</p>
          </div>
          <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3", TONE.oursLight)}>
            <p className={cn(XS, INK)}>{n.so}</p>
          </div>
          <div className="rounded-[var(--doc-r-inset)] bg-[#f4e5dc] px-4 py-3">
            <p className={cn(XS, BODY)}>{n.otherwise}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** The whole job at industry rates and at ours, on one scale, so the gap is seen first. */
function PriceBars() {
  const rows: { label: string; value: number; tone: Tone }[] = [
    { label: "At standard industry rates", value: INDUSTRY_PRICE, tone: "date" },
    { label: "Our price", value: PRICE, tone: "clay" },
  ];
  return (
    <div className="avoid-break mt-7 space-y-3">
      {rows.map((r) => (
        <div
          key={r.label}
          className="grid gap-1.5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:items-center sm:gap-4"
        >
          <p className={cn("font-semibold", SM, INK)}>{r.label}</p>
          <div className="flex items-center gap-3">
            <span
              className={cn("h-9 rounded-[var(--doc-r-inset)]", TONE[r.tone])}
              style={{ width: `${(r.value / INDUSTRY_PRICE) * 72}%` }}
              aria-hidden
            />
            <span className={cn("font-bold whitespace-nowrap tabular-nums", SM, INK)}>
              {ghs(r.value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Single pieces at both rates. The reader can hold one flyer in mind; a total is abstract. */
function PieceCards() {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {PIECES.map((p) => (
        <div
          key={p.what}
          className="rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)] px-4 py-3.5"
        >
          <p className={cn(MICRO, BODY)}>{p.what}</p>
          <p className={cn("mt-1", SM)}>
            <Was from={p.industry} to={p.ours} />
          </p>
        </div>
      ))}
    </div>
  );
}

/** Each part of the work with its two figures on top, then what it holds. */
function PricedGroups() {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {PRICED.map((g) => (
        <Inset key={g.group} tone="quiet" className="avoid-break">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <p className={cn("font-semibold", XS, INK)}>{g.group}</p>
            <p className={XS}>
              <Was from={g.industry} to={g.ours} />
            </p>
          </div>
          <DotList items={g.items} className="mt-2" />
        </Inset>
      ))}
    </div>
  );
}

/** How we begin, in order. Who carries each step sits at the end of its row. */
function StartSteps() {
  return (
    <ol className="avoid-break mt-7">
      {START.map((s, i) => {
        const tone = WHO_TONE[s.who];
        return (
          <li key={s.title}>
            {i > 0 && <Arrow className="my-1 ml-6 h-4 w-4 rotate-90" />}
            <div
              className={cn(
                "grid items-center gap-x-4 gap-y-1 rounded-[var(--doc-r-inset)] px-5 py-3.5 sm:grid-cols-[1.5rem_11rem_minmax(0,1fr)_5.5rem]",
                STEP_BG[tone],
              )}
            >
              <span className={cn("font-bold tabular-nums", SM, STEP_SOFT[tone])}>{i + 1}</span>
              <p className={cn("font-bold", SM, INK)}>{s.title}</p>
              <p className={cn(XS, STEP_SOFT[tone])}>{s.detail}</p>
              <span className={cn("font-semibold sm:text-right", MICRO, STEP_SOFT[tone])}>
                {s.who}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Ghana Student Awards: the whole awards campaign run by us, from the first post to the
 * awards night, for three months. Their videographer films; we do the rest.
 *
 * Decisions worth remembering:
 *
 *  - Built on the shape of the Nadkof plan: who we are, numbered parts joined by bridge lines,
 *    pictures over text, dark for our work and light for theirs, clay for what the eye should
 *    follow. Copy is plain, we and you, one idea a sentence, no dashes. The user took out the
 *    "We give first" panel on 2026-10-25, and the word "season" with it.
 *  - The client renamed the awards to the Ghana Student Laureates Program in an earlier plan,
 *    then went back to Ghana Student Awards. Use the current name only.
 *  - Their own earlier plan worried that paid voting makes awards look like money schemes.
 *    Judges' marks and an open tally answer that, and lead the approach.
 *  - On 2026-10-25 the user made the website plain pages only, at GHS 2,000, since a form does
 *    not fit that price. The nomination form moved onto our voting system, which is built once
 *    and charged per event: a set-up inside the price, then a share of vote money. No share of
 *    ticket money. Paystack's fee is named as Paystack's.
 *  - The price is our price, GHS 52,475, with no further discount (the GHS 27,700 offer was
 *    dropped on 2026-10-25). The user wants the client to see what the work costs: industry
 *    rates are other agencies' flat fees with no discount, and ours come from WRBA. So the
 *    cover strikes the industry total through, and the price part shows single pieces and
 *    every part at both rates. The counts in part 7 are ceilings.
 *  - "Live coverage" came out on 2026-10-25: it read as filming, which is their videographer's.
 *    Nominee videos came out the same day.
 *  - Late changes are billed and half the fee comes first. Both rules came from WRBA, where
 *    certificates were remade after the lists changed and never billed.
 */
export function GsaAwardsProposal({ record }: { record: DocumentRecord }) {
  return (
    <div className="[&_p]:text-pretty">
      <VerifyLine record={record} />
      <Letterhead record={record} />

      {/* ── Cover ───────────────────────────────────────────────── */}
      <Section>
        <Eyebrow>Prepared For</Eyebrow>
        <Heading size="h2" className="mt-3">
          Ghana Student Awards
        </Heading>

        <div className="mt-6">
          <DetailList>
            <DetailRow
              label="What we are offering"
              value={
                <CoverValue>
                  We design everything the public sees, online and at the venue. We also run your
                  social media. Start to finish, within three months.
                </CoverValue>
              }
            />
            <DetailRow
              label="The scope"
              value={
                <CoverValue>
                  <ul className="space-y-1">
                    {SCOPE.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </CoverValue>
              }
            />
            <DetailRow
              label="Filming"
              value={<CoverValue>Your videographer films. We edit.</CoverValue>}
            />
            <DetailRow
              label="The price"
              value={
                <CoverValue>
                  <Was from={INDUSTRY_PRICE} to={PRICE} />
                </CoverValue>
              }
            />
          </DetailList>
        </div>
      </Section>

      {/* ── Opening ─────────────────────────────────────────────── */}
      <Section className="page-start mb-20">
        <Lead>
          Saharabase Technologies is a digital agency in Accra. We build software, websites and
          mobile apps. We also make content and run campaigns.
        </Lead>

        <P className="mt-8">
          You asked us to bring the Ghana Student Awards back to life, and to run it from start to
          finish. This plan shows how we would do it.
        </P>
        <P className="mt-3">
          It is built on what we know so far. You may already have some of it in hand. Where we got
          something wrong, tell us.
        </P>

        <p
          className={cn(
            "mt-8 text-[length:var(--doc-t-h3)] leading-[1.3] font-bold tracking-[-0.015em] text-balance",
            INK,
          )}
        >
          Our goal: when a student, a school or a sponsor hears &ldquo;Ghana Student Awards&rdquo;,
          they think of a fair contest and a night worth being part of.
        </p>

        <Panel tone="quiet" className="mt-8">
          <P>
            The pictures in this plan show who does what.{" "}
            <strong>Dark is our work. Light is your part.</strong>
          </P>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            <KeyItem tones={["ours", "oursLight"]}>Our work</KeyItem>
            <KeyItem tones={["yours", "yoursLight"]}>Your part</KeyItem>
          </div>
        </Panel>
      </Section>

      {/* 01 Understanding */}
      <Part>
        <div className="avoid-break">
          <Head n={1}>What we understand about the awards today</Head>
          <P className="mt-4">
            This is what we took from our talks and from your earlier plan. Each point shapes this
            one.
          </P>
          <Understanding />
          <div className={cn("mt-5 rounded-[var(--doc-r-panel)] p-6", TONE.yoursLight)}>
            <p className={cn("font-bold", SM, INK)}>What we would like to know</p>
            <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {QUESTIONS.map((q) => (
                <li key={q} className={cn("flex gap-2.5", XS, BODY)}>
                  <span className={cn("font-bold", INK)}>?</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Part>

      {/* 02 Approach */}
      <Part>
        <div className="avoid-break">
          <Bridge>Those points set our approach.</Bridge>
          <Head n={2}>Our approach</Head>
          <P className="mt-4">
            People back awards they trust. So trust comes first. Then reach. Then the night itself.
          </P>
          <ApproachStairs />
          <Note className="mt-4">
            The third step is mostly yours. We give you the tools for it.
          </Note>
        </div>
      </Part>

      {/* 03 The twelve weeks */}
      <Part>
        <div className="avoid-break">
          <Bridge>Here is how the three months run.</Bridge>
          <Head n={3}>The twelve weeks at a glance</Head>
          <P className="mt-4">Five stages, then a close after the night.</P>
          <WeekTrack />
          <Note className="mt-4">
            The weeks move with your date. We set them together at our first meeting.
          </Note>
        </div>
      </Part>

      {/* 04 Brand */}
      <Part>
        <div className="avoid-break">
          <Bridge>Nothing goes out before the brand.</Bridge>
          <Head n={4}>A brand identity first</Head>
          <P className="mt-4">
            There is no logo yet. So we start there, in the first two weeks. Every flyer, screen and
            certificate after that carries one look.
          </P>
          <Steps steps={BRAND} className="mt-7" />
          <Note className="mt-4">You approve each step before we move to the next.</Note>
        </div>
      </Part>

      {/* 05 Website and voting */}
      <Part>
        <div className="avoid-break">
          <Bridge>With the brand in place, the website and voting go live.</Bridge>
          <Head n={5}>The website and our voting system</Head>
          <P className="mt-4">
            The website gives people the facts about the awards. That is what the{" "}
            {ghs(WEBSITE_PRICE)} covers.
          </P>
          <P className="mt-3">
            Nominations, votes and payments run on our own voting system. The website links straight
            to it.
          </P>
          <SiteAndSystem />
        </div>

        <div className="avoid-break mt-8">
          <p className={cn("font-bold", SM, INK)}>How a vote works</p>
          <Steps steps={VOTE_FLOW} className="mt-4" />
          <P className="mt-5">
            A vote counts only after the payment is confirmed. So every vote on the tally is a paid
            vote.
          </P>
        </div>

        <Panel tone="quiet" className="avoid-break mt-6">
          <p className={cn("font-bold", SM, INK)}>Judges and the public, together</p>
          <P className="mt-2">
            Judges mark each nominee on the same system. The result combines their marks with the
            public vote. You choose the weight, for example 60% judges and 40% public.
          </P>
        </Panel>

        <MoneySplit />
      </Part>

      {/* 06 Campaign */}
      <Part>
        <div className="avoid-break">
          <Bridge>Votes follow attention. Here is how we keep the awards in view.</Bridge>
          <Head n={6}>Running the campaign</Head>
          <P className="mt-4">
            For three months we run your social media on five platforms. We plan, write, post and
            answer messages.
          </P>
          <TwoSides ours={CAMPAIGN_OURS} yours={CAMPAIGN_YOURS} />
          <Note className="mt-4">
            Each nominee gets their flyer, their own vote link and USSD number, and a short guide on
            asking for votes.
          </Note>
        </div>
      </Part>

      {/* 07 What we make */}
      <Part>
        <div className="avoid-break">
          <Bridge>Behind the campaign sits a lot of making.</Bridge>
          <Head n={7}>What we make</Head>
          <P className="mt-4">
            Each number is the most we make within the price. Extra pieces are billed one by one.
          </P>
          <MakeGrid />
          <Note className="mt-4">
            Invitations, tickets and name tags are in the price too. So are the event opener, the
            stage screens and the stream graphics.
          </Note>
        </div>
      </Part>

      {/* 08 Footage */}
      <Part>
        <div className="avoid-break">
          <Bridge>Your videographer films. We turn the footage into stories.</Bridge>
          <Head n={8}>Your footage, edited</Head>
          <P className="mt-4">
            You keep your videographer. They film the launch, the campaign and the night. We edit.
          </P>
          <FootageFlow />
        </div>
      </Part>

      {/* 09 The night */}
      <Part>
        <div className="avoid-break">
          <Bridge>Then comes the night.</Bridge>
          <Head n={9}>The awards night</Head>
          <P className="mt-4">
            Winners flyers are made before the night. Each one goes out as the name is read.
          </P>
          <Steps steps={NIGHT_LIVE} className="mt-7" />
          <div className={cn("mt-5 rounded-[var(--doc-r-panel)] p-6", TONE.oursLight)}>
            <p className={cn("font-bold", SM, INK)}>On the stage and the stream</p>
            <DotList items={ON_STAGE} className="mt-3 sm:columns-2 sm:gap-8" />
          </div>
        </div>
      </Part>

      {/* 10 After */}
      <Part>
        <div className="avoid-break">
          <Bridge>After the night, we thank people and report back.</Bridge>
          <Head n={10}>After the night</Head>
          <P className="mt-4">
            The impact report shows sponsors what their money reached. It helps you bring them back
            next year.
          </P>
          <Steps steps={AFTER} className="mt-7" />
        </div>
      </Part>

      {/* 11 What we need */}
      <Part>
        <div className="avoid-break">
          <Bridge>All of this runs on time only with a few things from you.</Bridge>
          <Head n={11}>What we need from you</Head>
          <P className="mt-4">Four things keep the work on time.</P>
          <NeedsRows />
        </div>
      </Part>

      {/* 12 Price */}
      <Part>
        <div className="avoid-break">
          <Bridge>That leaves the price.</Bridge>
          <Head n={12}>The price</Head>
          <P className="mt-4">
            Industry rates are the flat fees other agencies charge for this work, with no discount.
          </P>
          <P className="mt-3">
            Our prices come from the Western Regional Business Awards 2026. We made many of the same
            pieces for that event. So each price here is the real cost of the work, kept moderate.
          </P>
          <PriceBars />
          <Note className="mt-4">Our price is {BELOW_INDUSTRY}% below industry rates.</Note>
        </div>

        <div className="avoid-break mt-8">
          <p className={cn("font-bold", SM, INK)}>A few pieces, one by one</p>
          <PieceCards />
        </div>

        {/* Splits between boxes, never inside one, so the price page is not left half empty. */}
        <div className="mt-8">
          <p className={cn("break-after-avoid font-bold", SM, INK)}>What you get, part by part</p>
          <Note className="mt-1 break-after-avoid">
            Each count is the most we make within the price.
          </Note>
          <PricedGroups />
        </div>

        <div className="avoid-break mt-8">
          <p className={cn("font-bold", SM, INK)}>What you pay</p>
          <div className="mt-3">
            <DetailList>
              <DetailRow label="All the work above" value={ghs(PRICE)} />
              <DetailRow label="The website, inside that figure" value={ghs(WEBSITE_PRICE)} />
              <DetailRow label="Voting set-up, inside that figure" value={ghs(VOTE_SETUP_PRICE)} />
              <DetailRow label="Our share of each vote" value={`${VOTE_SHARE}%`} />
              <DetailRow label="Paystack’s fee on each payment" value={`${PAYMENT_FEE}%`} />
              <DetailRow
                label="When you pay"
                value="Half before work starts, the rest before the awards night"
              />
            </DetailList>
          </div>
          <Note className="mt-3">
            The vote share and Paystack’s fee come out of the money voters pay. They are not billed
            to you.
          </Note>
        </div>

        <div className={cn("avoid-break mt-5 rounded-[var(--doc-r-panel)] p-6", TONE.yoursLight)}>
          <p className={cn("font-bold", SM, INK)}>Outside the price, paid at cost with receipts</p>
          <DotList items={OUTSIDE} className="mt-3 sm:columns-2 sm:gap-8" />
        </div>
        <Note className="mt-4">Payment dates are open to discussion.</Note>
      </Part>

      {/* 13 How we start */}
      <Part>
        <div className="avoid-break">
          <Bridge>That is the plan and its price. Here is how we would begin.</Bridge>
          <Head n={13}>How we start</Head>
          <P className="mt-4">Five steps, in this order.</P>
          <StartSteps />
        </div>
      </Part>

      {/* Next steps */}
      <Section avoidBreak>
        <Panel tone="ink">
          <Heading size="h2" className="font-bold">
            What happens next
          </Heading>
          <Steps steps={NEXT} className="mt-6" />
          <P className="mt-6">Questions or changes? Call or write to us any time.</P>
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
