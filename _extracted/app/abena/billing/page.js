'use client';

import React, { useRef } from 'react';

const billingRef = 'SAH-BD-20260428-BIL-C360-51';

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

    const handleDownloadPDF = () => {
        window.print();
    };

    return (
        <div className="billing-page">
            <style jsx global>{`
                @media screen {
                    .billing-page {
                        background: #e5e5e5;
                        min-height: 100vh;
                        padding: 32px 0;
                    }
                    .billing-sheet {
                        background: #fff;
                        width: 8.27in;
                        min-height: 11.69in;
                        margin: 0 auto;
                        padding: 1in;
                        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
                        font-family: var(--font-sora), system-ui, -apple-system, sans-serif;
                    }
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 1in;
                    }
                    html, body {
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
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

                <div className="flex items-start justify-between p-4 mb-8 rounded-lg bg-primary/10">
                    <div>
                        <h1 className="mb-4 text-3xl font-semibold leading-none text-black text-uptown">Saharabase Technologies</h1>
                        <p className="text-xs text-gray-600">17 Alhaji Sulley Road,</p>
                        <p className="text-xs text-gray-600">Abelemkpe, Accra</p>
                        <p className="text-xs text-gray-600">contact@saharabasetech.com</p>
                        <p className="my-2 text-xs text-gray-600">www.saharabasetech.com</p>
                    </div>
                    <div className="w-64 text-right">
                        <h2 className="mb-2 text-xl font-semibold text-gray-800">Billing Document</h2>
                        <p className="text-xs text-gray-600">Billing Ref: {billingRef}</p>
                        <p className="text-xs text-gray-600">Issue Date: APR 28, 2026</p>
                        <p className="text-xs text-gray-600">Valid Until: MAY 28, 2026</p>
                    </div>
                </div>

                <div className="mb-10">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Bill To</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">Career 360 Consult</p>
                        <p className="text-xs text-gray-600">Career & Education Consultancy</p>
                    </div>
                    <div className="p-4 mt-4 bg-white border rounded-lg border-primary/10">
                        <DetailRow label="Project Brief Ref" value="SAH-BD-20260428-PRO-51" />
                        <DetailRow label="Project Code" value="APR2026-C360" />
                        <DetailRow label="Billing Type" value="Full Platform Support Package" />
                    </div>
                </div>

                <div className="mb-8 avoid-break">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Project Investment</p>
                    <h3 className="mt-2 text-2xl font-semibold leading-tight text-gray-900">Custom Consultancy Web Application</h3>
                    <p className="mt-2 text-xs leading-relaxed text-gray-600">
                        Selected package for the agreed launch scope, including the full platform build and first-year within-scope platform support.
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
                                    <p className="font-semibold text-gray-900">Full Platform Support Package</p>
                                    <ul className="mt-2 space-y-1">
                                        <MiniBullet>Public consultancy website and responsive interface</MiniBullet>
                                        <MiniBullet>Consultation application workflow and admin management dashboard</MiniBullet>
                                        <MiniBullet>Blog, resource library, success stories, Google Calendar / Meet setup, deployment, handover, and first-year within-scope support</MiniBullet>
                                    </ul>
                                </td>
                                <td className="py-4 font-semibold text-right text-gray-900 align-top">GHS 3,000.00</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-end mt-6">
                        <div className="w-72">
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-gray-600">Dev Cost Total</span>
                                <span className="font-semibold text-gray-900">GHS 3,000.00</span>
                            </div>
                            <div className="flex justify-between pt-3 mt-2 text-base border-t border-gray-300">
                                <span className="font-semibold text-gray-900">Total Dev Cost</span>
                                <span className="font-bold text-primary">GHS 3,000.00</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 mb-8 border border-gray-200 rounded-lg bg-gray-50 avoid-break">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Package Options</p>
                            <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
                                The selected package is shown above. Other package options are listed for pricing context only and are not billed in this document.
                            </p>
                        </div>
                        <p className="shrink-0 rounded bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Selected</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="p-3 bg-white border border-gray-200 rounded">
                            <p className="text-xs font-semibold text-gray-900">Core Launch Package</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">GHS 6,500.00</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-gray-500">Full build with basic launch handover and a short stabilization window.</p>
                        </div>
                        <div className="p-3 bg-white border rounded border-primary/40 ring-1 ring-primary/20">
                            <p className="text-xs font-semibold text-primary">Full Platform Support Package</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">GHS 3,000.00</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-gray-500">Selected package with full build and first-year within-scope support.</p>
                        </div>
                        <div className="p-3 bg-white border border-gray-200 rounded">
                            <p className="text-xs font-semibold text-gray-900">Growth & Optimization Package</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">GHS 12,000.00</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-gray-500">Full build with expanded support, content assistance, and optimization reviews.</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 mb-8 bg-white border border-gray-200 rounded-lg avoid-break">
                    <div className="grid grid-cols-[150px_1fr_150px] gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Support Period</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">First year</p>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-600">
                            After launch, Saharabase Technologies remains available for timely support on valid platform-related requests within the agreed project scope. This gives Career 360 Consult a practical review period to use the platform, identify small workflow improvements, request reasonable refinements, and receive guidance without treating every minor adjustment as a new project.
                        </p>
                        <div className="text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Status</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">Included</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-[1fr_180px] gap-4 mb-8 avoid-break">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Initial Third-Party Setup Cost</p>
                        <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
                            The initial setup purchase covers the first annual domain and hosting items required to start the project.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="p-3 border border-gray-100 rounded bg-gray-50">
                                <p className="text-xs font-semibold text-gray-900">Domain Name</p>
                                <p className="mt-1 text-[11px] text-gray-600">career360consult.com</p>
                                <p className="mt-2 text-xs font-semibold text-gray-900">USD 15.00</p>
                            </div>
                            <div className="p-3 border border-gray-100 rounded bg-gray-50">
                                <p className="text-xs font-semibold text-gray-900">Application Hosting</p>
                                <p className="mt-1 text-[11px] text-gray-600">Server, deployment, and SSL</p>
                                <p className="mt-2 text-xs font-semibold text-gray-900">USD 50.00</p>
                            </div>
                        </div>
                        <p className="mt-3 text-[10px] italic leading-relaxed text-gray-500">
                            Future annual renewals remain separate from the development fee and are billed when due.
                        </p>
                    </div>

                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Setup Total</p>
                        <p className="mt-3 text-2xl font-semibold leading-none text-gray-900">USD 65</p>
                        <p className="mt-3 text-[11px] leading-relaxed text-gray-600">
                            Payable together with the upfront development deposit before work begins.
                        </p>
                    </div>
                </div>

                <div className="mb-8 avoid-break">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Payment Schedule</p>
                    <div className="mt-4 border-gray-300 divide-y divide-gray-200 border-y">
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Project Start</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Due before commencement</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                40% upfront deposit for development, plus the initial third-party setup purchase.
                            </p>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">GHS 1,200.00</p>
                                <p className="mt-1 text-sm font-semibold text-primary">+ USD 65.00</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Completion</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Due before final launch</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Remaining 60% development balance payable after completion and before final handover.
                            </p>
                            <p className="text-sm font-semibold text-right text-gray-900">GHS 1,800.00</p>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Support Period</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">After launch</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Timely support for valid within-scope requests, platform guidance, and reasonable refinements during the included support period.
                            </p>
                            <p className="text-sm font-semibold text-right text-gray-900">Included</p>
                        </div>
                    </div>
                </div>

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
                            <li>Please include payment reference C36051 in payment confirmation.</li>
                            <li>This bill covers the agreed launch scope only.</li>
                            <li>Included support covers reasonable within-scope updates, corrections, and guidance for the delivered platform.</li>
                            <li>Major changes or future expansion features will be quoted separately.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex items-start justify-between pt-6 mt-10 border-t border-gray-300">
                    <div className="text-xs text-gray-600">
                        <p>Approved by: Julitta Adanuse</p>
                        <p>Employee ID: SAH-BD-2020-07</p>
                    </div>
                    <div className="text-xs text-gray-500">
                        <p>Document ID: {billingRef}</p>
                        <p>Generated on System: SAH-CRM-BIL-2026</p>
                        <p>Timestamp: 2026-04-28T14:37:26Z</p>
                    </div>
                </div>
            </div>
        </div>
    );
}