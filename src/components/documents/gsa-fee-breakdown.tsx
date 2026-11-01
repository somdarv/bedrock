import { cn } from "@/lib/utils";
import { type DocumentRecord } from "@/lib/documents/registry";
import { DocumentFooter } from "./document-footer";
import {
  DetailList,
  DetailRow,
  Eyebrow,
  Heading,
  Lead,
  Letterhead,
  Note,
  P,
  Panel,
  Section,
  VerifyLine,
} from "./doc-ui";
import { DotList, Head, INK, Part, SM, SOFT, TONE, XS } from "./plan-ui";

/* ── Figures ────────────────────────────────────────────────────────── */

/**
 * The user's own figures from the Option 2 cuts page (claude.ai artifact Cqx6pA9y, db doc
 * `picks/option2`, version 86, 2026-11-01). `n` is how many, `each` the price of one. Lines the
 * user set to 0 are left out. Social media is 13 weeks: 2 stills and 1 animated video a week.
 */
type Line = { what: string; n: number; each: number };
type Group = { group: string; lines: Line[] };

const GROUPS: Group[] = [
  {
    group: "Brand",
    lines: [
      { what: "Brand identity: logo, colours, fonts and a short guide", n: 1, each: 1000 },
      { what: "Social media templates", n: 1, each: 500 },
    ],
  },
  {
    group: "Website",
    lines: [
      { what: "Design and build of the website, plain pages about the awards", n: 1, each: 1000 },
    ],
  },
  {
    group: "Campaign graphics",
    lines: [
      { what: "Launch teasers", n: 4, each: 200 },
      { what: "Call for nominations flyers", n: 8, each: 75 },
      { what: "Nominee flyers", n: 250, each: 25 },
      { what: "Speaker and guest flyers", n: 10, each: 75 },
      { what: "Countdown flyers, feed and status sizes", n: 14, each: 75 },
      { what: "Winners flyers", n: 50, each: 75 },
      { what: "Thank-you graphics", n: 5, each: 25 },
    ],
  },
  {
    group: "Social media graphics, 13 weeks",
    lines: [
      { what: "Still graphics, 2 a week", n: 26, each: 25 },
      { what: "Animated videos, 1 a week", n: 13, each: 100 },
    ],
  },
  {
    group: "Print designs for the venue",
    lines: [
      { what: "Backdrops", n: 4, each: 300 },
      { what: "Pull up banners", n: 4, each: 100 },
      { what: "Flags", n: 3, each: 200 },
      { what: "Invitations, tickets and name tags", n: 1, each: 1000 },
      { what: "Certificate design", n: 1, each: 500 },
      { what: "Winners’ certificates", n: 50, each: 50 },
      { what: "Programme, up to 8 pages", n: 1, each: 400 },
    ],
  },
  {
    group: "Video and screens for the night",
    lines: [
      { what: "Event opener and promo videos", n: 2, each: 500 },
      { what: "Stage screen visuals", n: 3, each: 400 },
      { what: "Lower thirds", n: 10, each: 75 },
      { what: "Live stream graphics", n: 1, each: 400 },
    ],
  },
];

/** A separate offer: two more websites, built like the awards site, paid in full upfront. */
const SITES: Group = {
  group: "Two more websites",
  lines: [
    { what: "Ghana Energy Awards website, design and build", n: 1, each: 2750 },
    { what: "Ghana Industrialisation Week website, design and build", n: 1, each: 2750 },
  ],
};

const amount = (l: Line) => l.n * l.each;
const sum = (lines: Line[]) => lines.reduce((n, l) => n + amount(l), 0);
const CAMPAIGN = GROUPS.reduce((n, g) => n + sum(g.lines), 0);
const WEBSITES = sum(SITES.lines);

/** The campaign in three payments (user, 2026-11-01). The last is whatever is left. */
const BEFORE_START = 10000;
const BEFORE_NIGHT = 5000;
const AFTER_NIGHT = CAMPAIGN - BEFORE_START - BEFORE_NIGHT;

