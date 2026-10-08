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
const XS = "text-[length:var(--doc-t-xs)] leading-[1.5]";
const MICRO = "text-[length:var(--doc-t-micro)] leading-[1.4]";
const INK = "text-[var(--doc-ink)]";
const BODY = "text-[var(--doc-ink-body)]";
const SOFT = "text-[var(--doc-ink-soft)]";

/* ── Colour ─────────────────────────────────────────────────────────── */

/**
 * Every diagram holds one code: dark is our work, light is the clinic's part. Each side has
 * a deep tone and a lighter one. The deep tone heads a table or marks the main step, and the
 * lighter one fills the rows under it, so a long table never turns into a wall of black.
 *
 * `date` is the calendar: things nobody does. `clay` is the one accent. It is kept for what
 * the eye should follow: the moments cut out of the podcast, the people the funnel loses, the
 * path a stranger takes to a booking, and what the clinic's knowledge turns into.
 *
 * The lighter tints came from the user on 2026-10-08: black and one cream felt limiting.
 */
type Tone = "ours" | "oursLight" | "yours" | "yoursLight" | "date" | "clay";

const TONE: Record<Tone, string> = {
  ours: "doc-invert bg-[var(--doc-fill-ink)]",
  oursLight: "doc-invert bg-[#3a3732]",
  yours: "bg-[#dbd6cb]",
  yoursLight: "bg-[#ece8df]",
  date: "bg-[#aba69c]",
  clay: "doc-invert bg-[#94492a]",
};

/**
 * Secondary text on each tone. Main text is always `INK`, which `.doc-invert` flips to white
 * on the dark fills. Soft ink fails contrast on the clay, so clay keeps full ink.
 */
const TONE_SOFT: Record<Tone, string> = {
  ours: SOFT,
  oursLight: SOFT,
  yours: BODY,
  yoursLight: BODY,
  date: BODY,
  clay: INK,
};

/** The clay at a whisper, for the boxes that name where people get lost. */
const CLAY_TINT = "bg-[#f4e5dc]";

/** The section numbers. Dark enough to read as large text, light enough to sit back. */
const NUMBER = "text-[#8a857b]";

/* ── Small parts ────────────────────────────────────────────────────── */

function Swatch({ tone }: { tone: Tone }) {
  return <span className={cn("h-4 w-4 shrink-0 rounded-[5px]", TONE[tone])} aria-hidden />;
}

/** A key entry. Takes the deep and the light tone, so the reader learns both belong to one side. */
function KeyItem({ tones, children }: { tones: Tone[]; children: React.ReactNode }) {
  return (
    <span className={cn("flex items-center gap-2.5", SM, BODY)}>
      <span className="flex gap-1">
        {tones.map((t) => (
          <Swatch key={t} tone={t} />
        ))}
      </span>
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

/** A small filled tag in one of the plan's tones. */
function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--doc-r-chip)] px-2.5 py-0.5 font-semibold whitespace-nowrap",
        MICRO,
        INK,
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

/** A numbered section heading. The numbers let the reader see the plan as one sequence. */
function Head({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4">
      <span
        className={cn(
          "shrink-0 text-[length:var(--doc-t-h3)] leading-[1.12] font-semibold tabular-nums",
          NUMBER,
        )}
      >
        {String(n).padStart(2, "0")}
      </span>
      <Heading className="font-bold">{children}</Heading>
    </div>
  );
}

/**
 * The line that joins a section to the one before it. The user asked for every section to be
 * joined, so the plan reads as one argument. It opens the next section rather than closing the
 * last, inside that section's held-together block, so a page never ends on a lone bridge.
 */
function Bridge({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10 flex items-center gap-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--doc-fill-strong)]">
        <Arrow className="h-4 w-4 rotate-90 text-[var(--doc-ink)]" />
      </span>
      <p className={cn("font-semibold", SM, INK)}>{children}</p>
    </div>
  );
}

/** A numbered part of the plan. Wider apart than a plain section: the user asked for more air. */
function Part({ className, children }: { className?: string; children: React.ReactNode }) {
  return <Section className={cn("mb-20", className)}>{children}</Section>;
}

type StepTone = Tone | "quiet" | "raised";

const STEP_BG: Record<StepTone, string> = {
  ...TONE,
  quiet: "bg-[var(--doc-fill-quiet)]",
  raised: "bg-[var(--doc-fill-strong)]",
};

const STEP_SOFT: Record<StepTone, string> = { ...TONE_SOFT, quiet: SOFT, raised: SOFT };

type Step = { tone: StepTone; title: string; sub?: string };

