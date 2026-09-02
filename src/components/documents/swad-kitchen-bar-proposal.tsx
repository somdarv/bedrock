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

/** The appendix inventory. Hand-authored, grouped the way the business is run. */
const MODULES: { name: string; items: string[] }[] = [
  {
    name: "The till",
    items: [
      "Touch till with your own menu, categories and sizes",
      "Dine-in, takeaway, pickup and delivery on the same screen",
      "Open tabs held against a table or a name",
      "Cash, Mobile Money, card, and comped orders recorded as comped",
      "Printed receipt on the original, reprints tracked separately",
      "Four-digit PIN per cashier, sessions that expire on their own",
      "Every sale carries the name of who rang it up",
      "Items grey out at the till the moment the stock behind them runs out",
    ],
  },
  {
    name: "The kitchen and the pass",
    items: [
      "Kitchen display board, tickets moving through accept, preparing and ready",
      "Audible alert on a new ticket, paced so a busy night does not drown it",
      "Per-item kitchen notes and allergy flags carried from the order",
      "Order manager for triage across the floor, the phone and online at once",
      "Timestamps on every stage, so you can see where the minutes went",
      "Items that need no preparation routed straight past the kitchen",
    ],
  },
  {
    name: "The bar and the store",
    items: [
      "One catalogue of everything you buy, in the units you buy it in",
      "Recipes down to the measure, so a double deducts twice a single",
      "Every sale moves the stock at the outlet that sold it",
      "No stock, no sale: a drink that cannot be poured cannot be rung up",
      "An override for when the ledger is wrong rather than the shelf empty, logged with a reason",
      "Blind closing counts: the counter never sees the expected figure",
      "Tonight's close is tomorrow's open, not a reset",
      "Wastage recorded one loss at a time, with a photo and a returned item above a value you set",
      "Breakage, spillage and comps separated from theft in the numbers",
      "Purchase orders, suppliers and price history",
      "Deliveries received line by line, so a bad crate is refused without refusing the delivery",
      "Transfers between the store, the kitchen and the bar, with a receiving signature",
      "Production runs for anything you make in bulk and draw down from",
      "Reorder levels set per location, not one figure for the whole business",
      "Stock counts and reconciliation cycles, counted against expected, with the difference explained",
    ],
  },
  {
    name: "Orders from outside",
    items: [
      "Your own ordering site, your menu, your prices",
      "Phone, WhatsApp and social orders entered by staff onto the same board",
      "Guest checkout, and returning customers recognised by phone number",
      "Delivery zones and fees you set, with orders outside the radius refused",
      "Live tracking from accepted to out for delivery to delivered",
      "Order codes a customer can quote and you can find in one search",
    ],
  },
  {
    name: "Money",
    items: [
      "Mobile Money collected into your account, matched to the order on its own",
      "Cash-up per shift, per cashier, with the cash figure separated out",
      "Promotions by percentage or amount, whole order or named items, with start and end dates",
      "Minimum spend, maximum discount and date windows on every promotion",
      "Daily takings by channel, by hour and by item",
      "Cost of what you sold against what you took, so margin is a number and not a feeling",
      "Every figure exportable, any day, without asking us",
    ],
  },
  {
    name: "Your people",
    items: [
      "One account per person, one role, and permissions that follow the role",
      "Separate views for the floor, the kitchen, the bar, the office and the owner",
      "Nobody approves their own paperwork",
      "Shifts with sales attributed to whoever was on",
      "Staff records, contracts, Ghana Card, SSNIT and next of kin",
      "New staff fill a joining form on a link, the office creates the account",
      "Suspension actually revokes access, on every device, immediately",
      "A live list of who is signed in right now, and the ability to sign anyone out",
      "Messages to staff in the app, with SMS fallback for anyone not logged in",
      "An audit trail of who changed what and when",
    ],
  },
];

