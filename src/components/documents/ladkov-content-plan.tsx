import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { type DocumentRecord } from "@/lib/documents/registry";
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

/* ── Type shorthands ────────────────────────────────────────────────── */

const SM = "text-[length:var(--doc-t-sm)] leading-[1.55]";
const XS = "text-[length:var(--doc-t-xs)] leading-[1.55]";
const MICRO = "text-[length:var(--doc-t-micro)] leading-[1.4]";
const INK = "text-[var(--doc-ink)]";
const BODY = "text-[var(--doc-ink-body)]";
const SOFT = "text-[var(--doc-ink-soft)]";

/* ── The ownership code ─────────────────────────────────────────────── */

/**
 * The one idea held through every diagram: dark is our work, light is theirs. The client
 * should be able to glance at any picture in the plan and see where it waits on them.
 * `date` is the calendar (health days, the diaspora season): things nobody does.
 */
type Tone = "ours" | "yours" | "date";

/**
 * `yours` sits one step darker than the strongest document fill. At `--doc-fill-strong`
 * it all but vanished against the quiet track in the timeline, and on paper it is the
 * half of the picture the client most needs to see.
 */
const TONE: Record<Tone, string> = {
  ours: "doc-invert bg-[var(--doc-fill-ink)]",
  yours: "bg-[#dbd6cb]",
  date: "bg-[var(--doc-ink-soft)]",
};

/** Text on each tone. `ours` flips through `.doc-invert`; `date` has no remap, so it is set. */
const TONE_TEXT: Record<Tone, string> = {
  ours: "text-[var(--doc-ink)]",
  yours: "text-[var(--doc-ink)]",
  date: "text-white",
};

/** Secondary text on each tone. Soft ink fails contrast on the `yours` fill, so it steps up. */
const TONE_SOFT: Record<Tone, string> = {
  ours: SOFT,
  yours: BODY,
  date: "text-white",
};

function Swatch({ tone }: { tone: Tone }) {
  return <span className={cn("h-4 w-4 shrink-0 rounded-[5px]", TONE[tone])} aria-hidden />;
}

function KeyItem({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("flex items-center gap-2", SM, BODY)}>
      <Swatch tone={tone} />
      {children}
    </span>
  );
}

/** A filled arrow. Points right; rotate it to point down where a row stacks on a phone. */
function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5 shrink-0 text-[var(--doc-ink-soft)]", className)}
      aria-hidden
    >
      <path
        d="M4 12h14M12.5 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Tags({ items, tone = "fill" }: { items: string[]; tone?: "fill" | "paper" }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "rounded-[var(--doc-r-chip)] px-2.5 py-0.5 font-medium whitespace-nowrap",
            MICRO,
            BODY,
            tone === "paper" ? "bg-[var(--doc-paper)]" : "bg-[var(--doc-fill)]",
          )}
        >
          {item}
        </span>
      ))}
    </span>
  );
}

/* ── Who we are talking to ──────────────────────────────────────────── */

const PAIR = [
  {
    title: "The patient",
    who: "An older adult. Often home in Ghana after years abroad.",
    worries: "Staying mobile. Falls, arthritis, life after a stroke. Care as good as abroad.",
    wins: "Calm, respectful explanations. A clean, modern clinic.",
    where: ["Facebook", "YouTube", "WhatsApp"],
  },
  {
    title: "Their son or daughter",
    who: "In Accra or abroad. Searches, compares and pays.",
    worries: "Is my parent in good hands? What will it cost? How is the recovery going?",
    wins: "Credentials. Real recovery stories. Home visits and easy booking.",
    where: ["Instagram", "Facebook", "YouTube", "LinkedIn"],
  },
];

const OTHERS: { who: string; worries: string; where: string[] }[] = [
  {
    who: "Local older adults",
    worries: "Joint pain, back pain, balance, life after surgery",
    where: ["Facebook", "YouTube"],
  },
  {
    who: "Parents of young children",
    worries: "Late walking, posture, sports injuries, conditions like cerebral palsy",
    where: ["Instagram", "TikTok", "Facebook"],
  },
  {
    who: "Young adults at work",
    worries: "Desk back pain, gym and football injuries, long hours in traffic",
    where: ["TikTok", "Instagram", "LinkedIn"],
  },
];

/* ── How the work feeds the platforms ───────────────────────────────── */

const STREAMS: {
  source: string;
  detail: string;
  needs: string | null;
  outputs: { what: string; to: string[] }[];
}[] = [
  {
    source: "Two shoot days",
    detail: "6 to 8 reels a day, batched by series and by room",
    needs: "A physio on set, a room and willing patients",
    outputs: [{ what: "16 reels", to: ["Instagram", "TikTok", "Facebook", "YouTube Shorts"] }],
  },
  {
    source: "One podcast half day",
    detail: "Two cameras, two microphones, 30 to 40 minutes",
    needs: "A physio to host, or to join as the guest",
    outputs: [
      { what: "1 full episode", to: ["YouTube"] },
      { what: "10 to 15 clips", to: ["TikTok", "Instagram", "Facebook"] },
      { what: "Quote cards", to: ["Instagram", "Facebook"] },
    ],
  },
  {
    source: "Design work at our office",
    detail: "Health days, tips, offers and milestones",
    needs: null,
    outputs: [
      { what: "8 to 10 graphics", to: ["Instagram", "Facebook"] },
      { what: "2 LinkedIn posts", to: ["LinkedIn"] },
    ],
  },
];

const EPISODES = [
  {
    month: "November",
    title: "Coming home: staying strong as you age in Ghana",
    guest: "A returnee patient",
  },
  {
    month: "December",
    title: "Caring for ageing parents, from Ghana or from abroad",
    guest: "A caregiver or family member",
  },
  {
    month: "January",
    title: "New year, new body? Getting back to exercise safely",
    guest: "A gym coach or sports person",
  },
];

/* ── One week ───────────────────────────────────────────────────────── */

const GRID_PLATFORMS = [
  { id: "ig", name: "Instagram", short: "IG" },
  { id: "tt", name: "TikTok", short: "TT" },
  { id: "fb", name: "Facebook", short: "FB" },
  { id: "yt", name: "YouTube", short: "YT" },
] as const;

type PlatformId = (typeof GRID_PLATFORMS)[number]["id"];

const WEEK: { day: string; post: string; on: PlatformId[] }[] = [
  { day: "Mon", post: "Myth or Fact reel", on: ["ig", "tt", "fb", "yt"] },
  { day: "Tue", post: "Podcast clip", on: ["ig", "tt", "fb"] },
  { day: "Wed", post: "Healthy ageing or Little Movers reel", on: ["ig", "tt", "fb", "yt"] },
  { day: "Thu", post: "Graphic: a tip, a health day or a service", on: ["ig", "fb"] },
  { day: "Fri", post: "Meet the Physio or Inside Ladkov reel", on: ["ig", "tt", "fb", "yt"] },
  { day: "Sat", post: "Podcast clip or Desk to Pitch", on: ["ig", "tt"] },
  { day: "Sun", post: "A recovery story or Book with Us", on: ["ig", "fb"] },
];

