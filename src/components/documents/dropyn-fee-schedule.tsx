import { VERIFY_BASE_URL, type DocumentRecord } from "@/lib/documents/registry";
import { DocumentFooter } from "./document-footer";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-gray-100 py-2 text-xs last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function MiniBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[11px] leading-relaxed text-gray-600">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}

/**
 * Dropyn Trading — Fee Schedule. Bespoke body authored locally; system metadata
 * (ID, dates, system, timestamp, verify QR) is driven by the registry record so it
 * stays in sync with what /verify/{id} confirms.
 */
export function DropynFeeSchedule({ record }: { record: DocumentRecord }) {
  return (
    <>
      <p className="my-2 break-all text-[10px] tracking-wide text-gray-400">
        {VERIFY_BASE_URL.replace(/^https?:\/\//, "")}/verify/{record.id}
      </p>

      {/* Letterhead */}
      <div className="mb-8 flex items-start justify-between gap-6 rounded-lg bg-primary/10 p-5">
        <div>
          <h1 className="mb-4 text-3xl font-semibold leading-none text-black">
            Saharabase Technologies
          </h1>
          <p className="text-xs text-gray-600">17 Alhaji Sulley Road,</p>
          <p className="text-xs text-gray-600">Abelemkpe, Accra</p>
          <p className="text-xs text-gray-600">contact@saharabasetech.com</p>
          <p className="mt-1 text-xs text-gray-600">www.saharabasetech.com</p>
        </div>
        <div className="w-56 text-right">
          <h2 className="mb-2 text-xl font-semibold text-gray-800">{record.type}</h2>
          <p className="text-xs text-gray-600">Ref: {record.reference}</p>
          <p className="text-xs text-gray-600">Issue Date: {record.issueDate}</p>
          {record.validUntil && <p className="text-xs text-gray-600">Valid Until: {record.validUntil}</p>}
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Bill To</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">Dropyn Trading LLC</p>
          <p className="text-xs text-gray-600">Commodity Sourcing &amp; Trading</p>
        </div>
        <div className="mt-4 rounded-lg border border-primary/10 bg-white p-4">
          <DetailRow label="Project Brief Ref" value="SAH-BD-20260630-PRO-52" />
          <DetailRow label="Project Code" value="JUN2026-DYN" />
          <DetailRow label="Billing Type" value="Custom Platform Build + Care Plan" />
        </div>
      </div>

      {/* Payment Summary — what's due upfront, at a glance */}
      <div className="avoid-break mb-10 rounded-lg border border-primary/20 bg-primary/5 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          Payment Summary
        </p>
        <div className="mt-3 flex items-end justify-between gap-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Due upfront to begin
            </p>
            <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-gray-900">
              GHS 4,000.00
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-primary">
              + USD 204.00 hosting (year 1)
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
              50% deposit on the build fee plus the first year of server hosting, payable before
              work commences.
            </p>
          </div>
          <div className="w-64 shrink-0 divide-y divide-gray-200 border-l border-gray-200 pl-6 text-xs">
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">Balance on completion</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 4,000.00</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">Total build fee</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 8,000.00</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">Care plan (after handover)</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 1,200.00 / mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Investment */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Project Investment</p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight text-gray-900">
          Commodity Sourcing &amp; Lead-Management Platform
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-gray-600">
          A custom web application that digitises Dropyn Trading&apos;s sourcing workflow end-to-end: a
          public-facing website, structured seller and buyer intake, and a secure internal dashboard for
          managing every deal.
        </p>

        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="py-3 font-semibold text-gray-600">Description</th>
              <th className="py-3 text-right font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 pr-8">
                <p className="font-semibold text-gray-900">Full Platform Build</p>
                <ul className="mt-2 space-y-1">
                  <MiniBullet>Public commodity website with responsive design and SEO-ready pages</MiniBullet>
                  <MiniBullet>Seller intake and buyer inquiry forms with secure database storage</MiniBullet>
                  <MiniBullet>Login-protected internal admin dashboard with multi-user team access</MiniBullet>
                  <MiniBullet>Deal status pipeline (New → In Review → Contacted → Negotiating → Closed), internal notes, and search / filter</MiniBullet>
                  <MiniBullet>Automated team notifications, submitter auto-acknowledgement, testing, deployment, and handover</MiniBullet>
                </ul>
              </td>
              <td className="py-4 text-right align-top font-semibold text-gray-900">GHS 8,000.00</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-72">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Development Subtotal</span>
              <span className="font-semibold text-gray-900">GHS 8,000.00</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-300 pt-3 text-base">
              <span className="font-semibold text-gray-900">Total Build Fee</span>
              <span className="font-bold text-primary">GHS 8,000.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Window */}
      <div className="avoid-break mb-8 rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-[150px_1fr] gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Delivery Window</p>
            <p className="mt-2 text-4xl font-semibold leading-none text-gray-900">3</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">weeks (max)</p>
          </div>
          <div className="border-l border-gray-200 pl-5">
            <p className="text-sm font-semibold text-gray-900">A single delivery window through to handoff</p>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
              A maximum of three weeks from confirmation of the upfront deposit, covering build, testing,
              deployment, and handover as one coordinated cycle. Final timing depends on timely feedback,
              content availability, and approvals.
            </p>
            <div className="mt-4 flex border-t border-gray-900">
              {["Build", "Testing", "Deployment", "Handover"].map((item, i) => (
                <div key={item} className="flex-1 pr-3 pt-2">
                  <p className="text-[10px] font-semibold tabular-nums text-primary">0{i + 1}</p>
                  <p className="mt-1 text-[11px] font-medium text-gray-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Care Plan / Retainer */}
      <div className="mb-8 border border-t-2 border-gray-200 border-t-primary bg-white">
        <div className="flex items-end justify-between gap-6 px-5 pt-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Care Plan</p>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">Platform Continuity &amp; Assurance Retainer</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-3xl font-semibold leading-none tabular-nums text-gray-900">GHS 1,200</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">per month</p>
          </div>
        </div>

        <p className="mt-3 px-5 text-xs leading-relaxed text-gray-700">
          The retainer covers the ongoing work a live platform needs after launch: monitoring, security,
          backups, and support. It keeps the system healthy and available while real deals move through it,
          and gives you a fixed, predictable monthly cost instead of unplanned repair bills.
        </p>

        <div className="mx-5 mt-4 grid grid-cols-2 gap-px border border-gray-200 bg-gray-200">
          {[
            { t: "Uptime & performance monitoring", d: "The platform is watched continuously, so slowdowns and outages are caught and fixed before they interrupt your team or a live deal." },
            { t: "Security & patching", d: "Software, access controls, and SSL are kept current, closing the gaps that attacks and data leaks rely on." },
            { t: "Backups & data integrity", d: "Seller, buyer, and deal records are backed up on a schedule and verified, so a failure or mistake never means lost data." },
            { t: "Priority support & changes", d: "Fixes and small improvements are handled first, so the platform keeps pace with how the business actually runs." },
          ].map((p, i) => (
            <div key={p.t} className="avoid-break bg-white px-4 py-3">
              <div className="flex gap-3">
                <span className="text-[11px] font-semibold tabular-nums text-primary">0{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{p.t}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-600">{p.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 px-5 text-[11px] leading-relaxed text-gray-600">
          <span className="font-semibold text-gray-800">What it avoids:</span> without ongoing care, small
          issues turn into outages, security gaps go unpatched, backups drift, and every change becomes a
          separate billable job. The retainer prevents that and keeps someone accountable for the platform at
          all times.
        </p>

        <div className="mx-5 mb-1 mt-4 flex gap-px border border-gray-200 bg-gray-200">
          <div className="flex-1 bg-gray-900 px-3 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">Monthly</p>
            <p className="mt-1 text-xs font-semibold tabular-nums text-white">GHS 1,200</p>
          </div>
          <div className="flex-1 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Quarterly · 5% off</p>
            <p className="mt-1 text-xs font-semibold tabular-nums text-gray-900">GHS 3,420</p>
          </div>
          <div className="flex-1 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Semi-annual · 10% off</p>
            <p className="mt-1 text-xs font-semibold tabular-nums text-gray-900">GHS 6,480</p>
          </div>
          <div className="flex-1 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Annual · 16.7% off</p>
            <p className="mt-1 text-xs font-semibold tabular-nums text-gray-900">GHS 12,000</p>
          </div>
        </div>

        <p className="mb-5 mt-3 px-5 text-[10px] italic leading-relaxed text-gray-500">
          The retainer begins after handover and renews automatically each billing cycle, cancellable with 30
          days&apos; notice.
        </p>
      </div>

      {/* Payment Schedule */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Payment Schedule</p>
        <div className="mt-4 divide-y divide-gray-200 border-y border-gray-300">
          <div className="avoid-break grid grid-cols-[140px_1fr_170px] gap-4 py-4">
            <div>
              <p className="text-xs font-semibold text-gray-900">Project Start</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Due before commencement</p>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              50% upfront deposit on the build fee, plus the first year of server hosting.
            </p>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums text-gray-900">GHS 4,000.00</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-primary">+ USD 204.00</p>
            </div>
          </div>
          <div className="avoid-break grid grid-cols-[140px_1fr_170px] gap-4 py-4">
            <div>
              <p className="text-xs font-semibold text-gray-900">Completion</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Due before final handoff</p>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              Remaining 50% build balance, payable on completion and before final handover (within the 3-week
              window).
            </p>
            <p className="text-right text-sm font-semibold text-gray-900">GHS 4,000.00</p>
          </div>
          <div className="avoid-break grid grid-cols-[140px_1fr_170px] gap-4 py-4">
            <div>
              <p className="text-xs font-semibold text-gray-900">Care Plan</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Recurring after handover</p>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              Platform Continuity &amp; Assurance Retainer: monitoring, security, backups, and priority on-call
              support.
            </p>
            <p className="text-right text-sm font-semibold text-gray-900">GHS 1,200.00 / mo</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <div className="w-72">
            <div className="flex justify-between py-1.5 text-xs">
              <span className="text-gray-600">Due at project start</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 4,000 + USD 204</span>
            </div>
            <div className="flex justify-between py-1.5 text-xs">
              <span className="text-gray-600">Due at completion</span>
              <span className="font-semibold tabular-nums text-gray-900">GHS 4,000.00</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-gray-300 pt-2 text-sm">
              <span className="font-semibold text-gray-900">Total build fee</span>
              <span className="font-bold tabular-nums text-primary">GHS 8,000.00</span>
            </div>
            <p className="mt-1 text-right text-[10px] text-gray-500">
              + USD 204 hosting (year 1) · GHS 1,200 / month retainer after handover
            </p>
          </div>
        </div>
      </div>

      {/* Payment details + notes */}
      <div className="avoid-break grid grid-cols-2 gap-5 border-t border-gray-300 pt-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">Payment Details</p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>Payment Type: Mobile Money Transfer</li>
            <li>Network: MTN</li>
            <li>Phone Number: 0539157613</li>
            <li>Name On Account: Richard Vinkpedomeh Somda</li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">Billing Notes</p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>Please include payment reference DYN52 in your payment confirmation.</li>
            <li>The build fee is a fixed price for the agreed launch scope.</li>
            <li>
              If you already have a domain we will point it to the platform; if not, we can acquire the one you
              want. Server hosting is a third-party Hostinger subscription that renews annually.
            </li>
          </ul>
        </div>
      </div>

      {/* Footer — system metadata + verify QR (dynamic on prepare) */}
      <DocumentFooter record={record} />
    </>
  );
}