/**
 * Swad International Kitchen & Bar, Accra. Restaurant and bar operations proposal.
 *
 * Built on the platform we already run for a seven-branch food business, set up for a
 * single outlet that runs a kitchen and a bar together and takes delivery and online
 * orders. Commercially this is a discounted build fee plus a service charge on money the
 * system collects, and a monthly care plan.
 *
 * Decisions worth remembering:
 *
 *  - Care is billed MONTHLY here, not per term. A restaurant takes money every night, so
 *    monthly matches how they actually hold cash. The school proposals bill per term for
 *    the opposite reason. Do not copy the termly cadence across.
 *  - The build fee is framed as "you are not paying us to invent it, you are paying us to
 *    set it up", which is true and is the strongest honest argument for the discount. The
 *    full build figure is stated so the discount is a number and not a claim.
 *  - The service charge applies only to money the system collects (online checkout, the
 *    MoMo prompt at the till). Never to cash in the drawer. Saying this plainly is what
 *    stops it reading as a tax on the whole business.
 *  - The emotional core is shrinkage, not convenience. A bar loses money quietly, and the
 *    honest pitch is that the stock, the till and the kitchen agree with each other by
 *    default, so a gap surfaces the same day. The document is careful never to accuse
 *    anybody's staff of stealing.
 *  - No demo link. The client asked for a walkthrough instead, so the document offers to
 *    sit with them rather than handing over a URL, and it does not name the other business.
 *  - Improvements to what they already run are free. Genuinely new modules are not
 *    promised, deliberately and silently.
 *
 * Voice: we and you, short sentences, plain words. It is asking for a long relationship,
 * and the support section is the part the client cared most about.
 */
