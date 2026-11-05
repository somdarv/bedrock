import { cn } from "@/lib/utils";
import { type DocumentRecord } from "@/lib/documents/registry";
import { ContractSignatures } from "./contract-signing";
import { DocumentFooter } from "./document-footer";
import {
  DetailList,
  DetailRow,
  Heading,
  Lead,
  Letterhead,
  P,
  Panel,
  Section,
  VerifyLine,
} from "./doc-ui";
import { BODY, DotList, Head, INK, SM, Steps, TONE, XS, type Step } from "./plan-ui";

/* ── Figures ────────────────────────────────────────────────────────── */

/** One payment, in full, two months after the issue date (user, 2026-11-05). */
const FEE = "GHS 7,000";
const FEE_WORDS = "seven thousand Ghana cedis";
const PAY_BY = "5 January 2027";

/* ── The work ───────────────────────────────────────────────────────── */

/**
 * The counts from the fee sheet BIL-GSA-63. The line amounts are gone, because the fee changed
 * from GHS 27,725 to GHS 7,000 on 2026-11-05 and those amounts no longer add up to it.
 */
type Line = { what: string; n: number };
type Group = { group: string; lines: Line[] };

const WORK: Group[] = [
  {
    group: "Brand",
    lines: [
      { what: "Brand identity: logo, colours, fonts and a short guide", n: 1 },
      { what: "Social media templates", n: 1 },
    ],
  },
  {
    group: "Website",
    lines: [
      {
        what: "Website with 8 plain pages: Home, About, Categories, How to nominate and vote, The night, Sponsors, News, Contact",
        n: 1,
      },
    ],
  },
  {
    group: "Campaign graphics",
    lines: [
      { what: "Launch teasers", n: 4 },
      { what: "Call for nominations flyers", n: 8 },
      { what: "Nominee flyers", n: 250 },
      { what: "Speaker and guest flyers", n: 10 },
      { what: "Countdown flyers, feed and status sizes", n: 14 },
      { what: "Winners flyers", n: 50 },
      { what: "Thank-you graphics", n: 5 },
    ],
  },
  {
    group: "Social media, 13 weeks",
    lines: [
      { what: "Still graphics, 2 a week", n: 26 },
      { what: "Animated videos, 1 a week", n: 13 },
    ],
  },
  {
    group: "Print designs for the venue",
    lines: [
      { what: "Backdrops", n: 4 },
      { what: "Pull up banners", n: 4 },
      { what: "Flags", n: 3 },
      { what: "Invitations, tickets and name tags, one design set", n: 1 },
      { what: "Certificate design", n: 1 },
      { what: "Winners’ certificates", n: 50 },
      { what: "Programme, up to 8 pages", n: 1 },
    ],
  },
  {
    group: "Video and screens",
    lines: [
      { what: "Opener and promo videos", n: 2 },
      { what: "Stage screen visuals", n: 3 },
      { what: "Lower thirds", n: 10 },
      { what: "Live stream graphics, one set", n: 1 },
    ],
  },
];

const WE_DO = [
  "The brand and social media templates",
  "Design and build of the awards website",
  "Every flyer design",
  "Graphics and animations from the content you send",
  "Print designs for the venue",
  "Videos and screens for the night",
];

const YOU_DO = [
  "Every piece of information we ask for",
  "All posting on social media",
  "Nominations and voting, on your own voting system",
  "Joining your voting system to the website, by your engineers",
  "The domain name and hosting, bought and paid for by you",
  "Printing, and what it costs",
  "Press releases",
  "The launch film, reels and highlights, by your videographer",
];

/* ── Dates ──────────────────────────────────────────────────────────── */

const YOU_SEND: [string, string][] = [
  [
    "Logo and colours. Sponsors and partners.",
    "1 week after you sign. No design starts before this.",
  ],
  [
    "Website template, domain name, hosting, logins and your voting engineer’s contact.",
    "2 weeks after you sign",
  ],
  ["All categories, all campaign dates and how voting works.", "2 weeks after you sign"],
  [
    "One full list of nominees, with a clear photo of each, taken from your voting system.",
    "1 week before voting opens",
  ],
  ["Each week’s words and pictures.", "1 week before that week starts"],
  [
    "Speakers, print sizes, name tags, programme, screen size and video clips.",
    "3 weeks before the awards night",
  ],
  ["Winners list, signers’ names and their signatures.", "1 week before the awards night"],
  ["Photos from the night, and the names to thank.", "1 week after the awards night"],
];

