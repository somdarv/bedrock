import React from 'react';

// Registry of documents issued by Saharabase Technologies.
// Add an entry here for each document that should verify as authentic.
const REGISTRY = {
    'SAH-BD-20260630-BIL-DYN-52': {
        type: 'Fee Schedule',
        client: 'Dropyn Trading LLC',
        project: 'Commodity Sourcing & Lead-Management Platform',
        issueDate: '30 June 2026',
        issuedBy: 'Saharabase Technologies',
        status: 'Valid',
    },
};

export function generateStaticParams() {
    return Object.keys(REGISTRY).map((ref) => ({ ref }));
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-6 py-3 text-sm border-b border-gray-100 last:border-b-0">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-right text-gray-900">{value}</span>
        </div>
    );
}

export default function Page({ params }) {
    const ref = decodeURIComponent(params.ref || '');
    const record = REGISTRY[ref];

    return (
        <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-100">
            <div className="w-full max-w-md overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm">
                {/* Brand header */}
                <div className="px-6 py-5 bg-primary/10">
                    <h1 className="text-lg font-semibold leading-none text-gray-900">Saharabase Technologies</h1>
                    <p className="mt-1 text-xs text-gray-600">Document Authenticity Verification</p>
                </div>

                {record ? (
                    <div className="px-6 py-6">
                        {/* Verified badge */}
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-10 h-10 text-white rounded-full bg-emerald-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            <div>
                                <p className="text-base font-semibold text-gray-900">Authentic Document</p>
                                <p className="text-xs text-gray-500">This document was issued by Saharabase Technologies.</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-4 mt-5 border border-gray-100 rounded-lg bg-gray-50">
                            <Row label="Document ID" value={ref} />
                            <Row label="Type" value={record.type} />
                            <Row label="Issued To" value={record.client} />
                            <Row label="Project" value={record.project} />
                            <Row label="Issue Date" value={record.issueDate} />
                            <Row label="Status" value={record.status} />
                        </div>

                        <p className="mt-5 text-[11px] leading-relaxed text-gray-500">
                            Verified against the Saharabase document registry. For any questions about this document,
                            contact us at contact@saharabasetech.com.
                        </p>
                    </div>
                ) : (
                    <div className="px-6 py-6">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-10 h-10 text-white bg-gray-400 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </span>
                            <div>
                                <p className="text-base font-semibold text-gray-900">Document Not Found</p>
                                <p className="text-xs text-gray-500">We could not verify this document reference.</p>
                            </div>
                        </div>

                        <div className="p-4 mt-5 border border-gray-100 rounded-lg bg-gray-50">
                            <Row label="Reference Checked" value={ref || '—'} />
                            <Row label="Status" value="Unrecognized" />
                        </div>

                        <p className="mt-5 text-[11px] leading-relaxed text-gray-500">
                            If you believe this is an error, please contact Saharabase Technologies at
                            contact@saharabasetech.com to confirm the document reference.
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-3 text-[10px] text-gray-400 border-t border-gray-100">
                    www.saharabasetech.com
                </div>
            </div>
        </div>
    );
}