/** Whole cedis bare, anything else to the pesewa: GHS 15, GHS 13,862.50. */
const ghs = (n: number) =>
  `GHS ${n.toLocaleString("en-GB", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const cedis = (n: number) => n.toLocaleString("en-GB");

/* ── Who does what ──────────────────────────────────────────────────── */

const WE_DO = [
  "The brand and social media templates",
  "Design and build of the awards website",
  "Every flyer design",
  "Graphics and animations from the content you send",
  "Print designs for the venue",
  "Videos and screens for the night",
];

const YOU_DO = [
  "Sending us the words and photos for each post",
  "All posting on social media",
  "The domain name and hosting, bought and paid for by you",
  "Nominations and voting, on your own voting system",
  "Joining your voting system to the website",
  "Press releases",
  "The launch film, reels and highlights, by your videographer",
];

const CONTACTS = [
  ["WhatsApp", "050 988 6584"],
  ["Phone", "+233 59 212 3054"],
  ["Email", "hello@saharabasetech.com"],
];

/* ── Diagrams ───────────────────────────────────────────────────────── */

/** A cover value in one left-aligned column, as on the proposal. */
function CoverValue({ children }: { children: React.ReactNode }) {
  return <span className="block sm:w-[26rem] sm:text-left">{children}</span>;
}

/** One part of the work: its lines, how many of each, then its subtotal. */
function GroupTable({ g }: { g: Group }) {
  return (
    <div className="avoid-break overflow-x-auto">
      <table className="doc-table min-w-[26rem] table-fixed">
        <thead>
          <tr>
            <th>{g.group}</th>
            <th className="w-[6rem] text-right">How many</th>
            <th className="w-[6.5rem] text-right">GHS</th>
          </tr>
        </thead>
        <tbody>
          {g.lines.map((l) => (
            <tr key={l.what}>
              <td>{l.what}</td>
              <td className="text-right tabular-nums">{cedis(l.n)}</td>
              <td className="text-right tabular-nums">{cedis(amount(l))}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} className="font-bold text-[var(--doc-ink)]">
              Subtotal
            </td>
            <td className="text-right font-bold text-[var(--doc-ink)] tabular-nums">
              {cedis(sum(g.lines))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Our list on the dark, theirs on the light, side by side. */
function TwoSides() {
  return (
    <div className="avoid-break mt-6 grid gap-3 sm:grid-cols-2">
      <div className={cn("rounded-[var(--doc-r-panel)] p-6", TONE.ours)}>
        <p className={cn("font-bold", SM, INK)}>We do</p>
        <DotList items={WE_DO} className="mt-3" />
      </div>
      <div className={cn("rounded-[var(--doc-r-panel)] p-6", TONE.yoursLight)}>
        <p className={cn("font-bold", SM, INK)}>Your team does</p>
        <DotList items={YOU_DO} className="mt-3" />
      </div>
    </div>
  );
}

/**
 * Ghana Student Awards: the fee for the awards campaign and two more websites, line by line.
 *
 * Decisions worth remembering:
 *
 *  - On 2026-10-31 the client said the proposal's fee was more than they could match. The first
 *    draft of this sheet offered two options. On 2026-11-01 the user set every count and price
 *    on a cuts page and asked for one plain sheet instead.
 *  - Graphics, print, video and the website's design and build are ours. Voting, all posting,
 *    press, the longer videos, and the domain and hosting bills are the client's. The client
 *    sends the words and photos for each post, and we send back the graphics (user, 2026-11-01).
 *  - How many and the line amount show. The price of one does not, so the sheet reads as what
 *    the money buys rather than a rate card.
 *  - The Ghana Energy Awards and Ghana Industrialisation Week websites are a separate offer at
 *    the end, GHS 5,500 for both, on one condition: the full amount is paid upfront. The
 *    campaign keeps its own figure and its own payments (user, 2026-11-01).
 *  - The campaign is paid GHS 10,000 before work starts, GHS 5,000 before the awards night, and the
 *    rest within 4 weeks after the night (user, 2026-11-01).
 *    Both sites are built at the same time and delivered together.
 *  - If the cuts page changes, change `GROUPS` by hand.
 */
export function GsaFeeBreakdown({ record }: { record: DocumentRecord }) {
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
              label="What this is"
              value={
                <CoverValue>
                  Our fee for the awards campaign, line by line. It replaces the fee in our proposal
                  PRO-GSA-62. A separate offer for two more websites comes at the end.
                </CoverValue>
              }
            />
            <DetailRow
              label="The awards campaign"
              value={
                <CoverValue>
                  <strong>{ghs(CAMPAIGN)}</strong>
                </CoverValue>
              }
            />
            <DetailRow
              label="Two more websites"
              value={<CoverValue>{ghs(WEBSITES)}, paid in full upfront</CoverValue>}
            />
          </DetailList>
        </div>
      </Section>

      {/* ── Opening ─────────────────────────────────────────────── */}
      <Section className="mb-16">
        <Lead>Here is the work, and what each part costs.</Lead>
        <P className="mt-6">
          We design the graphics and the videos for the night. We also design and build the awards
          website.
        </P>
        <P className="mt-3">
          We do not post on social media. Your team sends us the words and photos, we send back the
          graphics, and your team posts them.
        </P>
        <P className="mt-3">
          Each count is the most we make within the fee. Extra pieces, and changes to the website
          after launch, are billed one by one.
        </P>
      </Section>

      {/* 01 The fee */}
      <Part>
        <div className="avoid-break">
          <Head n={1}>The work and the fee</Head>
        </div>
        <div className="mt-6 space-y-4">
          {GROUPS.map((g) => (
            <GroupTable key={g.group} g={g} />
          ))}
        </div>
        <Panel tone="quiet" className="avoid-break mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <p className={cn("font-bold", SM, INK)}>The awards campaign</p>
            <p className={cn("font-bold tabular-nums", SM, INK)}>{ghs(CAMPAIGN)}</p>
          </div>
        </Panel>
      </Part>

      {/* 02 Who does what */}
      <Part>
        <div className="avoid-break">
          <Head n={2}>Who does what</Head>
          <TwoSides />
        </div>
      </Part>

      {/* 03 How you pay */}
      <Part>
        <div className="avoid-break">
          <Head n={3}>How you pay for the campaign</Head>
          <div className="mt-5">
            <DetailList>
              <DetailRow label="Before work starts" value={ghs(BEFORE_START)} />
              <DetailRow label="Before the awards night" value={ghs(BEFORE_NIGHT)} />
              <DetailRow
                label="The rest, within 4 weeks after the awards night"
                value={ghs(AFTER_NIGHT)}
              />
            </DetailList>
          </div>
        </div>
        <Note className="mt-4">Payment dates are open to discussion.</Note>
      </Part>

      {/* 04 A separate offer */}
      <Part>
        <div className="avoid-break">
          <Head n={4}>A separate offer: two more websites</Head>
          <P className="mt-4">
            We will also design and build websites for the Ghana Energy Awards and the Ghana
            Industrialisation Week. Each is built the same way as the awards website, with plain
            pages.
          </P>
          <P className="mt-3">
            We work on both websites at the same time and deliver them together.
          </P>
          <P className="mt-3">Your team pays for each one&rsquo;s domain name and hosting.</P>
        </div>
        <div className="mt-6">
          <GroupTable g={SITES} />
        </div>
        <Panel tone="quiet" className="avoid-break mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <p className={cn("font-bold", SM, INK)}>Both websites</p>
            <p className={cn("font-bold tabular-nums", SM, INK)}>{ghs(WEBSITES)}</p>
          </div>
          <Note className="mt-2">
            On one condition: the full {ghs(WEBSITES)} is paid upfront, before work starts.
          </Note>
        </Panel>
      </Part>

      {/* Next steps */}
      <Section avoidBreak>
        <Panel tone="ink">
          <Heading size="h2" className="font-bold">
            What happens next
          </Heading>
          <P className="mt-4">
            Once the first {ghs(BEFORE_START)} is paid, we start on your brand. The two websites
            start once their full fee is paid.
          </P>
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
