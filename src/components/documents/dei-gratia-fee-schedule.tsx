import { VERIFY_BASE_URL, type DocumentRecord } from "@/lib/documents/registry";
import { DocumentFooter } from "./document-footer";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-gray-100 py-3.5 text-lg last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function MiniBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-base leading-relaxed text-gray-700">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{children}</p>
  );
}

/**
 * Dei Gratia Medical Services, Fee Schedule (revised after the client meeting).
 * A firm bill for the clinic's website, now delivered: a fixed GHS 3,000 build (the
 * full services site plus WhatsApp appointment booking), with GHS 2,000 taken as the
 * agreed first payment and a GHS 1,000 balance on handover. No monthly retainer; instead
 * a short, unpriced statement that beyond handover we keep an eye on uptime and help with
 * the blog, as our contribution to the clinic's growth. Managed hosting billed at cost
 * (USD 48/yr); the domain sits outside this document. Typeset a size up for an older
 * reader who may skim; the footer and verification metadata keep their smaller scale.
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
          <p className="text-base text-gray-600">17 Alhaji Sulley Road,</p>
          <p className="text-base text-gray-600">Abelemkpe, Accra</p>
          <p className="text-base text-gray-600">contact@saharabasetech.com</p>
          <p className="mt-1 text-base text-gray-600">www.saharabasetech.com</p>
        </div>
        <div className="w-64 text-right">
          <h2 className="mb-2 whitespace-nowrap text-2xl font-semibold text-gray-800">{record.type}</h2>
          <p className="text-base text-gray-600">Ref: {record.reference}</p>
          <p className="text-base text-gray-600">Issue Date: {record.issueDate}</p>
          {record.validUntil && <p className="text-base text-gray-600">Valid Until: {record.validUntil}</p>}
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-10">
        <div>
          <Eyebrow>Bill To</Eyebrow>
          <p className="mt-2 text-xl font-semibold text-gray-900">Dei Gratia Medical Services</p>
          <p className="text-lg text-gray-600">Wayamba Junction, Tamale-Bolgatanga Road, Tamale</p>
        </div>
        <div className="mt-4 rounded-lg border border-primary/10 bg-white p-5">
          <DetailRow label="Engagement" value="Website Build + Online Appointment Booking" />
          <DetailRow label="Project Code" value="JUL2026-DEIG" />
          <DetailRow label="Billing Type" value="Fixed Build Fee" />
        </div>
      </div>

      {/* Payment Summary: the whole picture at a glance */}
      <div className="avoid-break mb-10 rounded-lg border border-primary/20 bg-primary/5 p-6">
        <Eyebrow>Payment Summary</Eyebrow>
        <div className="mt-3 flex items-end justify-between gap-8">
          <div>
            <p className="text-base font-semibold uppercase tracking-wider text-gray-500">
              Agreed first payment
            </p>
            <p className="mt-1 text-6xl font-bold leading-none tabular-nums text-gray-900">
              GHS 2,000.00
            </p>
            <p className="mt-3 text-xl font-semibold tabular-nums text-primary">
              + USD 48.00 hosting (year 1)
            </p>
            <p className="mt-3 text-lg leading-8 text-gray-700">
              Two-thirds of the GHS 3,000 total, agreed with the clinic. The remaining GHS 1,000
              balance falls due on handover.
            </p>
          </div>
          <div className="w-80 shrink-0 divide-y divide-gray-200 border-l border-gray-200 pl-6 text-lg">
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Web hosting (year 1)</span>
              <span className="font-semibold tabular-nums text-gray-900">USD 48.00</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Balance on handover</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 1,000.00</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Total build fee</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 3,000.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Investment */}
      <div className="mb-10">
        <Eyebrow>What Was Built</Eyebrow>
        <h3 className="mt-2 text-3xl font-semibold leading-tight text-gray-900 md:text-4xl">
          Dei Gratia Website &amp; Online Appointment Booking
        </h3>
        <p className="mt-3 text-lg leading-8 text-gray-700">
          A professional website that puts the clinic online: its services, team, and location, with a
          tap-to-chat WhatsApp line for booking and a health blog the clinic can keep growing. Built to
          load fast on a phone and to be found when a patient searches in Tamale.
        </p>

        <table className="mt-5 w-full border-collapse text-lg">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="py-3 font-semibold text-gray-600">Description</th>
              <th className="py-3 text-right font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 pr-8">
                <p className="text-xl font-semibold text-gray-900">Full Website Build</p>
                <ul className="mt-3 space-y-2.5">
                  <MiniBullet>Home, our story, our team, visit us, and contact, all responsive and SEO-ready</MiniBullet>
                  <MiniBullet>Full services section: maternal &amp; child health, 24/7 emergency care, laboratory, imaging, outpatient, pharmacy, screenings, and specialist services</MiniBullet>
                  <MiniBullet>WhatsApp appointment booking that opens a ready-to-send chat to the clinic</MiniBullet>
                  <MiniBullet>Health blog for articles, notices, and announcements</MiniBullet>
                  <MiniBullet>Map and directions, OPD hours, emergency line, and NHIS-accepted messaging</MiniBullet>
                  <MiniBullet>Tap-to-call and tap-to-chat throughout, plus testing, deployment, and handover</MiniBullet>
                </ul>
              </td>
              <td className="py-4 text-right align-top text-xl font-semibold text-gray-900">GHS 3,000.00</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-96">
            <div className="flex justify-between py-2 text-lg">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">GHS 3,000.00</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-300 pt-3 text-xl">
              <span className="font-semibold text-gray-900">Total Build Fee</span>
              <span className="font-bold text-primary">GHS 3,000.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery & Handover: the stages, no fixed day count */}
      <div className="avoid-break mb-10 rounded-lg border border-gray-200 bg-white p-6">
        <Eyebrow>Delivery &amp; Handover</Eyebrow>
        <p className="mt-3 text-lg leading-8 text-gray-700">
          The site was delivered as one coordinated cycle, from build through to handover, so the clinic
          received a finished, tested website ready to go live.
        </p>
        <div className="mt-5 flex border-t-2 border-gray-900">
          {["Build", "Testing", "Deployment", "Handover"].map((item, i) => (
            <div key={item} className="flex-1 pr-3 pt-3">
              <p className="text-base font-semibold tabular-nums text-primary">0{i + 1}</p>
              <p className="mt-1 text-lg font-medium text-gray-800">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Beyond Handover: our continued support, unpriced */}
      <div className="avoid-break mb-10 rounded-lg border border-gray-200 border-t-2 border-t-primary bg-white p-6">
        <Eyebrow>Beyond Handover</Eyebrow>
        <h3 className="mt-2 text-2xl font-semibold text-gray-900">We stay with you</h3>
        <p className="mt-3 text-lg leading-8 text-gray-700">
          Handover is not where we step away. We keep an eye on the site so it stays up and reachable for
          patients, and we lend a hand with the blog so it keeps speaking to the people you care for. We
          walk with the clinic from handover until your team is ready to carry it fully on its own.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-px border border-gray-200 bg-gray-200">
          {[
            { t: "Keeping watch on uptime", d: "We keep an eye on the site so it stays online and reachable whenever a patient looks." },
            { t: "A hand with the blog", d: "We help put up blog posts and updates, so the site keeps speaking to your patients." },
          ].map((p) => (
            <div key={p.t} className="avoid-break bg-white px-5 py-4">
              <p className="text-lg font-semibold text-gray-900">{p.t}</p>
              <p className="mt-1 text-base leading-relaxed text-gray-600">{p.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hosting */}
      <div className="avoid-break mb-10">
        <Eyebrow>Hosting</Eyebrow>
        <div className="mt-3 grid grid-cols-[1fr_240px] gap-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xl font-semibold text-gray-900">Web Hosting</p>
            <p className="mt-2 text-lg leading-8 text-gray-700">
              Managed hosting for the website, email, and the booking and contact flows. A third-party
              subscription billed at cost and renewed each year to keep the site online.
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-right">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
              Per year
            </p>
            <p className="mt-1 text-4xl font-semibold leading-none tabular-nums text-gray-900">USD 48</p>
            <p className="mt-2 text-base leading-relaxed text-gray-600">
              Billed at cost, renewed annually.
            </p>
          </div>
        </div>
      </div>

      {/* Payment details + notes */}
      <div className="avoid-break grid grid-cols-2 gap-5 border-t border-gray-300 pt-5">
        <div>
          <p className="mb-2 text-lg font-semibold text-gray-700">Payment Details</p>
          <ul className="space-y-1.5 text-base text-gray-600">
            <li>Payment Type: Mobile Money Transfer</li>
            <li>Network: MTN</li>
            <li>Phone Number: 0539157613</li>
            <li>Name On Account: Richard Vinkpedomeh Somda</li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-lg font-semibold text-gray-700">Billing Notes</p>
          <ul className="space-y-1.5 text-base text-gray-600">
            <li>Please include payment reference DEIG56 in your payment confirmation.</li>
          </ul>
        </div>
      </div>

      {/* Footer: system metadata + verify QR (dynamic on prepare) */}
      <DocumentFooter record={record} />
    </>
  );
}
