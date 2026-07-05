'use client'

import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';
import Image from 'next/image';


export default function Page() {
    const invoiceRef = useRef();

    const handleDownloadPDF = () => {
        const element = invoiceRef.current;
        const opt = {
            margin: [0.2, 0.], // Smaller margins [top&bottom, left&right]
            filename: 'SAH-ADM-20250822-INV-OCT254-Northfield Limited.pdf',
            image: { type: 'jpeg', quality: 1.0 },
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
                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
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
                <div ref={invoiceRef} className="max-w-3xl p-8 mx-auto rounded-lg shadow-lg bg-primary/2">
                    <p className='my-2 text-xs'>SAH-INV-2025-OCT2504-xb8e4f2a1c3d9e7f5-1724306412@saharabasetech.com</p>

                    {/* Header with Logo & Invoice Title */}
                    <div className='flex items-center justify-center w-full'>
                        <Image



                        />
                    </div>

                    <div className='flex items-start justify-between'>
                        {/* Bill To Section */}
                        <div className="mb-8">
                            <h3 className="mb-2 font-semibold text-gray-600">BILL TO</h3>
                            <p className="font-semibold text-gray-800">North Field Limited </p>
                            <p className="text-sm text-gray-600">Tamale, Ghana</p>
                            {/* <p className="my-4 text-sm text-gray-600">Contact Ref: +233 55 466 8284</p> */}
                        </div>

                        <div className='text-sm text-right'>
                            <h3 className="mb-2 font-semibold text-gray-600">PROJECT DETAILS</h3>
                            <p className="text-gray-600">Project ID: SAH-WB7D813X0125</p>
                            {/* <p className="text-gray-600">Contract Ref: SAH-ADM-20250314-CON-21</p> */}
                            {/* <p className="text-gray-600">Department: Web Development</p> */}
                        </div>
                    </div>

                    {/* Invoice Items */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="text-gray-600 border-b border-gray-300">
                                    <th className="py-3 text-left">Description</th>
                                    <th className="py-3 text-right">Period (Year)</th>
                                    <th className="py-3 text-right">Rate (GH₵)</th>
                                    <th className="py-3 text-right">Amount (GH₵)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-800">Domain & Hosting Package </p>
                                        <p className="text-sm text-gray-600">Domain registration for northfieldlimited.com</p>
                                        <p className="text-sm text-gray-600">Web hosting setup and configuration</p>
                                        <p className="text-sm text-gray-600">Setup of up to 5 professional email accounts</p>
                                        <p className="text-sm text-gray-600">DNS management and configuration</p>
                                    </td>
                                    <td className="py-4 text-right">0.06</td>
                                    <td className="py-4 text-right">1,200.00</td>
                                    <td className="py-4 text-right">1,200.00</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-800">Core Website Development </p>
                                        <p className="text-sm text-gray-600">Four(4) webpages: About, Services, Projects, Contact</p>
                                        <p className="text-sm text-gray-600">Contact forms</p>
                                        <p className="text-sm text-gray-600">Responsive design for all devices</p>
                                        <p className="text-sm text-gray-600">SEO optimization</p>
                                    </td>
                                    <td className="py-4 text-right">0.06</td>
                                    <td className="py-4 text-right">3,300.00</td>
                                    <td className="py-4 text-right">3,300.00</td>
                                </tr>
                                <tr className="items-start border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-800">Technical Support & Maintenance </p>
                                        <p className="text-sm text-gray-600">One full year of technical support</p>
                                        <p className="text-sm text-gray-600">Security monitoring and updates</p>
                                        <p className="text-sm text-gray-600">Performance optimization</p>
                                        <p className="text-sm text-gray-600">Bug fixes and system updates</p>
                                        <p className="text-sm text-gray-600">Technical documentation and training</p>
                                    </td>
                                    <td className="py-4 text-right">1</td>
                                    <td className="py-4 text-right">0</td>
                                    <td className="py-4 text-right">0</td>
                                </tr>

                                {/* <tr className="border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-800">Domain & Hosting Package (CraveCart)</p>
                                        <p className="text-sm text-gray-600">Domain registration for cravecartrestaurant.com</p>
                                        <p className="text-sm text-gray-600">Web hosting setup and configuration</p>
                                        <p className="text-sm text-gray-600">Setup of up to 5 professional email accounts</p>
                                        <p className="text-sm text-gray-600">DNS management and configuration</p>
                                    </td>
                                    <td className="py-4 text-right">1</td>
                                    <td className="py-4 text-right">700.00</td>
                                    <td className="py-4 text-right">700.00</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-800">Core Website Development (CraveCart)</p>
                                        <p className="text-sm text-gray-600">Four(4) webpages: About, Menu, Locations, Contact</p>
                                        <p className="text-sm text-gray-600">Responsive design for all devices</p>
                                        <p className="text-sm text-gray-600">SEO optimization</p>
                                    </td>
                                    <td className="py-4 text-right">1</td>
                                    <td className="py-4 text-right">1,300.00</td>
                                    <td className="py-4 text-right">1,300.00</td>
                                </tr> */}
                                {/* <tr className="items-start border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-800">Technical Support & Maintenance (CraveCart)</p>
                                        <p className="text-sm text-gray-600">One full year of technical support</p>
                                        <p className="text-sm text-gray-600">Security monitoring and updates</p>
                                        <p className="text-sm text-gray-600">Performance optimization</p>
                                        <p className="text-sm text-gray-600">Bug fixes and system updates</p>
                                        <p className="text-sm text-gray-600">Technical documentation and training</p>
                                    </td>
                                    <td className="py-4 text-right">1</td>
                                    <td className="py-4 text-right">0</td>
                                    <td className="py-4 text-right">0</td>
                                </tr> */}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mt-12 mb-8">
                        <div className="w-64">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-800">GH₵ 4,500.00</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Tax</span>
                                <span className="text-gray-800">N/A</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">F&F Discount (22%)</span>
                                <span className="text-gray-800">GH₵ 1,000.00</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-300">
                                <span className="font-semibold text-gray-800">Total</span>
                                <span className="font-semibold text-gray-800">GH₵ 3,500.00</span>
                            </div>
                            {/* <div className="flex justify-between mt-2">
                                <span className="text-gray-600">Total in USD (Est.)</span>
                                <span className="text-gray-800">$467.00</span>
                            </div> */}
                        </div>
                    </div>

                    {/* Payment Terms & Notes */}
                    <div className="pt-4 border-t border-gray-300">
                        <div className='flex justify-between w-full'>
                            <div className="mb-4">
                                <div>
                                    <p className='mb-2 text-sm font-semibold text-gray-600'>Payment Terms</p>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        <li>• 60% payment before work commences (GH₵ 2,100.00)</li>
                                        <li>• Balance due upon completion of work (GH₵ 1,400.00)</li>
                                        <li>• Payment due within 7 days of invoice date</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mb-4 ">
                                <h4 className="mb-2 text-sm font-extrabold text-gray-600">Payment Details</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>• Payment Type: Mobile Money Transfer</li>
                                    <li>• Network: MTN</li>
                                    <li>• Phone Number: 0539157613                                   </li>
                                    <li>• Name On Account: Richard Vinkpedomeh Somda
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 text-sm text-gray-600 border-t border-gray-300">
                            <p className='font-extrabold text-gray-600'>Notes:</p>
                            <p>1. Please include invoice number OCT2504 in payment reference</p>
                            {/* <p>2. Exchange rate: GH₵15.00 to USD (rate as of invoice date). Any fluctuations in the exchange rate at the time of payment may require fee adjustments accordingly.</p> */}
                            {/* <p>2. This invoice is related to Contract Reference: SAH-ADM-20250822-CON-22</p> */}
                            <p>3. This invoice is automatically generated and is valid without signature</p>
                        </div>
                    </div>

                    {/* Footer & document props section */}
                    <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-300">
                        <div className="text-xs text-gray-600">
                            <p>Processed by: Business Development</p>
                            <p>Approved by: Richard Somda Jnr</p>
                            {/* <p>Position: Director</p> */}
                            <p>Employee ID: ************</p>
                        </div>
                        <div className="text-xs text-gray-500">
                            <p>Document ID: SAH-ADM-20251025-INV-OCT2504</p>
                            <p>Generated on System: SAH-ERP-BIL-2025</p>
                            <p>Timestamp: 2025-10-25T22:40:12Z</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}