const PER_WEEK = WEEK.reduce((n, d) => n + d.on.length, 0);

/** Four weeks of the grid, plus the two LinkedIn posts and the full episode, to the nearest 5. */
const PER_MONTH = Math.round((PER_WEEK * 4 + 2 + 1) / 5) * 5;

const PLATFORM_JOBS: [string, string][] = [
  ["Instagram", "Trust. The clinic’s front window: reels, carousels, Stories and highlights."],
  ["TikTok", "Reach. Where new people find Ladkov: quick tips, myths and Accra humour."],
  ["Facebook", "Older adults and their families. Longer captions and health day flyers."],
  ["YouTube", "Depth. Full episodes and longer exercise videos that people find by search."],
  ["LinkedIn", "Doctors, companies and referrals. Milestones, the team, back care at work."],
];

/* ── What the posts are about ───────────────────────────────────────── */

const PILLARS = [
  {
    name: "Education",
    share: 30,
    series: "Myth or Fact · The 2-Minute Fix",
    example: "Should you rest completely when your back hurts?",
  },
  {
    name: "Healthy ageing and coming home",
    share: 20,
    series: "Welcome Home · Strong at Any Age",
    example: "Balance exercises that prevent falls at home",
  },
  {
    name: "The team and the clinic",
    share: 15,
    series: "Meet the Physio · Inside Ladkov",
    example: "What happens at your first visit",
  },
  {
    name: "Recovery stories and booking",
    share: 15,
    series: "Road to Recovery · Book with Us",
    example: "A stroke patient’s eight weeks, with consent",
  },
  {
    name: "Children",
    share: 10,
    series: "Little Movers",
    example: "How physio helps a child who is late to walk",
  },
  {
    name: "Young adults",
    share: 10,
    series: "Desk to Pitch",
    example: "Neck pain from phones and long hours in traffic",
  },
];

const TOP_SHARE = Math.max(...PILLARS.map((p) => p.share));

/* ── Thirteen weeks ─────────────────────────────────────────────────── */

/** Week 1 is Monday 2 November 2026. These are the Mondays. */
const WEEK_STARTS = [2, 9, 16, 23, 30, 7, 14, 21, 28, 4, 11, 18, 25];

const MONTH_BANDS = [
  { name: "November", from: 1, to: 4 },
  { name: "December", from: 5, to: 8 },
  { name: "January", from: 9, to: 13 },
];

type Mark = { from: number; to?: number; label?: string; tone: Tone };

/**
 * The shoot weeks are not arbitrary. Each shoot fills about two weeks of posts, and the
 * week-7 shoot and podcast carry the feeds through Christmas, when the clinic is quiet and
 * nobody wants a camera in their face. That is also why January's plan comes early.
 */
const TIMELINE: { label: string; marks: Mark[] }[] = [
  {
    label: "Health days",
    marks: [2, 3, 5, 8, 9, 11].map((w, i) => ({ from: w, label: String(i + 1), tone: "date" })),
  },
  {
    label: "Families home from abroad",
    marks: [{ from: 4, to: 10, label: "Diaspora season", tone: "date" }],
  },
  {
    label: "Next month’s plan, then your yes",
    marks: [
      { from: 3, tone: "ours" },
      { from: 4, tone: "yours" },
      { from: 5, tone: "ours" },
      { from: 6, tone: "yours" },
    ],
  },
  { label: "Shoot days", marks: [1, 3, 5, 7, 10, 12].map((w) => ({ from: w, tone: "ours" })) },
  {
    label: "Podcast recorded",
    marks: [
      { from: 2, label: "1", tone: "ours" },
      { from: 6, label: "2", tone: "ours" },
      { from: 7, label: "3", tone: "ours" },
    ],
  },
  {
    label: "Start the Year Pain-Free",
    marks: [{ from: 9, to: 12, label: "Campaign", tone: "ours" }],
  },
  {
    label: "Booking tools ready",
    marks: [{ from: 1, to: 4, label: "Set up", tone: "yours" }],
  },
  {
    label: "Boosting, if you choose",
    marks: [
      { from: 4, to: 7, label: "Welcome Home", tone: "yours" },
      { from: 9, to: 12, label: "Campaign", tone: "yours" },
    ],
  },
  {
    label: "Website, if you agree",
    marks: [
      { from: 5, to: 8, label: "Scope", tone: "ours" },
      { from: 9, to: 12, label: "Build and launch", tone: "ours" },
    ],
  },
  {
    label: "Reports to you",
    marks: [
      { from: 5, label: "R", tone: "ours" },
      { from: 10, label: "R", tone: "ours" },
    ],
  },
];

const HEALTH_DAYS = [
  "World Diabetes Day, 14 Nov",
  "World Prematurity Day, 17 Nov, and World COPD Day, mid November",
  "Day of Persons with Disabilities, 3 Dec, and National Farmers’ Day, 4 Dec",
  "Christmas",
  "New Year",
  "Schools reopen",
];

/* ── Month by month ─────────────────────────────────────────────────── */

const MONTHS: {
  n: number;
  month: string;
  title: string;
  goal: string;
  weeks: [string, string, string][];
  extra: React.ReactNode;
}[] = [
  {
    n: 1,
    month: "November",
    title: "Meet Ladkov",
    goal: "Faces people know, and a look people recognise. We also test which formats your audience likes.",
    weeks: [
      ["2 Nov", "Introducing Ladkov", "A clinic tour, Meet the Physio, and what we treat"],
      [
        "9 Nov",
        "Diabetes and the body",
        "Diabetes Day, diabetic foot care, a safe walking routine",
      ],
      [
        "16 Nov",
        "Breathing and little ones",
        "Little Movers for babies born early, breathing exercises, the first podcast clips",
      ],
      [
        "23 Nov",
        "Ageing well at home",
        "Exercises that prevent falls, and a checklist: is your parent’s home safe?",
      ],
    ],
    extra: (
      <>
        <strong>In the first week</strong> we tidy all five profiles, fix the look and the
        templates, and collect consent forms.
      </>
    ),
  },
  {
    n: 2,
    month: "December",
    title: "Welcome Home",
    goal: "The biggest month. Families are home for Christmas. Sons and daughters see a parent’s health up close.",
    weeks: [
      [
        "30 Nov",
        "Mobility for everyone",
        "Disabilities Day, back care for Farmers’ Day, a walking-frame progress story",
      ],
      [
        "7 Dec",
        "Welcome Home",
        "Returnee patients and their routines. “Book your parent’s check-up while you’re home.”",
      ],
      [
        "14 Dec",
        "Travel and the festive season",
        "Stiffness after long flights, lifting luggage, standing for hours to cook",
      ],
      [
        "21 Dec",
        "Christmas",
        "A greeting from the team, the year behind the scenes, the best of the month",
      ],
    ],
    extra: (
      <>
        <strong>An idea for you to decide:</strong> a gift voucher or family check-up package that
        someone abroad can buy for a parent. If you run it, the content sells it.
      </>
    ),
  },
  {
    n: 3,
    month: "January",
    title: "Start the Year Pain-Free",
    goal: "Two months of trust, turned into bookings. One campaign, and a call to book on most posts.",
    weeks: [
      [
        "28 Dec",
        "Campaign launch",
        "A New Year greeting, three signs you shouldn’t ignore that pain, a first-visit walkthrough",
      ],
      [
        "4 Jan",
        "Back to routine",
        "The gym without injury, a desk fix, a take-home plan for returnees flying back",
      ],
      ["11 Jan", "Kids back to school", "Heavy school bags, posture, sports injuries in children"],
      [
        "18 Jan",
        "Proof",
        "Two or three recovery stories, a three-month reel, a thank you from the team",
      ],
    ],
    extra: (
      <>
        <strong>One line for the whole month:</strong> “Don’t carry last year’s pain into this year.
        Book an assessment.” A flyer set and a pinned reel carry it on every platform.
      </>
    ),
  },
];

