'use client'

import React, { useRef } from 'react';

export default function page() {
    const proposalRef = useRef();

    const handleDownloadPDF = () => {
        // Native browser print → "Save as PDF" gives true vector text & perfect formatting.
        window.print();
    };

    // Reusable section header
    const SectionHeader = ({ number, title, kicker }) => (
        <div className="mt-10 mb-6">
            <div className="flex items-center gap-3">
                <span
                    className="inline-flex items-center justify-center text-xs font-bold text-white rounded-full bg-primary shrink-0"
                    style={{ width: '32px', height: '32px', lineHeight: 1 }}
                >
                    {number}
                </span>
                <h2 className="text-2xl font-semibold leading-none text-gray-900">{title}</h2>
            </div>
            {kicker && (
                <p className="mt-2 ml-11 text-[11px] tracking-[0.2em] uppercase text-gray-500">
                    {kicker}
                </p>
            )}
            <div className="w-12 h-px mt-3 ml-11 bg-primary/40" />
        </div>
    );

    const Bullet = ({ children }) => (
        <li className="flex items-start gap-3 my-2 text-sm text-gray-700">
            <span className="mt-2 inline-block w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span>{children}</span>
        </li>
    );

    const ArchitectureFlowIllustration = () => {
        const publicLayers = [
            { title: 'Service Pages', detail: 'Visitors explore offers' },
            { title: 'Content Hub', detail: 'Guides, articles, resources' },
            { title: 'Application Forms', detail: 'Structured consultation intake' },
        ];

        const operationsLayers = [
            { title: 'Admin Dashboard', detail: 'Review incoming requests' },
            { title: 'Workflow Control', detail: 'Approve, decline, assign next steps' },
            { title: 'Scheduling Tools', detail: 'Calendar, Meet, client updates' },
        ];

        const StackPanel = ({ label, layers, tone }) => {
            const isDark = tone === 'dark';

            return (
                <div className={isDark ? 'text-white' : 'text-gray-900'}>
                    <p className={isDark ? 'text-[10px] font-semibold tracking-widest uppercase text-white/60' : 'text-[10px] font-semibold tracking-widest uppercase text-primary'}>
                        {label}
                    </p>
                    <div className="mt-3 space-y-2">
                        {layers.map((layer, index) => (
                            <div key={layer.title} className="relative">
                                <div
                                    className={isDark ? 'absolute h-full rounded-md border border-white/10 bg-white/5' : 'absolute h-full rounded-md border border-primary/10 bg-primary/5'}
                                    style={{ left: `${8 + index * 2}px`, right: `${8 - index * 2}px`, top: '6px' }}
                                />
                                <div className={isDark ? 'relative rounded-md border border-white/10 bg-gray-900 px-3 py-2 shadow-sm' : 'relative rounded-md border border-primary/20 bg-white px-3 py-2 shadow-sm'}>
                                    <p className={isDark ? 'text-xs font-semibold text-white' : 'text-xs font-semibold text-gray-900'}>{layer.title}</p>
                                    <p className={isDark ? 'mt-0.5 text-[10px] leading-snug text-white/65' : 'mt-0.5 text-[10px] leading-snug text-gray-600'}>{layer.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

        return (
            <div className="mt-5 overflow-hidden bg-white border rounded-lg avoid-break border-primary/10">
                <div className="p-5">
                    <div className="grid items-center gap-3" style={{ gridTemplateColumns: '1fr 120px 1fr' }}>
                        <StackPanel label="Public stack" layers={publicLayers} />

                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Info Flow</p>

                            <div className="w-full rounded-full bg-primary/10 px-3 py-1.5 text-center text-[10px] font-semibold text-primary">
                                Requests
                            </div>
                            <div className="flex items-center w-full">
                                <span className="flex-1 h-px bg-primary/40" />
                                <span className="h-0 w-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-primary/60" />
                            </div>

                            <div className="relative flex h-[78px] w-[100px] flex-col items-center justify-center overflow-hidden rounded-[18px] border border-gray-300 bg-gray-50 text-center shadow-sm">
                                <div className="absolute left-0 top-0 h-5 w-full rounded-[50%] border-b border-gray-300 bg-white" />
                                <div className="relative z-10 px-2 mt-2">
                                    <p className="text-[10px] font-semibold leading-tight text-gray-900">Owned Data</p>
                                    <p className="mt-1 text-[9px] leading-tight text-gray-500">Requests, content, schedules</p>
                                </div>
                            </div>

                            <div className="flex items-center w-full">
                                <span className="h-0 w-0 border-y-[4px] border-r-[7px] border-y-transparent border-r-gray-500/70" />
                                <span className="flex-1 h-px bg-gray-400/70" />
                            </div>
                            <div className="w-full rounded-full bg-gray-900 px-3 py-1.5 text-center text-[10px] font-semibold text-white">
                                Updates
                            </div>
                        </div>

                        <StackPanel label="Operations stack" layers={operationsLayers} tone="dark" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 mt-5 border-t border-gray-100">
                        {[
                            { title: 'Apply', detail: 'Client submits a structured request' },
                            { title: 'Review', detail: 'Team qualifies and manages the case' },
                            { title: 'Respond', detail: 'Content, decisions, and sessions return to the client' },
                        ].map((step) => (
                            <div key={step.title} className="px-3 py-2 rounded-md bg-primary/5">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{step.title}</p>
                                <p className="mt-1 text-[10px] leading-snug text-gray-600">{step.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const ConsultationWorkflowIllustration = () => {
        const stages = [
            {
                number: '01',
                title: 'Apply',
                owner: 'Client',
                detail: 'A consultation request is submitted through the public form.',
            },
            {
                number: '02',
                title: 'Capture',
                owner: 'Platform',
                detail: 'The application is stored and the applicant receives confirmation.',
            },
            {
                number: '03',
                title: 'Review',
                owner: 'Admin',
                detail: 'The request is reviewed and qualified inside the dashboard.',
            },
            {
                number: '04',
                title: 'Schedule',
                owner: 'Admin',
                detail: 'If approved, an available advisory slot is selected.',
            },
            {
                number: '05',
                title: 'Invite',
                owner: 'Platform',
                detail: 'Calendar event, Meet link, and client invitation are sent.',
            },
        ];

        return (
            <div className="py-4 mt-5 border-gray-200 border-y avoid-break">
                <div className="grid grid-cols-[130px_1fr] gap-5">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Workflow</p>
                        <p className="mt-2 text-xs font-semibold leading-snug text-gray-900">Application to confirmed session</p>
                    </div>

                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                        {stages.map((stage) => (
                            <div key={stage.number} className="grid grid-cols-[32px_96px_1fr] gap-3 py-2.5">
                                <p className="text-[10px] font-semibold text-primary tabular-nums">{stage.number}</p>
                                <div>
                                    <p className="text-xs font-semibold leading-tight text-gray-900">{stage.title}</p>
                                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-gray-500">{stage.owner}</p>
                                </div>
                                <p className="text-[10px] leading-relaxed text-gray-600">{stage.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-[130px_1fr] gap-5 border-t border-gray-100 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Decision</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="pl-3 border-l border-gray-300">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Declined</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-gray-600">Applicant receives a clear status update.</p>
                        </div>
                        <div className="pl-3 border-l border-primary/40">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Approved</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-gray-600">Meeting slot, calendar event, and invitation are prepared.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="proposal-page">
            {/* Print styles: Google Docs-style A4 with proper margins */}
            <style jsx global>{`
                @media screen {
                    .proposal-page {
                        background: #e5e5e5;
                        min-height: 100vh;
                        padding: 32px 0;
                    }
                    .proposal-sheet {
                        background: #fff;
                        width: 8.27in;
                        min-height: 11.69in;
                        margin: 0 auto;
                        padding: 1in 1in;
                        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
                        font-family: var(--font-sora), system-ui, -apple-system, sans-serif;
                    }
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 1in 1in;
                    }
                    html, body {
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print { display: none !important; }
                    .proposal-page {
                        background: #fff !important;
                        padding: 0 !important;
                    }
                    .proposal-sheet {
                        width: 100% !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        background: #fff !important;
                        font-family: var(--font-sora), system-ui, -apple-system, sans-serif;
                    }
                    .page-break { page-break-before: always; break-before: page; }
                    .avoid-break { page-break-inside: avoid; break-inside: avoid; }
                    h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
                }
            `}</style>

            {/* Download Button */}
            <div className="max-w-3xl mx-auto mb-4 no-print">
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                    Download / Print PDF
                </button>
                <p className="mt-2 text-xs text-gray-500">
                    Tip: in the print dialog, choose <span className="font-semibold">Save as PDF</span> as the destination for a clean, vector-quality file.
                </p>
            </div>

            <div ref={proposalRef} className="proposal-sheet">
                <p className='my-2 text-xs'>SAH-BD-20260428-PRO-51-c360-7f9a2b1e8c4d@saharabasetech.com</p>

                {/* Header */}
                <div className="flex items-start justify-between p-4 mb-8 rounded-lg bg-primary/10">
                    <div>
                        <h1 className='mb-4 text-3xl font-semibold leading-none text-black text-uptown'>Saharabase Technologies</h1>
                        <p className="text-xs text-gray-600">17 Alhaji Sulley Road,</p>
                        <p className="text-xs text-gray-600">Abelemkpe, Accra</p>
                        <p className="text-xs text-gray-600">contact@saharabasetech.com</p>
                        <p className="my-2 text-xs text-gray-600">www.saharabasetech.com</p>
                    </div>
                    <div className="w-64 text-right">
                        <h2 className="mb-2 text-xl font-semibold text-gray-800 font-bol">Project Brief</h2>
                        <p className="text-xs text-gray-600">APR2026-C360</p>
                        <p className="text-xs text-gray-600">Issue Date: APR 28, 2026</p>
                        <p className="text-xs text-gray-600">Valid Until: MAY 28, 2026</p>
                    </div>
                </div>

                <div className='flex items-start justify-between'>
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-600 mb-">Proposed To:</h3>
                        <p className="font-semibold text-gray-800">Career 360 Consult</p>
                        <p className="text-sm text-gray-600">Career & Education Consultancy</p>
                    </div>
                </div>

                {/* Cover / Subject Block */}
                <div className='flex items-end mt-32 h-96'>
                    <div className='w-[95%] bg-red-2'>
                        <p className='text-[10px] tracking-[0.3em] uppercase text-gray-500 mb-3'>
                            Project Proposal: Custom Web Application
                        </p>
                        <p className='text-3xl leading-tight text-gray-900'>
                            <span className='font-semibold'>Design & Development of a Custom Consultancy Web Application</span>
                            <span className='block mt-2 text-base font-normal text-gray-600'>
                                A digital operating system for Career 360 Consult.
                            </span>
                        </p>
                    </div>
                </div>

                {/* Section 1: Executive Summary */}
                <div className='mt- page-break'>
                    <SectionHeader number="01" kicker="Overview" title="Executive Summary" />

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        This project involves the design and development of a custom-built web application
                        to power your career and education consultancy at Career 360 Consult.
                    </p>

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        Unlike traditional websites that simply display information, your platform will
                        function as a digital operating system for the consultancy, combining four
                        capabilities under one roof:
                    </p>

                    <div className="grid grid-cols-2 gap-3 my-5">
                        {[
                            { t: 'Public Presence', d: 'A polished professional face for your brand.' },
                            { t: 'Application System', d: 'Structured intake for consultation requests.' },
                            { t: 'Client Workflow', d: 'Internal management of every enquiry.' },
                            { t: 'Publishing Platform', d: 'Educational content and authority building.' },
                        ].map((c, i) => (
                            <div key={i} className="p-4 bg-white border rounded-lg border-primary/10">
                                <p className="text-xs font-semibold text-primary">{c.t}</p>
                                <p className="mt-1 text-xs text-gray-600">{c.d}</p>
                            </div>
                        ))}
                    </div>

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        The objective is to create a highly controlled, scalable, and data-owned platform
                        that lets you manage consultation requests, schedule advisory sessions, publish
                        your expertise, and build long-term authority in the career and education
                        consulting space.
                    </p>

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        Your platform will be fully custom engineered, avoiding heavy reliance on
                        third-party systems, ensuring you retain full control over your data,
                        operations, and future expansion.
                    </p>
                </div>

                {/* Section 2: Architecture */}
                <div className='mt-32'>
                    <SectionHeader number="02" kicker="System design" title="Platform Architecture" />

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        Your platform is built in clear, separate parts that fit together, structured
                        into two major layers that work seamlessly.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-5">
                        <div className="p-5 border rounded-lg bg-primary/10 border-primary/20">
                            <p className="text-[10px] tracking-widest uppercase text-primary font-semibold">Layer 01</p>
                            <p className="mt-2 text-base font-semibold text-gray-900">Public Experience</p>
                            <p className="mt-2 text-xs leading-relaxed text-gray-700">
                                The public interface where visitors discover your services, consume your
                                content, and apply for consultations.
                            </p>
                        </div>
                        <div className="p-5 border border-gray-900 rounded-lg bg-gray-900/95">
                            <p className="text-[10px] tracking-widest uppercase text-white/70 font-semibold">Layer 02</p>
                            <p className="mt-2 text-base font-semibold text-white">Internal Operations</p>
                            <p className="mt-2 text-xs leading-relaxed text-white/80">
                                A secure administrative environment where you manage consultation requests,
                                publish content, and schedule advisory sessions.
                            </p>
                        </div>
                    </div>

                    <ArchitectureFlowIllustration />
                </div>

                {/* Section 3: Core Modules */}
                <div>
                    <SectionHeader number="03" kicker="What you get" title="Core Platform Modules" />

                    {/* 4.1 */}
                    <div className="p-5 mt-2 bg-white border rounded-lg border-primary/10">
                        <p className="text-[10px] tracking-widest text-primary font-semibold">MODULE 4.1</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">Consultation Application Engine</p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-600">
                            Instead of allowing instant booking, your platform introduces an
                            application-based consultation model. This ensures your advisory time is
                            allocated only to relevant and qualified clients.
                        </p>

                        <ConsultationWorkflowIllustration />

                        <p className="mt-4 text-xs font-semibold text-gray-700">Workflow</p>
                        <ol className="mt-2 space-y-1.5">
                            {[
                                'Prospective client submits a consultation application.',
                                'The application is securely stored in your platform database.',
                                'The applicant receives a confirmation notification.',
                                'You review the application inside your administrative dashboard.',
                                'The application is approved or declined.',
                                'If approved, you select an available meeting slot.',
                                'The system automatically creates a Google Calendar event.',
                                'A Google Meet session link is generated.',
                                'The applicant receives the meeting invitation.',
                            ].map((step, i) => (
                                <li key={i} className="flex gap-3 text-xs text-gray-700">
                                    <span className="w-5 font-semibold text-primary">{i + 1}.</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>

                        <p className='mt-4 text-xs italic text-gray-600'>
                            This workflow transforms consultation management from manual coordination into
                            a structured digital process.
                        </p>
                    </div>

                    {/* 4.2 */}
                    <div className="p-5 mt-4 bg-white border rounded-lg border-primary/10">
                        <p className="text-[10px] tracking-widest text-primary font-semibold">MODULE 4.2</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">Consultation Management Dashboard</p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-600">
                            A dedicated administrative interface giving you central control over incoming
                            requests and platform content. Through this dashboard, you will be able to:
                        </p>
                        <ul className="mt-3">
                            <Bullet>review consultation applications</Bullet>
                            <Bullet>approve or reject applicants</Bullet>
                            <Bullet>schedule advisory sessions</Bullet>
                            <Bullet>generate Google Meet consultation sessions</Bullet>
                            <Bullet>track scheduled consultations</Bullet>
                            <Bullet>manage blog content</Bullet>
                            <Bullet>publish educational resources</Bullet>
                            <Bullet>showcase client success stories</Bullet>
                        </ul>
                    </div>

                    {/* 4.3 */}
                    <div className="p-5 mt-4 bg-white border rounded-lg border-primary/10">
                        <p className="text-[10px] tracking-widest text-primary font-semibold">MODULE 4.3</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">Educational Content Publishing System</p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-600">
                            A built-in content management system that lets you publish:
                        </p>
                        <ul className="mt-3">
                            <Bullet>educational blog articles</Bullet>
                            <Bullet>career guidance content</Bullet>
                            <Bullet>scholarship preparation insights</Bullet>
                            <Bullet>study abroad preparation resources</Bullet>
                        </ul>
                        <p className='mt-4 text-xs italic text-gray-600'>
                            This component positions you as a knowledge authority within your domain.
                        </p>
                    </div>

                    {/* 4.4 */}
                    <div className="p-5 mt-4 bg-white border rounded-lg border-primary/10">
                        <p className="text-[10px] tracking-widest text-primary font-semibold">MODULE 4.4</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">Resource Library</p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-600">
                            A structured repository for your educational materials. Supported formats may
                            include:
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            {[
                                'Downloadable guides',
                                'Reference documents',
                                'Video content',
                                'Curated external resources',
                                'Audio explanations',
                            ].map((f, i) => (
                                <div key={i} className="px-3 py-2 text-xs text-gray-700 rounded bg-primary/5">
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4.5 */}
                    <div className="p-5 mt-4 bg-white border rounded-lg border-primary/10">
                        <p className="text-[10px] tracking-widest text-primary font-semibold">MODULE 4.5</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">Success Story Showcase</p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-600">
                            A dedicated module to display your client outcomes and advisory impact.
                            Examples include:
                        </p>
                        <ul className="mt-3">
                            <Bullet>successful university admissions</Bullet>
                            <Bullet>scholarship awards</Bullet>
                            <Bullet>career transitions</Bullet>
                            <Bullet>job placements</Bullet>
                            <Bullet>academic achievements</Bullet>
                        </ul>
                        <p className='mt-4 text-xs italic text-gray-600'>
                            This component strengthens credibility and demonstrates measurable value.
                        </p>
                    </div>
                </div>

                {/* Section 4: Data Ownership */}
                <div>
                    <SectionHeader number="04" kicker="Independence" title="Data Ownership Philosophy" />

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        Your platform is designed to maintain maximum data ownership and operational
                        independence.
                    </p>

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        Key operational data, including consultation requests, scheduling records, blog
                        content, and resources, will be stored within your own platform infrastructure
                        rather than locked inside third-party systems.
                    </p>

                    <div className="grid grid-cols-3 gap-3 my-5">
                        {[
                            { t: 'Long-term Flexibility', d: 'Adapt the platform as your consultancy evolves.' },
                            { t: 'System Extensibility', d: 'Build on top of what you own, without limits.' },
                            { t: 'Full Control', d: 'Your data lives where you decide it lives.' },
                        ].map((c, i) => (
                            <div key={i} className="p-4 text-center bg-white border rounded-lg border-primary/10">
                                <p className="text-xs font-semibold text-primary">{c.t}</p>
                                <p className="mt-2 text-[11px] text-gray-600 leading-snug">{c.d}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 5: Deliverables */}
                <div>
                    <SectionHeader number="05" kicker="What's included" title="Deliverables" />

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        The following deliverables are included in your project scope:
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {[
                            'Custom web application design',
                            'Responsive mobile and desktop interface',
                            'Consultation application engine',
                            'Consultation management dashboard',
                            'Google Calendar scheduling integration',
                            'Google Meet session generation',
                            'Blog publishing module',
                            'Resource management module',
                            'Success story showcase',
                            'Contact enquiry system',
                            'Basic search engine optimization setup',
                            'Application deployment and configuration',
                        ].map((d, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 bg-white border rounded border-primary/10">
                                <span className="text-primary">✓</span>
                                <span>{d}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 6: Project Guardrails */}
                <div>
                    <SectionHeader number="06" kicker="Working terms" title="Project Guardrails" />

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        These working terms keep the project clear, practical, and protected on both sides.
                    </p>

                    <div className="mt-5 divide-y divide-gray-200 border-y border-gray-200">
                        {[
                            {
                                title: 'Project Assumptions',
                                points: [
                                    'Client provides final logo, brand assets, service details, and page content required for launch.',
                                    'Client provides or authorizes access to domain, email sender, Google Calendar / Meet, and required third-party accounts.',
                                    'Delivery timing depends on timely feedback, content availability, and approval of key screens.',
                                ],
                            },
                            {
                                title: 'Scope Boundaries',
                                points: [
                                    'Future expansion items listed in this brief are roadmap options and are not included in the current build unless separately approved.',
                                    'Paid ads, long-term content creation, payment gateway setup, advanced CRM features, and data migration are outside this scope.',
                                    'Major feature changes after approval may affect timeline and cost.',
                                ],
                            },
                            {
                                title: 'Launch Support',
                                points: [
                                    'Includes deployment, production configuration, SSL setup, and a final walkthrough of the admin workflow.',
                                    'Includes basic handover guidance for managing requests, content, resources, and success stories.',
                                    'Includes a short post-launch correction window for defects related to the agreed build scope.',
                                ],
                            },
                        ].map((block) => (
                            <div key={block.title} className="grid grid-cols-[170px_1fr] gap-5 py-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{block.title}</p>
                                </div>
                                <ul className="space-y-2">
                                    {block.points.map((point) => (
                                        <li key={point} className="flex gap-2 text-xs leading-relaxed text-gray-700">
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 7: Package Comparison */}
                <div>
                    <SectionHeader number="07" kicker="Support options" title="Package Comparison" />

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        All packages include the full agreed platform build. The difference is the level
                        of post-launch support, content assistance, refinements, and long-term platform
                        care included after launch.
                    </p>

                    <div className="mt-5 overflow-hidden bg-white border rounded-lg avoid-break border-primary/10">
                        <div className="grid grid-cols-[160px_1fr_1fr_1fr] border-b border-gray-200 bg-gray-50 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                            <div className="p-3">Package Area</div>
                            <div className="p-3">Core Launch</div>
                            <div className="p-3 text-primary">Full Platform Support</div>
                            <div className="p-3">Growth & Optimization</div>
                        </div>

                        {[
                            ['Full agreed platform build', 'Included', 'Included', 'Included'],
                            ['Admin handover', 'Basic guidance', 'Guided walkthrough', 'Guided walkthrough'],
                            ['Support duration', 'Short stabilization window', 'First full year', 'Expanded support period'],
                            ['Post-launch corrections', 'Clearly defined correction requests', 'Reasonable within-scope updates', 'Reasonable updates plus growth support'],
                            ['Content upload assistance', 'Client-managed', 'Included for ready content', 'Expanded assistance'],
                            ['Platform checks', 'Launch check only', 'Periodic checks', 'Optimization reviews'],
                            ['Advanced growth features', 'Discuss separately', 'Discuss separately', 'Selected features can be included'],
                        ].map(([area, core, support, growth]) => (
                            <div key={area} className="grid grid-cols-[160px_1fr_1fr_1fr] border-b border-gray-100 last:border-b-0 text-[11px] leading-relaxed text-gray-700">
                                <div className="p-3 font-semibold text-gray-900">{area}</div>
                                <div className="p-3">{core}</div>
                                <div className="p-3 bg-primary/5 font-medium text-gray-900">{support}</div>
                                <div className="p-3">{growth}</div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-4 border-l-2 border-primary/40 pl-3 text-xs leading-relaxed text-gray-600">
                        The Full Platform Support Package is recommended because it covers the first full
                        year of real platform use, while keeping support limited to valid within-scope
                        updates, corrections, content uploads, and platform guidance.
                    </p>
                </div>

                {/* Section 8: Future Expansion */}
                <div>
                    <SectionHeader number="08" kicker="Roadmap" title="Future Expansion Opportunities" />

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        Your platform architecture will support future upgrades that can be implemented as
                        your consultancy grows:
                    </p>

                    <ul className="mt-4">
                        <Bullet>paid consultation scheduling</Bullet>
                        <Bullet>payment gateway integration</Bullet>
                        <Bullet>digital course distribution</Bullet>
                        <Bullet>client portal access</Bullet>
                        <Bullet>automated appointment scheduling</Bullet>
                        <Bullet>analytics dashboards</Bullet>
                        <Bullet>marketing automation tools</Bullet>
                    </ul>
                </div>

                {/* Section 9: Timeline */}
                <div>
                    <SectionHeader number="09" kicker="Schedule" title="Estimated Development Timeline" />

                    <div className="py-5 mt-4 border-y border-gray-900/20 avoid-break">
                        <div className="grid grid-cols-[150px_1fr] gap-6">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">Estimated window</p>
                                <p className="mt-2 text-4xl font-semibold leading-none text-gray-900">3 to 4</p>
                                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">weeks</p>
                            </div>

                            <div className="pl-5 border-l border-gray-200">
                                <p className="text-sm font-semibold text-gray-900">A single delivery window for the full build</p>
                                <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
                                    This estimate covers planning, interface design, application development,
                                    testing, deployment, and handover as one coordinated implementation cycle.
                                </p>

                                <div className="grid grid-cols-3 gap-2 mt-4">
                                    {[
                                        'Planning',
                                        'Interface design',
                                        'Application build',
                                        'Testing',
                                        'Deployment',
                                        'Handover',
                                    ].map((item) => (
                                        <div key={item} className="border border-gray-200 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                                            {item}
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-4 border-l-2 border-primary/40 pl-3 text-[11px] italic leading-relaxed text-gray-500">
                                    Final timing may vary depending on content availability, approvals, and feedback cycles.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 10: Engineering & Running Costs */}
                <div>
                    <SectionHeader number="10" kicker="Investment" title="Engineering & Running Costs" />

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        Beyond the one-time build, your platform has an intentionally lean ongoing cost
                        structure. We engineer the system to operate within the free tiers of trusted
                        third-party services so you don't carry recurring infrastructure bills as you grow.
                    </p>

                    {/* Annual recurring */}
                    <div className="p-5 mt-5 bg-white border rounded-lg border-primary/10">
                        <p className="text-[10px] tracking-widest text-primary font-semibold">ANNUAL RECURRING COSTS</p>
                        <div className="mt-3 divide-y divide-gray-100">
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Domain Name</p>
                                    <p className="text-xs text-gray-600">career360consult.com, yearly registration</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">$15 / year</p>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Application Hosting</p>
                                    <p className="text-xs text-gray-600">Production server, deployment, and SSL</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">$50 / year</p>
                            </div>
                            <div className="flex items-center justify-between py-4 mt-1 border-t-2 border-primary/30">
                                <p className="text-sm font-semibold text-gray-900">Total Annual Running Cost</p>
                                <p className="text-lg font-bold text-primary">$65 / year</p>
                            </div>
                        </div>
                    </div>

                    {/* Cost savings highlight */}
                    <div className="p-5 mt-4 border rounded-lg bg-primary/10 border-primary/20">
                        <p className="text-[10px] tracking-widest text-primary font-semibold">ENGINEERED FOR ZERO HIDDEN COSTS</p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-800">
                            Your platform integrates several professional third-party services. Rather than
                            putting you on paid plans by default, we architect the system to stay within the
                            free usage limits of each one, so you get enterprise-grade capability without
                            enterprise-grade bills.
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {[
                                { name: 'Cloudinary', use: 'Image & media storage / delivery', tier: 'Free tier optimized' },
                                { name: 'Google Calendar API', use: 'Consultation scheduling', tier: 'Free' },
                                { name: 'Google Meet', use: 'Video consultation sessions', tier: 'Free' },
                                { name: 'Gmail SMTP / Resend', use: 'Transactional email delivery', tier: 'Free tier optimized' },
                            ].map((s, i) => (
                                <div key={i} className="p-3 bg-white border rounded border-primary/10">
                                    <p className="text-xs font-semibold text-gray-900">{s.name}</p>
                                    <p className="text-[11px] text-gray-600 mt-0.5">{s.use}</p>
                                    <p className="text-[10px] tracking-wider uppercase text-primary mt-1.5">{s.tier}</p>
                                </div>
                            ))}
                        </div>

                        <p className="mt-4 text-xs italic text-gray-700">
                            Should your usage one day exceed any free tier (a sign of strong growth), each
                            service offers transparent paid plans you can opt into individually. You stay
                            in control, and you only pay for what you actually need.
                        </p>
                    </div>

                    {/* Billing reference */}
                    <div className="p-4 mt-4 border-l-4 rounded bg-gray-50 border-primary">
                        <p className="text-xs font-semibold tracking-widest uppercase text-primary">Project Billing</p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">
                            The full development investment for this project is quoted in a separate billing
                            document, referenced as{' '}
                            <span className="font-semibold text-gray-900">SAH-BD-20260428-BIL-C360-51</span>,
                            issued alongside this proposal.
                        </p>
                    </div>
                </div>

                {/* Section 11: Expected Outcome */}
                <div>
                    <SectionHeader number="11" kicker="The result" title="Expected Outcome" />

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        On completion, you will have a custom-built web application that digitizes your
                        consulting workflow end-to-end.
                    </p>

                    <p className='my-3 text-sm leading-relaxed text-gray-700'>
                        Your platform will enable you to:
                    </p>

                    <ul className="mt-3">
                        <Bullet>attract and qualify potential clients</Bullet>
                        <Bullet>manage consultation requests efficiently</Bullet>
                        <Bullet>publish authoritative content</Bullet>
                        <Bullet>demonstrate measurable advisory impact</Bullet>
                        <Bullet>scale your digital presence over time</Bullet>
                    </ul>

                    <div className="p-5 mt-6 bg-gray-900 border border-gray-900 rounded-lg">
                        <p className="text-sm leading-relaxed text-white">
                            More than a website. A platform built around how you actually work, ready to
                            grow with you for years to come.
                        </p>
                        <p className="mt-3 text-xs text-white/70">
                            Reply to this proposal or reach us directly on{' '}
                            <a
                                className='font-bold underline'
                                rel="noopener noreferrer"
                                target='_blank'
                                href="https://wa.me/233509886584"
                            >
                                WhatsApp
                            </a>{' '}
                            to schedule the kickoff conversation.
                        </p>
                    </div>
                </div>

                {/* Approval Section */}
                <div className="flex items-start justify-between pt-6 mt-12 border-t border-gray-300">
                    <div className="text-xs text-gray-600">
                        <p>Approved by: Julitta Adanuse</p>
                        <p>Employee ID: SAH-BD-2020-07</p>
                    </div>
                    <div className="text-xs text-gray-500">
                        <p>Document ID: SAH-BD-20260428-PRO-51</p>
                        <p>Generated on System: SAH-CRM-PRO-2026</p>
                        <p>Timestamp: 2026-04-28T10:00:00Z</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