const WE_SEND: [string, string][] = [
  ["Your private link, the templates and the sample week.", "3 days after you sign"],
  ["The first brand designs.", "2 weeks after your part is complete"],
  ["The website, for you to check.", "3 weeks after your part is complete"],
  ["Nominee flyers.", "1 week after the full list is complete"],
  ["Each week’s graphics.", "2 days after that week’s part is complete"],
  ["Print designs, videos and screens for the night.", "1 week before the awards night"],
  ["Certificates and winners flyers.", "Before the awards night"],
];

const IF_THEN: [string, string][] = [
  [
    "Something comes late",
    "Our date moves by at least the same number of days. If the moment for that piece has passed, we may not make it.",
  ],
  [
    "Something is incomplete",
    "We do not start that piece. We tell you what is missing. Our time starts when it is complete.",
  ],
  [
    "Information changes after we start",
    "This is new work. We tell you the price and the new date first. We start when you agree in writing.",
  ],
  ["A detail you sent or approved is wrong", "You pay for the fix, and for any reprint."],
  ["A new sponsor or partner comes after the list closes", "We do not add them to any design."],
];

const HOW_IT_RUNS: Step[] = [
  { tone: "yours", title: "You accept and sign this contract" },
  { tone: "ours", title: "We send your private link" },
  { tone: "yours", title: "You send each part, complete and on time" },
  { tone: "ours", title: "We make the work, and you approve it" },
];

/* ── Parts of the page ──────────────────────────────────────────────── */

/** A contract's tables run long, so their rows sit closer than the fee sheet's. */
const TIGHT = "[&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3 [&_th]:py-2";

/**
 * Numbered clauses, 3.1, 3.2 and so on, so either side can point at one line in a message. Each
 * clause is a list item, which the print styles keep whole across a page break.
 */
