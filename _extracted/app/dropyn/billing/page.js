'use client';

import React, { useRef, useState, useEffect } from 'react';
import Script from 'next/script';

const billingRef = 'SAH-BD-20260630-BIL-DYN-52';
const verifyUrl = `https://saharabasetech.com/verify/${billingRef}`;

function DetailRow({ label, value }) {
    return (
        <div className="flex justify-between gap-6 py-2 text-xs border-b border-gray-100 last:border-b-0">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-right text-gray-800">{value}</span>
        </div>
    );
}

function MiniBullet({ children }) {
    return (
        <li className="flex gap-2 text-[11px] leading-relaxed text-gray-600">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{children}</span>
        </li>
    );
}

export default function Page() {
    const invoiceRef = useRef();
    const [qrLoaded, setQrLoaded] = useState(false);

    const handleDownloadPDF = () => {
        window.print();
    };

    useEffect(() => {
        if (qrLoaded && typeof window !== 'undefined' && window.QRCode) {
            const el = document.getElementById('auth-qr');
            if (el) {
                el.innerHTML = '';
                new window.QRCode(el, {
                    text: verifyUrl,
                    width: 88,
                    height: 88,
                    colorDark: '#111827',
                    colorLight: '#ffffff',
                    correctLevel: window.QRCode.CorrectLevel.H,
                });
            }
        }
    }, [qrLoaded]);

    return (
        <div className="billing-page">
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
                strategy="afterInteractive"
                onLoad={() => setQrLoaded(true)}
            />
            <style jsx global>{`
                html { font-size: 18px; }

                /* Bump the hardcoded-pixel label sizes so they scale up with everything else */
                .billing-sheet .text-\\[8px\\]  { font-size: 9.5px; }
                .billing-sheet .text-\\[9px\\]  { font-size: 10.5px; }
                .billing-sheet .text-\\[10px\\] { font-size: 11.5px; }
                .billing-sheet .text-\\[11px\\] { font-size: 12.5px; }

                @media screen {
                    .billing-page {
                        background: #e5e5e5;
                        min-height: 100vh;
                        padding: 32px 0;
                    }
                    .billing-sheet {
                        background: #fff;
                        width: 100%;
                        max-width: 8.27in;
                        min-height: 11.69in;
                        margin: 0 auto;
                        padding: 0.55in;
                        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
                        font-family: var(--font-sora), system-ui, -apple-system, sans-serif;
                    }
                }

                /* Phone: fill the screen, trim margins, enlarge type, stack tight rows */
                @media screen and (max-width: 640px) {
                    html { font-size: 21px; }
                    .billing-page { padding: 0; }
                    .billing-sheet {
                        max-width: 100%;
                        min-height: 0;
                        padding: 16px 12px;
                        box-shadow: none;
                    }
                    .m-col { flex-direction: column !important; }
                    .m-col > * + * { margin-top: 14px; }
                    .m-stack { grid-template-columns: 1fr !important; }
                    .m-tier { flex-wrap: wrap !important; }
                    .m-tier > * { flex: 1 1 44% !important; }
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 0.65in 0.4in;
                    }
                    html, body {
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        font-size: 19px !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print { display: none !important; }
                    .billing-page {
                        background: #fff !important;
                        padding: 0 !important;
                    }
                    .billing-sheet {
                        width: 100% !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        background: #fff !important;
                        font-family: var(--font-sora), system-ui, -apple-system, sans-serif;
                    }
                    .avoid-break { page-break-inside: avoid; break-inside: avoid; }
                }
            `}</style>

            <div className="max-w-3xl mx-auto mb-4 no-print">
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                    Download / Print PDF
                </button>
                <p className="mt-2 text-xs text-gray-500">
                    Tip: choose <span className="font-semibold">Save as PDF</span> in the print dialog.
                </p>
            </div>

            <div ref={invoiceRef} className="billing-sheet">
                <p className="my-2 text-xs text-gray-500">{billingRef.toLowerCase()}@saharabasetech.com</p>

                {/* Header */}
                <div className="flex items-start justify-between p-4 mb-8 rounded-lg bg-primary/10 m-col">
                    <div>
                        <h1 className="mb-4 text-3xl font-semibold leading-none text-black text-uptown">Saharabase Technologies</h1>
                        <p className="text-xs text-gray-600">17 Alhaji Sulley Road,</p>
                        <p className="text-xs text-gray-600">Abelemkpe, Accra</p>
                        <p className="text-xs text-gray-600">contact@saharabasetech.com</p>
                        <p className="my-2 text-xs text-gray-600">www.saharabasetech.com</p>
                    </div>
                    <div className="w-64 text-right">
                        <h2 className="mb-2 text-xl font-semibold text-gray-800">Fee Schedule</h2>
                        <p className="text-xs text-gray-600">Billing Ref: {billingRef}</p>
                        <p className="text-xs text-gray-600">Issue Date: JUN 30, 2026</p>
                        <p className="text-xs text-gray-600">Valid Until: JUL 30, 2026</p>
                    </div>
                </div>

                {/* Bill To */}
                <div className="mb-10">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Bill To</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">Dropyn Trading LLC</p>
                        <p className="text-xs text-gray-600">Commodity Sourcing &amp; Trading</p>
                    </div>
                    <div className="p-4 mt-4 bg-white border rounded-lg border-primary/10">
                        <DetailRow label="Project Brief Ref" value="SAH-BD-20260630-PRO-52" />
                        <DetailRow label="Project Code" value="JUN2026-DYN" />
                        <DetailRow label="Billing Type" value="Custom Platform Build + Care Plan" />
                    </div>
                </div>

                {/* Project Investment */}
                <div className="mb-8 avoid-break">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Project Investment</p>
                    <h3 className="mt-2 text-2xl font-semibold leading-tight text-gray-900">Commodity Sourcing &amp; Lead-Management Platform</h3>
                    <p className="mt-2 text-xs leading-relaxed text-gray-600">
                        A custom web application that digitises Dropyn Trading&apos;s sourcing workflow end-to-end: a public-facing
                        website, structured seller and buyer intake, and a secure internal dashboard for managing every deal.
                    </p>

                    <table className="w-full mt-5 text-sm border-collapse">
                        <thead>
                            <tr className="text-left border-b border-gray-300">
                                <th className="py-3 font-semibold text-gray-600">Description</th>
                                <th className="py-3 font-semibold text-right text-gray-600">Amount</th>
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
                                        <MiniBullet>Deal status pipeline (New &rarr; In Review &rarr; Contacted &rarr; Negotiating &rarr; Closed), internal notes, and search / filter</MiniBullet>
                                        <MiniBullet>Automated team notifications, submitter auto-acknowledgement, testing, deployment, and handover</MiniBullet>
                                    </ul>
                                </td>
                                <td className="py-4 font-semibold text-right text-gray-900 align-top">GHS 8,000.00</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-end mt-6">
                        <div className="w-72">
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-gray-600">Development Subtotal</span>
                                <span className="font-semibold text-gray-900">GHS 8,000.00</span>
                            </div>
                            <div className="flex justify-between pt-3 mt-2 text-base border-t border-gray-300">
                                <span className="font-semibold text-gray-900">Total Build Fee</span>
                                <span className="font-bold text-primary">GHS 8,000.00</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery Window */}
                <div className="p-4 mb-8 bg-white border border-gray-200 rounded-lg avoid-break">
                    <div className="grid grid-cols-[150px_1fr] gap-6 m-stack">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Delivery Window</p>
                            <p className="mt-2 text-4xl font-semibold leading-none text-gray-900">3</p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">weeks (max)</p>
                        </div>
                        <div className="pl-5 border-l border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">A single delivery window through to handoff</p>
                            <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
                                A maximum of three weeks from confirmation of the upfront deposit, covering build, testing,
                                deployment, and handover as one coordinated cycle. Final timing depends on timely feedback,
                                content availability, and approvals.
                            </p>
                            <div className="flex mt-4 border-t border-gray-900">
                                {['Build', 'Testing', 'Deployment', 'Handover'].map((item, i) => (
                                    <div key={item} className="flex-1 pt-2 pr-3">
                                        <p className="text-[10px] font-semibold text-primary tabular-nums">0{i + 1}</p>
                                        <p className="mt-1 text-[11px] font-medium text-gray-800">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Care Plan / Retainer */}
                <div className="mb-8 bg-white border border-gray-200 border-t-2 border-t-primary avoid-break">
                    <div className="flex items-end justify-between gap-6 px-5 pt-5">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Care Plan</p>
                            <h3 className="mt-1 text-xl font-semibold text-gray-900">Platform Continuity &amp; Assurance Retainer</h3>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-3xl font-semibold leading-none text-gray-900 tabular-nums">GHS 1,200</p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">per month</p>
                        </div>
                    </div>

                    <p className="px-5 mt-3 text-xs leading-relaxed text-gray-700">
                        The retainer covers the ongoing work a live platform needs after launch: monitoring, security, backups,
                        and support. It keeps the system healthy and available while real deals move through it, and gives you
                        a fixed, predictable monthly cost instead of unplanned repair bills.
                    </p>

                    <div className="grid grid-cols-2 mx-5 mt-4 border border-gray-200 gap-px bg-gray-200 m-stack">
                        {[
                            { t: 'Uptime & performance monitoring', d: 'The platform is watched continuously, so slowdowns and outages are caught and fixed before they interrupt your team or a live deal.' },
                            { t: 'Security & patching', d: 'Software, access controls, and SSL are kept current, closing the gaps that attacks and data leaks rely on.' },
                            { t: 'Backups & data integrity', d: 'Seller, buyer, and deal records are backed up on a schedule and verified, so a failure or mistake never means lost data.' },
                            { t: 'Priority support & changes', d: 'Fixes and small improvements are handled first, so the platform keeps pace with how the business actually runs.' },
                        ].map((p, i) => (
                            <div key={p.t} className="px-4 py-3 bg-white">
                                <div className="flex gap-3">
                                    <span className="text-[11px] font-semibold text-primary tabular-nums">0{i + 1}</span>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900">{p.t}</p>
                                        <p className="mt-1 text-[11px] leading-relaxed text-gray-600">{p.d}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="px-5 mt-4 text-[11px] leading-relaxed text-gray-600">
                        <span className="font-semibold text-gray-800">What it avoids:</span> without ongoing care, small issues
                        turn into outages, security gaps go unpatched, backups drift, and every change becomes a separate billable
                        job. The retainer prevents that and keeps someone accountable for the platform at all times.
                    </p>

                    <div className="flex mx-5 mt-4 mb-1 border border-gray-200 gap-px bg-gray-200 m-tier">
                        <div className="flex-1 px-3 py-2 text-center bg-gray-900">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">Monthly</p>
                            <p className="mt-1 text-xs font-semibold text-white tabular-nums">GHS 1,200</p>
                        </div>
                        <div className="flex-1 px-3 py-2 text-center bg-white">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Quarterly &middot; 5% off</p>
                            <p className="mt-1 text-xs font-semibold text-gray-900 tabular-nums">GHS 3,420</p>
                        </div>
                        <div className="flex-1 px-3 py-2 text-center bg-white">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Semi-annual &middot; 10% off</p>
                            <p className="mt-1 text-xs font-semibold text-gray-900 tabular-nums">GHS 6,480</p>
                        </div>
                        <div className="flex-1 px-3 py-2 text-center bg-white">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Annual &middot; 16.7% off</p>
                            <p className="mt-1 text-xs font-semibold text-gray-900 tabular-nums">GHS 12,000</p>
                        </div>
                    </div>

                    <p className="px-5 pb-5 mt-3 text-[10px] italic leading-relaxed text-gray-500">
                        The retainer begins after handover and renews automatically each billing cycle, cancellable with 30 days&apos; notice.
                    </p>
                </div>

                {/* Hosting */}
                <div className="grid grid-cols-[1fr_180px] gap-px mb-8 border border-gray-200 bg-gray-200 avoid-break m-stack">
                    <div className="p-4 bg-white">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Server Hosting</p>
                        <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
                            The platform runs on a cloud server (VPS) rather than shared hosting. Because it is a server-rendered
                            application with its own database, admin login, and email delivery, it needs a dedicated environment for
                            reliable performance, security isolation, and room to scale as deal volume grows.
                        </p>
                        <div className="grid grid-cols-2 mt-3 border border-gray-200 gap-px bg-gray-200 m-stack">
                            <div className="p-3 bg-white">
                                <p className="text-xs font-semibold text-gray-900">Hostinger KVM 2 VPS</p>
                                <p className="mt-1 text-[11px] text-gray-600">Third-party cloud server (Hostinger) at USD 17 / month</p>
                                <p className="mt-2 text-xs font-semibold text-gray-900 tabular-nums">USD 204 / year</p>
                            </div>
                            <div className="p-3 bg-white">
                                <p className="text-xs font-semibold text-gray-900">Domain Name</p>
                                <p className="mt-1 text-[11px] text-gray-600">If you already have a domain, we point it to the platform. If not, we acquire the domain you want.</p>
                                <p className="mt-2 text-xs font-semibold text-gray-900">Flexible</p>
                            </div>
                        </div>
                        <p className="mt-3 text-[10px] italic leading-relaxed text-gray-500">
                            Hosting is a third-party Hostinger subscription (KVM 2 plan, USD 17/month = USD 204/year), billed at cost
                            and separate from the build fee and retainer. If you have a domain we point it to the platform at no extra charge; if not, we can acquire the one you want.
                        </p>
                    </div>

                    <div className="p-4 bg-white">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Hosting / Year</p>
                        <p className="mt-3 text-2xl font-semibold leading-none text-gray-900 tabular-nums">USD 204</p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-primary">Third-party</p>
                        <p className="mt-3 text-[11px] leading-relaxed text-gray-600">
                            First year payable with the upfront deposit so the server is provisioned before work begins.
                        </p>
                    </div>
                </div>

                {/* Payment Schedule */}
                <div className="mb-8 avoid-break">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Payment Schedule</p>
                    <div className="mt-4 border-gray-300 divide-y divide-gray-200 border-y">
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4 m-stack">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Project Start</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Due before commencement</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                50% upfront deposit on the build fee, plus the first year of server hosting.
                            </p>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900 tabular-nums">GHS 4,000.00</p>
                                <p className="mt-1 text-sm font-semibold text-primary tabular-nums">+ USD 204.00</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4 m-stack">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Completion</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Due before final handoff</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Remaining 50% build balance, payable on completion and before final handover (within the 3-week window).
                            </p>
                            <p className="text-sm font-semibold text-right text-gray-900">GHS 4,000.00</p>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4 m-stack">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Care Plan</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Recurring after handover</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Platform Continuity &amp; Assurance Retainer: monitoring, security, backups, and priority on-call support.
                            </p>
                            <p className="text-sm font-semibold text-right text-gray-900">GHS 1,200.00 / mo</p>
                        </div>
                    </div>

                    <div className="flex justify-end mt-5">
                        <div className="w-72">
                            <div className="flex justify-between py-1.5 text-xs">
                                <span className="text-gray-600">Due at project start</span>
                                <span className="font-semibold text-gray-900 tabular-nums">GHS 4,000 + USD 204</span>
                            </div>
                            <div className="flex justify-between py-1.5 text-xs">
                                <span className="text-gray-600">Due at completion</span>
                                <span className="font-semibold text-gray-900 tabular-nums">GHS 4,000.00</span>
                            </div>
                            <div className="flex justify-between pt-2 mt-1 text-sm border-t border-gray-300">
                                <span className="font-semibold text-gray-900">Total build fee</span>
                                <span className="font-bold text-primary tabular-nums">GHS 8,000.00</span>
                            </div>
                            <p className="mt-1 text-[10px] text-right text-gray-500">+ USD 204 hosting (year 1) &middot; GHS 1,200 / month retainer after handover</p>
                        </div>
                    </div>
                </div>

                {/* Payment details + notes */}
                <div className="grid grid-cols-2 gap-5 pt-5 border-t border-gray-300 avoid-break">
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
                            <li>If you already have a domain we will point it to the platform; if not, we can acquire the one you want. Server hosting is a third-party Hostinger subscription that renews annually.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-end justify-between gap-6 pt-6 mt-10 border-t border-gray-300">
                    <div className="text-xs text-gray-600">
                        <p>Approved by: Julitta Adanuse</p>
                        <p>Employee ID: SAH-BD-2020-07</p>
                        <p className="mt-2 text-gray-500">Document ID: {billingRef}</p>
                        <p className="text-gray-500">Generated on System: SAH-CRM-BIL-2026</p>
                        <p className="text-gray-500">Timestamp: 2026-06-30T10:00:00Z</p>
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                        <div id="auth-qr" className="flex items-center justify-center bg-white" style={{ width: '88px', height: '88px' }} />
                        <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-500">Scan to verify</p>
                        <p className="text-[8px] text-gray-400">saharabasetech.com/verify</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
