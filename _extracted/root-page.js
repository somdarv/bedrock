'use client'

import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

export default function Page() {
    const invoiceRef = useRef();

    const handleDownloadPDF = () => {
        const element = invoiceRef.current;
        const opt = {
            margin: [0.0, 0], // Smaller margins [top&bottom, left&right]
            filename: 'Contract-20250119-CON-01-SenaBioResearch.pdf',
            image: { type: 'jpeg', quality: 1 },
            html2canvas: {
                scale: 2,
                backgroundColor: null // Remove default white background
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
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                    </svg>
                    Download PDF
                </button>
            </div>


            <div >
                <div ref={invoiceRef} className="max-w-3xl mx-auto bg-primary/2 p-8 rounded-lg shadow-lg">
                    <p className='text-xs my-2'>SAH-CON-2025-JA1901-rx7d9f1a2b3c4d5e6f-1674068002@saharabasetech.com</p>

                    {/* Header with Logo & Invoice Title */}
                    <div className="flex bg-primary/10 rounded-lg p-4  justify-between items-start mb-8">
                        <div>
                            <h1 className='text-black text-mairo text-5xl  mb-3'>Sahara</h1>
                            <p className="text-gray-600 text-sm">17 Alhaji Sulley Rd,</p>
                            <p className="text-gray-600 text-sm">Abelemkpe, Accra</p>
                            <p className="text-gray-600 text-sm">support@saharabasetech.com</p>
                        </div>
                        <div className="text-right mt-16">
                            {/* <h2 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h2> */}
                            <p className="text-gray-600 text-sm">+233 50 988 6584 | +233 59 212 3054</p>
                            <p className="text-gray-600 text-sm">Date: Jan 19, 2025</p>
                            <p className='text-gray-600 text-sm'>Document ID: SAH-ADM-20250119-CON-01</p>

                            {/* <p className="text-gray-600 text-sm">Due Date: Jan 26, 2024</p> */}

                        </div>
                    </div>

                    <div className='fle items-start justify-between'>

                        <h1 className='font-bold text-5xl mt-8'>Website <br /> Development  <br />Services Agreement</h1>
                        <p className='my-8 text-gray-600 text-sm'>SAHARA BASE TECHNOLOGIES - SENA BIO RESEARCH</p>

                        {/* Bill To Section */}
                        <div className="mb-8 mt-80">
                            <h3 className="text-gray-600 font-semibold mb-2 ">Prepared For</h3>
                            <p className="text-gray-800 font-semibold">Sena Bio Research</p>
                            {/* <p className="text-gray-600 text-sm">+233 54 531 8356</p> */}
                            <p className="text-gray-600 text-sm">Tamale, Ghana</p>

                            <p className="text-gray-600 my- text-sm">+233 26 943 5750</p>


                            {/* <p className="text-gray-600">client@email.com</p> */}
                        </div>
                        <div className="mb-8 mt-12">
                            <h3 className="text-gray-600 font-semibold mb-2 ">Created By:</h3>
                            <p className="text-gray-800 font-semibold">Sahara Base Technologies</p>
                            {/* <p className="text-gray-600 text-sm">+233 54 531 8356</p> */}
                            <p className="text-gray-600 text-sm">Accra, Ghana</p>

                            <p className="text-gray-600 text-sm">+233 50 988 6584 | +233 59 212 3054</p>

                            {/* <p className="text-gray-600">client@email.com</p> */}
                        </div>

                        {/* <div className='text-right text-sm'>
                        <h3 className="text-gray-600 font-semibold mb-2">PROJECT DETAILS</h3>
                        <p className="text-gray-600">Project ID: PRJ-2024-001</p>
                        <p className="text-gray-600">Contract Ref: CNT-2024-0123</p>
                        <p className="text-gray-600">Department: Web Development</p>
                    </div> */}
                    </div>

                    {/* Invoice Items */}
                    <div className="mb-8 mt-56">
                        <h1 className='font-bold text-gray-600 my-4'>Definition</h1>

                        <p className='text-gray-600 text-sm'>This website development services agreement is intended as a legally binding agreement between  <span className='font-semibold'> Sahara Base Technologies (Developer)</span> and    <span className='font-semibold'>Sena Bio Research (Client)</span>, collectively known as the  <span className='font-semibold'>"Parties".</span> <br /><br />

                            <span className='font-semibold'>The Client</span> has agreed to allow the above  <span className='font-semibold'>The Developer</span> to create, develop, test, and host a website according to the scope of work defined herein. <br /><br />

                            <span className='font-semibold'>The Developer</span> is interested in undertaking such work; and the <span className='font-semibold'>Parties</span> mutually desire to set and agree to the following terms and conditions as listed. <br /><br /></p>


                    </div>


                    <div className="mb-8 mt-">
                        <h1 className='font-bold text-gray-600 my-4'>Governing Law</h1>
                        <p className='text-gray-600 text-sm'>This Agreement shall be governed by and construed in accordance with the laws of the Republic of Ghana. Both parties submit to the exclusive jurisdiction of the courts of Ghana for the resolution of any disputes arising from or in connection with this Agreement. The official language of this Agreement is English, and any translations are provided for convenience only.





                        </p>



                    </div>

                    {/* scope of Work */}
                    <div className="mb-8 mt-">
                        <h1 className='font-bold text-gray-600 my-4'>Scope Of Work</h1>

                        <p className='text-gray-600 text-sm'>This scope of work details the specific deliverables, technical requirements, and project dependencies. The successful completion of this project relies on close collaboration between Sahara and Sena Bio Research, particularly regarding content provision and design approval processes.</p>


                        <p className='text-gray-600 my-2 text-sm font-semibold'>1. Domain & Hosting Services</p>
                        <ul className='ml-2'>
                            <li className='text-gray-600 text-sm my-1'>• Domain name registration for http://senabioreseach.org</li>
                            <li className='text-gray-600 text-sm my-1'>• Web hosting setup and configuration                            </li>
                            <li className='text-gray-600 text-sm my-1'>• Setup of 120 custom mailboxes       </li>
                            <li className='text-gray-600 text-sm my-1'>• DNS management and configuration</li>
                        </ul>

                        <p className='text-gray-600 my-2 text-sm font-semibold'>2. Website Development</p>
                        <ul className='ml-2'>
                            <p className='text-sm text-gray-600'>A. UI/UX Design</p>
                            <li className='text-gray-600 text-sm my-1'>• Creation of responsive website design                   </li>
                            <li className='text-gray-600 text-sm my-1'>• User experience flow diagrams                            </li>
                            <li className='text-gray-600 text-sm my-1'>• Design system documentation</li>
                        </ul>

                        <ul className='ml-2 mt-6'>
                            <p className='text-sm text-gray-600'>B. Front-end Development</p>
                            <li className='text-gray-600 text-sm my-1'>• HTML/CSS/JavaScript implementation
                            </li>
                            <li className='text-gray-600 text-sm my-1'>• Responsive design implementation                           </li>
                            <li className='text-gray-600 text-sm my-1'>• Cross-browser compatibility
                            </li>
                        </ul>
                        <ul className='ml-2 mt-6'>
                            <p className='text-sm text-gray-600'>C. Technical Maintenance/Assistance</p>
                            <li className='text-gray-600 text-sm my-1'>• Post-launch support

                            </li>
                            <li className='text-gray-600 text-sm my-1'>• Bug fixes
                            </li>
                            <li className='text-gray-600 text-sm my-1'>• System updates

                            </li>
                            <li className='text-gray-600 text-sm my-1'>• Performance monitoring
                            </li>
                            <li className='text-gray-600 text-sm my-1'>• Technical documentation


                            </li>
                        </ul>

                        <p className='text-gray-600 text-sm my-2'>Changes to this Agreement or to any deliverables in this contract must be submitted in writing and approved by both parties prior to taking place.
                        </p>
                        <p className='text-gray-600 text-sm my-2'>The Developer agrees to notify company if any risks or schedule delays may take place effecting delivery dates and presentation of the final website.
                        </p>

                    </div>


                    {/* web hosting */}
                    <div className="mb-8 mt-">
                        <h1 className='font-bold text-gray-600 my-4'>Website Hosting</h1>

                        <p className='text-gray-600 text-sm'>The developer shall provide website hosting services for  the Client’s website once development is complete. Hosting shall be a shared hosting environment with a minimum of 99.9% server uptime.

                            <br /><br />

                            The Developer is in agreement to maintain a copy of the client’s website on an offline server as a backup to the live site. <br />

                            <br />
                            Any and all modifications are expected to be completed within 3 business days of developer's acknowledgment depending on level of repair or maintenance request. <br /><br />

                            The Developer agrees to provide reasonable access to any parties authorized by the Client for purposes of website audits, updates, or modifications.


                        </p>

                    </div>


                    {/* web hosting */}
                    <div className="mb-8 mt-">
                        <h1 className='font-bold text-gray-600 my-4'>Design</h1>

                        <p className='text-gray-600 text-sm'>The Developer agrees to attain design approval from the Client prior to the Developer beginning development by submitting detailed design mockups for the Client's review.

                            <br /><br />

                            The Client’s website will not include any of the following unless previously agreed upon between both parties.
                            <br /><br />
                            <ul className='ml-4 text-sm text-gray-600'>
                                <li>1. Any destructive, crude, insulting, harassing, violent, sexual or any other inappropriate
                                </li>
                                <li>2. Any and invisible fields or pages.

                                </li>
                            </ul>

                            <br /><br />
                            All materials to be supplied by client must be provided with compatible file types and sizes.

                            <br /><br />

                            Until final approval, no portions of above site will be made available to end users.
                        </p>

                    </div>


                    {/*  Pricing */}
                    <div className="mb-8 mt-">
                        <h1 className='font-bold text-gray-600 my-4'>Pricing And Payment Terms</h1>

                        <p className='text-gray-600 text-sm'>The total cost for all services outlined in this scope of work is Two Hundred and Two United States Dollars, Twenty Cents (USD 202.20). This comprehensive pricing was agreed upon during a phone consultation between the parties and covers all deliverables detailed in this document. A complete cost breakdown can be found in Invoice #JA1901, dated January 19, 2025, which has been provided to Sena Bio Research and is incorporated here by reference.

                            <br /><br />

                            Payment Terms:

                            <br /><br />
                            <ul className='ml-4 text-sm text-gray-600'>
                                <li>1. 60% deposit (USD 121.32) is required before work commences</li>
                                <li>2. Remaining balance due within 2 days upon completion of work </li>
                                <li>3. Payment method: Mobile Money (Details as specified in Invoice #JA1901) </li>
                                <li>4. Exchange rate: GH₵14.9 to USD (as of invoice date)</li> {/* Changed from 3 to 4 */}
                            </ul>

                            <br /><br />
                            PS:  Any fluctuations in the exchange rate at the time of payment may require fee adjustments accordingly.
                            <br /><br />

                        </p>

                    </div>


                    {/*  Termination & Conflict Resolution */}
                    <div className="mb-8 mt-">
                        <h1 className='font-bold text-gray-600 my-4'>Termination & Conflict Resolution</h1>


                        <p className='text-gray-600 text-sm'>Either party may terminate this agreement with 7 days written notice. If the client terminates, they must pay for all work completed up to the termination date, and the initial deposit remains non-refundable once work has commenced. Sahara may terminate the agreement if the client fails to provide required materials within 30 days, delays payment beyond 14 days, or violates any terms of this agreement.
                            <br /><br />

                            In the event of disputes, both parties agree to first attempt resolution through direct communication within 7 days of the dispute arising. If direct negotiation fails, the parties will engage in mediation in Accra, with costs shared equally. Should mediation prove unsuccessful, legal proceedings may be pursued under Ghanaian law in Accra courts, with the prevailing party entitled to recover reasonable legal fees.

                            <br /><br />

                            Neither party shall be liable for failure to perform due to circumstances beyond reasonable control, including but not limited to natural disasters, war, civil unrest, government actions, or extended power outages. Such circumstances must be communicated to the other party within 48 hours of occurrence.

                        </p>

                    </div>

                    {/*  Acceptance & Authorization */}
                    <div className="mb-8 mt-">
                        <h1 className='font-bold text-gray-600 my-4'>Acceptance & Authorization</h1>

                        <p className='text-gray-600 text-sm'>This agreement represents the entire scope of work between Sahara and Sena Bio Research for the website development project described herein. By signing below, both parties acknowledge that they have read, understood, and agree to all terms and conditions outlined in this document, including the payment terms, deliverables, and project timeline. Any modifications to this agreement must be made in writing and signed by both parties.

                            <br /><br />

                            The undersigned represents and warrants that they have the authority to enter into this binding agreement on behalf of their respective organizations. This agreement becomes effective as of the date of the last signature below.

                        </p>

                        <div className='bg-gray-100 w-full p-4 my-4 flex items-start justify-between'>
                            <div>
                                <p className='font-bold mb-8'>Sahara Base Technologies</p>
                                <span className=''>_____________________________________</span>
                                <p className='text-sm  mt-4'>Richard Somda Jnr</p>
                                <p className='text-sm text-gray-600'>Executive Director</p>

                            </div>

                            <div className='text-right'>
                                <p className='font-bold mb-8'>Sena Bio Research</p>
                                <span className=''>_____________________________________</span>
                                <p className='text-sm  mt-4'>Ezekiel Bruce</p>
                                <p className='text-sm text-gray-600'>President</p>
                            </div>
                        </div>

                    </div>




                    {/* Footer & document props section */}
                    <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-300">
                        <div className="text-xs text-gray-600">
                            <p>Processed by: Administrative Department</p>
                            <p>Approved by: Richard Somda Jnr</p>
                            <p>Position: Executive Director</p>
                            <p>Executive ID: ************</p>
                        </div>
                        <div className="text-xs text-gray-500">
                            <p>Document ID: SAH-ADM-20250119-CON-01</p>
                            <p>Generated on System: SAH-ERP-DOC-2025</p>
                            <p>Timestamp: 2025-01-19T18:30:00Z</p>
                            <p>Reference Invoice: JA1901</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