function Clauses({
  part,
  from = 1,
  items,
  className,
}: {
  part: number;
  from?: number;
  items: React.ReactNode[];
  className?: string;
}) {
  return (
    <ol className={cn("mt-5 space-y-3", className)}>
      {items.map((item, i) => (
        <li key={i} className={cn("flex gap-3 sm:gap-4", SM, BODY)}>
          <span className="w-9 shrink-0 font-semibold text-[var(--doc-ink-soft)] tabular-nums sm:w-10">
            {part}.{from + i}
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function ContractPart({
  n,
  title,
  hold,
  children,
}: {
  n: number;
  title: string;
  /** Printed on the same page as the heading, so a heading never sits alone at a page's foot. */
  hold?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Section className="mb-10">
      <div className="avoid-break">
        <Head n={n}>{title}</Head>
        {hold}
      </div>
      {children}
    </Section>
  );
}

function WorkTable({ g }: { g: Group }) {
  return (
    <div className="avoid-break">
      <table className={cn("doc-table table-fixed", TIGHT)}>
        <thead>
          <tr>
            <th>{g.group}</th>
            <th className="w-[4rem] text-right whitespace-nowrap">Up to</th>
          </tr>
        </thead>
        <tbody>
          {g.lines.map((l) => (
            <tr key={l.what}>
              <td>{l.what}</td>
              <td className="text-right tabular-nums">{l.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TwoColumnTable({
  left,
  right,
  rows,
  strongFirst,
  leftWidth = "w-[56%]",
}: {
  left: string;
  right: string;
  rows: [string, string][];
  strongFirst?: boolean;
  leftWidth?: string;
}) {
  return (
    <div className="avoid-break">
      <table className={cn("doc-table table-fixed", TIGHT)}>
        <thead>
          <tr>
            <th className={leftWidth}>{left}</th>
            <th>{right}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <td className={strongFirst ? "font-semibold text-[var(--doc-ink)]" : undefined}>
                {a}
              </td>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Ghana Student Awards: the contract, which the client signs before the needs list goes out.
 *
 * Decisions worth remembering:
 *
 *  - 2026-11-05, the user's terms: we are only the tools. The client gives everything we ask for,
 *    clear and organised, on our templates or through the needs list. The fee is GHS 7,000, paid
 *    once in full, two months from now. Nominations and voting run on the client's own system,
 *    and their engineers join it to the website. Late, incomplete or changed information means we
 *    cannot deliver. Both sides agree to be organised, forthcoming and on time.
 *  - 2026-11-04, the user's term: the sponsor and partner list closes before designs start.
 *  - Every count stays as the client accepted it on BIL-GSA-63. Only the fee changed.
 *  - Very simple English, like the needs list. The client's contact reads short sentences best.
 *  - Numbered clauses, so anyone can point at 6.2 in a WhatsApp message.
 *  - Signed online, from a private link at /c/{token}: one person types a name and phone number
 *    and accepts it for Evergreen (user, 2026-11-05). See `contract-signing.tsx`. Once it has been
 *    accepted, leave these words alone. A change after that needs a new contract.
 *  - No Valid Until. The hub marks a document expired after that date, and a contract does not
 *    lapse that way. It runs from signing until the work is delivered and the fee is paid.
 */
export function GsaContract({ record }: { record: DocumentRecord }) {
  return (
    <>
      <VerifyLine record={record} />
      <Letterhead record={record} />
      <div className="[&_p]:text-pretty">
        {/* ── Cover ───────────────────────────────────────────────── */}
        <Section>
          <Heading size="h2">Contract for the Ghana Student Awards Campaign</Heading>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className={cn("rounded-[var(--doc-r-panel)] p-6", TONE.ours)}>
              <p className={cn("font-bold", SM, INK)}>Saharabase Technologies</p>
              <p className={cn("mt-2", XS, BODY)}>17 Alhaji Sulley Road, Abelemkpe, Accra.</p>
              <p className={cn("mt-1", XS, BODY)}>
                In this contract, &ldquo;we&rdquo; and &ldquo;us&rdquo;.
              </p>
            </div>
            <div className={cn("rounded-[var(--doc-r-panel)] p-6", TONE.yoursLight)}>
              <p className={cn("font-bold", SM, INK)}>Evergreen Events &amp; Production</p>
              <p className={cn("mt-2", XS, BODY)}>Organisers of the Ghana Student Awards.</p>
              <p className={cn("mt-1", XS, BODY)}>In this contract, &ldquo;you&rdquo;.</p>
            </div>
          </div>

          <div className="mt-6">
            <DetailList>
              <DetailRow
                label="The fee"
                value={
                  <span className="block sm:w-[26rem] sm:text-left">
                    <strong>{FEE}</strong>, paid once and in full by {PAY_BY}
                  </span>
                }
              />
              <DetailRow
                label="The work"
                value={
                  <span className="block sm:w-[26rem] sm:text-left">
                    Brand, website, graphics, print designs and videos
                  </span>
                }
              />
              <DetailRow
                label="Voting"
                value={
                  <span className="block sm:w-[26rem] sm:text-left">
                    Your system. Your engineers join it to the website.
                  </span>
                }
              />
            </DetailList>
          </div>
        </Section>

        {/* ── Opening ─────────────────────────────────────────────── */}
        <Section className="mb-10">
          <Lead>
            You run the awards. We are the tools that make its designs, videos and website.
          </Lead>
          <P className="mt-4">
            We can only deliver what you give us, when you give it. So this contract holds both of
            us to one standard: organised, forthcoming and on time.
          </P>
        </Section>

        <ContractPart n={1} title="Our roles">
          <Clauses
            part={1}
            items={[
              "You run the Ghana Student Awards. You decide the categories, nominees, judges, winners, venue and dates.",
              "We design and build what Part 2 lists. We work from what you give us.",
              "We do not post on your pages. We do not speak for the awards.",
              "Each of us will be organised, forthcoming and on time.",
            ]}
          />
        </ContractPart>

        <ContractPart
          n={2}
          title="The work"
          hold={
            <>
              <P className="mt-4">Each number is the most we make for the fee.</P>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[WORK.slice(0, 3), WORK.slice(3)].map((column) => (
                  <div key={column[0].group} className="space-y-4">
                    {column.map((g) => (
                      <WorkTable key={g.group} g={g} />
                    ))}
                  </div>
                ))}
              </div>
            </>
          }
        />

        <ContractPart
          n={3}
          title="Who does what"
          hold={
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className={cn("rounded-[var(--doc-r-panel)] p-6", TONE.ours)}>
                <p className={cn("font-bold", SM, INK)}>We do</p>
                <DotList items={WE_DO} className="mt-3" />
              </div>
              <div className={cn("rounded-[var(--doc-r-panel)] p-6", TONE.yoursLight)}>
                <p className={cn("font-bold", SM, INK)}>You do</p>
                <DotList items={YOU_DO} className="mt-3" />
              </div>
            </div>
          }
        >
          <Clauses
            part={3}
            items={[
              "Anything not listed in this contract is outside the fee. We can price it for you.",
              "The websites for the Ghana Energy Awards and the Ghana Industrialisation Week are not part of this contract. They stay a separate offer.",
            ]}
          />
        </ContractPart>

        <ContractPart
          n={4}
          title="What you give us, and how"
          hold={<Steps steps={HOW_IT_RUNS} className="mt-5" />}
        >
          <Clauses
            part={4}
            items={[
              "You give us everything we ask for. We cannot make a piece until we have what it needs.",
              <>
                After you sign, we send you a private link called{" "}
                <strong>What we need from you</strong>. It lists everything, part by part. We also
                send templates to fill in.
              </>,
              "Everything comes through that link or on our templates. It comes clear, organised and in one piece.",
              "Scattered WhatsApp messages and voice notes do not count as received.",
              "A part is complete when every question is answered, every name is spelled correctly, logos are real logo files and photos are clear.",
              "Logins are the one exception. Send them privately on WhatsApp, and never type them on a form.",
              "The person who accepts this contract speaks for you. We act only on that person’s answers and approvals, unless they name someone else in writing.",
              "The full list of sponsors, partners and partner schools comes before designs start. After that, the list is closed.",
            ]}
          />
        </ContractPart>

        <ContractPart
          n={5}
          title="When things must come"
          hold={
            <>
              <P className="mt-4">
                Things come ahead of time. These are the latest dates, and they hold on both sides.
                Our time starts when your part is complete.
              </P>
              <div className="mt-5">
                <TwoColumnTable left="You send" right="By when" rows={YOU_SEND} />
              </div>
            </>
          }
        >
          <div className="mt-4">
            <TwoColumnTable left="We send" right="By when" rows={WE_SEND} leftWidth="w-[48%]" />
          </div>
          <Clauses
            part={5}
            items={[
              "You set the campaign dates and the date of the awards night. Once set, moving one is a change under Part 6.",
              "If either of us sees that a date is in danger, we tell the other that same day.",
            ]}
          />
        </ContractPart>

        <ContractPart
          n={6}
          title="Late, incomplete or changed information"
          hold={
            <>
              <P className="mt-4">
                We cannot deliver with things coming late or information changing. We cannot work
                with incomplete information. So this is what happens.
              </P>
              <div className="mt-5">
                <TwoColumnTable
                  left="If"
                  right="Then"
                  rows={IF_THEN}
                  strongFirst
                  leftWidth="w-[36%]"
                />
              </div>
            </>
          }
        >
          <Clauses
            part={6}
            items={[
              "The fee stays the same when any of these happens. So does the payment date.",
              "We are not responsible for a date missed for any of these reasons.",
            ]}
          />
        </ContractPart>

        <ContractPart n={7} title="Approvals and changes">
          <Clauses
            part={7}
            items={[
              "You approve on your project page, on WhatsApp or by email. A phone call or voice note is not an approval.",
              "You reply within 2 working days. A piece waits until you reply, and our date moves.",
              "Each design includes 2 rounds of changes. One round is one list, with all the changes together.",
              "Your approval means you have checked every name and detail. After that, the piece is final, and any change is billed.",
              "Extra pieces above the numbers in Part 2 are billed one by one. So are changes to the website after launch.",
              "We tell you the price before we do billed work.",
              "If we make a mistake against what you sent, we fix it free.",
            ]}
          />
        </ContractPart>

        <ContractPart n={8} title="Voting">
          <Clauses
            part={8}
            items={[
              "The voting system is yours. Nominations, nominee details and photos, votes, the count, the results and the vote money all run on it.",
              "We do not build, run or check your voting system.",
              "Your engineers join it to the website. You connect us to them within 2 weeks after you sign.",
              "Your engineers give us the links and instructions. We give them the website details they need.",
              "Both teams test the join before voting opens.",
              "If your engineers are late, the website goes live without voting. We add the join when they are ready.",
            ]}
          />
        </ContractPart>

        <ContractPart n={9} title="The fee and payment">
          <Panel tone="quiet" className="avoid-break mt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className={cn("font-bold", SM, INK)}>One full payment by {PAY_BY}</p>
              <p className={cn("font-bold tabular-nums", SM, INK)}>{FEE}</p>
            </div>
          </Panel>
          <Clauses
            part={9}
            items={[
              `The fee for all the work in Part 2 is ${FEE} (${FEE_WORDS}).`,
              `You pay it once, in full, by ${PAY_BY}. There is no deposit.`,
              "We send you an invoice with the payment details before that date.",
              "The date is fixed. It does not move if your information comes late or the awards night moves.",
              "If the fee is not paid by that date, we stop all work until it is paid. Our dates then move by the same number of days.",
              "The fee does not cover what Part 3 lists as yours.",
            ]}
          />
        </ContractPart>

        <ContractPart n={10} title="Ownership and permission">
          <Clauses
            part={10}
            items={[
              "When you have paid in full, the final designs, logo, videos and website are yours. Until then, they stay ours, and you may use them for this campaign.",
              "Our working files stay with us, unless we agree otherwise.",
              "We may show the finished work as an example of what we do.",
              "You confirm that you may use everything you send us: photos, logos, music, names and words.",
              "You confirm that nominees and guests have agreed to the use of their names and photos.",
              "We each keep the other’s private details private. We use your logins only for this work.",
            ]}
          />
        </ContractPart>

        <ContractPart n={11} title="Limits">
          <Clauses
            part={11}
            items={[
              "We are not responsible for your voting system, the count or the results.",
              "We are not responsible for domain or hosting companies, printers or social media platforms.",
              "We do not promise a number of votes, guests, sponsors or sales.",
              "Our total responsibility under this contract is never more than the fee you have paid.",
              "Neither of us is at fault for a delay caused by something beyond our control, such as a flood or a national network failure. We tell each other at once.",
            ]}
          />
        </ContractPart>

        <ContractPart n={12} title="Start and end">
          <Clauses
            part={12}
            items={[
              "This contract starts on the day you accept and sign it. It ends when the work is delivered and the fee is paid.",
              "If you end it early, or the awards are cancelled, the full fee stays due.",
              "If a part is still missing 14 days after its date, we may pause the work. After 30 days paused, we may end this contract, and the full fee stays due.",
              "If we fail to do our part after you have sent yours, write to us. If we do not put it right within 14 days, you may end this contract and pay only for the pieces we delivered.",
            ]}
          />
        </ContractPart>

        <ContractPart n={13} title="General">
          <Clauses
            part={13}
            items={[
              "This contract replaces everything agreed before on the awards campaign. That includes our proposal PRO-GSA-62 and the campaign part of our fee sheet BIL-GSA-63.",
              "Accepting this contract online, with a typed name and phone number, counts as signing it.",
              "A change to this contract counts only when it is in writing and both of us have agreed to it.",
              "The laws of Ghana apply to this contract.",
              "If we disagree, we talk first. If that does not settle it within 14 days, we go to a mediator in Accra. After that, either of us may go to the courts of Ghana.",
            ]}
          />
        </ContractPart>

        <ContractSignatures
          record={record}
          party="Evergreen Events & Production"
          signer={{ name: "Richard Somda", title: "Creative Director" }}
        />

        <DocumentFooter record={record} />
      </div>
    </>
  );
}
