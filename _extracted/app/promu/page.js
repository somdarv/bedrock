'use client'

import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

export default function ProposalPage() {
    const proposalRef = useRef();

    const handleDownloadPDF = () => {
        const element = proposalRef.current;
        const opt = {
            margin: [0.0, 0.0],
            filename: 'Ibrahim Mustapha Website Proposal.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                backgroundColor: null
            },
            jsPDF: {
                unit: 'in',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        html2pdf().set(opt).from(element).save();
    };

    return (
        <div>
            {/* Download Button */}
            <div className="max-w-3xl mx-auto mb-4">
                <button
                    onClick={handleDownloadPDF}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
                >
                    Download PDF
                </button>
            </div>

            <div ref={proposalRef} className="max-w-3xl mx-auto bg-primary/5 p-8 rounded-lg shadow-lg">
                <p className='text-xs my-2'>SAH-BD-20250406-PRO-36-8x4dff1a2b3c67d5e6f-172401632404@saharabasetech.com</p>

                <div className="flex bg-primary/10 rounded-lg p-4 justify-between items-start mb-8">
                    <div>
                        <h1 className='text-black font-semibold text-uptown text-5xl mb-4'>Saharabase Technologies</h1>
                        <p className="text-gray-600 text-sm">17 Alhaji Sulley Road,</p>
                        <p className="text-gray-600 text-sm">Abelemkpe, Accra</p>
                        <p className="text-gray-600 text-sm">contact@saharabasetech.com</p>
                        <p className="text-gray-600 text-sm my-2">www.saharabasetech.com</p>
                    </div>
                    <div className="text-right w-44">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">PROPOSAL</h2>
                        <p className="text-gray-600 text-sm">Proposal #: APR06256</p>
                        <p className="text-gray-600 text-sm">Issue Date: APR 06, 2025</p>
                        <p className="text-gray-600 text-sm">Valid Until: MAY 06, 2025</p>
                    </div>
                </div>

                <div className='flex items-start justify-between'>
                    <div className="mb-8">
                        <h3 className="text-gray-600 font-semibold mb-2">Proposed To:</h3>
                        <p className="text-gray-800 font-semibold">Ibrahim Mustapha</p>
                        <p className="text-gray-600 text-sm">Public Speaking Coach, Accra, Ghana</p>
                    </div>
                </div>

                {/* Subject */}
                <div className='h-96 mt-44 flex items-end'>
                    <p className='w-[70%] text-2xl'><span className='font-semibold'>Subject: </span> Website Development Proposal for Ibrahim Mustapha</p>
                </div>

                <div className='mt-44'>
                    <div className='font-semibold my-8 text-md'>Introduction</div>
                    <p className='text-sm my-2'>
                        Ibrahim, your impactful work as a public speaking coach, keynote speaker, and author inspires many in Accra, Tamale, and beyond. At Saharabase Technologies, we’re excited to present this proposal to create a website that amplifies your reach, streamlines your operations, and boosts your revenue. Our tailored plan will modernize your online presence, helping you attract more clients, sell your 30+ books and Skillshare courses, and establish your authority in the field.
                        <br /><br />
                        This proposal outlines immediate features for a strong launch, including a year of free technical support, and future enhancements for long-term growth.
                    </p>

                    <div className='font-semibold my-8 text-md'>Scope of Work</div>
                    <p className='text-sm my-2'>
                        Our approach combines an immediate website overhaul with scalable options for the future. Below, we detail each feature with descriptions and benefits.
                    </p>

                    <div className='font-semibold my-8 text-md'>Immediate Features</div>
                    <p className='text-sm my-2'>
                        These features will be implemented in the initial launch to create a robust online presence:
                        <br /><br />
                        <span className='font-medium'>1. Online Booking System</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Allows clients to view your availability and book sessions directly.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Simplifies scheduling, saves time, and increases bookings.<br /><br />

                        <span className='font-medium'>2. E-Commerce Shop</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A dedicated section to sell your 30+ books and Skillshare courses.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Creates a seamless revenue stream and makes it easy for visitors to purchase your work.<br /><br />

                        <span className='font-medium'>3. Blog Section</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A platform for sharing public speaking tips and insights, optimized for SEO.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Attracts organic traffic, positions you as a thought leader, and keeps your site dynamic.<br /><br />

                        <span className='font-medium'>4. Testimonials</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Displays feedback from past clients to build trust.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Provides social proof and encourages new clients to book sessions or buy courses.<br /><br />

                        <span className='font-medium'>5. Newsletter Sign-Up</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Captures visitor emails for future outreach.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Nurtures leads and turns casual visitors into long-term clients.<br /><br />

                        <span className='font-medium'>6. Social Media Integration</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Links your website to your YouTube, Facebook, and LinkedIn profiles.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Amplifies your reach and drives traffic between platforms.<br /><br />

                        <span className='font-medium'>7. Mobile-Friendly and SEO-Optimized Design</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Ensures the site works well on all devices and ranks higher in search results.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Reaches more people, especially in Ghana where mobile usage is high, and improves visibility.<br /><br />

                        <span className='font-medium'>8. One-Year Full Technical Maintenance and Support (Free)</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Includes regular updates, bug fixes, performance monitoring, security patches, and technical assistance via phone, email, or WhatsApp for 12 months.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Ensures your website remains secure, functional, and up-to-date without additional costs, allowing you to focus on coaching and creating.<br /><br />
                    </p>

                    <div className='font-semibold my-8 text-md'>Future Features</div>
                    <p className='text-sm my-2'>
                        These optional enhancements can be added later or included now upon request:
                        <br /><br />
                        <span className='font-medium'>1. Public Speaking Challenge Section</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Engages visitors with interactive challenges (e.g., recording a short speech).<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Builds confidence, showcases your coaching style, and drives client bookings.<br /><br />

                        <span className='font-medium'>2. Success Story Spotlight</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Features video testimonials and detailed client transformations.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Inspires trust and demonstrates your impact through real stories.<br /><br />

                        <span className='font-medium'>3. Local Events Calendar</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Highlights upcoming workshops and events in Ghana.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Positions you as a community leader and attracts local clients.<br /><br />

                        <span className='font-medium'>4. Resource Library</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Offers free downloadable guides and mini-courses.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Provides value, captures leads, and promotes your paid offerings.<br /><br />

                        <span className='font-medium'>5. Q&A Forum</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A community space for users to ask public speaking questions.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Fosters engagement, builds community, and showcases your expertise.<br /><br />

                        <span className='font-medium'>6. Embedded Video Tips Section</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Integrates your YouTube videos directly on the site.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Keeps visitors engaged and drives traffic to your channel.<br /><br />

                        <span className='font-medium'>7. Book a Free Consultation Feature</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Allows visitors to schedule a free chat with you.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Lowers barriers for potential clients and boosts bookings.<br /><br />

                    </p>

                    <div className='font-semibold my-8 text-md'>Next Steps</div>
                    <p className='text-sm my-2'>
                        To move forward, we suggest scheduling a consultation to review this proposal and finalize the scope of work. Through further discussions, we can determine the exact scope and related pricing tailored to your needs. Please share your preferred days and times for a meeting, either in person or virtually. Contact us via email at contact@saharabasetech.com or directly on <a className='font-bold underline' rel="noopener noreferrer" target='_blank' href="https://wa.me/233592123054">WhatsApp</a> to arrange this.
                    </p>
                </div>

                {/* Approval Section */}
                <div className="flex justify-between items-center pt-6 mt-8 border-t border-gray-300">
                    <div className="text-xs text-gray-600">
                        <p>Prepared by: Julitta Adanuse</p>
                        <p>Position: Business Development Manager</p>
                        <p>Employee ID: SAH-BD-2020-07</p>
                    </div>
                    <div className="text-xs text-gray-500">
                        <p>Document ID: SAH-BD-20250406-PRO-36</p>
                        <p>Generated on System: SAH-CRM-PRO-2025</p>
                        <p>Timestamp: 2025-04-06T09:32:00Z</p>
                    </div>
                </div>
            </div>
        </div>
    )
}