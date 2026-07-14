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

function MiniBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-gray-600">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{children}</p>
  );
}

/**
 * Dei Gratia Medical Services, Fee Schedule. A firm bill for the clinic's public
 * website: a fixed GHS 4,000 build (the full services site plus WhatsApp appointment
 * booking), managed hosting billed at cost (the clinic provides its own domain), and a
 * GHS 2,000/mo care plan after handover. The retainer is a full partnership (site
 * care, ongoing development updates, brand design work, and blog publishing), which is
 * what carries the higher monthly figure. Bespoke body authored locally; system
 * metadata (ID, dates, system, timestamp, verify QR) is driven by the registry record
 * so it stays in sync with /verify/{id}.
 */
export function DeiGratiaFeeSchedule({ record }: { record: DocumentRecord }) {
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
          <p className="text-sm text-gray-600">contact@saharabasetech.com</p>
          <p className="mt-1 text-sm text-gray-600">www.saharabasetech.com</p>
        </div>
        <div className="w-64 text-right">
          <h2 className="mb-2 whitespace-nowrap text-xl font-semibold text-gray-800">{record.type}</h2>
          <p className="text-sm text-gray-600">Ref: {record.reference}</p>
          <p className="text-sm text-gray-600">Issue Date: {record.issueDate}</p>
          {record.validUntil && <p className="text-sm text-gray-600">Valid Until: {record.validUntil}</p>}
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-10">
        <div>
          <Eyebrow>Bill To</Eyebrow>
          <p className="mt-2 text-lg font-semibold text-gray-900">Dei Gratia Medical Services</p>
          <p className="text-base text-gray-600">Wayamba Junction, Tamale-Bolgatanga Road, Tamale</p>
        </div>
        <div className="mt-4 rounded-lg border border-primary/10 bg-white p-5">
          <DetailRow label="Engagement" value="Website Build + Online Appointment Booking" />
          <DetailRow label="Project Code" value="JUL2026-DEIG" />
          <DetailRow label="Billing Type" value="Fixed Build Fee + Monthly Care Plan" />
        </div>
      </div>

      {/* Payment Summary: what's due upfront, at a glance */}
      <div className="avoid-break mb-10 rounded-lg border border-primary/20 bg-primary/5 p-6">
        <Eyebrow>Payment Summary</Eyebrow>
        <div className="mt-3 flex items-end justify-between gap-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Due upfront to begin
            </p>
            <p className="mt-1 text-4xl font-bold leading-none tabular-nums text-gray-900">
              GHS 1,600.00
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums text-primary">
              + USD 48.00 hosting (year 1)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              40% deposit on the build fee plus the first year of hosting, payable before work
              commences.
            </p>
          </div>
          <div className="w-72 shrink-0 divide-y divide-gray-200 border-l border-gray-200 pl-6 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Web hosting (year 1)</span>
              <span className="font-semibold tabular-nums text-gray-900">USD 48.00</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Balance on completion</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 2,400.00</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Total build fee</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 4,000.00</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Care plan (after handover)</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 2,000.00 / mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Investment */}
      <div className="mb-8">
        <Eyebrow>Project Investment</Eyebrow>
        <h3 className="mt-2 text-2xl font-semibold leading-tight text-gray-900 md:text-3xl">
          Dei Gratia Website &amp; Online Appointment Booking
        </h3>
        <p className="mt-3 text-base leading-8 text-gray-700">
          A professional website that puts the clinic online: its services, team, and location, with
          a tap-to-chat WhatsApp line for booking appointments and a health blog the clinic can keep
          growing. Built to load fast on a phone and to be found when a patient searches in Tamale.
        </p>

        <table className="mt-5 w-full border-collapse text-base">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="py-3 font-semibold text-gray-600">Description</th>
              <th className="py-3 text-right font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 pr-8">
                <p className="text-lg font-semibold text-gray-900">Full Website Build</p>
                <ul className="mt-3 space-y-2">
                  <MiniBullet>Responsive, SEO-ready site: home, our story, our team, visit us, and contact</MiniBullet>
                  <MiniBullet>A full services section covering maternal &amp; child health, 24/7 emergency &amp; urgent care, laboratory, imaging, outpatient, pharmacy, screenings, and specialist services</MiniBullet>
                  <MiniBullet>WhatsApp appointment booking: every &ldquo;Book an appointment&rdquo; opens a ready-to-send chat straight to the clinic</MiniBullet>
                  <MiniBullet>Health blog the clinic can update with articles, notices, and announcements</MiniBullet>
                  <MiniBullet>Location with map and directions, OPD hours, emergency line, and NHIS-accepted messaging throughout</MiniBullet>
                  <MiniBullet>Tap-to-call and tap-to-chat on every page, testing, deployment, and handover</MiniBullet>
                </ul>
              </td>
              <td className="py-4 text-right align-top font-semibold text-gray-900">GHS 4,000.00</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-80">
            <div className="flex justify-between py-2 text-base">
              <span className="text-gray-600">Development Subtotal</span>
              <span className="font-semibold text-gray-900">GHS 4,000.00</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-300 pt-3 text-lg">
              <span className="font-semibold text-gray-900">Total Build Fee</span>
              <span className="font-bold text-primary">GHS 4,000.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Window */}
      <div className="avoid-break mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-[160px_1fr] gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Delivery Window</p>
            <p className="mt-2 text-5xl font-semibold leading-none text-gray-900">14</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">days (max)</p>
          </div>
          <div className="border-l border-gray-200 pl-5">
            <p className="text-base font-semibold text-gray-900">A single delivery window through to handoff</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              A maximum of fourteen days from confirmation of the upfront deposit, covering build, testing,
              deployment, and handover as one coordinated cycle. Final timing depends on timely feedback,
              content availability, and approvals.
            </p>
            <div className="mt-4 flex border-t border-gray-900">
              {["Build", "Testing", "Deployment", "Handover"].map((item, i) => (
                <div key={item} className="flex-1 pr-3 pt-2">
                  <p className="text-xs font-semibold tabular-nums text-primary">0{i + 1}</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Care Plan / Retainer */}
      <div className="mb-8 border border-t-2 border-gray-200 border-t-primary bg-white">
        <div className="flex items-end justify-between gap-6 px-6 pt-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Care Plan</p>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">Website Care &amp; Growth Retainer</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-3xl font-semibold leading-none tabular-nums text-gray-900">GHS 2,000</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">per month</p>
          </div>
        </div>

        <p className="mt-4 px-6 text-base leading-8 text-gray-700">
          For a clinic, the website is never just a brochure. It carries the emergency line, the
          booking button, and the service and hours a worried patient relies on at any hour. The
          retainer is a full partnership, not only upkeep: it keeps the site live and secure, carries
          the ongoing development as the clinic grows, handles graphic design work for the Dei Gratia
          brand, and writes up and publishes the blog. It gives the clinic a fixed, predictable
          monthly cost instead of unplanned bills for each change.
        </p>

        <div className="mx-6 mt-4 grid grid-cols-2 gap-px border border-gray-200 bg-gray-200">
          {[
            { t: "Site care & uptime", d: "The site is watched around the clock and kept secure, patched, backed up, and fast, so the emergency line and booking button are always live and correct." },
            { t: "Ongoing development updates", d: "New sections, features, and changes as the clinic grows, so the site keeps evolving instead of going stale, with no separate build fee each time." },
            { t: "Graphic design for your brand", d: "Design work for the Dei Gratia brand: social graphics, flyers, and visuals that keep the clinic looking sharp and consistent." },
            { t: "Blog & content publishing", d: "We write up and put up your blog posts, notices, and announcements, so the health blog stays active and worth following." },
          ].map((p, i) => (
            <div key={p.t} className="avoid-break bg-white px-5 py-4">
              <div className="flex gap-3">
                <span className="text-sm font-semibold tabular-nums text-primary">0{i + 1}</span>
                <div>
                  <p className="text-base font-semibold text-gray-900">{p.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{p.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 px-6 text-sm leading-relaxed text-gray-600">
          <span className="font-semibold text-gray-800">What it avoids:</span> without the plan, security
          gaps go unpatched and backups drift, the blog goes quiet, and every update, graphic, or new
          section becomes a separate billable job. On a site patients turn to in an emergency, that
          risk is real. The retainer prevents it and keeps someone accountable for the site at all times.
        </p>

        <div className="mx-6 mb-1 mt-4 flex gap-px border border-gray-200 bg-gray-200">
          <div className="flex-1 bg-gray-900 px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Monthly</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-white">GHS 2,000</p>
          </div>
          <div className="flex-1 bg-white px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Quarterly · 5% off</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-gray-900">GHS 5,700</p>
          </div>
        </div>

        <p className="mb-6 mt-3 px-6 text-xs italic leading-relaxed text-gray-500">
          The retainer begins the month after handover and renews automatically each billing cycle,
          cancellable with 30 days&apos; notice.
        </p>
      </div>

      {/* Domain & Hosting */}
      <div className="avoid-break mb-8">
        <Eyebrow>Domain &amp; Hosting</Eyebrow>
        <p className="mt-2 text-base leading-8 text-gray-700">
          The clinic provides its own domain; we point it to the site at no charge. Managed hosting is
          a third-party subscription billed at cost, separate from the build fee and the care plan, and
          renewed annually.
        </p>
        <div className="mt-4 grid grid-cols-[1fr_220px] gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-base font-semibold text-gray-900">Domain Name</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Provided by the clinic. Dei Gratia registers and owns its domain; we point it to the
                site.
              </p>
              <p className="mt-3 text-lg font-semibold tabular-nums text-gray-900">Provided by client</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-base font-semibold text-gray-900">Web Hosting</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Managed hosting for the website, email, and the booking and contact flows.
              </p>
              <p className="mt-3 text-lg font-semibold tabular-nums text-gray-900">USD 48 / year</p>
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Third-party / year 1
            </p>
            <p className="mt-1 text-3xl font-semibold leading-none tabular-nums text-gray-900">USD 48</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Payable with the upfront deposit so the server is provisioned before work begins.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="mb-8">
        <Eyebrow>Payment Schedule</Eyebrow>
        <div className="mt-4 divide-y divide-gray-200 border-y border-gray-300">
          <div className="avoid-break grid grid-cols-[160px_1fr_180px] gap-4 py-4">
            <div>
              <p className="text-base font-semibold text-gray-900">Project Start</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">Due before commencement</p>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              40% deposit on the build fee, plus the first year of hosting.
            </p>
            <div className="text-right">
              <p className="text-base font-semibold tabular-nums text-gray-900">GHS 1,600.00</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-primary">+ USD 48.00</p>
            </div>
          </div>
          <div className="avoid-break grid grid-cols-[160px_1fr_180px] gap-4 py-4">
            <div>
              <p className="text-base font-semibold text-gray-900">Completion</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">Due before final handoff</p>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Remaining 60% build balance, payable on completion and before final handover (within the
              14-day window).
            </p>
            <p className="text-right text-base font-semibold text-gray-900">GHS 2,400.00</p>
          </div>
          <div className="avoid-break grid grid-cols-[160px_1fr_180px] gap-4 py-4">
            <div>
              <p className="text-base font-semibold text-gray-900">Care Plan</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">Recurring after handover</p>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Website Care &amp; Growth Retainer, beginning the month after handover: site care, ongoing
              development updates, brand design work, and blog publishing.
            </p>
            <p className="text-right text-base font-semibold text-gray-900">GHS 2,000.00 / mo</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <div className="w-80">
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-gray-600">Due at project start</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 1,600 + USD 48</span>
            </div>
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-gray-600">Due at completion</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 2,400.00</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-gray-300 pt-2 text-base">
              <span className="font-semibold text-gray-900">Total build fee</span>
              <span className="font-bold tabular-nums text-primary">GHS 4,000.00</span>
            </div>
            <p className="mt-1 text-right text-xs text-gray-500">
              + USD 48 hosting (year 1) · GHS 2,000 / month retainer after handover
            </p>
          </div>
        </div>
      </div>

      {/* Payment details + notes */}
      <div className="avoid-break grid grid-cols-2 gap-5 border-t border-gray-300 pt-5">
        <div>
          <p className="mb-2 text-base font-semibold text-gray-700">Payment Details</p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>Payment Type: Mobile Money Transfer</li>
            <li>Network: MTN</li>
            <li>Phone Number: 0539157613</li>
            <li>Name On Account: Richard Vinkpedomeh Somda</li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-base font-semibold text-gray-700">Billing Notes</p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>Please include payment reference DEIG56 in your payment confirmation.</li>
            <li>The build fee is a fixed price for the agreed launch scope.</li>
            <li>
              The clinic provides its own domain. Web hosting (USD 48/yr) is a third-party subscription
              billed at cost and renewed annually. Appointment booking runs through the clinic&apos;s
              WhatsApp line.
            </li>
          </ul>
        </div>
      </div>

      {/* Footer: system metadata + verify QR (dynamic on prepare) */}
      <DocumentFooter record={record} />
    </>
  );
}