export function SwadKitchenBarProposal({ record }: { record: DocumentRecord }) {
  return (
    <>
      <VerifyLine record={record} />
      <Letterhead record={record} />

      {/* Prepared For */}
      <Section>
        <Eyebrow>Prepared For</Eyebrow>
        <Heading size="h2" className="mt-3">
          Swad International Kitchen &amp; Bar
        </Heading>
        <Note className="mt-2">Kitchen, bar and delivery, Accra</Note>

        <div className="mt-6">
          <DetailList>
            <DetailRow
              label="What we are offering"
              value="One system to run the floor, the kitchen and the bar"
            />
            <DetailRow
              label="To build and set it up"
              value="GHS 14,500, discounted from GHS 38,000"
            />
            <DetailRow label="To keep it running" value="GHS 1,500 a month" />
            <DetailRow label="On money the system collects" value="3% service charge" />
            <DetailRow label="On cash in the drawer" value="Nothing" />
            <DetailRow label="This offer holds for" value="21 days from the date above" />
          </DetailList>
        </div>
      </Section>

      {/* Opening */}
      <Section>
        <Lead>
          A kitchen and a bar are two different businesses sharing one roof, one till and one set of
          staff. Almost everything that goes wrong in either one goes wrong quietly.
        </Lead>
        <P className="mt-5">
          A bottle walks. A crate is signed for and never makes it to the store. A plate goes out
          that nobody rang up. None of it looks like anything on the night. It turns up weeks later
          as a figure that does not match what you remember selling, and by then there is no way
          left to find out which night it happened on.
        </P>
        <P className="mt-5">
          We are not proposing to catch anybody. We are proposing a system where the stock, the till
          and the kitchen agree with each other by default, so a gap shows up the same day it
          happens, while somebody can still remember it.
        </P>
      </Section>

      {/* Credibility */}
      <Section avoidBreak>
        <Panel>
          <Eyebrow>This Is Not A Prototype</Eyebrow>
          <Heading className="mt-3">It already runs a food business every day</Heading>
          <P className="mt-5">
            We built this platform for a food business operating seven branches in Accra. It has
            been in daily use long enough that the hard parts are behind us: the busy Friday nights,
            the stock counts that did not add up, the till that had to keep working when the
            internet did not.
          </P>
          <P className="mt-4">
            What we would build for Swad is that system, set up around your menu, your bar, your
            recipes and your people. You are not the first ones to run it, and that is the point.
          </P>
          <Inset className="mt-6">
            <p className="text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink)]">
              We would rather show you than describe it
            </p>
            <Note className="mt-2">
              Give us an hour at Swad, or anywhere that suits you. We will bring it up on a screen
              and walk you through the till, the kitchen board and the bar stock, using your own
              menu if you send it ahead.
            </Note>
          </Inset>
        </Panel>
      </Section>

      {/* Promises */}
      <Section>
        <Eyebrow>Four Promises</Eyebrow>
        <Heading className="mt-3">What the system does without being asked</Heading>
        <BulletList className="mt-6">
          <Bullet>
            <strong>Every sale moves the stock.</strong> Ring up a double and the system takes two
            measures out of that bottle, at that bar, that second. Not at the end of the night. Not
            when somebody remembers to do a count.
          </Bullet>
          <Bullet>
            <strong>Nobody marks their own homework.</strong> The person who records a loss is not
            the person who approves it. The person counting the store at close cannot see what the
            system expected them to find. Those two rules do more for an honest count than any
            camera.
          </Bullet>
          <Bullet>
            <strong>It works on a bad night.</strong> The till keeps taking orders when the internet
            drops and catches up when it returns. The kitchen board does not freeze because the
            floor is busy. Nothing anybody typed is lost.
          </Bullet>
          <Bullet>
            <strong>Your numbers are yours.</strong> Every figure in it can be exported, any day,
            without asking us. That is true on your first day and on your last.
          </Bullet>
        </BulletList>
      </Section>

      {/* ── WHAT IT DOES ─────────────────────────────────────────── */}
      <Section>
        <Eyebrow>What It Does</Eyebrow>
        <Heading className="mt-3">The floor and the kitchen</Heading>
        <P className="mt-5">
          One screen for the whole service, and one board for the kitchen. Both are built for people
          moving fast with their hands full.
        </P>
        <BulletList className="mt-6">
          <Bullet>
            <strong>The till.</strong> Your menu, your categories, your sizes. Dine-in, takeaway,
            pickup and delivery all on the same screen. Tabs held against a table or a name. Cash,
            Mobile Money and card, with comped orders recorded as comped rather than quietly
            deleted. A receipt prints once as the original, and every reprint after that is marked
            as a reprint.
          </Bullet>
          <Bullet>
            <strong>Who rang it up.</strong> Every cashier has their own four-digit PIN and their
            own session. Every sale carries their name. At the end of a shift you get their takings,
            their orders and their cash figure on its own, which is what makes a cash-up honest.
          </Bullet>
          <Bullet>
            <strong>The kitchen board.</strong> Tickets appear the moment they are taken, wherever
            they came from, and move through accept, preparing and ready. There is a sound when a
            new one lands, paced so a busy night does not turn it into noise. Kitchen notes and
            allergy flags travel with the order.
          </Bullet>
          <Bullet>
            <strong>One place to see everything.</strong> The order manager shows the floor, the
            phone, WhatsApp and online in one board, so nobody has to ask which screen an order came
            in on. Every stage is timestamped, so when a table waited forty minutes you can see
            exactly where the minutes went.
          </Bullet>
        </BulletList>
      </Section>

      <Section>
        <Heading className="mt-3">The bar and the store</Heading>
        <P className="mt-5">
          This is the part built for the problem we opened with, and it is the part most systems
          sold to restaurants in Ghana do not really have.
        </P>
        <BulletList className="mt-6">
          <Bullet>
            <strong>Recipes down to the measure.</strong> Every drink and every plate is defined by
            what goes into it. A single is one measure, a double is two, a cocktail is whatever you
            say it is. Sell it and the ingredients come off the shelf at the outlet that sold it.
          </Bullet>
          <Bullet>
            <strong>No stock, no sale.</strong> If the bottle behind a drink is finished, the drink
            greys out at the till before the customer is promised it. There is an override for when
            the ledger is wrong rather than the shelf empty, it is not a cashier&rsquo;s to use, and
            every use of it records who and why.
          </Bullet>
          <Bullet>
            <strong>Blind closing counts.</strong> Whoever counts at close does not get shown what
            the system expected them to find. That single rule turns a count from a confirmation
            into a count. Tonight&rsquo;s close becomes tomorrow&rsquo;s opening figure, so nothing
            silently resets overnight.
          </Bullet>
          <Bullet>
            <strong>Losses recorded as losses.</strong> Breakage, spillage, a returned plate and a
            comp are four different things and the system keeps them four different things. Above a
            value you set, a wastage claim needs a photo and the item returned. Recording a loss and
            approving it are two different jobs held by two different people.
          </Bullet>
          <Bullet>
            <strong>Buying and receiving.</strong> Purchase orders, your suppliers, and what each of
            them charged you last time. Deliveries are received line by line, so a bad crate is
            refused on its own without holding up the rest of the delivery.
          </Bullet>
          <Bullet>
            <strong>Moving stock around.</strong> Transfers between the store, the kitchen and the
            bar, requested by one person, approved by another and signed for on receipt. Nothing
            moves on somebody&rsquo;s word.
          </Bullet>
          <Bullet>
            <strong>Counts that mean something.</strong> Reorder levels set per location rather than
            one figure for the whole business, so a full bar does not read as critical. Regular
            reconciliation cycles put counted against expected and make somebody explain the
            difference while it is still fresh.
          </Bullet>
        </BulletList>
      </Section>

      <Section>
        <Heading className="mt-3">Orders from outside, and the money</Heading>
        <BulletList className="mt-6">
          <Bullet>
            <strong>Your own ordering site.</strong> Your menu and your prices, on your own link, so
            an order placed online costs you no commission to anybody. Guests can order without an
            account, and a returning customer is recognised by their phone number.
          </Bullet>
          <Bullet>
            <strong>Phone, WhatsApp and social.</strong> Orders that come in by message or call are
            typed onto the same board as everything else, so the kitchen has one queue and you have
            one set of numbers.
          </Bullet>
          <Bullet>
            <strong>Delivery.</strong> Zones and fees you set. Orders from outside your radius are
            refused before anybody promises them. Live tracking from accepted through out for
            delivery to delivered, and an order code the customer can quote.
          </Bullet>
          <Bullet>
            <strong>Mobile Money that lands by itself.</strong> Payments come into your account and
            match themselves to the right order. Nobody sits with a phone and a notebook matching
            payments by hand at midnight.
          </Bullet>
          <Bullet>
            <strong>Promotions with an end date.</strong> Percentage or amount, whole order or named
            items, minimum spend, a cap on the discount, and a date it stops. Promotions that cannot
            expire are how a good week becomes a bad month.
          </Bullet>
          <Bullet>
            <strong>What you actually made.</strong> Takings by channel, by hour and by item, set
            against the cost of what you sold. Margin becomes a number you can look at rather than a
            feeling you have.
          </Bullet>
        </BulletList>
        <Note className="mt-6">The full list, every item, is at the end of this document.</Note>
      </Section>

      {/* ── SUPPORT ──────────────────────────────────────────────── */}
      <Section avoidBreak>
        <Eyebrow>Support</Eyebrow>
        <Panel tone="strong" className="mt-4">
          <Heading size="h2">We are in it with you, not behind a form</Heading>
          <P className="mt-6">
            A restaurant does not break at eleven on a Tuesday morning. It breaks at half past eight
            on a Friday, with a full floor and a queue at the bar. That is the hour this has to be
            worth something, so that is the hour we built it for.
          </P>
          <BulletList className="mt-6">
            <Bullet>
              <strong>We usually know before you call.</strong> The system reports its own errors to
              us as they happen. A till that starts failing, a payment that stops landing, a screen
              throwing errors in the kitchen: those reach us on their own. Often the call we make to
              you is the first you hear of it.
            </Bullet>
            <Bullet>
              <strong>Somebody picks up when you are open.</strong> Evenings and weekends included,
              because those are your hours. You are calling people who know your setup, your menu
              and your staff, not explaining yourself to a queue.
            </Bullet>
            <Bullet>
              <strong>We can see what your staff saw.</strong> When a cashier says it would not let
              them do something, we can look at exactly what happened on that device at that moment
              instead of asking them to describe it. That turns a twenty minute argument into a two
              minute fix.
            </Bullet>
            <Bullet>
              <strong>We train the people you hire next.</strong> Staff move on. Training is not one
              day at the start, it is something we keep doing as your team changes, and it is part
              of what you are already paying for.
            </Bullet>
            <Bullet>
              <strong>Nothing changes under your staff without warning.</strong> When we improve
              something, the people who use it get walked through it on their own screen, slide by
              slide, and have to confirm they have seen it before they carry on. Your team is never
              surprised by their own till.
            </Bullet>
          </BulletList>
        </Panel>
      </Section>

      {/* ── COSTS ────────────────────────────────────────────────── */}
      <Section avoidBreak className="mb-8">
        <Eyebrow>What It Costs</Eyebrow>
        <Panel className="mt-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="min-w-0">
              <Chip tone="paper">To Get Started</Chip>
              <Heading size="h2" className="mt-4">
                You are not paying us to invent it
              </Heading>
            </div>
            <div className="doc-invert shrink-0 overflow-hidden rounded-[var(--doc-r-inset)] sm:w-[17rem]">
              <div className="bg-[var(--doc-paper)] px-5 py-5">
                <Figure value="GHS 14,500" caption="once, to build and set up" />
              </div>
              <div className="bg-[var(--doc-fill-quiet)] px-5 py-4">
                <p className="text-[length:var(--doc-t-lead)] leading-none font-semibold text-[var(--doc-ink)] tabular-nums">
                  GHS 1,500
                </p>
                <p className="mt-1.5 text-[length:var(--doc-t-sm)] text-[var(--doc-ink-soft)]">
                  a month, to keep it running
                </p>
              </div>
            </div>
          </div>

          <P className="mt-8">
            Building a system like this from nothing is months of work, and we would quote it at
            around GHS 38,000. You are not being asked for that, because it is already built and
            already proven. What you are paying for is the setup.
          </P>

          <Inset className="mt-7">
            <p className="text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink)]">
              What the GHS 14,500 covers
            </p>
            <P className="mt-2.5">
              Your full menu and bar list loaded in, with sizes and prices. Every recipe defined
              down to the measure, which is the slow part and the part that makes the stock control
              real. Your suppliers, your opening stock counted in, your delivery zones and fees.
              Your branding on the ordering site and your details on the receipt. Accounts and
              permissions for every member of staff. Then training on the floor, in the kitchen and
              behind the bar until your people can run a full service without us standing there.
            </P>
          </Inset>

          <Inset className="mt-5">
            <p className="text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink)]">
              What the GHS 1,500 a month covers
            </p>
            <P className="mt-2.5">
              Everything in the support section above, plus hosting, daily backups and security. It
              is billed monthly rather than yearly because that is how a restaurant holds cash, and
              it starts the month after you go live, not the day you sign.
            </P>
          </Inset>
        </Panel>
      </Section>

      {/* Service charge */}
      <Section avoidBreak>
        <Panel tone="quiet">
          <Eyebrow>The Service Charge</Eyebrow>
          <Heading className="mt-3">3% on money the system collects for you</Heading>
          <P className="mt-5">
            When a customer pays online or on a Mobile Money prompt at the till, that money is
            collected, matched to the order and settled into your account without anybody touching
            it. A service charge of 3% applies to that money.
          </P>
          <P className="mt-4">
            <strong>Cash in the drawer is not charged.</strong> Neither is a card paid on your own
            terminal. This applies only to money the system itself collects on your behalf, and it
            is the normal rate people are already used to on Mobile Money. Many places pass it on to
            the customer as a payment charge, and the system can add it to the bill automatically if
            you want it done that way.
          </P>
        </Panel>
      </Section>

      {/* Costs not included */}
      <Section avoidBreak>
        <Eyebrow>Costs That Are Not In These Prices</Eyebrow>
        <Heading className="mt-3">Things charged by the message or by the item</Heading>
        <P className="mt-5">
          A few things are charged each time they are used or bought once, so they cannot sit inside
          a fixed price.
        </P>
        <BulletList className="mt-6">
          <Bullet>
            <strong>SMS.</strong> Order confirmations, delivery updates and anything you send to
            your customer list. Bought in bundles. We will price it once we know how many customers
            you have and how often you want to write to them.
          </Bullet>
          <Bullet>
            <strong>WhatsApp.</strong> Charged by Meta for each message delivered, and the rate
            moves every few months, so it is quoted separately and kept up to date. It also needs
            its own number that cannot be used on the normal WhatsApp app. We set that up with you.
          </Bullet>
          <Bullet>
            <strong>Hardware.</strong> The tablet or terminal at the till, the receipt printer, the
            screen in the kitchen and the cash drawer. We will spec exactly what you need and you
            can buy it yourself or through us. We would rather you spent well once than cheaply
            twice.
          </Bullet>
          <Bullet>
            <strong>A second outlet.</strong> Everything here is for one place. If Swad opens
            another, the system already handles branches, transfers between them and one set of
            books across both. We would price that when it happens and it would be far less than
            starting again.
          </Bullet>
        </BulletList>
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
            If the amount is wrong for the business, or the timing falls in a bad month, say so and
            we will work out something that fits. We would rather start well than start on our own
            numbers.
          </P>
        </Panel>
      </Section>

      {/* Terms */}
      <Section avoidBreak>
        <Eyebrow>Terms</Eyebrow>
        <BulletList className="mt-5">
          <Bullet>
            <strong>Starting.</strong> As a starting point, half of the GHS 14,500 begins the work
            and the rest is due when you go live. If that shape does not suit the business, tell us.
            We will agree an amount and a schedule you can actually meet, and we are happy to spread
            it.
          </Bullet>
          <Bullet>
            <strong>The monthly fee</strong> starts the month after you go live, not the day you
            sign. You are not paying to wait.
          </Bullet>
          <Bullet>
            <strong>How long it takes.</strong> About six weeks from our first working session. The
            till, the kitchen board and the bar stock go live first, because those are the parts
            that earn their keep from day one. Online ordering and delivery follow.
          </Bullet>
          <Bullet>
            <strong>The recipes are the work.</strong> Defining every drink and every plate down to
            the measure is the slow part, and we do it with your bar manager and your head chef in
            the room. Set aside time for that. It is what makes everything else true.
          </Bullet>
          <Bullet>
            <strong>Your records.</strong> You can download everything at any time. Nothing is ever
            held back over a bill.
          </Bullet>
          <Bullet>
            <strong>Nothing here is signed off yet.</strong> Before anything is, we sit down with
            you, whoever runs your bar, whoever runs your kitchen and whoever keeps your books. We
            go through exactly what is being built, exactly what it costs and exactly when it is
            paid, and we agree all three together. This offer holds for 21 days from the date at the
            top, and if you need longer, ask us.
          </Bullet>
        </BulletList>
      </Section>

      {/* Next steps */}
      <Section avoidBreak className="mb-14">
        <Panel tone="ink">
          <Eyebrow>What Happens Next</Eyebrow>
          <Heading size="h2" className="mt-3">
            Give us an hour and a screen
          </Heading>
          <Lead className="mt-5">
            We come to Swad, bring the system up and walk you through the till, the kitchen board
            and the bar stock. Send us your menu beforehand and we will set part of it up first, so
            you are looking at your own food and your own prices rather than somebody else&rsquo;s.
            That hour costs nothing and it is what we build from.
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
          All {MODULES.reduce((n, m) => n + m.items.length, 0)} items, listed in full. You get every
          one of them.
        </Note>

        <div className="mt-8 space-y-7">
          {MODULES.map((section) => (
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
      </Section>

      <DocumentFooter record={record} />
    </>
  );
}