const HANDOVERS = [
  "Into December: faces people recognise, and a first report on which series work.",
  "Into January: families who now know the name. The three strongest series get more slots, and the weak formats go.",
];

const KEEPS: [string, string][] = [
  ["3", "podcast episodes"],
  ["30 to 45", "clips"],
  ["24 to 30", "graphics"],
  ["6", "LinkedIn posts"],
];

/* ── The monthly loop ───────────────────────────────────────────────── */

const LOOP: { when: string; ours?: string; yours?: string }[] = [
  { when: "By the 20th", ours: "We send next month’s plan: themes, scripts and shoot dates." },
  { when: "Within 3 working days", yours: "You approve it, or tell us what to change." },
  {
    when: "On the agreed days",
    ours: "We shoot at the clinic with our own kit.",
    yours: "You give us a room, a physio and willing patients.",
  },
  { when: "Every week", ours: "We edit, and send you the week’s batch." },
  { when: "Every week", yours: "You check it and say yes." },
  {
    when: "Every day",
    ours: "We post on all five platforms.",
    yours: "You answer the messages and calls the posts bring in.",
  },
  {
    when: "First week of the next month",
    ours: "We report what worked and what did not. The report shapes the next plan.",
  },
];

/* ── Where our work waits on you ────────────────────────────────────── */

const NEEDS: [string, string | null][] = [
  [
    "We write the month’s plan and every script.",
    "Your yes within three working days, and a physio to check the clinical facts.",
  ],
  [
    "We film at the clinic with our own cameras, lights and microphones.",
    "A room to film in, a physio’s time, and willing patients.",
  ],
  ["We record the podcast.", "A physiotherapist to host, or to join as the guest."],
  ["We film real patients.", "A signed consent form from each one. We bring the forms."],
  ["We brief and direct models on set.", "You find the models, when an idea needs them."],
  ["Our posts bring in messages and calls.", "Someone who answers them quickly, every day."],
  [
    "Our report counts new patients from social media.",
    "Your front desk asking every new patient: how did you hear about us?",
  ],
  ["We pick the posts worth boosting.", "Your decision, and your budget."],
  ["We edit, design, write the captions and post on five platforms.", null],
];

/* ── Consent ────────────────────────────────────────────────────────── */

type Seen = 0 | 0.5 | 1;

const LEVELS: { name: string; seen: [Seen, Seen, Seen, Seen]; good: string }[] = [
  { name: "Full feature", seen: [1, 1, 1, 1], good: "Recovery stories, testimonials" },
  { name: "Hands and movement", seen: [0, 0, 1, 0], good: "Exercise demos, progress clips" },
  { name: "Voice only", seen: [0, 1, 0, 0], good: "Testimonials from private patients" },
  { name: "Written words", seen: [0, 0, 0, 0.5], good: "Carousels and flyers" },
  { name: "Acted by someone else", seen: [0, 0, 0, 0], good: "Sensitive conditions, children" },
];

function Dot({ v }: { v: Seen }) {
  if (v === 0) {
    return (
      <span
        role="img"
        aria-label="Not shown"
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--doc-ink-soft)] align-middle"
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={v === 1 ? "Shown" : "First name or initials only"}
      className="inline-block h-3.5 w-3.5 rounded-full align-middle"
      style={{
        background:
          v === 1
            ? "var(--doc-ink)"
            : "linear-gradient(90deg, var(--doc-ink) 50%, var(--doc-fill-strong) 50%)",
      }}
    />
  );
}

/* ── From a video to a visit ────────────────────────────────────────── */

const FUNNEL: { stage: string; who: Tone; width: number; tools: string }[] = [
  {
    stage: "Sees a post",
    who: "ours",
    width: 100,
    tools:
      "Reels, podcast clips and boosted posts. A Google profile for people who search “physiotherapy near me”.",
  },
  {
    stage: "Trusts the clinic",
    who: "ours",
    width: 90,
    tools: "Your physios’ faces, recovery stories, full podcast episodes and reviews.",
  },
  {
    stage: "Gets in touch",
    who: "yours",
    width: 80,
    tools:
      "WhatsApp Business with quick replies. A free guide, Home Exercises for Older Adults, given for a phone number. A lead tracker the front desk fills in every day.",
  },
  {
    stage: "Books a visit",
    who: "yours",
    width: 70,
    tools:
      "One clear offer, with its own code for each campaign, so you can see which post brought the patient. Family and gift packages that children abroad can pay for.",
  },
  {
    stage: "Returns and refers",
    who: "yours",
    width: 60,
    tools: "A review request after a good session. A refer-a-friend discount for both people.",
  },
];

/* ── Boosting ───────────────────────────────────────────────────────── */

const BOOSTS: [string, string, string][] = [
  [
    "Welcome Home, and “Book your parent’s check-up”",
    "Ghanaians in the UK, USA, Canada and Europe, and Accra",
    "Late Nov to mid Dec",
  ],
  ["The Start the Year Pain-Free reel", "Adults over 30 near East Legon", "January"],
  ["Your best Meet the Physio or recovery story", "Older adults and parents in Accra", "Any month"],
];

/* ── Appendix ───────────────────────────────────────────────────────── */

