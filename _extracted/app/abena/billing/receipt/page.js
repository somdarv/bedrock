'use client';

import React, { useRef } from 'react';

const billingRef = 'SAH-BD-20260428-BIL-C360-51';
const receiptRef = 'SAH-RC-20260504-C360-51-01';

function DetailRow({ label, value }) {
    return (
        <div className="flex justify-between gap-6 py-2 text-xs border-b border-gray-100 last:border-b-0">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-right text-gray-800">{value}</span>
        </div>
    );
}

export default function Page() {
    const receiptRefEl = useRef();

    const handleDownloadPDF = () => {
        window.print();
    };

    const packageTotal = 3000;
    const amountPaid = 1200;
    const completionBalance = 1800;

    return (
        <div className="receipt-page">
            <style jsx global>{`
                @media screen {
                    .receipt-page {
                        background: #e5e5e5;
                        min-height: 100vh;
                        padding: 32px 0;
                    }
                    .receipt-sheet {
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
                    .receipt-page {
                        background: #fff !important;
                        padding: 0 !important;
                    }
                    .receipt-sheet {
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

            <div ref={receiptRefEl} className="receipt-sheet">
                <p className="my-2 text-xs text-gray-500">{receiptRef.toLowerCase()}@saharabasetech.com</p>

                <div className="flex items-start justify-between p-4 mb-8 rounded-lg bg-primary/10">
                    <div>
                        <h1 className="mb-4 text-3xl font-semibold leading-none text-black text-uptown">Saharabase Technologies</h1>
                        <p className="text-xs text-gray-600">17 Alhaji Sulley Road,</p>
                        <p className="text-xs text-gray-600">Abelemkpe, Accra</p>
                        <p className="text-xs text-gray-600">contact@saharabasetech.com</p>
                        <p className="my-2 text-xs text-gray-600">www.saharabasetech.com</p>
                    </div>
                    <div className="w-64 text-right">
                        <h2 className="mb-2 text-xl font-semibold text-gray-800">Payment Receipt</h2>
                        <p className="text-xs text-gray-600">Receipt Ref: {receiptRef}</p>
                        <p className="text-xs text-gray-600">Issue Date: MAY 04, 2026</p>
                        <p className="text-xs text-gray-600">Status: Payment Received</p>
                    </div>
                </div>

                <div className="mb-10">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Received From</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">Career 360 Consult</p>
                        <p className="text-xs text-gray-600">Career & Education Consultancy</p>
                    </div>
                    <div className="p-4 mt-4 bg-white border rounded-lg border-primary/10">
                        <DetailRow label="Billing Document Ref" value={billingRef} />
                        <DetailRow label="Project Brief Ref" value="SAH-BD-20260428-PRO-51" />
                        <DetailRow label="Project Code" value="APR2026-C360" />
                        <DetailRow label="Payment Reference" value="C36051" />
                    </div>
                </div>

                <div className="mb-8 avoid-break">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Amount Received</p>
                    <h3 className="mt-2 text-2xl font-semibold leading-tight text-gray-900">Development Cost Deposit — Payment Received</h3>
                    <p className="mt-2 text-xs leading-relaxed text-gray-600">
                        This receipt acknowledges receipt of the 40% development deposit from Career 360 Consult, clearing the initial deposit obligation for the agreed development scope as detailed in Billing Document {billingRef}. The third-party hosting and domain setup fee (USD 65.00) has not yet been paid and remains outstanding before work commences.
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
                                    <p className="font-semibold text-gray-900">Payment Received — Mobile Money Transfer</p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                                        40% development deposit received in full. Applied against the initial dev cost deposit for the Full Platform Support Package.
                                    </p>
                                </td>
                                <td className="py-4 font-semibold text-right text-gray-900 align-top">GHS 1,200.00</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-end mt-6">
                        <div className="w-80">
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-gray-600">Dev Cost Total</span>
                                <span className="font-semibold text-gray-900">GHS {packageTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-gray-600">Development Deposit Paid</span>
                                <span className="font-semibold text-gray-900">- GHS {amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm border-t border-gray-200 mt-1">
                                <span className="text-gray-600">Completion Balance (Dev)</span>
                                <span className="font-semibold text-gray-900">GHS {completionBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between pt-3 mt-2 text-sm border-t border-gray-300">
                                <span className="text-gray-600">Hosting &amp; Domain Setup</span>
                                <span className="font-semibold text-orange-600">USD 65.00 — Not yet paid</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 mb-8 border border-gray-200 rounded-lg bg-gray-50 avoid-break">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Payment Confirmation</p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="p-3 bg-white border border-gray-100 rounded">
                            <DetailRow label="Payment Method" value="Mobile Money Transfer" />
                            <DetailRow label="Network" value="MTN" />
                            <DetailRow label="Receiving Account" value="0539157613" />
                            <DetailRow label="Account Name" value="Richard V. Somda" />
                        </div>
                        <div className="p-3 bg-white border border-gray-100 rounded">
                            <DetailRow label="Transaction Date" value="May 04, 2026" />
                            <DetailRow label="Currency" value="GHS (Ghana Cedi)" />
                            <DetailRow label="Amount" value="1,200.00" />
                            <DetailRow label="Payment Reference" value="C36051" />
                        </div>
                    </div>
                </div>

                <div className="mb-8 avoid-break">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Updated Payment Schedule</p>
                    <div className="mt-4 border-gray-300 divide-y divide-gray-200 border-y">
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Project Start Deposit</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">40% Dev Cost</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Required development deposit before commencement of work.
                            </p>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">GHS 1,200.00</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Required</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4 bg-primary/5">
                            <div>
                                <p className="text-xs font-semibold text-primary">Received</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">May 04, 2026</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Development deposit paid in full (GHS 1,200.00). Deposit obligation cleared.
                            </p>
                            <p className="text-sm font-semibold text-right text-primary">- GHS 1,200.00</p>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Deposit Balance</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Dev Cost</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Development deposit is fully cleared. Work may commence once hosting and domain setup fee is also received.
                            </p>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">GHS 0.00</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-primary">Cleared</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4">
                            <div>
                                <p className="text-xs font-semibold text-orange-600">Hosting &amp; Domain</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">Setup Fee</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Initial third-party setup — domain name (career360consult.com) and application hosting, server, deployment, and SSL. Required before commencement alongside the deposit.
                            </p>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-orange-600">USD 65.00</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-orange-500">Not yet paid</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_170px] gap-4 py-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Completion</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">60% Balance</p>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Remaining development balance payable after completion and before final handover.
                            </p>
                            <p className="text-sm font-semibold text-right text-gray-900">GHS 1,800.00</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5 pt-5 border-t border-gray-300 avoid-break">
                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-700">Receipt Notes</p>
                        <ul className="space-y-1 text-xs text-gray-600">
                            <li>This receipt confirms GHS 1,200.00 received as the 40% development deposit against Billing Document {billingRef}.</li>
                            <li>The development deposit is now fully cleared. The USD 65.00 hosting and domain setup fee has not yet been paid and is required before commencement.</li>
                            <li>The completion balance of GHS 1,800.00 (60%) is due before final handover.</li>
                            <li>Please retain this receipt for your records.</li>
                        </ul>
                    </div>

                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-700">Acknowledgement</p>
                        <ul className="space-y-1 text-xs text-gray-600">
                            <li>Saharabase Technologies acknowledges receipt of the payment described in this document.</li>
                            <li>The full agreed scope, deliverables, and support terms remain as outlined in Billing Document {billingRef}.</li>
                            <li>For payment queries, contact contact@saharabasetech.com.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex items-start justify-between pt-6 mt-10 border-t border-gray-300">
                    <div className="text-xs text-gray-600">
                        <p>Approved by: Julitta Adanuse</p>
                        <p>Employee ID: SAH-BD-2020-07</p>
                    </div>
                    <div className="text-xs text-gray-500">
                        <p>Document ID: {receiptRef}</p>
                        <p>Generated on System: SAH-CRM-BIL-2026</p>
                        <p>Timestamp: 2026-05-04T10:00:00Z</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
