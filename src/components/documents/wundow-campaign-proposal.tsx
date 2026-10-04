import { type DocumentRecord } from "@/lib/documents/registry";
import { DocumentFooter } from "./document-footer";
import {
  Bullet,
  BulletList,
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

/** Every piece of campaign work goes round this loop. */
const LOOP = [
  "You share the information and plan for each piece.",
  "We make the first designs from what you give us.",
  "You give your input, and we revise until it suits your intent and purpose.",
  "Nothing goes out until you say yes.",
];

/**
 * Wundow Salifu Abraham Mangariba, aspiring NDC Regional Secretary for the North East.
 * Digital marketing, visual branding and web services for his campaign, introduced by
 * Robert Kampi Laari.
 *
 * The words are the user's own. They drafted this as a letter, edited it to final, and
 * asked for it on the standard proposal sheet. Change the copy only when asked.
 *
 * Decisions worth remembering:
 *
 *  - It opens on a test he can run himself: Google your name. Web services is the answer
 *    to that test, and the letter points down to it.
 *  - The campaign film (hub package "Wundow S A Mangariba Video Work", GHS 500) was fully
 *    discounted as a gift. The letter says so without naming the figure. Keep it that way.
 *  - No prices for the campaign work. It offers a generous discount and a quote on request.
 *  - We carry his campaign strategy. We do not write it.
 *  - It reads as a letter on purpose: Dear Sir at the top, signed by Richard Somda.
 */
export function WundowCampaignProposal({ record }: { record: DocumentRecord }) {
  return (
    <>
      <VerifyLine record={record} />
      <Letterhead record={record} />

      {/* Prepared For */}
      <Section>
        <Eyebrow>Prepared For</Eyebrow>
        <Heading size="h2" className="mt-3">
          Wundow Salifu Abraham Mangariba
        </Heading>

        <div className="mt-6">
          <DetailList>
            <DetailRow
              label="What we are offering"
              value="Digital marketing, visual branding and web services"
            />
            <DetailRow label="Your campaign film" value="Ready, and fully discounted" />
            <DetailRow label="This offer holds for" value="21 days from the date above" />
          </DetailList>
        </div>
      </Section>

      {/* Opening */}
      <Section>
        <P>Dear Sir,</P>
        <Panel tone="quiet" className="mt-6">
          <Lead>
            Before you read on, try one thing:{" "}
            <strong className="text-[var(--doc-ink)]">Google your name and see what comes up.</strong>{" "}
            If the results are thin, out of date or not about you,{" "}
            <strong className="text-[var(--doc-ink)]">that is a problem we can fix.</strong> We
            explain how under Web services, further down this letter.
          </Lead>
        </Panel>
      </Section>

      {/* The film */}
      <Section>
        <Heading>Your film is ready</Heading>
        <P className="mt-4">
          Our good friend asked us to make a film from your campaign song, and it&rsquo;s here in
          this folder.
        </P>
        <BulletList className="mt-5">
          <Bullet>
            <strong>One full film</strong> of 4 minutes 36 seconds.
          </Bullet>
          <Bullet>
            <strong>Seven short clips</strong> for WhatsApp, Facebook and TikTok.
          </Bullet>
        </BulletList>
        <P className="mt-5">
          Every clip ends with <strong>your name</strong> and the word <strong>VOTE.</strong>
        </P>
      </Section>

      {/* The gift */}
      <Section avoidBreak>
        <Panel tone="strong">
          <Heading size="h2">We value relationships</Heading>
          <P className="mt-5">
            Because of our good relationship with Robert, we have fully discounted this work and
            added a few purpose-driven shorts to go with it. We value relationships above all else,
            so <strong>we give first.</strong>
          </P>
        </Panel>
      </Section>

      {/* Who we are */}
      <Section>
        <Heading>Who we are</Heading>
        <P className="mt-4">
          We are Saharabase Technologies, a digital solutions and strategy company. We{" "}
          <strong>work with personal brands</strong>, small businesses and institutions to tell
          their story and reach the people who matter to them.
        </P>
      </Section>

      {/* What we offer */}
      <Section>
        <Heading>How we can help your campaign</Heading>
        <P className="mt-4">
          A friend of our friend is our friend too, so we would like to offer our support. Our aim
          is simple:{" "}
          <strong>make your brand recognisable and consistent everywhere voters meet it.</strong>
        </P>
        <BulletList className="mt-6">
          <Bullet>
            <strong>Digital marketing strategy:</strong> one clear message, a steady posting plan
            for your social channels, and content that keeps your name in front of voters through to
            election day.
          </Bullet>
          <Bullet>
            <strong>Visual branding:</strong> one set of colours, fonts and layouts on every poster,
            post, video and banner, so people know your campaign at a glance.
          </Bullet>
          <Bullet>
            <strong>Web services:</strong> an online presence voters can find and trust, and an easy
            way for supporters to reach and join your campaign.{" "}
            <strong>When people Google your name</strong>, the <strong>right story</strong> about{" "}
            <strong>you</strong> shows up <strong>first.</strong>
          </Bullet>
        </BulletList>

        <P className="mt-6">
          We will follow your broader campaign strategy and guide. Our part is the visuals people
          see, from flyers and posters to video edits, including:
        </P>
        <ul className="mt-4 pl-1 sm:columns-2 sm:gap-10">
          {[
            "Posters and flyers",
            "Social media posts",
            "Short videos",
            "Banners, T-shirts and stickers",
            "A campaign website",
          ].map((item) => (
            <li
              key={item}
              className="mb-2 flex break-inside-avoid gap-3 text-[length:var(--doc-t-body)] leading-[1.7] text-[var(--doc-ink-body)]"
            >
              <span className="flex h-[1.7em] w-2.5 shrink-0 items-center justify-center" aria-hidden>
                <span className="h-[5px] w-[5px] rounded-full bg-[var(--doc-ink-soft)]" />
              </span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>

        <Panel tone="quiet" className="mt-7">
          <P>
            Your posters have good words: Integrity, Experience, Humility. Right now each poster
            looks different. We will give <strong>them one look.</strong> Then people will{" "}
            <strong>know your posts at once.</strong>
          </P>
        </Panel>
      </Section>

      {/* How we work */}
      <Section avoidBreak>
        <Heading>How we work</Heading>
        <P className="mt-4">
          We are very collaborative. Every piece goes through the same simple loop:
        </P>
        <ol className="mt-5 space-y-3">
          {LOOP.map((step, i) => (
            <li
              key={step}
              className="flex gap-3 text-[length:var(--doc-t-body)] leading-[1.7] text-[var(--doc-ink-body)]"
            >
              <span className="w-4 shrink-0 font-semibold text-[var(--doc-ink-soft)] tabular-nums">
                {i + 1}.
              </span>
              <span className="min-w-0">{step}</span>
            </li>
          ))}
        </ol>
        <P className="mt-5">We keep your plans private.</P>
      </Section>

      {/* Next steps */}
      <Section avoidBreak>
        <Panel tone="ink">
          <Heading size="h2">Let us talk</Heading>
          <P className="mt-5">
            Tell Robert, or call us. In solidarity with your campaign, and in good faith as we begin
            this relationship through our mutual friend Robert, we are glad to offer you a generous
            discount. Share what you need, and we will prepare a quote that works for you.
          </P>
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
        <P>We wish you well.</P>
        <p className="mt-8 text-[length:var(--doc-t-body)] font-semibold text-[var(--doc-ink)]">
          Richard Somda, Creative Director
        </p>
        <Note className="mt-1">Saharabase Technologies</Note>
      </Section>

      <DocumentFooter record={record} />
    </>
  );
}