const SAMPLES: { hook: string; how: string; series: string; who: string }[] = [
  {
    hook: "Rest is the cure for back pain. Myth or fact?",
    how: "A physio reacts to the claim, then explains and shows",
    series: "Myth or Fact",
    who: "Physiotherapist",
  },
  {
    hook: "Do this before you get out of bed",
    how: "Simple stretches on a bed, filmed from above and the side",
    series: "The 2-Minute Fix",
    who: "Physio and a model",
  },
  {
    hook: "Your parent can’t get up from a chair easily. Here’s why.",
    how: "A sit-to-stand test, then a three-move routine",
    series: "Strong at Any Age",
    who: "An older patient (level 1 or 2), or a model",
  },
  {
    hook: "Coming home after 30 years abroad",
    how: "An interview, cut with footage of the patient’s sessions",
    series: "Welcome Home",
    who: "A returnee patient (level 1)",
  },
  {
    hook: "When should your baby be walking?",
    how: "A calm explainer over soft footage of a session",
    series: "Little Movers",
    who: "Physio, with a parent and child or a re-enactment",
  },
  {
    hook: "Two hours in traffic. Your back after:",
    how: "A funny skit in a car, then the fix",
    series: "Desk to Pitch",
    who: "A model or staff",
  },
  {
    hook: "POV: your first visit to Ladkov",
    how: "First person, from reception to assessment",
    series: "Inside Ladkov",
    who: "Staff",
  },
  {
    hook: "Meet [name]: why I became a physiotherapist",
    how: "A sit-down interview with clinic footage",
    series: "Meet the Physio",
    who: "Physiotherapist",
  },
  {
    hook: "Week 1 vs week 8",
    how: "Progress footage, side by side",
    series: "Road to Recovery",
    who: "A patient (level 1 or 2)",
  },
  {
    hook: "3 things in your house that cause falls",
    how: "A walk through a home, or a set dressed as one",
    series: "Strong at Any Age",
    who: "Physiotherapist",
  },
  {
    hook: "What’s this machine for?",
    how: "Quick cuts of each piece of equipment in use",
    series: "Inside Ladkov",
    who: "Physio and a model",
  },
  {
    hook: "Gym in January? Read this first",
    how: "Common mistakes and their fixes, in the clinic gym",
    series: "Desk to Pitch",
    who: "Physio and a model",
  },
];

/* ── Diagrams ───────────────────────────────────────────────────────── */

