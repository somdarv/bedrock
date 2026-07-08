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

const DISCOVERY: string[] = [
  "How do you talk to parents today, and what tends to go wrong?",
  "How do you handle admissions and enquiries from new families?",
  "When a parent looks your school up online, what do you want them to find?",
  "If one everyday task got easier tomorrow, which one would help you most?",
];

/**
 * Zenith School, website proposal. Bespoke body authored locally; system metadata
 * (ID, dates, system, timestamp, verify QR) is driven by the registry record so it
 * stays in sync with what /verify/{id} confirms. The one figure it carries is the
 * GHS 500 monthly care plan; the development itself is offered at a discounted rate
 * with no number, as part of the Northern Region initiative.
 */
export function ZenithSchoolProposal({ record }: { record: DocumentRecord }) {
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
        <p className="mt-2 text-lg font-semibold text-gray-900">Zenith School</p>
        <p className="text-base text-gray-600">Basic School, Tamale</p>

        <div className="mt-4 rounded-lg border border-primary/10 bg-white p-5">
          <DetailRow label="What we propose" value="A simple, professional school website" />
          <DetailRow label="Domain and hosting" value="Set up and managed for you" />
          <DetailRow label="Development" value="Heavily discounted, initiative pricing" />
          <DetailRow label="Care plan" value="GHS 500 per month" />
          <DetailRow label="Timing" value="This offer holds if we begin within 7 days" />
        </div>
      </div>

      {/* Opening */}
      <div className="mb-10">
        <p className="text-base leading-8 text-gray-700">
          It is 2026, and the first place a parent looks for a school is often online. A clear, simple
          website is the easiest way for Zenith School to be found, to be trusted, and to tell its own
          story.
        </p>
        <p className="mt-4 text-base leading-8 text-gray-700">
          We would like to help you take that first step. As part of an initiative to bring schools and
          organisations across the Northern Region online, we are offering to build Zenith School a
          website on terms made to be easy to say yes to.
        </p>
      </div>

      {/* What we propose */}
      <div className="mb-10">
        <Eyebrow>What We Propose</Eyebrow>
        <h3 className="mt-2 text-2xl font-semibold leading-snug text-gray-900 md:text-3xl">
          A simple, professional website for the school
        </h3>
        <p className="mt-3 text-base leading-8 text-gray-700">
          A clean website that shows Zenith School at its best and gives parents what they came looking
          for. Built to load fast, read well on a phone, and stay easy to keep current.
        </p>
        <ul className="mt-4 space-y-3">
          <Bullet>A welcoming home page that introduces the school</Bullet>
          <Bullet>Pages for your story, your programmes, and admissions</Bullet>
          <Bullet>A place for news, announcements, and photos</Bullet>
          <Bullet>Clear contact details, your location, and how to enquire</Bullet>
          <Bullet>Built to work well on phones and to be found on Google</Bullet>
        </ul>
        <p className="mt-4 text-base leading-8 text-gray-700">
          You will not have to touch the technical side at all. We set up the domain and hosting and look
          after them for you as part of caring for the site, so it all sits in one place with the team
          that built it. You simply get a website that works, and one team to call if anything ever needs
          attention.
        </p>
      </div>

      {/* The development */}
      <div className="avoid-break mb-10">
        <Eyebrow>The Development</Eyebrow>
        <p className="mt-2 text-base leading-8 text-gray-700">
          A website like this normally carries a development fee. As part of our initiative to bring
          Northern Region institutions online, we are offering the development for Zenith School at a
          heavily discounted rate. What we are after here is reach and relationship, not a large invoice.
        </p>
      </div>

      {/* Care plan / retainer, the one real figure */}
      <div className="avoid-break mb-10 rounded-lg border border-gray-200 border-t-2 border-t-primary bg-white">
        <div className="flex items-end justify-between gap-6 px-6 pt-6">
          <div>
            <Eyebrow>Care Plan</Eyebrow>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">Looking after your site</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-3xl font-semibold leading-none tabular-nums text-gray-900">GHS 500</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              per month
            </p>
          </div>
        </div>

        <p className="mt-4 px-6 text-base leading-8 text-gray-700">
          As part of how we normally work, we place a monthly care fee on the sites we manage. That fee
          is usually higher, but given the standing of Zenith School and the spirit of this initiative,
          we propose a care plan of GHS 500 per month.
        </p>

        <div className="mx-6 mt-4 grid grid-cols-2 gap-px border border-gray-200 bg-gray-200">
          {[
            {
              t: "Minor changes, within scope",
              d: "Updating text and information, swapping photos, and small tweaks to what is already there.",
            },
            {
              t: "Always online",
              d: "We host the site and keep it up, monitored, and quick, so it is there whenever a parent looks.",
            },
            {
              t: "Safe and backed up",
              d: "Security updates and regular backups, so the site stays protected and nothing is lost.",
            },
            {
              t: "Someone to reach",
              d: "A person to call when you need a small hand or have a quick question.",
            },
          ].map((item, i) => (
            <div key={item.t} className="avoid-break bg-white px-4 py-3">
              <div className="flex gap-3">
                <span className="text-base font-semibold tabular-nums text-primary">0{i + 1}</span>
                <div>
                  <p className="text-base font-semibold text-gray-900">{item.t}</p>
                  <p className="mt-1 text-sm leading-7 text-gray-600">{item.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 px-6 text-base leading-8 text-gray-700">
          Anything beyond these minor changes, such as a new section or a new feature, comes as its own
          item, quoted and agreed with you before any work begins. You can pay the care plan monthly, or
          quarterly if that suits you better.
        </p>
        <div className="h-6" />
      </div>

      {/* Where this can grow */}
      <div className="avoid-break mb-10">
        <Eyebrow>Where This Can Grow</Eyebrow>
        <p className="mt-2 text-base leading-8 text-gray-700">
          A website is the first step. When you are ready, this can grow with you.
        </p>
        <div className="mt-2 divide-y divide-gray-100">
          <LeadPoint n={1} title="Edit it yourself">
            We can set the site up so your own team updates content, news, and photos, without needing us
            each time.
          </LeadPoint>
          <LeadPoint n={2} title="The first pieces of a school system">
            Small tools that take real weight off your staff, like admissions enquiries or announcements
            to parents, added one at a time.
          </LeadPoint>
          <LeadPoint n={3} title="A full school management system">
            In time, the same platform can grow toward managing fees, attendance, results, and records,
            the way our larger systems already do.
          </LeadPoint>
        </div>
      </div>

      {/* A note on timing, the catch */}
      <div className="avoid-break mb-10 rounded-lg border border-primary/20 bg-primary/5 p-6">
        <Eyebrow>A Note on Timing</Eyebrow>
        <p className="mt-3 text-base leading-8 text-gray-700">
          This proposal, and the discounted terms in it, hold if we can begin within seven days. That is
          the only catch. It keeps this initiative moving and lets us give each school our full attention
          in turn.
        </p>
      </div>

      {/* What we ask in return */}
      <div className="avoid-break mb-10">
        <Eyebrow>What We&apos;d Like in Return</Eyebrow>
        <p className="mt-2 text-base leading-8 text-gray-700">
          In return, we ask for the chance to understand how your school really runs. The more we learn
          about your day to day, the better we can build for you, now and later.
        </p>
        <ol className="mt-4 space-y-3">
          {DISCOVERY.map((q, i) => (
            <li key={i} className="flex gap-3 text-base leading-7 text-gray-700">
              <span className="font-semibold tabular-nums text-gray-400">{i + 1}.</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Where we go from here, with contact */}
      <div className="avoid-break mb-8 rounded-lg border border-gray-200 border-t-2 border-t-primary bg-white p-6">
        <Eyebrow>Where We Go From Here</Eyebrow>
        <p className="mt-3 text-base leading-8 text-gray-700">
          Let us sit down for a short conversation, agree on what your first website should say, and
          begin. We can have Zenith School online sooner than you think.
        </p>
        <p className="mt-4 text-base leading-8 text-gray-700">
          I am ready whenever you are. You can reach me directly.
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
