'use client'

import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

export default function page() {
    const proposalRef = useRef();

    const handleDownloadPDF = () => {
        const element = proposalRef.current;
        const opt = {
            margin: [0.0, 0.0],
            filename: 'Coskon Engineering Website Proposal.pdf',
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
                <p className='text-xs my-2'>SAH-BD-20250406-PRO-35-8x4dff1a2b3c67d5e6f-172401632403@saharabasetech.com</p>

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
                        <p className="text-gray-600 text-sm">Proposal #: APR06255</p>
                        <p className="text-gray-600 text-sm">Issue Date: APR 06, 2025</p>
                        <p className="text-gray-600 text-sm">Valid Until: MAY 06, 2025</p>
                    </div>
                </div>

                <div className='flex items-start justify-between'>
                    <div className="mb-8">
                        <h3 className="text-gray-600 font-semibold mb-2">Proposed To:</h3>
                        <p className="text-gray-800 font-semibold">Coskon Engineering Limited</p>
                        <p className="text-gray-600 text-sm">Plot 42, Block D, Adumasa New Site, Kumasi, Ghana</p>
                    </div>
                </div>

                {/* Subject */}
                <div className='h-96 mt-44 flex items-end'>
                    <p className='w-[70%] text-2xl'><span className='font-semibold'>Subject:  </span> Website Rebrand and Enhancement Proposal for Coskon Engineering Limited</p>
                </div>

                <div className='mt-44'>
                    <div className='font-semibold my-8 text-md'>Introduction</div>
                    <p className='text-sm my-2'>
                        Saharabase Technologies is excited to present this proposal for the rebrand and enhancement of the Coskon Engineering Limited website. As a leading construction company in Ghana, your online presence should reflect your expertise and reliability. Our tailored plan will modernize your website, improve user engagement, and position you to attract more clients in Kumasi and beyond.
                        <br /><br />
                        This proposal details a strategic rebrand, key features for immediate implementation, including a year of free technical support, and future enhancements to support your long-term growth.
                    </p>

                    <div className='font-semibold my-8 text-md'>Scope of Work</div>
                    <p className='text-sm my-2'>
                        Our approach combines an immediate website overhaul with scalable options for the future. Below, we outline each feature with descriptions and benefits.
                    </p>

                    <div className='font-semibold my-8 text-md'>Immediate Features</div>
                    <p className='text-sm my-2'>
                        These features will be implemented in the initial launch to create a robust online presence:
                        <br /><br />
                        <span className='font-medium'>1. Rebrand Strategy</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A refreshed visual identity with a modern logo, cohesive color scheme, and professional typography, paired with a clean, mobile-friendly design and SEO optimization.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Enhances your professional image, improves accessibility on all devices, and boosts visibility on search engines like Google, helping clients find you easily.<br /><br />

                        <span className='font-medium'>2. Enhanced Contact Section</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A comprehensive contact area featuring a form (name, email, phone, project details, message), a “Call Now” button for direct calls, and a WhatsApp button for instant messaging.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Simplifies client outreach, leverages popular communication methods in Ghana (e.g., WhatsApp), and increases lead generation by making it easy to connect with your team.<br /><br />

                        <span className='font-medium'>3. Project Portfolio</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A dedicated section showcasing your 18 completed projects with high-quality photos, videos, and descriptions, including before-and-after visuals for renovations and filters by project type.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Demonstrates your expertise visually, builds trust with potential clients, and engages visitors with interactive content, encouraging them to explore your work.<br /><br />

                        <span className='font-medium'>4. Testimonials Section</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A display of client feedback (e.g., from David Koomson, Mercy Appiah) with names and optional photos, integrated into the portfolio or as a standalone section.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Provides social proof, reassures potential clients of your quality, and strengthens credibility through authentic voices.<br /><br />

                        <span className='font-medium'>5. Blog</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A manageable platform for posting industry news, project stories, and construction tips, optimized for search engines.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Positions Coskon as an industry leader, drives organic traffic through valuable content, and keeps your website dynamic and engaging.<br /><br />

                        <span className='font-medium'>6. FAQ Section</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A concise list of common questions (e.g., “What is your project timeline?”) with answers, placed in the footer or “About Us” page.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Saves time by addressing inquiries upfront, improves user experience, and reduces repetitive communication.<br /><br />

                        <span className='font-medium'>7. Social Media Integration</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> Embedded posts from your Facebook page ([Coskon Engineering Limited](https://www.facebook.com/Coskon)) and prominent social media links.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Increases engagement, showcases your activity and community involvement, and leverages existing followers to build trust.<br /><br />

                        <span className='font-medium'>8. Map Integration</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> An embedded Google Map on the contact page showing your office location (Plot 42, Block D, Adumasa New Site, Kumasi).<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Helps local clients find you easily, enhances convenience, and strengthens your community presence.<br /><br />

                        <span className='font-medium'>9. One-Year Full Technical Maintenance and Support (Free)</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A comprehensive support package for 12 months, including regular website updates, bug fixes, performance monitoring, security patches, and technical assistance via phone, email, or WhatsApp. This ensures your website remains functional, secure, and up-to-date without additional costs.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Provides peace of mind with proactive maintenance, saves you from unexpected repair costs, ensures optimal performance for clients, and allows your team to focus on core business activities while we handle technical needs.<br /><br />
                    </p>

                    <div className='font-semibold my-8 text-md'>Future Features</div>
                    <p className='text-sm my-2'>
                        These optional enhancements can be added later or included now upon request:
                        <br /><br />
                        <span className='font-medium'>1. Project Estimator Tool</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> An interactive tool allowing users to input project details (e.g., size, type) for a rough cost estimate, requiring contact info for detailed quotes.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Provides immediate value to clients, captures leads efficiently, and sets you apart from competitors with a proactive feature.<br /><br />

                        <span className='font-medium'>2. Team Page</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A section introducing key staff with photos, names, and roles, highlighting your experienced professionals.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Personalizes your brand, builds client trust by showcasing your team’s expertise, and fosters a human connection.<br /><br />

                        <span className='font-medium'>3. Certifications and Awards</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A display of licenses, insurance details, and any awards or recognitions in a dedicated section.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Reinforces your authority, reassures clients of your qualifications, and enhances your reputation in the industry.<br /><br />

                        <span className='font-medium'>4. Multilingual Support</span><br />
                        <span className='font-semibold margin my-1'>Description:</span> A language toggle offering content in local languages like Twi alongside English, covering key pages.<br />
                        <span className='font-semibold margin my-1'>Benefits:</span> Expands your reach to diverse clients in Ghana, improves accessibility, and shows cultural sensitivity.<br /><br />
                        <span className='font-semibold margin my-1'>Note:</span> If you’d like any of these future features added now, we can adjust the scope and pricing accordingly. Just let us know!
                    </p>

                    <div className='font-semibold my-8 text-md'>Pricing</div>
                    <p className='text-sm my-2'>
                        The estimated cost for the rebrand and immediate features, including one year of full technical maintenance and support free of charge, is GHS 6,000 to GHS 8,000. This reflects a high-quality, custom website tailored to the Ghanaian market.                        <br /><br />
                        {/* <ul className='list-disc list-inside'>
                            <li className='text-sm my-2'><span className='font-semibold'>Custom Design and Development:</span> GHS 4,000 to 6,000. Covers branding refresh, layout design, and coding.</li>
                            <li className='text-sm my-2'><span className='font-semibold'>Feature Integration:</span> GHS 3,000 to 5,000. Includes contact section, portfolio, testimonials, blog, FAQ, social media setup, and map integration.</li>
                            <li className='text-sm my-2'><span className='font-semibold'>Mobile Optimization and SEO:</span> GHS 2,000 to 3,000. Ensures responsiveness and search visibility.</li>
                            <li className='text-sm my-2'><span className='font-semibold'>Team Training and One-Year Support:</span> GHS 1,000 to 2,000. Covers basic training on managing the website (e.g., blog updates) and 12 months of free technical maintenance.</li>
                        </ul> */}
                        <br />
                        The one-year support package is included at no additional cost, adding significant value to your investment. Adding future features now will increase costs slightly, and we’ll provide a detailed quote based on your final scope.
                    </p>

                    <div className='font-semibold my-8 text-md'>Next Steps</div>
                    <p className='text-sm my-2'>
                        To move forward, we suggest scheduling a consultation to review this proposal, finalize the scope, and align on the budget. Please share your preferred days and times for a meeting, either in person or virtually. Contact us via email or directly on <a className='font-bold underline' rel="noopener noreferrer" target='_blank' href="https://wa.me/233592123054">WhatsApp</a> to arrange this.
                        <br /><br />
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
                        <p>Document ID: SAH-BD-20250406-PRO-35</p>
                        <p>Generated on System: SAH-CRM-PRO-2025</p>
                        <p>Timestamp: 2025-04-06T09:31:00Z</p>
                    </div>
                </div>
            </div>
        </div>
    )
}