/** The patient and the person paying, with what passes between them. */
function AudiencePair() {
  return (
    <div className="mt-7 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-stretch sm:gap-3">
      {PAIR.map((p, i) => (
        <Fragment key={p.title}>
          {i === 1 && (
            <div className="flex items-center justify-center gap-2 py-1 sm:w-20 sm:flex-col sm:py-0">
              <Arrow className="-rotate-90 sm:rotate-180" />
              <p className={cn("text-center font-semibold", MICRO, SOFT)}>
                looks for care, pays, checks in
              </p>
            </div>
          )}
          <div className="rounded-[var(--doc-r-panel)] bg-[var(--doc-fill)] p-6">
            <p className={cn("text-[length:var(--doc-t-lead)] font-semibold", INK)}>{p.title}</p>
            <p className={cn("mt-1", SM, BODY)}>{p.who}</p>
            <dl className={cn("mt-5 space-y-3", XS)}>
              <div>
                <dt className={cn("font-semibold", INK)}>Worries about</dt>
                <dd className={BODY}>{p.worries}</dd>
              </div>
              <div>
                <dt className={cn("font-semibold", INK)}>Won over by</dt>
                <dd className={BODY}>{p.wins}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <Tags items={p.where} tone="paper" />
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/** Three sources at the clinic, fanning out to the platforms. */
function FeedDiagram() {
  return (
    <div className="mt-8 space-y-6">
      {STREAMS.map((s) => (
        <div
          key={s.source}
          className="avoid-break grid gap-2 sm:grid-cols-[13rem_auto_minmax(0,1fr)] sm:items-center sm:gap-5"
        >
          <div>
            <div className={cn("rounded-[var(--doc-r-inset)] px-5 py-4", TONE.ours)}>
              <p className={cn("font-semibold", SM, INK)}>{s.source}</p>
              <p className={cn("mt-0.5", XS, SOFT)}>{s.detail}</p>
            </div>
            {s.needs && (
              <div className={cn("mt-1 rounded-[var(--doc-r-inset)] px-5 py-3", TONE.yours)}>
                <p className={cn(XS, BODY)}>
                  <span className={cn("font-semibold", INK)}>From you: </span>
                  {s.needs}
                </p>
              </div>
            )}
          </div>

          <Arrow className="mx-5 rotate-90 sm:mx-0 sm:rotate-0" />

          <div className="space-y-3">
            {s.outputs.map((o) => (
              <div key={o.what} className="flex flex-col gap-1.5">
                <p
                  className={cn(
                    "text-[length:var(--doc-t-lead)] leading-tight font-semibold tabular-nums",
                    INK,
                  )}
                >
                  {o.what}
                </p>
                <Tags items={o.to} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2 rounded-[var(--doc-r-panel)] bg-[var(--doc-fill-quiet)] p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <Figure value={`About ${PER_MONTH}`} className="shrink-0 whitespace-nowrap" />
        <p className={cn(SM, BODY)}>
          posts go out in a typical month, from about three days at the clinic.
        </p>
      </div>
    </div>
  );
}

/** Seven days down, four platforms across. A filled dot is a post that goes out. */
function WeekGrid() {
  const cols =
    "grid grid-cols-[2.75rem_minmax(0,1fr)_repeat(4,1.75rem)] sm:grid-cols-[3.25rem_minmax(0,1fr)_repeat(4,5rem)] items-center gap-x-2";
  const totals = GRID_PLATFORMS.map((p) => WEEK.filter((d) => d.on.includes(p.id)).length);

  return (
    <div className="mt-7 overflow-hidden rounded-[var(--doc-r-inset)]">
      <div className={cn(cols, "bg-[var(--doc-fill-strong)] px-4 py-3 font-semibold", XS, INK)}>
        <span>Day</span>
        <span>Main post</span>
        {GRID_PLATFORMS.map((p) => (
          <span key={p.id} className="text-center">
            <span className="sm:hidden">{p.short}</span>
            <span className="hidden sm:inline">{p.name}</span>
          </span>
        ))}
      </div>
      {WEEK.map((d, i) => (
        <div
          key={d.day}
          className={cn(
            cols,
            "px-4 py-2",
            i % 2 ? "bg-[var(--doc-fill)]" : "bg-[var(--doc-paper)]",
          )}
        >
          <span className={cn("font-semibold", XS, INK)}>{d.day}</span>
          <span className={cn(XS, BODY)}>{d.post}</span>
          {GRID_PLATFORMS.map((p) => (
            <span key={p.id} className="flex justify-center">
              {d.on.includes(p.id) ? (
                <span
                  role="img"
                  aria-label={`Posted on ${p.name}`}
                  className="h-3.5 w-3.5 rounded-full bg-[var(--doc-fill-ink)]"
                />
              ) : (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--doc-fill-strong)]"
                  aria-hidden
                />
              )}
            </span>
          ))}
        </div>
      ))}
      <div className={cn(cols, "bg-[var(--doc-fill-strong)] px-4 py-3 font-semibold", XS, INK)}>
        <span className="col-span-2">Posts a week</span>
        {totals.map((t, i) => (
          <span key={GRID_PLATFORMS[i].id} className="text-center tabular-nums">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function PillarChart() {
  return (
    <div className="mt-7 space-y-2">
      {PILLARS.map((p, i) => (
        <div
          key={p.name}
          className={cn(
            "avoid-break grid gap-3 rounded-[var(--doc-r-inset)] px-5 py-4 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-center sm:gap-8",
            i % 2 ? "bg-[var(--doc-paper)]" : "bg-[var(--doc-fill-quiet)]",
          )}
        >
          <div className="min-w-0">
            <p className={cn("font-semibold", SM, INK)}>{p.name}</p>
            <p className={cn(XS, BODY)}>{p.series}</p>
            <p className={cn("mt-1", XS, SOFT)}>“{p.example}”</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 flex-1 rounded-[var(--doc-r-chip)] bg-[var(--doc-fill)]">
              <div
                className="h-3 rounded-[var(--doc-r-chip)] bg-[var(--doc-fill-ink)]"
                style={{ width: `${(p.share / TOP_SHARE) * 100}%` }}
              />
            </div>
            <span className={cn("w-10 text-right font-semibold tabular-nums", SM, INK)}>
              {p.share}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Thirteen weeks across, one row per strand of work. Read down a column for one week. */
function Timeline() {
  const cols = "grid grid-cols-[repeat(13,minmax(0,1fr))] gap-[3px]";
  const row = "sm:grid sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:items-center sm:gap-4";

  return (
    <div className="mt-7 space-y-2.5">
      <div className={row}>
        <span className="hidden sm:block" />
        <div>
          <div className={cols}>
            {MONTH_BANDS.map((m) => (
              <span
                key={m.name}
                style={{ gridColumn: `${m.from} / ${m.to + 1}` }}
                className={cn(
                  "truncate rounded-[8px] bg-[var(--doc-fill-strong)] py-1 text-center font-semibold",
                  MICRO,
                  INK,
                )}
              >
                {m.name}
              </span>
            ))}
          </div>
          <div className={cn(cols, "mt-1")}>
            {WEEK_STARTS.map((d, i) => (
              <span key={i} className={cn("text-center tabular-nums", MICRO, SOFT)}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {TIMELINE.map((r) => (
        <div key={r.label} className={row}>
          <p className={cn("mb-1 sm:mb-0", XS, BODY)}>{r.label}</p>
          <div className={cn(cols, "grid-rows-[1.75rem]")}>
            {WEEK_STARTS.map((_, i) => (
              <span
                key={i}
                style={{ gridColumn: i + 1, gridRow: 1 }}
                className="rounded-[8px] bg-[var(--doc-fill-quiet)]"
              />
            ))}
            {r.marks.map((m, i) => (
              <span
                key={i}
                style={{ gridColumn: `${m.from} / ${(m.to ?? m.from) + 1}`, gridRow: 1 }}
                className={cn(
                  "z-[1] flex min-w-0 items-center justify-center overflow-hidden rounded-[8px] px-1.5 font-semibold",
                  MICRO,
                  TONE[m.tone],
                  TONE_TEXT[m.tone],
                )}
              >
                {m.label && <span className="truncate">{m.label}</span>}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Two lanes, one month. Every crossing from dark to light is a handover. */
function MonthlyLoop() {
  return (
    <div className="mt-7 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Chip tone="ink" className="justify-center">
          Saharabase
        </Chip>
        <Chip className="justify-center">Ladkov</Chip>
      </div>
      {LOOP.map((step, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          {(["ours", "yours"] as const).map((lane) => {
            const text = step[lane];
            return text ? (
              <div
                key={lane}
                className={cn("rounded-[var(--doc-r-inset)] px-4 py-3.5 sm:px-5", TONE[lane])}
              >
                <p className={cn(MICRO, TONE_SOFT[lane])}>
                  <span className={cn("font-semibold tabular-nums", INK)}>{i + 1}</span>
                  &nbsp;&nbsp;{step.when}
                </p>
                <p className={cn("mt-1", XS, INK)}>{text}</p>
              </div>
            ) : (
              <div key={lane} className="rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)]" />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function NeedsPairs() {
  return (
    <div className="mt-7 space-y-3">
      <div className="hidden grid-cols-2 gap-1.5 sm:grid">
        <Chip tone="ink" className="justify-center">
          What we do
        </Chip>
        <Chip className="justify-center">What it needs from you</Chip>
      </div>
      {NEEDS.map(([ours, yours]) => (
        <div key={ours} className="avoid-break grid gap-1 sm:grid-cols-2 sm:gap-1.5">
          <div className={cn("rounded-[var(--doc-r-inset)] px-5 py-3.5", TONE.ours)}>
            <p className={cn(XS, INK)}>{ours}</p>
          </div>
          <div
            className={cn(
              "rounded-[var(--doc-r-inset)] px-5 py-3.5",
              yours ? TONE.yours : "bg-[var(--doc-fill-quiet)]",
            )}
          >
            <p className={cn(XS, yours ? INK : SOFT)}>
              {yours ? (
                <>
                  <span className="font-semibold sm:hidden">Needs: </span>
                  {yours}
                </>
              ) : (
                "Nothing from you. This part is all ours."
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Funnel() {
  return (
    <div className="mt-8">
      {FUNNEL.map((s, i) => (
        <Fragment key={s.stage}>
          {i === 2 && (
            <div className="mb-4 flex items-center gap-3 pl-4">
              <Arrow className="rotate-90" />
              <p className={cn("font-semibold", SM, INK)}>
                Here our work hands over to your front desk.
              </p>
            </div>
          )}
          <div className="avoid-break mb-5">
            <div
              className={cn(
                "flex h-12 items-center gap-3 rounded-[var(--doc-r-chip)] px-5",
                TONE[s.who],
              )}
              style={{ width: `${s.width}%` }}
            >
              <span className={cn("font-semibold tabular-nums", SM, TONE_SOFT[s.who])}>
                {i + 1}
              </span>
              <span className={cn("truncate font-semibold", SM, INK)}>{s.stage}</span>
            </div>
            <p className={cn("mt-2 pl-5", XS, BODY)}>{s.tools}</p>
            {i === 2 && (
              <div className="mt-3 ml-5 rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)] px-5 py-4">
                <p className={cn("font-semibold", SM, INK)}>Most clinics lose people here.</p>
                <p className={cn("mt-1", XS, BODY)}>
                  Someone watches a video, means to call, and forgets. Catch the name and number
                  while the interest is warm.
                </p>
              </div>
            )}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Ladkov Physiotherapy, East Legon. Three months of social media content: reels, graphics
 * and a two-person podcast, shot on site with our own kit, edited and posted on five
 * platforms. The user met them on 7 October 2026 and drafted the plan; this is that plan
 * set on the proposal sheet, with the relationships drawn rather than described.
 *
 * Decisions worth remembering:
 *
 *  - No prices. The user told the clinic they would build a sample plan first and price
 *    from it. The closing panel says the price follows once the shape is agreed.
 *  - Every diagram uses one code: dark blocks are our work, light blocks are the clinic's.
 *    It is what makes the dependencies visible at a glance. Keep it if a diagram is added.
 *  - Nothing promises followers, virality or bookings. The promise is volume, schedule and
 *    an honest report. The user was explicit that results cannot be guaranteed.
 *  - The real buyer is often the patient's adult child, frequently abroad. December, when
 *    the diaspora is home, is the biggest month for that reason.
 *  - January's plan comes in early December, not by the 20th, so the January campaign can
 *    be filmed before the Christmas shutdown. The timeline and the loop both say so.
 *  - The website and the booking tools are offered as later phases, not sold here.
 */
export function LadkovContentPlan({ record }: { record: DocumentRecord }) {
  return (
    <>
      <VerifyLine record={record} />
      <Letterhead record={record} />

      {/* Prepared For */}
      <Section>
        <Eyebrow>Prepared For</Eyebrow>
        <Heading size="h2" className="mt-3">
          Ladkov Physiotherapy
        </Heading>
        <Note className="mt-2">East Legon, Accra</Note>

        <div className="mt-6">
          <DetailList>
            <DetailRow
              label="What we are offering"
              value="Video, graphics and a podcast, filmed at your clinic and posted for you"
            />
            <DetailRow label="How long" value="Three months, November 2026 to January 2027" />
            <DetailRow
              label="Where it goes"
              value="Instagram, TikTok, Facebook, YouTube and LinkedIn"
            />
            <DetailRow
              label="Each month"
              value="16 reels, 1 podcast episode, 10 to 15 clips, 8 to 10 graphics"
            />
            <DetailRow label="Time at your clinic" value="About three days a month" />
            <DetailRow label="This plan holds for" value="21 days from the date above" />
          </DetailList>
        </div>
      </Section>

      {/* Opening */}
      <Section>
        <Lead>
          You asked for a team that brings its own kit, films at the clinic, writes the scripts,
          edits and posts. This plan shows what three months of that looks like.
        </Lead>
        <P className="mt-5">
          The goal: when an older adult in East Legon needs a physiotherapist, or their daughter in
          London searches for one, <strong>Ladkov is the name they already know.</strong>
        </P>
        <Note className="mt-4">If we start earlier or later, every date here moves with it.</Note>

        <Panel
          tone="quiet"
          className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
        >
          <P>
            The pictures in this plan show who does what.{" "}
            <strong>Dark is our work. Light is your part.</strong>
          </P>
          <div className="flex shrink-0 gap-5">
            <KeyItem tone="ours">Our work</KeyItem>
            <KeyItem tone="yours">Your part</KeyItem>
          </div>
        </Panel>
      </Section>

      {/* Audience */}
      <Section>
        <Heading>The patient and the person who pays are often two people</Heading>
        <P className="mt-4">
          Most of your patients are older adults, many of them home after years abroad. The one
          searching and paying is often their grown child, sometimes still abroad. Every post has to
          speak to both.
        </P>

        <AudiencePair />

        <p className={cn("mt-8 mb-3 font-semibold", SM, INK)}>Three more groups we speak to</p>
        <div className="overflow-hidden rounded-[var(--doc-r-inset)]">
          {OTHERS.map((o, i) => (
            <div
              key={o.who}
              className={cn(
                "grid gap-2 px-5 py-3.5 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5",
                i % 2 ? "bg-[var(--doc-paper)]" : "bg-[var(--doc-fill)]",
              )}
            >
              <p className={cn("font-semibold", XS, INK)}>{o.who}</p>
              <p className={cn(XS, BODY)}>{o.worries}</p>
              <Tags items={o.where} tone={i % 2 ? "fill" : "paper"} />
            </div>
          ))}
        </div>
        <Note className="mt-5">
          If you offer home visits, packages for older patients or progress updates for families, we
          put them up front. Families abroad look for exactly these.
        </Note>
      </Section>

      {/* Feed */}
      <Section>
        <Heading>Three days at the clinic, a month of posts</Heading>
        <P className="mt-4">
          We film about two weeks of reels in one visit. One podcast conversation gives a month of
          clips. Each piece is cut again for every platform it goes to.
        </P>
        <FeedDiagram />
      </Section>

      {/* Podcast */}
      <Section>
        <Heading>The podcast</Heading>
        <div className="mt-6">
          <DetailList>
            <DetailRow label="Working title" value="The Recovery Room by Ladkov, to be agreed" />
            <DetailRow label="Who talks" value="A Ladkov physiotherapist and a host or guest" />
            <DetailRow label="Length" value="30 to 40 minutes, relaxed and conversational" />
            <DetailRow
              label="Where"
              value="A quiet room at the clinic, with your branded backdrop"
            />
          </DetailList>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="doc-table min-w-[30rem]">
            <thead>
              <tr>
                <th>Month</th>
                <th>Episode</th>
                <th>Possible guest</th>
              </tr>
            </thead>
            <tbody>
              {EPISODES.map((e) => (
                <tr key={e.month}>
                  <td className="whitespace-nowrap">{e.month}</td>
                  <td className="font-semibold text-[var(--doc-ink)]">{e.title}</td>
                  <td>{e.guest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <BulletList className="mt-6">
          <Bullet>Strong answers become reels of 30 to 60 seconds.</Bullet>
          <Bullet>Surprising lines become hooks for TikTok.</Bullet>
          <Bullet>Advice becomes quote cards and carousels.</Bullet>
        </BulletList>
        <Note className="mt-4">
          The number of clips follows the conversation. A strong episode gives more than 15.
        </Note>
      </Section>

      {/* Week */}
      <Section>
        <div className="avoid-break">
          <Heading>One week across the platforms</Heading>
          <P className="mt-4">
            A reel goes out on up to four platforms. We change the caption, the length and the cover
            for each, so nothing looks copied.
          </P>
          <WeekGrid />
        </div>
        <Note className="mt-3">
          Plus one full episode a month on YouTube, and two LinkedIn posts. Posting times change
          after month one, once we see each audience.
        </Note>

        <div className="avoid-break mt-5 overflow-hidden rounded-[var(--doc-r-inset)]">
          {PLATFORM_JOBS.map(([name, job], i) => (
            <div
              key={name}
              className={cn(
                "flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:gap-5",
                i % 2 ? "bg-[var(--doc-paper)]" : "bg-[var(--doc-fill)]",
              )}
            >
              <p className={cn("shrink-0 font-semibold sm:w-24", XS, INK)}>{name}</p>
              <p className={cn(XS, BODY)}>{job}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Pillars */}
      <Section>
        <Heading>What the posts are about</Heading>
        <P className="mt-4">
          Six subjects, each with its own named series. Viewers learn what to expect. Shoot days run
          faster.
        </P>
        <PillarChart />
        <Note className="mt-4">Podcast clips feed every subject, depending on the episode.</Note>
      </Section>

      {/* Timeline */}
      <Section avoidBreak>
        <Heading>Thirteen weeks, November to January</Heading>
        <P className="mt-4">
          The whole plan, week by week. Read down a column to see what happens together.
        </P>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
          <KeyItem tone="ours">Our work</KeyItem>
          <KeyItem tone="yours">Your part</KeyItem>
          <KeyItem tone="date">The calendar</KeyItem>
        </div>
        <Timeline />
        <ol className={cn("mt-6 grid gap-x-8 gap-y-1.5 sm:grid-cols-2", XS, BODY)}>
          {HEALTH_DAYS.map((d, i) => (
            <li key={d} className="flex gap-2.5">
              <span className={cn("w-3 shrink-0 font-semibold tabular-nums", INK)}>{i + 1}</span>
              <span className="min-w-0">{d}</span>
            </li>
          ))}
        </ol>
        <Note className="mt-4">
          Shoot days and podcast sessions come about seven to nine times in all. Each shoot fills
          the next two weeks. We confirm the exact dates when you approve each month&rsquo;s plan.
          If we start in October, World Osteoporosis Day (20 Oct) and World Stroke Day (29 Oct) join
          the calendar.
        </Note>
      </Section>

      {/* Months */}
      <Section>
        <Heading>Each month hands something to the next</Heading>
        <div className="mt-7">
          {MONTHS.map((m, i) => (
            <Fragment key={m.month}>
              <Panel
                tone={m.n === 2 ? "base" : "quiet"}
                className="avoid-break grid gap-6 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-7 sm:p-7"
              >
                <div>
                  <Chip tone="paper">
                    Month {m.n} · {m.month}
                  </Chip>
                  <Heading className="mt-4">{m.title}</Heading>
                  <p className={cn("mt-3", SM, BODY)}>{m.goal}</p>
                  <p className={cn("mt-4", XS, BODY)}>{m.extra}</p>
                </div>
                <ol className="space-y-1.5">
                  {m.weeks.map(([date, theme, detail]) => (
                    <li
                      key={date}
                      className="rounded-[var(--doc-r-inset)] bg-[var(--doc-paper)] px-4 py-2"
                    >
                      <p className={cn(XS, BODY)}>
                        <span className={cn("tabular-nums", SOFT)}>{date}</span>
                        &nbsp;&nbsp;
                        <span className={cn("font-semibold", INK)}>{theme}</span>
                      </p>
                      <p className={cn("mt-0.5", XS, BODY)}>{detail}</p>
                    </li>
                  ))}
                </ol>
              </Panel>
              {HANDOVERS[i] && (
                <div className="my-3 flex items-center gap-3 pl-6 sm:pl-8">
                  <Arrow className="rotate-90" />
                  <p className={cn(SM, BODY)}>{HANDOVERS[i]}</p>
                </div>
              )}
            </Fragment>
          ))}
        </div>

        <div className="my-3 flex items-center gap-3 pl-6 sm:pl-8">
          <Arrow className="rotate-90" />
          <p className={cn(SM, BODY)}>And at the end of it:</p>
        </div>
        <Panel tone="strong" className="avoid-break">
          <Heading>After thirteen weeks, this is yours to keep</Heading>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-12">
            <Figure value="48" caption="reels" className="shrink-0" />
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              {KEEPS.map(([n, what]) => (
                <div key={what}>
                  <dt
                    className={cn(
                      "text-[length:var(--doc-t-lead)] leading-none font-semibold tabular-nums",
                      INK,
                    )}
                  >
                    {n}
                  </dt>
                  <dd className={cn("mt-1.5", XS, SOFT)}>{what}</dd>
                </div>
              ))}
            </dl>
          </div>
          <P className="mt-7">
            Plus the templates, and the raw footage if you ask for it. A final report comes in the
            first week of February. It tells you what grew, what worked, and what we would do next:
            carry on, grow, or hand over to someone in-house using our templates.
          </P>
        </Panel>
      </Section>

      {/* Loop */}
      <Section>
        <div className="avoid-break">
          <Heading>Every month runs on the same loop</Heading>
          <P className="mt-4">
            You approve the plan once a month. We then make it, with a quick check from you before
            anything goes live.
          </P>
          <MonthlyLoop />
        </div>
        <Panel tone="quiet" className="avoid-break mt-6">
          <P>
            <strong>A late step holds up every step after it.</strong> A plan approved a week late
            means a shoot a week late. That is a week with nothing new to post.
          </P>
          <Note className="mt-3">
            January is the one exception to the 20th. Its plan comes to you in the first week of
            December, so we can film before the holidays.
          </Note>
        </Panel>
      </Section>

      {/* Needs */}
      <Section>
        <Heading>Where our work waits on you</Heading>
        <P className="mt-4">
          Most of this plan is ours to carry. These are the places it waits on Ladkov.
        </P>
        <NeedsPairs />
      </Section>

      {/* Consent */}
      <Section avoidBreak>
        <Heading>Every patient chooses how much of them is seen</Heading>
        <P className="mt-4">
          No patient appears without a signed form. Each one picks a level. Shy patients can still
          take part.
        </P>
        <div className="mt-6 overflow-x-auto">
          <table className="doc-table min-w-[32rem] table-fixed">
            <thead>
              <tr>
                <th className="w-[28%]">Level</th>
                <th className="w-[9%] px-1 text-center">Face</th>
                <th className="w-[9%] px-1 text-center">Voice</th>
                <th className="w-[9%] px-1 text-center">Body</th>
                <th className="w-[9%] px-1 text-center">Name</th>
                <th className="w-[36%]">Good for</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((l, i) => (
                <tr key={l.name}>
                  <td className="font-semibold text-[var(--doc-ink)]">
                    {i + 1}. {l.name}
                  </td>
                  {l.seen.map((v, j) => (
                    <td key={j} className="px-1 text-center">
                      <Dot v={v} />
                    </td>
                  ))}
                  <td>{l.good}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note className="mt-3">
          A full dot is shown. A half dot is a first name or initials only.
        </Note>
        <P className="mt-5">
          Children appear only with a parent&rsquo;s written consent, at the level the parent
          chooses. We bring each willing patient a specific idea, so they know exactly what they are
          agreeing to.
        </P>
      </Section>

      {/* Funnel */}
      <Section>
        <Heading>From a video to a booked visit</Heading>
        <P className="mt-4">
          Social media brings attention. The clinic grows only when that attention becomes a booked
          visit. Every post points to one next step.
        </P>
        <Funnel />
        <Note>
          A WhatsApp auto-reply can be this plain: &ldquo;Thanks for contacting Ladkov. Reply 1 to
          book, 2 for services.&rdquo; Offers and prices are your decisions. We design the materials
          and put them in the calendar.
        </Note>

        <Panel tone="quiet" className="avoid-break mt-7">
          <Heading>Our advice</Heading>
          <P className="mt-4">
            Start with the three months of content. In November, set up WhatsApp Business, one offer
            and a lead tracker. Plan the website in December, so it can go live with the January
            campaign or soon after.
          </P>
        </Panel>
      </Section>

      {/* Website */}
      <Section avoidBreak>
        <Heading>Your website</Heading>
        <P className="mt-4">
          To our knowledge, your website has not changed since around 2024. We will confirm that
          when we check it properly. Families abroad look at the website before they pay. An old one
          undoes the trust the videos build.
        </P>
        <P className="mt-4">We build websites. A refreshed one would have:</P>
        <BulletList className="mt-4">
          <Bullet>
            A design made for phones, with WhatsApp and booking buttons on every page.
          </Bullet>
          <Bullet>
            A page for each condition, such as stroke, back pain, arthritis and children, so people
            find Ladkov on Google.
          </Bullet>
          <Bullet>A page for families abroad: packages, payment and progress updates.</Bullet>
          <Bullet>A page for each campaign and for the free guide.</Bullet>
          <Bullet>
            Your reels and podcast episodes, so they keep working after they leave the feed.
          </Bullet>
          <Bullet>Figures that show which channels bring visitors and bookings.</Bullet>
        </BulletList>
        <Note className="mt-4">This is a later phase, priced on its own.</Note>
      </Section>

      {/* Boosting */}
      <Section avoidBreak>
        <Heading>Boosting, when you are ready</Heading>
        <P className="mt-4">
          There is no paid budget yet, so the plan works without one. Each month we name the two or
          three posts most worth boosting. A small budget on a few posts beats a thin spread across
          many.
        </P>
        <div className="mt-6 overflow-x-auto">
          <table className="doc-table min-w-[30rem]">
            <thead>
              <tr>
                <th>What to boost</th>
                <th>Who sees it</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {BOOSTS.map(([what, who, when]) => (
                <tr key={what}>
                  <td className="font-semibold text-[var(--doc-ink)]">{what}</td>
                  <td>{who}</td>
                  <td className="whitespace-nowrap">{when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Promise */}
      <Section avoidBreak>
        <Panel>
          <Heading size="h2">What we can promise</Heading>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Inset>
              <p className={cn("font-semibold", SM, INK)}>We promise</p>
              <BulletList className="mt-3 space-y-2">
                <Bullet size="sm">
                  The agreed number of reels, graphics and podcast pieces, every month.
                </Bullet>
                <Bullet size="sm">Posts on schedule, on all five platforms.</Bullet>
                <Bullet size="sm">
                  An honest report every month, including what did not work.
                </Bullet>
              </BulletList>
            </Inset>
            <Inset tone="quiet">
              <p className={cn("font-semibold", SM, INK)}>Nobody can promise</p>
              <BulletList className="mt-3 space-y-2">
                <Bullet size="sm">A set number of followers.</Bullet>
                <Bullet size="sm">A video that goes viral.</Bullet>
                <Bullet size="sm">A set number of new patients.</Bullet>
              </BulletList>
            </Inset>
          </div>

          <p className={cn("mt-7 font-semibold", SM, INK)}>What we measure</p>
          <BulletList className="mt-3 space-y-2">
            <Bullet size="sm">Reach and views on each platform.</Bullet>
            <Bullet size="sm">Likes, comments, shares and saves.</Bullet>
            <Bullet size="sm">New followers.</Bullet>
            <Bullet size="sm">Profile visits, link clicks, and taps on WhatsApp or call.</Bullet>
            <Bullet size="sm">
              New patients who found you on social media, counted by your front desk.
            </Bullet>
          </BulletList>

          <P className="mt-6">
            Growth on social media is slow, and it is never guaranteed. What we aim for is steady
            growth each month in reach, engagement and messages. By the end, people recognise the
            clinic. And you own a library of videos that keeps working after we finish.
          </P>
        </Panel>
      </Section>

      {/* Next steps */}
      <Section avoidBreak>
        <Panel tone="ink">
          <Heading size="h2">Mark it up, then let us sit down</Heading>
          <Lead className="mt-5">
            Read the plan and mark anything you would change. Then give us an hour with whoever runs
            the clinic and whoever will answer the messages. We agree the shape together, and then
            we send you a price for the three months.
          </Lead>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">
            {[
              ["WhatsApp", "050 988 6584"],
              ["Phone", "+233 59 212 3054"],
              ["Email", "hello@saharabasetech.com"],
            ].map(([label, value]) => (
              <span
                key={label}
                className="rounded-[var(--doc-r-chip)] bg-[var(--doc-fill-strong)] px-5 py-2.5 text-center text-[length:var(--doc-t-sm)] whitespace-nowrap text-[var(--doc-ink)]"
              >
                <span className="text-[var(--doc-ink-soft)]">{label}</span>{" "}
                <span className="font-medium">{value}</span>
              </span>
            ))}
          </div>
        </Panel>
      </Section>

      {/* Sign-off */}
      <Section avoidBreak className="mb-14">
        <p className="text-[length:var(--doc-t-body)] font-semibold text-[var(--doc-ink)]">
          Richard Somda, Creative Director
        </p>
        <Note className="mt-1">Saharabase Technologies</Note>
      </Section>

      {/* ── APPENDIX ─────────────────────────────────────────────── */}
      <Divider />
      <Section>
        <Chip>Appendix</Chip>
        <Heading className="mt-4">Twelve of the 48 reels</Heading>
        <Note className="mt-2">
          A sample of the range, and how we would film each one. A Ladkov physiotherapist checks
          every script before we film it.
        </Note>
        <div className="mt-6 overflow-x-auto">
          <table className="doc-table min-w-[34rem]">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th className="w-[46%]">The hook, and how we film it</th>
                <th>Series</th>
                <th>On camera</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLES.map((s, i) => (
                <tr key={s.hook}>
                  <td className="tabular-nums">{i + 1}</td>
                  <td>
                    <span className="block font-semibold text-[var(--doc-ink)]">{s.hook}</span>
                    <span className="mt-0.5 block text-[var(--doc-ink-soft)]">{s.how}</span>
                  </td>
                  <td className="whitespace-nowrap">{s.series}</td>
                  <td>{s.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <DocumentFooter record={record} />
    </>
  );
}