/** Boxes joined by arrows. Runs across from small up, down on a phone. */
function Steps({ steps, className }: { steps: Step[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-stretch", className)}>
      {steps.map((s, i) => (
        <Fragment key={s.title}>
          {i > 0 && <Arrow className="mx-auto rotate-90 sm:mx-0 sm:rotate-0 sm:self-center" />}
          <div
            className={cn(
              "min-w-0 flex-1 rounded-[var(--doc-r-inset)] px-4 py-3.5",
              STEP_BG[s.tone],
            )}
          >
            {s.sub && <p className={cn(MICRO, STEP_SOFT[s.tone])}>{s.sub}</p>}
            <p className={cn("mt-0.5 font-semibold", XS, INK)}>{s.title}</p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/** A filled dot for "yes", a speck for "no". Used by every dot chart in the plan. */
function Dot({ on, label }: { on: boolean; label: string }) {
  return on ? (
    <span
      role="img"
      aria-label={label}
      className="h-3.5 w-3.5 rounded-full bg-[var(--doc-fill-ink)]"
    />
  ) : (
    <span className="h-1.5 w-1.5 rounded-full bg-[var(--doc-fill-strong)]" aria-hidden />
  );
}

/** A plain list with small dots, for lists that sit inside a filled block. */
function DotList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item) => (
        <li key={item} className={cn("flex items-baseline gap-2.5", XS, BODY)}>
          <span
            className="h-1.5 w-1.5 shrink-0 -translate-y-px rounded-full bg-[var(--doc-ink-soft)]"
            aria-hidden
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

/* ── Cover and opening ──────────────────────────────────────────────── */

/** The fee, stated once here and used by the cover, the price section and the comparison. */
const MONTHLY_FEE = 6200;
const MONTHS_IN_PLAN = 3;
const ghs = (n: number) => `GHS ${n.toLocaleString("en-GB")}`;

/* ── 01 What we understand ──────────────────────────────────────────── */

/** What we took from the first meeting, and what each point does to the plan. */
const UNDERSTAND: { see: string; so: string }[] = [
  {
    see: "Many of your patients are older. Many came home after years abroad.",
    so: "We make calm, clear videos that older people can follow.",
  },
  {
    see: "A son or daughter often pays. Many of them live abroad.",
    so: "We speak to families too. December, when they come home, is our biggest month.",
  },
  {
    see: "Your physios hear the same problems and questions every week.",
    so: "Every idea starts from what they know.",
  },
  {
    see: "You want a team to make your content and post it.",
    so: "We plan, film, edit and post. You approve.",
  },
  {
    see: "Bookings come in by phone. Your website button only calls.",
    so: "Every post points to a real person on your team. Later, your website takes bookings.",
  },
  {
    see: "You have two branches, in East Legon and in Tema.",
    so: "Posts and ads send people to the branch nearest them.",
  },
  {
    see: "There is no budget for paid ads yet.",
    so: "The plan works without ads. You can add them later.",
  },
];

/** What we do not know yet. Each answer changes a part of the plan. */
const QUESTIONS = [
  "Is Google Analytics set up on your website?",
  "Is your Google profile set up for both branches?",
  "Who answers your messages on WhatsApp and social media today?",
  "How do bookings work today, and what do you record for each one?",
  "Do you offer home visits, or progress updates for families?",
  "Which local languages do your physios speak?",
];

/* ── 02 Our approach ────────────────────────────────────────────────── */

const APPROACH: { tone: Tone; title: string; how: string }[] = [
  { tone: "ours", title: "Be seen", how: "Reels and podcast clips on five platforms" },
  { tone: "ours", title: "Be trusted", how: "Your physios on camera. Real recovery stories." },
  { tone: "yours", title: "Be easy to reach", how: "A real person answers, on every platform" },
  { tone: "yours", title: "Be booked", how: "Quick replies, callbacks and follow-ups" },
];

/* ── 03 Who we talk to ──────────────────────────────────────────────── */

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

const CHANNELS = [
  { name: "Facebook", short: "FB" },
  { name: "Instagram", short: "IG" },
  { name: "TikTok", short: "TT" },
  { name: "YouTube", short: "YT" },
  { name: "LinkedIn", short: "IN" },
  { name: "WhatsApp", short: "WA" },
];

const AUDIENCES: { who: string; on: string[] }[] = [
  { who: "Your older patients", on: ["Facebook", "YouTube", "WhatsApp"] },
  { who: "Their children abroad", on: ["Facebook", "Instagram", "YouTube", "LinkedIn"] },
  { who: "Local older adults", on: ["Facebook", "YouTube"] },
  { who: "Parents of young children", on: ["Facebook", "Instagram", "TikTok"] },
  { who: "Young workers", on: ["Instagram", "TikTok", "LinkedIn"] },
];

const REACH = CHANNELS.map((c) => AUDIENCES.filter((a) => a.on.includes(c.name)).length);
const FACEBOOK_REACH = REACH[0];

/* ── 04 The ideas come from your clinic ─────────────────────────────── */

/**
 * The user's point on 2026-10-08: the clinic knows the recurring problems and questions, so we
 * source our ideas from its knowledge. We are the creative side. Their own ideas are welcome too.
 */
const KNOW = [
  "The problems patients bring every week",
  "The questions people ask your front desk",
  "What works in treatment",
  "Your own ideas for posts",
];

const CRAFT = [
  "Hooks and scripts",
  "Filming and editing",
  "Posting at the right times",
  "Learning what gets watched",
];

const IDEA_STEPS: Step[] = [
  { tone: "yours", sub: "Once a month", title: "A physio gives us 30 minutes of ideas" },
  { tone: "yours", sub: "Every day", title: "Your front desk notes the questions people ask" },
  { tone: "ours", sub: "Then", title: "We write the scripts. Your physio checks each one." },
];

/* ── 05 What we post about ──────────────────────────────────────────── */

/**
 * Reworked on 2026-10-08 for views. Short physio videos that do well open on a problem the
 * viewer already has ("Your back hurts because...") and give one fix. Most clinics settle near
 * 60% teaching, 25% clinic and patients, 15% trends. Everyday Ghanaian moments lead.
 */
const PILLARS = [
  { name: "Everyday posture", share: 25, series: "Posture Check · The 2-Minute Fix" },
  { name: "Myths and your questions", share: 20, series: "Myth or Fact · Ask a Physio" },
  { name: "Healthy ageing", share: 15, series: "Welcome Home · Strong at Any Age" },
  { name: "Active life", share: 15, series: "Gym Check · Desk to Pitch" },
  {
    name: "Real patients, real team",
    share: 15,
    series: "Road to Recovery · Meet the Physio · Inside Nadkof",
  },
  { name: "Children", share: 10, series: "Little Movers" },
];

/** Darkest for the biggest share, so the order of the legend is the order of the ring. */
const PILLAR_SHADES = ["#131211", "#3a3732", "#6b665e", "#98938a", "#c4bfb4", "#e2ddd3"];

const PILLAR_RING = (() => {
  let at = 0;
  const stops = PILLARS.map((p, i) => {
    const from = at;
    at += p.share;
    return `${PILLAR_SHADES[i]} ${from}% ${at}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
})();

/** Where the pain starts. Each is a moment a viewer in Accra or Tema lives every week. */
const MOMENTS = [
  "Sitting in traffic",
  "At a desk all day",
  "Looking down at a phone",
  "How you sleep",
  "Backing a baby",
  "Pounding fufu",
  "Lifting a gas cylinder",
  "Standing to cook",
  "Climbing stairs",
  "In the gym",
  "Sunday football",
  "Carrying a school bag",
];

/* ── 06 Where the posts come from ───────────────────────────────────── */

/**
 * The numbers were cut on 2026-10-08. The user called 6 to 8 reels a shoot day unrealistic
 * and set 3 to 5. Two shoot days at that pace is 8 reels a month. Clips came down from 10 to
 * 15 to 8, which one 40-minute talk gives without padding. Clips also go to YouTube Shorts,
 * each linked to the full episode.
 */
const STREAMS: {
  source: string;
  detail: string;
  needs: string | null;
  outputs: { n: number; what: string; to: string[] }[];
}[] = [
  {
    source: "Two shoot days",
    detail: "3 to 5 reels a day",
    needs: "A physio, a room, willing patients",
    outputs: [{ n: 8, what: "reels", to: ["Instagram", "TikTok", "Facebook", "YouTube Shorts"] }],
  },
  {
    source: "One podcast morning",
    detail: "Two cameras, a 40-minute talk",
    needs: "A physio to host",
    outputs: [
      { n: 1, what: "full episode", to: ["YouTube"] },
      {
        n: 8,
        what: "clips",
        to: ["Instagram", "TikTok", "Facebook", "YouTube Shorts", "LinkedIn"],
      },
    ],
  },
  {
    source: "Design days at our office",
    detail: "Health days, tips, offers, podcast quotes",
    needs: null,
    outputs: [{ n: 8, what: "graphics", to: ["Instagram", "Facebook"] }],
  },
];

const PIECES = STREAMS.flatMap((s) => s.outputs).reduce((n, o) => n + o.n, 0);

/* ── 07 The podcast ─────────────────────────────────────────────────── */

type CutKind = "clip" | "hook" | "quote";

const EPISODE_MINUTES = 40;

/** Drawn widths, in percent of the episode. Not to scale: a 15-second hook would vanish. */
const CUT_KINDS: Record<CutKind, { label: string; bg: string; width: number }> = {
  clip: { label: "longer clips, 30 to 60 seconds", bg: "bg-[#94492a]", width: 3.4 },
  hook: { label: "short hooks for TikTok", bg: "bg-[var(--doc-fill-ink)]", width: 2 },
  quote: { label: "quotes for graphics", bg: "bg-[#8a857b]", width: 1.5 },
};

/** Where the cuts might fall in one episode. Illustrative: the real ones follow the talk. */
const CUTS: { at: number; kind: CutKind }[] = [
  { at: 2.5, kind: "hook" },
  { at: 5.5, kind: "clip" },
  { at: 9.5, kind: "quote" },
  { at: 12.5, kind: "clip" },
  { at: 16, kind: "hook" },
  { at: 19.5, kind: "clip" },
  { at: 23, kind: "quote" },
  { at: 26.5, kind: "clip" },
  { at: 30, kind: "hook" },
  { at: 33, kind: "quote" },
  { at: 36, kind: "clip" },
];

const EPISODES = [
  {
    month: "November",
    theme: "Meet Nadkof",
    title: "Coming home: staying strong as you age in Ghana",
    guest: "A patient who came home from abroad",
  },
  {
    month: "December",
    theme: "Welcome Home",
    title: "Caring for ageing parents, from Ghana or from abroad",
    guest: "A son or daughter who cares for a parent",
  },
  {
    month: "January",
    theme: "Start the Year Pain-Free",
    title: "New year, new body? Getting back to exercise safely",
    guest: "A gym coach or a sports person",
  },
];

/* ── 08 One week ────────────────────────────────────────────────────── */

type Kind = "reel" | "clip" | "graphic";

/** A clip is clay here too, so it reads as the same thing it was in the podcast strip. */
const KINDS: Record<Kind, { label: string; tone: Tone }> = {
  reel: { label: "Reel", tone: "ours" },
  clip: { label: "Clip", tone: "clay" },
  graphic: { label: "Graphic", tone: "date" },
};

const GRID_PLATFORMS = [
  { id: "ig", name: "Instagram", short: "IG" },
  { id: "tt", name: "TikTok", short: "TT" },
  { id: "fb", name: "Facebook", short: "FB" },
  { id: "yt", name: "YouTube", short: "YT" },
  { id: "in", name: "LinkedIn", short: "IN" },
] as const;

type PlatformId = (typeof GRID_PLATFORMS)[number]["id"];

/**
 * Sized to what small businesses are told works: Instagram 3 to 5 posts a week, TikTok 3 to
 * 4, Facebook close to daily. YouTube gets every reel and clip as a Short. Two reels, two
 * clips and two graphics a week is exactly the month's 8, 8 and 8.
 */
const WEEK: { day: string; post: string; kind: Kind | null; on: PlatformId[] }[] = [
  { day: "Mon", post: "Posture Check", kind: "reel", on: ["ig", "tt", "fb", "yt"] },
  { day: "Tue", post: "A health tip", kind: "graphic", on: ["ig", "fb"] },
  { day: "Wed", post: "A podcast moment", kind: "clip", on: ["ig", "tt", "fb", "yt", "in"] },
  { day: "Thu", post: "Myth or Fact", kind: "reel", on: ["ig", "tt", "fb", "yt"] },
  { day: "Fri", post: "A health day or an offer", kind: "graphic", on: ["ig", "fb"] },
  { day: "Sat", post: "A podcast moment", kind: "clip", on: ["tt", "fb", "yt"] },
  { day: "Sun", post: "No new post", kind: null, on: [] },
];

const PER_WEEK = WEEK.reduce((n, d) => n + d.on.length, 0);

/** Four weeks of the grid, plus the full episode, to the nearest 5. */
const PER_MONTH = Math.round((PER_WEEK * 4 + 1) / 5) * 5;

/* ── 09 Each platform has a job ─────────────────────────────────────── */

/**
 * Across runs from finding new people (0) to building trust (100). Down runs from quick (0)
 * to in depth (100). Placed as the user read them on 2026-10-08. `step` is the order on the
 * path a stranger takes to a booking. Label sides are chosen so no label crosses an axis or
 * the path; check the map by eye if a point moves.
 */
const PLATFORM_MAP: {
  name: string;
  job: string;
  x: number;
  y: number;
  side: "left" | "right" | "above" | "below";
  step?: number;
}[] = [
  { name: "TikTok", job: "Finds new people", x: 15, y: 22, side: "above", step: 1 },
  { name: "Instagram", job: "Your shop window", x: 33, y: 34, side: "below", step: 2 },
  { name: "Facebook", job: "Reaches families", x: 70, y: 30, side: "right", step: 3 },
  { name: "LinkedIn", job: "Doctors who refer", x: 58, y: 69, side: "right" },
  { name: "YouTube", job: "Found by search", x: 88, y: 83, side: "left", step: 4 },
];

const PATH = PLATFORM_MAP.filter((p) => p.step).sort((a, b) => (a.step ?? 0) - (b.step ?? 0));

/* ── 10 Thirteen weeks ──────────────────────────────────────────────── */

type Happening = { tone: "ours" | "yours" | "date"; text: string };

/**
 * One row a week, Monday 2 November to Monday 25 January. The user could not read the old
 * thirteen-column chart, so the weeks run down the page now, the way a diary does.
 *
 * The clinic days are not arbitrary. Each shoot fills about two weeks of posts, and the
 * 14 December shoot and podcast carry the feeds through Christmas, when the clinic is quiet.
 * That is also why January's plan and its idea session come early.
 */
const CALENDAR: {
  month: string;
  theme: string;
  season?: string;
  weeks: { date: string; about: string; clinic: ("shoot" | "podcast")[]; also: Happening[] }[];
}[] = [
  {
    month: "November",
    theme: "Meet Nadkof",
    weeks: [
      {
        date: "2 Nov",
        about: "Introducing Nadkof",
        clinic: ["shoot"],
        also: [{ tone: "ours", text: "We tidy your five profiles" }],
      },
      {
        date: "9 Nov",
        about: "Diabetes and the body",
        clinic: ["podcast"],
        also: [
          { tone: "date", text: "World Diabetes Day, 14 Nov" },
          { tone: "yours", text: "Idea session for December" },
          { tone: "ours", text: "Lead system live" },
        ],
      },
      {
        date: "16 Nov",
        about: "Breathing and little ones",
        clinic: ["shoot"],
        also: [
          { tone: "date", text: "Prematurity Day, 17 Nov" },
          { tone: "ours", text: "December plan to you" },
          { tone: "ours", text: "Reply guide for your team" },
        ],
      },
      {
        date: "23 Nov",
        about: "Ageing well at home",
        clinic: [],
        also: [
          { tone: "yours", text: "You approve December" },
          { tone: "yours", text: "Idea session for January" },
          { tone: "date", text: "Families start arriving" },
        ],
      },
    ],
  },
  {
    month: "December",
    theme: "Welcome Home",
    season: "Families home from abroad",
    weeks: [
      {
        date: "30 Nov",
        about: "Mobility for everyone",
        clinic: ["shoot"],
        also: [
          { tone: "date", text: "Disability Day, 3 Dec" },
          { tone: "date", text: "Farmers’ Day, 4 Dec" },
          { tone: "ours", text: "November report" },
          { tone: "ours", text: "January plan to you" },
        ],
      },
      {
        date: "7 Dec",
        about: "Welcome Home",
        clinic: ["podcast"],
        also: [{ tone: "yours", text: "You approve January" }],
      },
      {
        date: "14 Dec",
        about: "Travel and the festive season",
        clinic: ["shoot", "podcast"],
        also: [{ tone: "ours", text: "We film January early" }],
      },
      {
        date: "21 Dec",
        about: "Christmas",
        clinic: [],
        also: [{ tone: "date", text: "Christmas" }],
      },
    ],
  },
  {
    month: "January",
    theme: "Start the Year Pain-Free",
    season: "One campaign, all month",
    weeks: [
      {
        date: "28 Dec",
        about: "Campaign launch",
        clinic: [],
        also: [{ tone: "date", text: "New Year" }],
      },
      {
        date: "4 Jan",
        about: "Back to routine",
        clinic: ["shoot"],
        also: [
          { tone: "ours", text: "December report" },
          { tone: "date", text: "Families fly back" },
        ],
      },
      {
        date: "11 Jan",
        about: "Back to school",
        clinic: [],
        also: [{ tone: "date", text: "Schools reopen" }],
      },
      {
        date: "18 Jan",
        about: "Recovery stories",
        clinic: ["shoot"],
        also: [],
      },
      {
        date: "25 Jan",
        about: "The best of three months",
        clinic: [],
        also: [{ tone: "ours", text: "Final report in February" }],
      },
    ],
  },
];

const CLINIC_DAY: Record<"shoot" | "podcast", { label: string; tone: Tone }> = {
  shoot: { label: "Shoot day", tone: "ours" },
  podcast: { label: "Podcast", tone: "oursLight" },
};

/* ── 11 Month by month ──────────────────────────────────────────────── */

const STAGES = ["Known", "Trusted", "Booked"];

const MONTHS: {
  month: string;
  title: string;
  goal: string;
  note?: string;
  bg: string;
  handover: { to: string; what: string };
}[] = [
  {
    month: "November",
    title: "Meet Nadkof",
    goal: "People learn your faces and your name.",
    bg: "bg-[var(--doc-fill-quiet)]",
    handover: {
      to: "Into December",
      what: "Faces people know. A first report on which series work.",
    },
  },
  {
    month: "December",
    title: "Welcome Home",
    goal: "Families home for Christmas see your care up close.",
    note: "An idea for you: a gift voucher a child abroad buys for a parent.",
    bg: "bg-[var(--doc-fill)]",
    handover: {
      to: "Into January",
      what: "Families who know your name. More posts for the three best series.",
    },
  },
  {
    month: "January",
    title: "Start the Year Pain-Free",
    goal: "Trust turns into bookings. Most posts ask people to book.",
    note: "“Don’t carry last year’s pain into this year.”",
    bg: "bg-[var(--doc-fill-strong)]",
    handover: { to: "After January", what: "Everything we made stays with you." },
  },
];

const KEEPS: [string, string][] = [
  ["24", "reels"],
  ["3", "full episodes"],
  ["24", "clips"],
  ["24", "graphics"],
];

/* ── 12 The monthly loop ────────────────────────────────────────────── */

/** Eight steps, so ours and yours alternate all the way round. Ideas come first. */
const LOOP: { who: Tone; title: string; when: string }[] = [
  { who: "yours", title: "Your physios share ideas", when: "By the 10th" },
  { who: "ours", title: "We plan the month", when: "By the 20th" },
  { who: "yours", title: "You approve it", when: "Within 3 working days" },
  { who: "ours", title: "We film at your clinic", when: "On agreed days" },
  { who: "yours", title: "You check the edits", when: "Every week" },
  { who: "ours", title: "We post", when: "Six days a week" },
  { who: "yours", title: "You answer messages", when: "Within minutes" },
  { who: "ours", title: "We report", when: "First week of next month" },
];

/* ── 13 What we need from you ───────────────────────────────────────── */

/** Each row reads: you do A, so we can do B, otherwise C. The user asked for that shape. */
const NEEDS: { you: string; so: string; otherwise: string }[] = [
  {
    you: "You approve the plan within 3 working days",
    so: "We film on time",
    otherwise: "The month starts late",
  },
  {
    you: "You give us access to your accounts",
    so: "Every enquiry is counted automatically",
    otherwise: "Counts rest on memory",
  },
  {
    you: "A physio gives us 30 minutes of ideas a month",
    so: "Every post starts from a real case",
    otherwise: "We work from general advice",
  },
  {
    you: "A physio joins each shoot",
    so: "Every video has an expert in it",
    otherwise: "We film models only",
  },
  {
    you: "You collect each patient’s consent",
    so: "We film real recovery stories",
    otherwise: "Models act the stories out",
  },
  {
    you: "You find a model when an idea needs one",
    so: "We film skits and re-enactments",
    otherwise: "We drop those ideas",
  },
  {
    you: "A real person replies within minutes",
    so: "Messages turn into bookings",
    otherwise: "People book elsewhere",
  },
  {
    you: "Your front desk asks how they heard of you",
    so: "We know which posts bring patients",
    otherwise: "We guess",
  },
];

/* ── 14 Consent ─────────────────────────────────────────────────────── */

type Seen = 0 | 0.5 | 1;

/** Consent is the clinic's to collect. This is our suggested shape for it, not our form. */
const LEVELS: { name: string; seen: [Seen, Seen, Seen, Seen]; good: string }[] = [
  {
    name: "Full feature",
    seen: [1, 1, 1, 1],
    good: "Full recovery stories. Patients doing far better than before.",
  },
  { name: "Hands and movement", seen: [0, 0, 1, 0], good: "Exercise demos" },
  { name: "Voice only", seen: [0, 1, 0, 0], good: "Private testimonials. We animate them." },
  { name: "Written words", seen: [0, 0, 0, 0.5], good: "Quotes on graphics" },
  { name: "Played by a model", seen: [0, 0, 0, 0], good: "Sensitive cases. Children." },
];

function SeenDot({ v }: { v: Seen }) {
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

/* ── 15 The marketing machine ───────────────────────────────────────── */

/**
 * The user's frame: social media is one part of the clinic's whole marketing machine. Only
 * social media is tagged as this plan. The rest are named, not offered.
 */
const MACHINE: { name: string; tag?: string; inPlan?: boolean }[] = [
  { name: "Social media", tag: "This plan", inPlan: true },
  { name: "Google search and Maps" },
  { name: "Your website", tag: "Later" },
  { name: "Doctors who refer" },
  { name: "Past patients who tell friends" },
  { name: "Health talks in the community" },
  { name: "Paid ads", tag: "Optional" },
];

/* ── 16 Catching every lead ─────────────────────────────────────────── */

/**
 * The funnel with its leaks. The user asked to see where people get stuck and what we put
 * there instead. Each fix is coloured by who runs it. Stage names stay short: the narrowest
 * bar is 60% of a 15rem column.
 */
const FUNNEL: { stage: string; tone: Tone; width: number; lost: string; fix: string; by: Tone }[] =
  [
    {
      stage: "Sees a post",
      tone: "ours",
      width: 100,
      lost: "Scrolls past. Nothing says what to do next.",
      fix: "Every post ends with one next step: “Message us.”",
      by: "oursLight",
    },
    {
      stage: "Trusts you",
      tone: "ours",
      width: 90,
      lost: "Not sure you treat their problem.",
      fix: "Physios on camera, recovery stories, a reply to every comment.",
      by: "oursLight",
    },
    {
      stage: "Sends a message",
      tone: "yours",
      width: 80,
      lost: "Gets a machine. Or no reply at all.",
      fix: "A real person replies within minutes, on any platform.",
      by: "yoursLight",
    },
    {
      stage: "Books a visit",
      tone: "yours",
      width: 70,
      lost: "Says “I will call back”, then forgets.",
      fix: "The same person calls back that day. A check-in three days later.",
      by: "yoursLight",
    },
    {
      stage: "Comes back",
      tone: "yours",
      width: 60,
      lost: "Stops after one or two sessions.",
      fix: "A reminder before each visit. A review request. A friend discount.",
      by: "yoursLight",
    },
  ];

/* ── 17 A real person, every time ───────────────────────────────────── */

/**
 * No bot menus. The user was clear on 2026-10-08: people switch off at "press 1". They want a
 * person who knows the answer and cares about the question, on whichever platform they used,
 * and the same person all the way to the booking. That person is on the clinic's staff. We
 * write the reply guide if they want one.
 */
const HUMAN_STEPS: Step[] = [
  { tone: "ours", sub: "1", title: "A post with one clear next step" },
  { tone: "quiet", sub: "2", title: "They message you, on any platform" },
  { tone: "yours", sub: "3", title: "A real person replies within minutes" },
  { tone: "yours", sub: "4", title: "The same person stays with them to the booking" },
];

const LANES: { label: string; tone: Tone; steps: string[] }[] = [
  {
    label: "Books",
    tone: "yours",
    steps: [
      "A reminder the day before",
      "A progress note to family abroad, if the patient agrees",
      "A review request after a good session",
    ],
  },
  {
    label: "Not yet",
    tone: "date",
    steps: ["A check-in on day 3", "Another on day 7", "A health tip each month, by WhatsApp"],
  },
];

/* ── 18 How every enquiry is counted ────────────────────────────────── */

/**
 * Counts must not rest on anyone typing them in. The user rejected a shared sheet on
 * 2026-10-08: a client who wanted to talk the work down could under-report, and the numbers
 * would go against us. So the clinic is onboarded onto our lead system and every source feeds
 * it automatically. Checked that day:
 *
 *  - WhatsApp "coexistence" lets a number keep the WhatsApp Business app while every chat is
 *    mirrored to the Cloud API, so our system sees each one.
 *  - Instagram and Facebook messages arrive by webhook through Meta's messaging APIs.
 *  - TikTok's Business Messaging API sends inbound messages by webhook. Its reach is still
 *    patchy, hence "where TikTok allows it".
 *  - The Business Profile Performance API reports call clicks, direction requests and
 *    website clicks, given manager access.
 *  - Ghana virtual numbers from call-tracking providers forward to the desk and log calls.
 *
 * Walk-ins are the one count entered by hand. Campaign codes give an independent check there.
 */
const TRACK_SOURCES: { name: string; how: string; auto: boolean }[] = [
  {
    name: "WhatsApp",
    how: "Your number links to our system. You keep using the app.",
    auto: true,
  },
  {
    name: "Instagram and Facebook",
    how: "Each message reaches our system as it arrives.",
    auto: true,
  },
  { name: "TikTok", how: "The same, where TikTok allows it.", auto: true },
  {
    name: "Every “Message us” link",
    how: "Our tracked link records the click and the post.",
    auto: true,
  },
  { name: "Phone calls", how: "A tracked number rings your desk and logs the call.", auto: true },
  { name: "Your Google profile", how: "Calls, directions and clicks, read daily.", auto: true },
  { name: "Your website", how: "Google Analytics and our booking form.", auto: true },
  {
    name: "Walk-ins",
    how: "Your desk asks how they heard of you, and taps the answer.",
    auto: false,
  },
];

const TRACKER_ROWS: [string, string, string, string][] = [
  ["4 Nov", "TikTok message", "Posture Check: traffic", "Booked, Tema"],
  ["5 Nov", "Instagram message", "Podcast clip 3", "Call back Friday"],
  ["6 Nov", "Walk-in, code HOME", "Welcome Home", "Booked, East Legon"],
];

/* ── 19 Your website ────────────────────────────────────────────────── */

const SITE: { name: string; leaves: string[] }[] = [
  { name: "A page per condition", leaves: ["Stroke", "Back pain", "Arthritis", "Children"] },
  { name: "Families abroad", leaves: ["Packages", "Pay from abroad", "Progress updates"] },
  { name: "Your branches", leaves: ["East Legon page", "Tema page", "Google reviews"] },
  { name: "Videos", leaves: ["Reels", "Podcast episodes", "Campaign pages"] },
];

/** Branch centres across four equal columns. The connector stubs drop onto these. */
const SITE_CENTRES = SITE.map((_, i) => ((i + 0.5) / SITE.length) * 100);

/**
 * What every page gains. The user said a WhatsApp button and a booking button on their own
 * looked trivial, and that the booking button they have today only places a call. Booking a
 * real time comes first and is drawn bigger.
 */
const CAPTURE: { title: string; sub: string }[] = [
  { title: "Book a time online", sub: "Pick a branch, a day and a time. No phone call needed." },
  { title: "WhatsApp, ready to send", sub: "The message says which page they came from" },
  { title: "Call me back", sub: "Leave a number. Your desk calls today." },
  { title: "A free exercise guide", sub: "Sent in return for a phone number" },
];

/* ── 20 Where to start ──────────────────────────────────────────────── */

const START: Step[] = [
  { tone: "ours", sub: "November", title: "Content starts. The lead system goes live." },
  { tone: "yours", sub: "November", title: "You choose one offer for January" },
  { tone: "ours", sub: "December", title: "We plan your website update" },
  { tone: "ours", sub: "January", title: "The updated site goes live with the campaign" },
];

/* ── 21 Paid ads ────────────────────────────────────────────────────── */

/** Week 1 is Monday 2 November 2026. These are the Mondays. */
const WEEK_STARTS = [2, 9, 16, 23, 30, 7, 14, 21, 28, 4, 11, 18, 25];

const MONTH_BANDS = [
  { name: "November", from: 1, to: 4 },
  { name: "December", from: 5, to: 8 },
  { name: "January", from: 9, to: 13 },
];

type Mark = { from: number; to: number; label: string; tone: Tone };

/** Who sees each ad sits under its name. A bar four weeks wide is too short to hold it. */
const ADS: { what: string; who: string; mark: Mark }[] = [
  {
    what: "Welcome Home posts",
    who: "Shown to Ghanaians abroad",
    mark: { from: 4, to: 7, label: "4 weeks", tone: "yours" },
  },
  {
    what: "The campaign reel",
    who: "Shown to over 30s near you",
    mark: { from: 9, to: 12, label: "4 weeks", tone: "yours" },
  },
  {
    what: "Your best trust post",
    who: "Shown to older adults in Accra and Tema",
    mark: { from: 1, to: 13, label: "All 13 weeks", tone: "yoursLight" },
  },
];

/* ── 23 The price ───────────────────────────────────────────────────── */

const COVERED = [
  "Strategy and planning",
  "Scripts and hooks",
  "Filming, with our own cameras, lights and microphones",
  "Editing and design",
  "Posting on five platforms",
  "Our lead system, set up and running",
  "A reply guide for your team",
  "A report every month",
];

/** One month against the whole plan. The user wanted both read at a glance. */
const COMPARE: [string, string, string][] = [
  ["Days at your clinic", "2 shoot days, 1 podcast morning", "6 shoot days, 3 podcast mornings"],
  ["Reels, clips and graphics", "8 of each", "24 of each"],
  ["Full episodes", "1", "3"],
  ["Posts", `About ${PER_MONTH}`, `About ${PER_MONTH * MONTHS_IN_PLAN}`],
];

/* ── 24 How we start ────────────────────────────────────────────────── */

/**
 * The steps of engagement the user set on 2026-10-08: a mutual NDA, an MOU, a baseline audit
 * to measure progress against, account access, a two-month pilot, then a review where both
 * sides decide. Joint steps take the neutral fill: they belong to neither colour.
 */
const ENGAGE: { who: "Both of us" | "Us" | "You"; title: string; detail: string }[] = [
  {
    who: "Both of us",
    title: "A mutual NDA",
    detail: "Each side keeps the other’s information private.",
  },
  { who: "Both of us", title: "An MOU", detail: "We write down what each side does." },
  {
    who: "Us",
    title: "A baseline audit",
    detail: "Your website, social media and Google profile, measured before we start.",
  },
  {
    who: "You",
    title: "Access to your accounts",
    detail: "Partner access for us. You stay the owner of every account.",
  },
  { who: "Both of us", title: "A two-month pilot", detail: "November and December." },
  {
    who: "Both of us",
    title: "A review",
    detail: "We compare the numbers with the baseline. Then we decide together.",
  },
];

const ENGAGE_TONE: Record<(typeof ENGAGE)[number]["who"], StepTone> = {
  "Both of us": "raised",
  Us: "ours",
  You: "yours",
};

/* ── Next steps ─────────────────────────────────────────────────────── */

const NEXT: Step[] = [
  { tone: "raised", sub: "1", title: "You read the plan" },
  { tone: "raised", sub: "2", title: "You tell us what to change" },
  { tone: "raised", sub: "3", title: "We send the NDA" },
];

/* ── Appendix ───────────────────────────────────────────────────────── */

const SAMPLES: { hook: string; how: string; series: string; who: string }[] = [
  {
    hook: "Your back hurts because of how you sit in traffic.",
    how: "A physio in a driver’s seat shows the fix: seat height, a rolled towel, mirrors",
    series: "Posture Check",
    who: "Physiotherapist",
  },
  {
    hook: "Stop sleeping like this.",
    how: "Three sleeping positions, and the one that strains your neck",
    series: "Posture Check",
    who: "Physio and a model",
  },
  {
    hook: "The reason your neck hurts is in your hand.",
    how: "A phone-neck test, then three moves to undo it",
    series: "The 2-Minute Fix",
    who: "Physio and a model",
  },
  {
    hook: "Backing your baby? Tie it this way.",
    how: "A mother ties a baby on her back. A physio shows what spares her spine.",
    series: "Posture Check",
    who: "A parent and child (level 1), or a model",
  },
  {
    hook: "Pounding fufu is a workout. Don’t hurt your back doing it.",
    how: "A short skit at the mortar, then the safe stance",
    series: "Posture Check",
    who: "Models",
  },
  {
    hook: "Lifting a gas cylinder? Watch your back.",
    how: "Wrong way and right way, side by side",
    series: "The 2-Minute Fix",
    who: "Physio and a model",
  },
  {
    hook: "Rest is the cure for back pain. Myth or fact?",
    how: "A physio reacts to the claim, then explains and shows",
    series: "Myth or Fact",
    who: "Physiotherapist",
  },
  {
    hook: "Should you crack your own back?",
    how: "A physio answers, then shows a safer stretch",
    series: "Myth or Fact",
    who: "Physiotherapist",
  },
  {
    hook: "Why does my knee hurt on the stairs?",
    how: "A question from your front desk, answered in a minute",
    series: "Ask a Physio",
    who: "Physiotherapist",
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
    hook: "Gym in January? Read this first.",
    how: "Common mistakes and their fixes, in your gym",
    series: "Gym Check",
    who: "Physio and a model",
  },
  {
    hook: "Sunday football tomorrow? Do this tonight.",
    how: "A five-minute warm-up for weekend players",
    series: "Desk to Pitch",
    who: "Physio and a model",
  },
  {
    hook: "Week 1 vs week 8",
    how: "Progress footage, side by side",
    series: "Road to Recovery",
    who: "A patient (level 1 or 2)",
  },
  {
    hook: "Meet [name]: why I became a physiotherapist",
    how: "A sit-down interview with clinic footage",
    series: "Meet the Physio",
    who: "Physiotherapist",
  },
  {
    hook: "When should your baby be walking?",
    how: "A calm explainer over soft footage of a session",
    series: "Little Movers",
    who: "Physio, with a parent and child or a model",
  },
];

/* ── Diagrams ───────────────────────────────────────────────────────── */

/** What we took from the meeting on the left, what it does to the plan on the right. */
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

/**
 * Four steps from a stranger to a patient, drawn as a staircase going down. Each step sits
 * further in than the last, so the order reads before a word does. The first two are ours,
 * the last two are yours.
 */
function ApproachChain() {
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

/** The patient and the person paying, with what passes between them. */
function AudiencePair() {
  return (
    <div className="avoid-break mt-7 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-stretch sm:gap-3">
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
          <div className="rounded-[var(--doc-r-panel)] bg-[var(--doc-fill)] p-5">
            <p className={cn("text-[length:var(--doc-t-lead)] font-bold", INK)}>{p.title}</p>
            <p className={cn("mt-1", SM, BODY)}>{p.who}</p>
            <dl className={cn("mt-4 space-y-2.5", XS)}>
              <div>
                <dt className={cn("font-semibold", INK)}>Worries about</dt>
                <dd className={BODY}>{p.worries}</dd>
              </div>
              <div>
                <dt className={cn("font-semibold", INK)}>Won over by</dt>
                <dd className={BODY}>{p.wins}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <Tags items={p.where} tone="paper" />
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/** Five groups down, six channels across. The bottom row counts how many groups each reaches. */
function AudienceMatrix() {
  const cols =
    "grid grid-cols-[minmax(0,1fr)_repeat(6,1.6rem)] sm:grid-cols-[minmax(0,1fr)_repeat(6,4.5rem)] items-center gap-x-1.5";
  return (
    <div className="avoid-break mt-6 overflow-hidden rounded-[var(--doc-r-inset)]">
      <div className={cn(cols, "bg-[var(--doc-fill-strong)] px-4 py-3 font-semibold", XS, INK)}>
        <span>Who</span>
        {CHANNELS.map((c) => (
          <span key={c.name} className="text-center">
            <span className="sm:hidden">{c.short}</span>
            <span className="hidden sm:inline">{c.name}</span>
          </span>
        ))}
      </div>
      {AUDIENCES.map((a, i) => (
        <div
          key={a.who}
          className={cn(
            cols,
            "px-4 py-2",
            i % 2 ? "bg-[var(--doc-fill)]" : "bg-[var(--doc-paper)]",
          )}
        >
          <span className={cn(XS, BODY)}>{a.who}</span>
          {CHANNELS.map((c) => (
            <span key={c.name} className="flex justify-center">
              <Dot on={a.on.includes(c.name)} label={`On ${c.name}`} />
            </span>
          ))}
        </div>
      ))}
      <div className={cn(cols, "bg-[var(--doc-fill-strong)] px-4 py-3 font-semibold", XS, INK)}>
        <span>Groups reached</span>
        {REACH.map((n, i) => (
          <span key={CHANNELS[i].name} className="text-center tabular-nums">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * What the clinic knows, plus what we bring, gives posts people trust. Drawn as a sum so the
 * order of credit is plain: their knowledge comes first.
 */
function IdeasSum() {
  const glyph = cn(
    "hidden self-center text-center text-[length:var(--doc-t-h2)] leading-none font-bold sm:block",
    NUMBER,
  );
  return (
    <div className="avoid-break mt-7 grid gap-2.5 sm:grid-cols-[minmax(0,1.05fr)_1.5rem_minmax(0,1fr)_1.5rem_minmax(0,0.8fr)] sm:items-stretch">
      <div className={cn("rounded-[var(--doc-r-panel)] p-5", TONE.yours)}>
        <p className={cn("font-bold", SM, INK)}>What your physios know</p>
        <DotList items={KNOW} className="mt-3" />
      </div>
      <span className={glyph} aria-hidden>
        +
      </span>
      <div className={cn("rounded-[var(--doc-r-panel)] p-5", TONE.ours)}>
        <p className={cn("font-bold", SM, INK)}>What we bring</p>
        <DotList items={CRAFT} className="mt-3" />
      </div>
      <span className={glyph} aria-hidden>
        =
      </span>
      <div
        className={cn("flex flex-col justify-center rounded-[var(--doc-r-panel)] p-5", TONE.clay)}
      >
        <p className={cn("text-[length:var(--doc-t-lead)] leading-snug font-bold", INK)}>
          Posts people trust
        </p>
        <p className={cn("mt-2", XS, INK)}>Each one starts from a real case.</p>
      </div>
    </div>
  );
}

function PillarRing() {
  return (
    <div className="avoid-break mt-7 flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10">
      <div
        className="relative h-48 w-48 shrink-0 rounded-full"
        style={{ background: PILLAR_RING }}
        role="img"
        aria-label="Share of posts by topic"
      >
        <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full bg-[var(--doc-paper)]">
          <span className={cn("text-[length:var(--doc-t-h3)] leading-none font-bold", INK)}>6</span>
          <span className={cn("mt-1", MICRO, SOFT)}>topics</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {PILLARS.map((p, i) => (
          <li key={p.name} className="flex items-start gap-3">
            <span
              className="mt-1 h-3.5 w-3.5 shrink-0 rounded-[4px]"
              style={{ background: PILLAR_SHADES[i] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className={cn("block font-semibold", XS, INK)}>{p.name}</span>
              <span className={cn("block", MICRO, SOFT)}>{p.series}</span>
            </span>
            <span className={cn("font-semibold tabular-nums", SM, INK)}>{p.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Three sources, each in its own band: the source on the left, what it makes on the right,
 * every output row the same shape so the numbers and platforms line up down the page.
 */
function FeedDiagram() {
  return (
    <div className="mt-7 space-y-2.5">
      {STREAMS.map((s) => (
        <div
          key={s.source}
          className="avoid-break grid gap-2 rounded-[var(--doc-r-panel)] bg-[var(--doc-fill-quiet)] p-2.5 sm:grid-cols-[13.5rem_1.25rem_minmax(0,1fr)] sm:items-center sm:gap-3"
        >
          <div className="space-y-1">
            <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3.5", TONE.ours)}>
              <p className={cn("font-semibold", SM, INK)}>{s.source}</p>
              <p className={cn("mt-0.5", XS, SOFT)}>{s.detail}</p>
            </div>
            {s.needs && (
              <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-2.5", TONE.yours)}>
                <p className={cn(XS, BODY)}>
                  <span className={cn("font-semibold", INK)}>From you: </span>
                  {s.needs}
                </p>
              </div>
            )}
          </div>

          <Arrow className="mx-auto rotate-90 sm:rotate-0" />

          <div className="space-y-1">
            {s.outputs.map((o) => (
              <div
                key={o.what}
                className="flex flex-col gap-2 rounded-[var(--doc-r-inset)] bg-[var(--doc-paper)] px-4 py-3 sm:grid sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center sm:gap-3"
              >
                <p className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-[length:var(--doc-t-h3)] leading-none font-bold tabular-nums",
                      INK,
                    )}
                  >
                    {o.n}
                  </span>
                  <span className={cn("font-semibold", SM, INK)}>{o.what}</span>
                </p>
                <Tags items={o.to} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div
        className={cn(
          "avoid-break flex flex-col gap-4 rounded-[var(--doc-r-panel)] p-6 sm:flex-row sm:items-center sm:gap-7 sm:px-8",
          TONE.ours,
        )}
      >
        <Figure value={String(PIECES)} caption="pieces of content" className="shrink-0" />
        <Arrow className="h-6 w-6 rotate-90 sm:rotate-0" />
        <Figure
          value={`About ${PER_MONTH}`}
          caption="posts a month"
          className="shrink-0 whitespace-nowrap"
        />
        <p className={cn("sm:ml-auto sm:max-w-[13rem]", XS, SOFT)}>
          Each piece goes out on more than one platform.
        </p>
      </div>
    </div>
  );
}

/**
 * One episode as a bar, with a gap where each moment was cut out. The cut pieces sit just
 * below their gaps, tipped a little, so the eye reads them as lifted out of the talk. The user
 * wanted the cut shown by design, not explained in words, and approved this on 2026-10-08.
 */
function EpisodeCut() {
  const counts = (Object.keys(CUT_KINDS) as CutKind[]).map((k) => ({
    kind: k,
    n: CUTS.filter((c) => c.kind === k).length,
  }));
  const at = (m: number) => (m / EPISODE_MINUTES) * 100;

  return (
    <div className="avoid-break mt-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className={cn("font-semibold", SM, INK)}>One 40-minute episode</p>
        <p className={cn(XS, SOFT)}>The whole episode also goes on YouTube</p>
      </div>

      {/* Each gap carries a dashed cut line down both edges, like the marks on a pattern. */}
      <div className="relative mt-3 h-14 rounded-[10px] bg-[#dbd6cb]">
        {CUTS.map((c) => (
          <span
            key={c.at}
            className="absolute -top-2 -bottom-2"
            style={{
              left: `${at(c.at)}%`,
              width: `${CUT_KINDS[c.kind].width}%`,
              background: [
                "repeating-linear-gradient(to bottom, var(--doc-ink-soft) 0 3px, transparent 3px 6px) left / 1.5px 100% no-repeat",
                "repeating-linear-gradient(to bottom, var(--doc-ink-soft) 0 3px, transparent 3px 6px) right / 1.5px 100% no-repeat",
                "linear-gradient(var(--doc-paper), var(--doc-paper)) center / 100% calc(100% - 1rem) no-repeat",
              ].join(", "),
            }}
          />
        ))}
      </div>

      <div className="relative h-16" aria-hidden>
        {CUTS.map((c, i) => {
          const k = CUT_KINDS[c.kind];
          return (
            <Fragment key={c.at}>
              <span
                className="absolute top-0 h-4 w-[2px]"
                style={{
                  left: `calc(${at(c.at) + k.width / 2}% - 1px)`,
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, var(--doc-ink-soft) 0 3px, transparent 3px 6px)",
                }}
              />
              <span
                className={cn("absolute top-5 h-10 rounded-[4px]", k.bg)}
                style={{
                  left: `${at(c.at)}%`,
                  width: `${k.width}%`,
                  transform: `rotate(${i % 2 ? 5 : -5}deg)`,
                }}
              />
            </Fragment>
          );
        })}
      </div>

      <div className={cn("mt-1 flex justify-between tabular-nums", MICRO, SOFT)}>
        {[0, 10, 20, 30, 40].map((m) => (
          <span key={m}>{m} min</span>
        ))}
      </div>

      <div className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-3">
        {counts.map(({ kind, n }) => (
          <div key={kind} className="flex items-center gap-3">
            <span
              className={cn("h-8 w-3 shrink-0 rounded-[3px]", CUT_KINDS[kind].bg)}
              aria-hidden
            />
            <p className={cn(XS, BODY)}>
              <span
                className={cn("mr-1.5 text-[length:var(--doc-t-lead)] font-bold tabular-nums", INK)}
              >
                {n}
              </span>
              {CUT_KINDS[kind].label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Seven days down, five platforms across. A filled dot is a post that goes out. */
function WeekGrid() {
  const cols =
    "grid grid-cols-[2.5rem_minmax(0,1fr)_repeat(5,1.5rem)] sm:grid-cols-[3rem_minmax(0,1fr)_4.75rem_repeat(5,4.25rem)] items-center gap-x-2";
  const totals = GRID_PLATFORMS.map((p) => WEEK.filter((d) => d.on.includes(p.id)).length);

  return (
    <div className="avoid-break mt-7 overflow-hidden rounded-[var(--doc-r-inset)]">
      <div className={cn(cols, "bg-[var(--doc-fill-strong)] px-4 py-3 font-semibold", XS, INK)}>
        <span>Day</span>
        <span>Post</span>
        <span className="hidden sm:inline">Type</span>
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
          <span className={cn(XS, d.kind ? BODY : SOFT)}>{d.post}</span>
          <span className="hidden sm:block">
            {d.kind && <Pill tone={KINDS[d.kind].tone}>{KINDS[d.kind].label}</Pill>}
          </span>
          {GRID_PLATFORMS.map((p) => (
            <span key={p.id} className="flex justify-center">
              <Dot on={d.on.includes(p.id)} label={`Posted on ${p.name}`} />
            </span>
          ))}
        </div>
      ))}
      <div className={cn(cols, "bg-[var(--doc-fill-strong)] px-4 py-3 font-semibold", XS, INK)}>
        <span className="col-span-2 sm:col-span-3">Posts a week</span>
        {totals.map((t, i) => (
          <span key={GRID_PLATFORMS[i].id} className="text-center tabular-nums">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * A two-axis map with each platform as a point. Across: finds new people to builds trust.
 * Down: quick to in depth. The numbered clay line is one common path to a booking. On a
 * phone the map would crowd, so it becomes a list.
 */
function PlatformMap() {
  const axis = cn(
    "absolute flex items-center gap-1.5 rounded-[var(--doc-r-chip)] bg-[var(--doc-paper)] px-3 py-1 font-semibold whitespace-nowrap",
    XS,
    INK,
  );

  return (
    <>
      <div className="avoid-break relative mt-7 hidden h-[27rem] rounded-[var(--doc-r-panel)] bg-[var(--doc-fill-quiet)] sm:block">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <line
            x1="4"
            y1="50"
            x2="96"
            y2="50"
            stroke="#d3cec3"
            strokeWidth="3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="50"
            y1="10"
            x2="50"
            y2="90"
            stroke="#d3cec3"
            strokeWidth="3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={PATH.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#94492a"
            strokeWidth="2.5"
            strokeDasharray="7 6"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <span className={cn(axis, "top-3 left-1/2 -translate-x-1/2")}>
          <Arrow className="h-3.5 w-3.5 -rotate-90 text-[var(--doc-ink)]" />
          Quick
        </span>
        <span className={cn(axis, "bottom-3 left-1/2 -translate-x-1/2")}>
          <Arrow className="h-3.5 w-3.5 rotate-90 text-[var(--doc-ink)]" />
          In depth
        </span>
        <span className={cn(axis, "top-[calc(50%+0.7rem)] left-[3%]")}>
          <Arrow className="h-3.5 w-3.5 rotate-180 text-[var(--doc-ink)]" />
          Finds new people
        </span>
        <span className={cn(axis, "top-[calc(50%+0.7rem)] right-[3%]")}>
          Builds trust
          <Arrow className="h-3.5 w-3.5 text-[var(--doc-ink)]" />
        </span>

        {PLATFORM_MAP.map((p) => (
          <Fragment key={p.name}>
            <span
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-bold tabular-nums",
                MICRO,
                p.step ? cn("h-7 w-7", TONE.clay, INK) : "h-4 w-4 bg-[var(--doc-fill-ink)]",
              )}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {p.step}
            </span>
            <span
              className={cn(
                "absolute whitespace-nowrap",
                (p.side === "left" || p.side === "right") && "-translate-y-1/2",
                (p.side === "above" || p.side === "below") && "-translate-x-1/2 text-center",
                p.side === "above" && "-translate-y-full",
                p.side === "left" && "text-right",
              )}
              style={
                p.side === "right"
                  ? { left: `calc(${p.x}% + 1.25rem)`, top: `${p.y}%` }
                  : p.side === "left"
                    ? { right: `calc(${100 - p.x}% + 1.25rem)`, top: `${p.y}%` }
                    : p.side === "above"
                      ? { left: `${p.x}%`, top: `calc(${p.y}% - 1.1rem)` }
                      : { left: `${p.x}%`, top: `calc(${p.y}% + 1.1rem)` }
              }
            >
              <span className={cn("block font-bold", SM, INK)}>{p.name}</span>
              <span className={cn("block", MICRO, BODY)}>{p.job}</span>
            </span>
          </Fragment>
        ))}
      </div>

      <ol className="mt-7 space-y-2 sm:hidden">
        {[...PATH, ...PLATFORM_MAP.filter((p) => !p.step)].map((p) => (
          <li
            key={p.name}
            className="flex items-center gap-3 rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)] px-4 py-3"
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold",
                MICRO,
                p.step ? cn(TONE.clay, INK) : "bg-[var(--doc-fill-strong)]",
              )}
            >
              {p.step}
            </span>
            <span>
              <span className={cn("block font-bold", SM, INK)}>{p.name}</span>
              <span className={cn("block", XS, BODY)}>{p.job}</span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

/**
 * Thirteen weeks as a diary: one month a block, one week a row. `children` is the section's
 * opening (bridge, heading, key). It is held together with November, so the heading never
 * ends a page without the first block of weeks under it.
 */
function Calendar({ children }: { children: React.ReactNode }) {
  const row =
    "grid gap-x-4 gap-y-1.5 sm:grid-cols-[4rem_minmax(0,1fr)_7.25rem_minmax(0,1.3fr)] sm:items-center";
  const [first, ...rest] = CALENDAR.map((m) => <MonthWeeks key={m.month} month={m} row={row} />);
  return (
    <div className="space-y-4">
      <div className="avoid-break space-y-4">
        <div>{children}</div>
        <div className={cn(row, "hidden px-4 pt-3 font-semibold sm:grid", MICRO, SOFT)}>
          <span>Week of</span>
          <span>We post about</span>
          <span>At your clinic</span>
          <span>Also this week</span>
        </div>
        {first}
      </div>
      {rest}
    </div>
  );
}

function MonthWeeks({ month: m, row }: { month: (typeof CALENDAR)[number]; row: string }) {
  return (
    <div className="avoid-break overflow-hidden rounded-[var(--doc-r-inset)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-[var(--doc-fill-strong)] px-4 py-3">
        <p className={cn("font-bold", SM, INK)}>
          {m.month}
          <span className={cn("ml-3 font-semibold", BODY)}>{m.theme}</span>
        </p>
        {m.season && <p className={cn("font-semibold", MICRO, BODY)}>{m.season}</p>}
      </div>
      {m.weeks.map((w, i) => (
        <div
          key={w.date}
          className={cn(
            row,
            "px-4 py-2.5",
            i % 2 ? "bg-[var(--doc-fill)]" : "bg-[var(--doc-fill-quiet)]",
          )}
        >
          <span className={cn("font-semibold tabular-nums", XS, SOFT)}>{w.date}</span>
          <span className={cn("font-semibold", XS, INK)}>{w.about}</span>
          <span className="flex flex-wrap gap-1">
            {w.clinic.length ? (
              w.clinic.map((c) => (
                <Pill key={c} tone={CLINIC_DAY[c].tone}>
                  {CLINIC_DAY[c].label}
                </Pill>
              ))
            ) : (
              <span
                className="ml-2 hidden h-1.5 w-1.5 rounded-full bg-[var(--doc-fill-strong)] sm:block"
                aria-hidden
              />
            )}
          </span>
          <span className="flex flex-wrap gap-1">
            {w.also.map((a) => (
              <Pill key={a.text} tone={a.tone}>
                {a.text}
              </Pill>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Three segments: how far along the road from known to booked a month stands. Empty segments
 * carry a stroke so they read as empty slots to be filled; the user could not see them as
 * plain white on the panel.
 */
function Meter({ stage }: { stage: number }) {
  return (
    <div role="img" aria-label={`Step ${stage} of ${STAGES.length}: ${STAGES[stage - 1]}`}>
      <div className="grid grid-cols-3 gap-1.5">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-3 rounded-full",
              i < stage
                ? "bg-[var(--doc-fill-ink)]"
                : "bg-[var(--doc-paper)] shadow-[inset_0_0_0_1.5px_#8a857b]",
            )}
          />
        ))}
      </div>
      <div className={cn("mt-2 grid grid-cols-3 gap-1.5", MICRO)}>
        {STAGES.map((s, i) => (
          <span key={s} className={i === stage - 1 ? cn("font-bold", INK) : SOFT}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The three months as a relay. What one month hands over is drawn as a dark band lying across
 * the join, overlapping both panels, so the handover reads at a glance while scrolling. Each
 * panel is a shade deeper than the last and its meter one step further on.
 */
function MonthRelay() {
  return (
    <div className="mt-8">
      {MONTHS.map((m, i) => (
        <Fragment key={m.month}>
          <div
            className={cn(
              "avoid-break relative grid gap-5 rounded-[var(--doc-r-panel)] px-6 py-7 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-center sm:gap-10 sm:px-8",
              m.bg,
            )}
          >
            <div>
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className={cn("font-semibold", SM, SOFT)}>{m.month}</span>
                <span
                  className={cn("text-[length:var(--doc-t-lead)] leading-tight font-bold", INK)}
                >
                  {m.title}
                </span>
              </p>
              <p className={cn("mt-1.5", SM, BODY)}>{m.goal}</p>
              {m.note && <p className={cn("mt-2", XS, SOFT)}>{m.note}</p>}
            </div>
            <Meter stage={i + 1} />
          </div>
          <div
            className={cn(
              "relative z-[1] mx-4 -my-5 flex items-center gap-3 rounded-[var(--doc-r-inset)] px-5 py-3.5 sm:mx-12",
              TONE.ours,
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--doc-fill-strong)]">
              <Arrow className="h-4 w-4 rotate-90 text-[var(--doc-ink)]" />
            </span>
            <p className={cn(XS, BODY)}>
              <span className={cn("font-semibold", INK)}>{m.handover.to}: </span>
              {m.handover.what}
            </p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * What the clinic keeps, in their colour because it is theirs. January's handover lies across
 * its top, so the relay ends here. Kept compact: it shares a page with the three months.
 */
function KeepPanel() {
  return (
    <div className={cn("rounded-[var(--doc-r-panel)] px-6 pt-10 pb-6 sm:px-8", TONE.yours)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p
          className={cn(
            "text-[length:var(--doc-t-lead)] leading-snug font-bold sm:min-w-[11.5rem]",
            INK,
          )}
        >
          After 13 weeks, this is yours to keep
        </p>
        <dl className="grid shrink-0 grid-cols-4 gap-x-5">
          {KEEPS.map(([n, what]) => (
            <div key={what}>
              <dt
                className={cn(
                  "text-[length:var(--doc-t-h3)] leading-none font-bold tabular-nums",
                  INK,
                )}
              >
                {n}
              </dt>
              <dd className={cn("mt-1.5 whitespace-nowrap", XS, BODY)}>{what}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className={cn("mt-4", XS, BODY)}>
        You also keep the templates. In early February we send a final report with our advice for
        what comes next.
      </p>
    </div>
  );
}

/** The month as a ring of eight steps, ours and yours alternating. A list on a phone. */
function Cycle() {
  const n = LOOP.length;
  const point = (step: number) => {
    const a = ((-90 + (step * 360) / n) * Math.PI) / 180;
    return { x: 50 + 37 * Math.cos(a), y: 50 + 40 * Math.sin(a) };
  };

  return (
    <>
      <div className="avoid-break relative mt-8 hidden h-[32rem] sm:block">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <ellipse
            cx="50"
            cy="50"
            rx="37"
            ry="40"
            fill="none"
            stroke="var(--doc-fill-strong)"
            strokeWidth="8"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {LOOP.map((_, i) => {
          const p = point(i + 0.5);
          const turn = ((i + 0.5) * 360) / n;
          return (
            <span
              key={i}
              className="absolute"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: `translate(-50%, -50%) rotate(${turn}deg)`,
              }}
            >
              <Arrow className="h-4 w-4" />
            </span>
          );
        })}
        <div className="absolute top-1/2 left-1/2 w-52 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className={cn("text-[length:var(--doc-t-h3)] font-bold", INK)}>One month</p>
          <p className={cn("mt-1", XS, SOFT)}>Our report shapes the next plan.</p>
        </div>
        {LOOP.map((s, i) => {
          const p = point(i);
          return (
            <div
              key={s.title}
              className={cn(
                "absolute w-[10rem] -translate-x-1/2 -translate-y-1/2 rounded-[var(--doc-r-inset)] px-4 py-3 text-center",
                TONE[s.who],
              )}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <p className={cn(MICRO, TONE_SOFT[s.who])}>
                {i + 1} · {s.when}
              </p>
              <p className={cn("mt-0.5 font-semibold", XS, INK)}>{s.title}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-7 space-y-2 sm:hidden">
        {LOOP.map((s, i) => (
          <Fragment key={s.title}>
            {i > 0 && <Arrow className="mx-auto rotate-90" />}
            <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3", TONE[s.who])}>
              <p className={cn(MICRO, TONE_SOFT[s.who])}>
                {i + 1} · {s.when}
              </p>
              <p className={cn("mt-0.5 font-semibold", XS, INK)}>{s.title}</p>
            </div>
          </Fragment>
        ))}
        <p className={cn("flex items-center justify-center gap-2 pt-1", XS, SOFT)}>
          <Arrow className="h-4 w-4 -rotate-90" />
          Back to 1. Our report shapes the next plan.
        </p>
      </div>
    </>
  );
}

/**
 * You do A, so we do B, otherwise C. Read like a table: the headers take the deep tones, the
 * rows the light ones, and "otherwise" stays bare so it reads as the consequence, not a task.
 */
function NeedsFlow() {
  const row =
    "grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_1.25rem_minmax(0,1fr)_1.5rem_minmax(0,0.8fr)] sm:items-stretch sm:gap-2";
  const head = "rounded-[var(--doc-r-inset)] px-4 py-2 font-semibold";
  const box = "rounded-[var(--doc-r-inset)] px-4 py-3";
  return (
    <div className="avoid-break mt-7 space-y-2">
      <div className={cn(row, "hidden sm:grid")}>
        <span className={cn(head, XS, INK, TONE.yours)}>You</span>
        <span />
        <span className={cn(head, XS, INK, TONE.ours)}>So we can</span>
        <span />
        <span className={cn(head, XS, INK)}>Otherwise</span>
      </div>
      {NEEDS.map((r) => (
        <div key={r.you} className={row}>
          <div className={cn(box, TONE.yoursLight)}>
            <p className={cn(XS, INK)}>{r.you}</p>
          </div>
          <Arrow className="mx-auto rotate-90 sm:mx-0 sm:rotate-0 sm:self-center" />
          <div className={cn(box, TONE.oursLight)}>
            <p className={cn("font-semibold", XS, INK)}>{r.so}</p>
          </div>
          <span className={cn("hidden self-center text-center sm:block", MICRO, SOFT)}>or</span>
          <p className={cn("px-4 sm:self-center", XS, SOFT)}>
            <span className="sm:hidden">Otherwise: </span>
            {r.otherwise}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Every way a patient finds the clinic, converging on the one place they all end: the front
 * desk. Lines are drawn from the centre of each source row to the middle of the desk block.
 */
function Machine() {
  const n = MACHINE.length;
  // Rows are h-10 (2.5rem) with a 0.375rem gap, so row centres sit at these fractions.
  const rowY = (i: number) => ((i * 2.875 + 1.25) / (n * 2.5 + (n - 1) * 0.375)) * 100;
  return (
    <div className="avoid-break mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_5rem_minmax(0,0.8fr)] sm:items-stretch sm:gap-0">
      <div className="space-y-1.5">
        {MACHINE.map((m) => (
          <div
            key={m.name}
            className={cn(
              "flex h-10 items-center justify-between gap-3 rounded-[var(--doc-r-inset)] px-4",
              m.inPlan ? TONE.ours : TONE.yoursLight,
            )}
          >
            <span className={cn("truncate font-semibold", XS, INK)}>{m.name}</span>
            {m.tag && (
              <span
                className={cn(
                  "shrink-0 rounded-[var(--doc-r-chip)] px-2.5 py-0.5 font-semibold",
                  MICRO,
                  m.inPlan ? "bg-[#94492a] text-white" : cn("bg-[var(--doc-paper)]", BODY),
                )}
              >
                {m.tag}
              </span>
            )}
          </div>
        ))}
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="hidden h-full w-full sm:block"
        aria-hidden
      >
        {MACHINE.map((m, i) => (
          <line
            key={m.name}
            x1="0"
            y1={rowY(i)}
            x2="100"
            y2="50"
            stroke={m.inPlan ? "#131211" : "#c9c4b9"}
            strokeWidth={m.inPlan ? 2.5 : 1.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <Arrow className="mx-auto rotate-90 sm:hidden" />

      <div className="flex flex-col justify-center">
        <div className={cn("rounded-[var(--doc-r-panel)] p-5", TONE.yours)}>
          <p className={cn("text-[length:var(--doc-t-lead)] font-bold", INK)}>Your front desk</p>
          <p className={cn("mt-1", XS, BODY)}>Every enquiry ends here, whatever its source.</p>
          <Arrow className="my-3 h-4 w-4 rotate-90" />
          <span
            className={cn(
              "inline-flex rounded-[var(--doc-r-chip)] px-4 py-1.5 font-semibold",
              XS,
              INK,
              TONE.ours,
            )}
          >
            A booked patient
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The funnel narrowing down the left. Each step shows where people fall out, then the fix.
 * The first column carries a slim label, lighter than the other two, so the stages read as
 * one person moving down: someone who sees a post, then trusts you, and so on.
 */
function Funnel() {
  const row =
    "grid gap-1.5 sm:grid-cols-[15rem_1.25rem_minmax(0,1fr)_1.25rem_minmax(0,1fr)] sm:items-center sm:gap-2";
  const head = "rounded-[var(--doc-r-inset)] px-4 py-2 font-semibold";
  return (
    <div className="avoid-break mt-8 space-y-2">
      <div className={cn(row, "hidden sm:grid")}>
        <span className="flex justify-center">
          <span
            className={cn(
              "rounded-[var(--doc-r-chip)] bg-[var(--doc-fill-quiet)] px-4 py-1 font-semibold",
              MICRO,
              BODY,
            )}
          >
            Someone who&hellip;
          </span>
        </span>
        <span />
        <span className={cn(head, XS, INK, TONE.clay)}>Where people get lost</span>
        <span />
        <span className={cn(head, "bg-[var(--doc-fill-strong)]", XS, INK)}>What fixes it</span>
      </div>
      {FUNNEL.map((s, i) => (
        <Fragment key={s.stage}>
          {i === 2 && (
            <div className="flex items-center gap-2.5 py-1 sm:w-[15rem] sm:justify-center">
              <Arrow className="h-4 w-4 rotate-90" />
              <p className={cn("font-semibold", MICRO, INK)}>Your front desk takes over</p>
            </div>
          )}
          <div className={row}>
            <div className="flex sm:justify-center">
              <div
                className={cn(
                  "flex h-12 w-full items-center justify-center gap-2 rounded-[var(--doc-r-chip)] px-4 sm:w-[var(--w)]",
                  TONE[s.tone],
                )}
                style={{ "--w": `${s.width}%` } as React.CSSProperties}
              >
                <span className={cn("font-semibold tabular-nums", XS, TONE_SOFT[s.tone])}>
                  {i + 1}
                </span>
                <span className={cn("font-semibold whitespace-nowrap", XS, INK)}>{s.stage}</span>
              </div>
            </div>
            <Arrow className="hidden text-[#94492a] sm:block" />
            <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3", CLAY_TINT)}>
              <p className={cn(XS, INK)}>
                <span className="font-semibold sm:hidden">Lost: </span>
                {s.lost}
              </p>
            </div>
            <Arrow className="hidden sm:block" />
            <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3", TONE[s.by])}>
              <p className={cn("font-semibold", XS, INK)}>{s.fix}</p>
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * What happens to one message, with a person at every step. Four steps, then a fork: people
 * who book, and people who do not yet. The same person carries both lanes.
 */
function HumanFlow() {
  return (
    <div className="avoid-break mt-7 space-y-5">
      <Steps steps={HUMAN_STEPS} />
      <p className={cn("flex items-center gap-2.5 font-semibold", XS, INK)}>
        <Arrow className="h-4 w-4 rotate-90" />
        After the first reply, every chat goes one of two ways. Neither goes quiet.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {LANES.map((lane) => (
          <div
            key={lane.label}
            className="rounded-[var(--doc-r-panel)] bg-[var(--doc-fill-quiet)] p-4"
          >
            <Pill tone={lane.tone}>{lane.label}</Pill>
            <div className="mt-3 space-y-1.5">
              {lane.steps.map((s, i) => (
                <Fragment key={s}>
                  {i > 0 && <Arrow className="mx-auto h-4 w-4 rotate-90" />}
                  <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-2.5", TONE.yoursLight)}>
                    <p className={cn(XS, INK)}>{s}</p>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A reply as a person writes it, beside what we give the team who write them. */
function HumanReply() {
  return (
    <div className="avoid-break mt-5 grid gap-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="rounded-[var(--doc-r-panel)] bg-[var(--doc-fill)] p-5">
        <p className={cn("font-semibold", XS, SOFT)}>What the patient gets, within minutes</p>
        <p
          className={cn(
            "mt-3 rounded-[var(--doc-r-inset)] rounded-tl-[4px] bg-[var(--doc-paper)] px-4 py-3",
            XS,
            INK,
          )}
        >
          Good morning, this is [name] at Nadkof. I&rsquo;m sorry about your mum&rsquo;s knee. How
          long has it been hurting?
        </p>
      </div>
      <div className={cn("rounded-[var(--doc-r-panel)] p-5", TONE.ours)}>
        <p className={cn("font-semibold", XS, SOFT)}>What we give your team, if you want it</p>
        <p className={cn("mt-3 font-semibold", SM, INK)}>A reply guide</p>
        <p className={cn("mt-1", XS, BODY)}>
          Answers to the questions people ask most, written with your physios.
        </p>
      </div>
    </div>
  );
}

/**
 * Every source feeds our lead system on its own. Walk-ins are the one count typed in by hand,
 * so they alone take the clinic's colour and the "Your desk" tag. Both sides read one screen.
 */
function TrackerFlow() {
  return (
    <div className="avoid-break mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_1.25rem_11rem] sm:items-stretch sm:gap-2.5">
      <div className="space-y-1">
        {TRACK_SOURCES.map((s) => (
          <div
            key={s.name}
            className={cn(
              "grid items-center gap-x-3 gap-y-1 rounded-[var(--doc-r-inset)] px-4 py-2 sm:grid-cols-[9.5rem_minmax(0,1fr)_auto]",
              s.auto ? "bg-[var(--doc-fill-quiet)]" : TONE.yoursLight,
            )}
          >
            <p className={cn("font-semibold", XS, INK)}>{s.name}</p>
            <p className={cn(MICRO, BODY)}>{s.how}</p>
            <span
              className={cn(
                "justify-self-start rounded-[var(--doc-r-chip)] px-2.5 py-0.5 font-semibold whitespace-nowrap",
                MICRO,
                INK,
                s.auto ? TONE.ours : "bg-[var(--doc-paper)]",
              )}
            >
              {s.auto ? "Automatic" : "Your desk"}
            </span>
          </div>
        ))}
      </div>
      <Arrow className="mx-auto rotate-90 sm:rotate-0 sm:self-center" />
      <div className="flex flex-col justify-center">
        <div className={cn("rounded-[var(--doc-r-panel)] p-5", TONE.ours)}>
          <p className={cn("text-[length:var(--doc-t-lead)] leading-snug font-bold", INK)}>
            Our lead system
          </p>
          <p className={cn("mt-2", XS, SOFT)}>
            Every enquiry in one place. You see the same screen we do.
          </p>
        </div>
        <Arrow className="mx-auto my-2 h-4 w-4 rotate-90" />
        <div className={cn("rounded-[var(--doc-r-inset)] px-4 py-3", TONE.oursLight)}>
          <p className={cn("font-bold", SM, INK)}>Our monthly report</p>
          <p className={cn("mt-0.5", MICRO, SOFT)}>Measured against your baseline</p>
        </div>
      </div>
    </div>
  );
}

/** The steps of engagement in order. Who carries each one sits at the end of its row. */
function EngageSteps() {
  return (
    <ol className="avoid-break mt-7">
      {ENGAGE.map((e, i) => {
        const tone = ENGAGE_TONE[e.who];
        return (
          <li key={e.title}>
            {i > 0 && <Arrow className="my-1 ml-6 h-4 w-4 rotate-90" />}
            <div
              className={cn(
                "grid items-center gap-x-4 gap-y-1 rounded-[var(--doc-r-inset)] px-5 py-3.5 sm:grid-cols-[1.5rem_11rem_minmax(0,1fr)_5.5rem]",
                STEP_BG[tone],
              )}
            >
              <span className={cn("font-bold tabular-nums", SM, STEP_SOFT[tone])}>{i + 1}</span>
              <p className={cn("font-bold", SM, INK)}>{e.title}</p>
              <p className={cn(XS, STEP_SOFT[tone])}>{e.detail}</p>
              <span className={cn("font-semibold sm:text-right", MICRO, STEP_SOFT[tone])}>
                {e.who}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The site they already have at the top, what the update adds below, what every page gains. */
function SiteTree() {
  const bar = "absolute rounded-full bg-[#c9c4b9]";
  return (
    <div className="avoid-break mt-7">
      <div className="flex justify-center">
        <span
          className={cn(
            "rounded-[var(--doc-r-chip)] px-6 py-2.5 font-semibold",
            SM,
            INK,
            TONE.yours,
          )}
        >
          Your website today
        </span>
      </div>
      {/* Taller than it needs to be on purpose: the user wanted the links to read clearly. */}
      <div className="relative hidden h-14 sm:block" aria-hidden>
        <span className={cn(bar, "top-0 left-1/2 h-7 w-1 -translate-x-1/2")} />
        <span
          className={cn(bar, "top-7 h-1")}
          style={{
            left: `${SITE_CENTRES[0]}%`,
            right: `${100 - SITE_CENTRES[SITE.length - 1]}%`,
          }}
        />
        {SITE_CENTRES.map((x) => (
          <span
            key={x}
            className={cn(bar, "top-7 h-7 w-1 -translate-x-1/2")}
            style={{ left: `${x}%` }}
          />
        ))}
      </div>
      <div className="mt-3 grid gap-4 sm:mt-0 sm:grid-cols-4 sm:gap-0">
        {SITE.map((b) => (
          <div key={b.name} className="flex flex-col items-center sm:px-1.5">
            <span
              className={cn(
                "w-full rounded-[var(--doc-r-inset)] px-3 py-2.5 text-center font-semibold",
                XS,
                INK,
                TONE.ours,
              )}
            >
              {b.name}
            </span>
            <div className="mt-2 flex w-full flex-col items-center gap-1.5">
              {b.leaves.map((leaf) => (
                <span
                  key={leaf}
                  className={cn(
                    "w-full rounded-[var(--doc-r-chip)] bg-[var(--doc-fill-quiet)] px-3 py-1 text-center",
                    MICRO,
                    BODY,
                  )}
                >
                  {leaf}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className={cn("mt-8 font-bold", SM, INK)}>On every page</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
        {CAPTURE.map((c, i) => (
          <div
            key={c.title}
            className={cn(
              "rounded-[var(--doc-r-inset)] px-4 py-3.5",
              i === 0 ? TONE.ours : TONE.oursLight,
            )}
          >
            <p className={cn("font-semibold", i === 0 ? SM : XS, INK)}>{c.title}</p>
            <p className={cn("mt-1", MICRO, SOFT)}>{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const COLS13 = "grid grid-cols-[repeat(13,minmax(0,1fr))] gap-[3px]";
const TL_ROW = "sm:grid sm:grid-cols-[12.5rem_minmax(0,1fr)] sm:items-center sm:gap-4";

function WeekHeader() {
  return (
    <div className={TL_ROW}>
      <span className={cn("hidden self-end font-semibold sm:block", MICRO, SOFT)}>Week of</span>
      <div>
        <div className={COLS13}>
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
        <div className={cn(COLS13, "mt-1")}>
          {WEEK_STARTS.map((d, i) => (
            <span key={i} className={cn("text-center tabular-nums", MICRO, SOFT)}>
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekTrack({ label, sub, mark }: { label: string; sub: string; mark: Mark }) {
  return (
    <div className={TL_ROW}>
      <p className="mb-1.5 sm:mb-0">
        <span className={cn("block font-bold", SM, INK)}>{label}</span>
        <span className={cn("block", MICRO, BODY)}>{sub}</span>
      </p>
      <div className={cn(COLS13, "grid-rows-[2.25rem]")}>
        {WEEK_STARTS.map((_, i) => (
          <span
            key={i}
            style={{ gridColumn: i + 1, gridRow: 1 }}
            className="rounded-[8px] bg-[var(--doc-fill-quiet)]"
          />
        ))}
        <span
          style={{ gridColumn: `${mark.from} / ${mark.to + 1}`, gridRow: 1 }}
          className={cn(
            "z-[1] flex min-w-0 items-center justify-center overflow-hidden rounded-[8px] px-2 font-semibold",
            XS,
            INK,
            TONE[mark.tone],
          )}
        >
          <span className="truncate">{mark.label}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Nadkof Physiotherapy and Wellness Centre, East Legon and Tema. Three months of social media
 * content: reels, graphics and a two-person podcast, filmed at the clinic, edited and posted
 * on five platforms, at GHS 6,200 a month.
 *
 * Decisions worth remembering:
 *
 *  - The clinic is Nadkof. The first versions were issued as "Ladkov", a mishearing. The
 *    reference moved from PRO-LADKOV-61 to PRO-NADKOF-61 in both repos on 2026-10-08.
 *  - This is the proposal, not a draft for a meeting. The meeting has happened. It opens by
 *    saying who we are and that we give first: the plan is theirs to use either way.
 *  - It is a sample plan built on what we know. It says so, asks what we do not know, and
 *    allows that the clinic may already do some of it.
 *  - Ideas come from the clinic's knowledge. We are the craft.
 *  - No bot menus. A real person on the clinic's staff answers, on every platform, and stays
 *    with the patient to the booking. We write the reply guide if they want one.
 *  - Social media is one part of the clinic's marketing machine. The machine is named; only
 *    social media is offered.
 *  - Numbers were cut to what the team can film: 3 to 5 reels a shoot day, 8 reels and 8
 *    clips a month. The week grid sums to exactly that; change both together.
 *  - The plan reads as one argument: numbered parts, each opened by a `Bridge` line inside
 *    its held-together block. Keep a bridge on any part added.
 *  - Dark is our work, light is the clinic's, each in a deep and a light tone. Clay is the
 *    one accent. Copy is plain, we and you, one idea a sentence, no dashes.
 *  - The clinic already has a website. We update it. A fresher look is mentioned as a later
 *    talk, never sold here.
 *  - Nothing promises followers, virality or bookings. Part 22 says why.
 *  - Counts are automatic. The clinic is onboarded onto our lead system and every source
 *    feeds it; only walk-ins are typed in. Never offer a shared sheet: a client could
 *    under-report and the numbers would count against us.
 *  - The engagement runs NDA, MOU, baseline audit, account access, a two-month pilot, then
 *    a joint review. Progress is always measured against the audit's baseline.
 */
export function NadkofContentPlan({ record }: { record: DocumentRecord }) {
  return (
    <div className="[&_p]:text-pretty">
      <VerifyLine record={record} />
      <Letterhead record={record} />

      {/* ── Cover ───────────────────────────────────────────────── */}
      <Section>
        <Eyebrow>Prepared For</Eyebrow>
        <Heading size="h2" className="mt-3">
          Nadkof Physiotherapy and Wellness Centre
        </Heading>
        <Note className="mt-2">East Legon, Accra · Community 25, Tema</Note>

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
              value="8 reels, 1 podcast episode, 8 podcast clips, 8 graphics"
            />
            <DetailRow
              label="Time at your clinic"
              value="Two shoot days and one podcast morning a month"
            />
            <DetailRow label="Price" value={`${ghs(MONTHLY_FEE)} a month, everything included`} />
          </DetailList>
        </div>
      </Section>

      {/* ── Opening ─────────────────────────────────────────────── */}
      <Section className="page-start mb-20">
        <Lead>
          Saharabase Technologies is a digital agency in Accra. We build software, websites and
          mobile apps. We also make content and run campaigns.
        </Lead>

        <Panel tone="ink" className="mt-8">
          <p className={cn("text-[length:var(--doc-t-h2)] leading-tight font-bold", INK)}>
            We give first.
          </p>
          <p className={cn("mt-4 text-[length:var(--doc-t-lead)] leading-[1.6]", BODY)}>
            We value long working relationships. So this plan is yours to use, whether you work with
            us or not. Anyone who knows the work can follow it.
          </p>
        </Panel>

        <P className="mt-8">
          You asked for a team to make your social media content and post it for you. This plan
          shows how we would do it, from November to January.
        </P>
        <P className="mt-3">
          It is a sample plan, built on what we know about Nadkof so far. You may already do some of
          what we suggest. Where we got something wrong, tell us.
        </P>

        <p
          className={cn(
            "mt-8 text-[length:var(--doc-t-h3)] leading-[1.3] font-bold tracking-[-0.015em] text-balance",
            INK,
          )}
        >
          Our goal: when an older adult in Accra or Tema needs a physiotherapist, or their daughter
          in London searches for one, Nadkof is the name they already know.
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
          <Head n={1}>What we understand about Nadkof today</Head>
          <P className="mt-4">
            This is what we took from our talk with you. We do not have every detail yet. Each point
            shapes the plan.
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
            People rarely book after one post. They see you a few times. They start to trust you.
            Then they reach out. The plan works on every step.
          </P>
          <ApproachChain />
          <Note className="mt-4">
            The first two steps are mostly our work. The last two happen at your front desk.
          </Note>
        </div>
      </Part>

      {/* 03 Audience */}
      <Part>
        <div className="avoid-break">
          <Bridge>Being seen starts with knowing who we talk to.</Bridge>
          <Head n={3}>Who we talk to</Head>
          <P className="mt-4">
            Your patient is often older. The person who pays is often their son or daughter,
            sometimes abroad. Every post speaks to both.
          </P>
          <AudiencePair />
        </div>
        <div className="avoid-break mt-6">
          <P>
            Five groups in all, each on different platforms. Facebook reaches {FACEBOOK_REACH} of
            the {AUDIENCES.length}. It gets a post six days a week.
          </P>
          <AudienceMatrix />
        </div>
      </Part>

      {/* 04 Ideas */}
      <Part>
        <div className="avoid-break">
          <Bridge>To speak to them well, we start with what your physios know.</Bridge>
          <Head n={4}>The ideas come from your clinic</Head>
          <P className="mt-4">
            Your physios hear the same problems and questions every week. That is the best source of
            posts there is. We bring the craft. Your own ideas for posts are welcome too.
          </P>
          <IdeasSum />
          <Steps steps={IDEA_STEPS} className="mt-5" />
        </div>
      </Part>

      {/* 05 Pillars */}
      <Part>
        <div className="avoid-break">
          <Bridge>Those ideas fall into six topics.</Bridge>
          <Head n={5}>What we post about</Head>
          <P className="mt-4">
            Views come first. People stop scrolling for what they recognise: their own pain, in
            their own day. So most reels open on an everyday moment, then give one fix.
          </P>
          <PillarRing />
          <div className="mt-7 rounded-[var(--doc-r-panel)] bg-[var(--doc-fill-quiet)] p-5">
            <p className={cn("font-bold", SM, INK)}>Everyday moments we film</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MOMENTS.map((m) => (
                <Pill key={m} tone="yoursLight">
                  {m}
                </Pill>
              ))}
            </div>
          </div>
          <Note className="mt-4">
            Some posts are in Twi and Ga, with English subtitles. Sixteen sample reels are in the
            appendix at the end.
          </Note>
        </div>
      </Part>

      {/* 06 Feed */}
      <Part>
        <div className="avoid-break">
          <Bridge>Here is how the topics become posts.</Bridge>
          <Head n={6}>Where the posts come from</Head>
          <P className="mt-4">
            Most of it is filmed at your clinic, on two shoot days and one podcast morning a month.
            We bring our own cameras, lights and microphones.
          </P>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <p
              className={cn(
                "rounded-[var(--doc-r-inset)] bg-[var(--doc-fill)] px-5 py-3.5",
                XS,
                BODY,
              )}
            >
              <strong>A reel</strong> is a short video we script and film on a shoot day.
            </p>
            <p
              className={cn(
                "rounded-[var(--doc-r-inset)] bg-[var(--doc-fill)] px-5 py-3.5",
                XS,
                BODY,
              )}
            >
              <strong>A clip</strong> is a short moment cut from the podcast.
            </p>
          </div>
          <FeedDiagram />
        </div>
      </Part>

      {/* 07 Podcast */}
      <Part>
        <div className="avoid-break">
          <Bridge>The podcast gives the most posts for the least time. Here is how.</Bridge>
          <Head n={7}>One podcast, cut into a month of clips</Head>
          <P className="mt-4">
            Once a month, a Nadkof physio and a guest talk for 40 minutes at your clinic. We record
            it. Then we cut out the best moments.
          </P>
          <EpisodeCut />
          <Note className="mt-4">
            Every clip also goes on YouTube Shorts, linked to the full episode.
          </Note>
        </div>

        <div className="avoid-break mt-8">
          <P>There are three episodes, one each month. Each one fits that month&rsquo;s theme.</P>
          <div className="mt-5 overflow-x-auto">
            <table className="doc-table min-w-[30rem] table-fixed">
              <thead>
                <tr>
                  <th className="w-[26%]">Month</th>
                  <th className="w-[44%]">Episode</th>
                  <th>Possible guest</th>
                </tr>
              </thead>
              <tbody>
                {EPISODES.map((e) => (
                  <tr key={e.month}>
                    <td>
                      <span className="block font-semibold text-[var(--doc-ink)]">{e.month}</span>
                      <span className="block text-[var(--doc-ink-soft)]">{e.theme}</span>
                    </td>
                    <td className="font-semibold text-[var(--doc-ink)]">{e.title}</td>
                    <td>{e.guest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note className="mt-3">
            We could call it The Recovery Room by Nadkof. You choose the final name.
          </Note>
        </div>
      </Part>

      {/* 08 Week */}
      <Part>
        <div className="avoid-break">
          <Bridge>Reels, clips and graphics then go out on a set weekly rhythm.</Bridge>
          <Head n={8}>One week of posts</Head>
          <P className="mt-4">Not every platform gets every post. Each one gets what suits it.</P>
          <WeekGrid />
          <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
            <p className={cn("shrink-0 font-bold", SM, INK)}>
              {PER_WEEK} posts a week. About {PER_MONTH} a month.
            </p>
            <Note>Once a month, the full episode goes on YouTube.</Note>
          </div>
        </div>
      </Part>

      {/* 09 Platform jobs */}
      <Part>
        <div className="avoid-break">
          <Bridge>Each platform gets different posts because each has a different job.</Bridge>
          <Head n={9}>Each platform has a job</Head>
          <P className="mt-4">
            Some platforms find new people. Others build trust. Most patients pass through a few
            before they book.
          </P>
          <PlatformMap />
          <Note className="mt-4">
            The numbered line is one common path to a booking. LinkedIn sits apart. It reaches the
            doctors who refer patients to you.
          </Note>
        </div>
      </Part>

      {/* 10 Calendar */}
      <Part>
        <Calendar>
          <Bridge>The topics also follow the calendar. Here are the thirteen weeks.</Bridge>
          <Head n={10}>Thirteen weeks, week by week</Head>
          <P className="mt-4">
            Each row is one week, from Monday 2 November. We confirm the dates in each month&rsquo;s
            plan.
          </P>
          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
            <KeyItem tones={["ours", "oursLight"]}>Our work</KeyItem>
            <KeyItem tones={["yours"]}>Your part</KeyItem>
            <KeyItem tones={["date"]}>The calendar</KeyItem>
          </div>
        </Calendar>
      </Part>

      {/* 11 Months */}
      <Part>
        <div className="avoid-break">
          <Bridge>Week by week, each month builds on the one before.</Bridge>
          <Head n={11}>Each month builds on the last</Head>
          <P className="mt-4">
            November makes you known. December earns trust. January brings bookings.
          </P>
          <MonthRelay />
          <KeepPanel />
        </div>
      </Part>

      {/* 12 Loop */}
      <Part>
        <div className="avoid-break">
          <Bridge>Every one of those months runs on the same loop.</Bridge>
          <Head n={12}>Every month runs on one loop</Head>
          <P className="mt-4">Your ideas start it. You approve the plan. Then we make it.</P>
          <Cycle />
        </div>
        <div className="avoid-break mt-8">
          <p className={cn("mb-3 font-semibold", SM, INK)}>
            One late step delays every step after it.
          </p>
          <Steps
            steps={[
              { tone: "yours", title: "You approve a week late" },
              { tone: "ours", title: "We film a week late" },
              { tone: "quiet", title: "A week with no new posts" },
            ]}
          />
          <Note className="mt-3">
            January&rsquo;s plan comes in early December. That way we film before Christmas.
          </Note>
        </div>
      </Part>

      {/* 13 Needs */}
      <Part>
        <div className="avoid-break">
          <Bridge>The loop only moves when a few things come from you.</Bridge>
          <Head n={13}>What we need from you</Head>
          <P className="mt-4">Most of the work is ours. These few things depend on you.</P>
          <NeedsFlow />
        </div>
      </Part>

      {/* 14 Consent */}
      <Part>
        <div className="avoid-break">
          <Bridge>Consent matters most. Here is how we suggest you handle it.</Bridge>
          <Head n={14}>Each patient chooses what we show</Head>
          <P className="mt-4">
            Consent is yours to collect. Your clinic asks each patient and keeps the signed form.
            This is how we suggest you ask.
          </P>
          <div className="mt-6 overflow-x-auto">
            <table className="doc-table min-w-[32rem] table-fixed">
              <thead>
                <tr>
                  <th className="w-[29%]">Level</th>
                  <th className="w-[9%] px-1 text-center">Face</th>
                  <th className="w-[9%] px-1 text-center">Voice</th>
                  <th className="w-[9%] px-1 text-center">Body</th>
                  <th className="w-[9%] px-1 text-center">Name</th>
                  <th className="w-[35%]">What we make</th>
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
                        <SeenDot v={v} />
                      </td>
                    ))}
                    <td>{l.good}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note className="mt-3">
            A half dot means first name or initials only. A child appears only with a parent&rsquo;s
            written consent.
          </Note>
        </div>
      </Part>

      {/* 15 Machine */}
      <Part>
        <div className="avoid-break">
          <Bridge>
            All of this brings people to Nadkof. Social media is one of several ways they arrive.
          </Bridge>
          <Head n={15}>Social media is one part of the machine</Head>
          <P className="mt-4">
            Patients find you in many ways. Every way ends at the same place: someone at your clinic
            who answers.
          </P>
          <Machine />
        </div>
      </Part>

      {/* 16 Leads */}
      <Part>
        <div className="avoid-break">
          <Bridge>
            Every way ends at your front desk. The question is whether it catches them.
          </Bridge>
          <Head n={16}>Is Nadkof ready for everyone the posts bring in?</Head>
          <P className="mt-4">
            Posts bring attention. Attention only helps when someone catches it. You may already
            have a way of doing this. This is how we think it could work.
          </P>
          <Funnel />
        </div>
      </Part>

      {/* 17 Human replies */}
      <Part>
        <div className="avoid-break">
          <Bridge>The biggest fix is a person, not a machine.</Bridge>
          <Head n={17}>A real person, every time</Head>
          <P className="mt-4">
            People switch off when a machine answers. They want someone who knows the answer and
            cares about the question. So a real person on your team replies, on every platform. That
            includes comments and messages on TikTok.
          </P>
          <P className="mt-3">
            It works best with someone on your staff. They know your services, your prices and your
            physios. No reply we write could match that.
          </P>
          <HumanFlow />
        </div>
        <HumanReply />
      </Part>

      {/* 18 Tracker */}
      <Part>
        <div className="avoid-break">
          <Bridge>To improve, we need to count what happens.</Bridge>
          <Head n={18}>How every enquiry is counted</Head>
          <P className="mt-4">
            We set you up on our lead system. Each platform reports into it on its own. Nobody types
            the numbers in, so both sides can trust them.
          </P>
          <TrackerFlow />
        </div>

        <div className="avoid-break mt-8">
          <P>Three example entries. The first three columns fill themselves.</P>
          <div className="mt-5 overflow-x-auto">
            <table className="doc-table min-w-[34rem] table-fixed">
              <thead>
                <tr>
                  <th className="w-[13%]">Date</th>
                  <th className="w-[27%]">Came from</th>
                  <th className="w-[31%]">Post that brought them</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {TRACKER_ROWS.map((r) => (
                  <tr key={r[0]}>
                    <td className="tabular-nums">{r[0]}</td>
                    <td className="font-semibold text-[var(--doc-ink)]">{r[1]}</td>
                    <td>{r[2]}</td>
                    <td className="font-semibold text-[var(--doc-ink)]">{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note className="mt-3">
            Your team marks the result, or our booking form does. A patient who shows a campaign
            code tells us the post on their own. Each week we look at the numbers with you.
          </Note>
          <div className={cn("mt-6 rounded-[var(--doc-r-panel)] p-5", TONE.yoursLight)}>
            <p className={cn("font-bold", SM, INK)}>What this needs from you</p>
            <p className={cn("mt-1.5", XS, BODY)}>
              Partner access to your social media accounts, your Google profile and your website
              figures. The person who set them up can add us in a few minutes. You stay the owner of
              every account. If you already use a system of your own, we connect to it instead.
            </p>
          </div>
        </div>
      </Part>

      {/* 19 Website */}
      <Part>
        <div className="avoid-break">
          <Bridge>
            Your website is the other place people land. Today it only lets them call.
          </Bridge>
          <Head n={19}>Your website, updated</Head>
          <P className="mt-4">
            You already have a website. We keep it. We add what turns a visit into a booking.
          </P>
          <SiteTree />
          <Note className="mt-4">
            The site could also take a more modern look. We can talk about that later. The update is
            priced on its own.
          </Note>
        </div>
      </Part>

      {/* 20 Start */}
      <Part>
        <div className="avoid-break">
          <Bridge>Content first, then the lead system, then the website. Here is the order.</Bridge>
          <Head n={20}>Where to start</Head>
          <Steps steps={START} className="mt-6" />
          <Note className="mt-4">Offers and prices are your call. We design the materials.</Note>
        </div>
      </Part>

      {/* 21 Paid ads */}
      <Part>
        <div className="avoid-break">
          <Bridge>Paid ads can join at any point. They are optional.</Bridge>
          <Head n={21}>Paid ads, when you are ready</Head>
          <P className="mt-4">
            A paid ad means paying a platform to show your post to more people. You have no ad
            budget yet. The plan works without one.
          </P>
          <P className="mt-3">If you add a budget, spend it on a few strong posts.</P>
          <div className="mt-7 space-y-3">
            <WeekHeader />
            {ADS.map((a) => (
              <WeekTrack key={a.what} label={a.what} sub={a.who} mark={a.mark} />
            ))}
          </div>
          <Note className="mt-4">
            Each month we name the two or three posts worth paying for. You pay the platform
            directly.
          </Note>
        </div>
      </Part>

      {/* 22 Promise */}
      <Part>
        <div className="avoid-break">
          <Bridge>Paid or not, here is what we can promise.</Bridge>
          <Head n={22}>What we can promise</Head>
          <Panel className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Inset>
                <p className={cn("font-bold", SM, INK)}>We promise</p>
                <BulletList className="mt-3 space-y-2">
                  <Bullet size="sm">
                    The agreed number of reels, clips and graphics, every month.
                  </Bullet>
                  <Bullet size="sm">Posts on schedule, on all five platforms.</Bullet>
                  <Bullet size="sm">
                    An honest report every month, including what did not work.
                  </Bullet>
                </BulletList>
              </Inset>
              <Inset tone="quiet">
                <p className={cn("font-bold", SM, INK)}>Nobody can promise</p>
                <BulletList className="mt-3 space-y-2">
                  <Bullet size="sm">A set number of followers.</Bullet>
                  <Bullet size="sm">A video that goes viral.</Bullet>
                  <Bullet size="sm">A set number of new patients.</Bullet>
                </BulletList>
              </Inset>
            </div>

            <p className={cn("mt-7 font-bold", SM, INK)}>What we measure</p>
            <BulletList className="mt-3 space-y-2">
              <Bullet size="sm">Reach and views on each platform.</Bullet>
              <Bullet size="sm">Likes, comments, shares and saves.</Bullet>
              <Bullet size="sm">New followers.</Bullet>
              <Bullet size="sm">Profile visits, link clicks, and taps on WhatsApp or call.</Bullet>
              <Bullet size="sm">Messages, calls and bookings in our lead system.</Bullet>
              <Bullet size="sm">
                New patients who found you on social media, by post and by campaign code.
              </Bullet>
            </BulletList>

            <P className="mt-6">
              We measure each of these against the baseline from our first audit. That is how both
              sides see progress.
            </P>
            <P className="mt-3">
              Growth on social media is slow. It is never guaranteed. We aim for steady growth each
              month in reach, engagement and messages. By the end, people recognise the clinic. And
              you own a library of videos that keeps working after we finish.
            </P>
          </Panel>
        </div>
      </Part>

      {/* 23 Price */}
      <Part>
        <div className="avoid-break">
          <Bridge>That leaves the price.</Bridge>
          <Head n={23}>The price</Head>
          <div
            className={cn(
              "mt-6 grid gap-5 rounded-[var(--doc-r-panel)] p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-10 sm:p-8",
              TONE.ours,
            )}
          >
            <Figure value={ghs(MONTHLY_FEE)} caption="a month, everything included" />
            <DotList items={COVERED} />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="doc-table min-w-[30rem] table-fixed">
              <thead>
                <tr>
                  <th className="w-[30%]" />
                  <th className="w-[35%]">One month</th>
                  <th>Three months</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([what, one, three]) => (
                  <tr key={what}>
                    <td>{what}</td>
                    <td className="font-semibold text-[var(--doc-ink)] tabular-nums">{one}</td>
                    <td className="font-semibold text-[var(--doc-ink)] tabular-nums">{three}</td>
                  </tr>
                ))}
                <tr>
                  <td className="font-bold text-[var(--doc-ink)]">Price</td>
                  <td className="font-bold text-[var(--doc-ink)] tabular-nums">
                    {ghs(MONTHLY_FEE)}
                  </td>
                  <td className="font-bold text-[var(--doc-ink)] tabular-nums">
                    {ghs(MONTHLY_FEE * MONTHS_IN_PLAN)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={cn("mt-5 rounded-[var(--doc-r-panel)] p-6", TONE.yoursLight)}>
            <p className={cn("font-bold", SM, INK)}>Outside the fee</p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className={cn("font-semibold", XS, INK)}>Paid ads</dt>
                <dd className={cn(XS, BODY)}>You pay the platform directly.</dd>
              </div>
              <div>
                <dt className={cn("font-semibold", XS, INK)}>A website update</dt>
                <dd className={cn(XS, BODY)}>Priced on its own, when you want it.</dd>
              </div>
            </dl>
          </div>
          <Note className="mt-4">
            The first two months are a pilot. If you need something special, we put it before you
            and agree together how to do it. Payment dates are open to discussion.
          </Note>
        </div>
      </Part>

      {/* 24 How we start */}
      <Part>
        <div className="avoid-break">
          <Bridge>That is the plan and its price. Here is how we would begin.</Bridge>
          <Head n={24}>How we start working together</Head>
          <P className="mt-4">Six steps, in this order.</P>
          <EngageSteps />
        </div>

        <div className={cn("avoid-break mt-6 rounded-[var(--doc-r-panel)] p-6 sm:p-8", TONE.yours)}>
          <p className={cn("text-[length:var(--doc-t-lead)] font-bold", INK)}>
            Why a two-month pilot
          </p>
          <P className="mt-3">
            We both want fair value for what we put in. The pilot shows you how we work, whether the
            price suits you, and whether you like the quality.
          </P>
          <P className="mt-3">
            At the end, we review it together. If both sides want to go on, we agree the terms
            again. If the results are not there, we change the strategy. If you choose someone else,
            that is your call.
          </P>
          <P className="mt-3">
            <strong>What we value most is giving you value for your money.</strong> And doing work
            we are proud of.
          </P>
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
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">
            {[
              ["WhatsApp", "050 988 6584"],
              ["Phone", "+233 59 212 3054"],
              ["Email", "somda@saharabasetech.com"],
            ].map(([label, value]) => (
              <span
                key={label}
                className="rounded-[var(--doc-r-chip)] bg-[var(--doc-fill-strong)] px-4 py-2 text-center text-[length:var(--doc-t-xs)] whitespace-nowrap text-[var(--doc-ink)]"
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
      <Divider className="page-start" />
      <Section>
        <Chip>Appendix</Chip>
        <Heading className="mt-4 font-bold">Sixteen of the 24 reels</Heading>
        <Note className="mt-2">
          These are samples. We can change any of them. Your physio checks every script before we
          film.
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

      <DocumentFooter record={record} showSystem={false} />
    </div>
  );
}
