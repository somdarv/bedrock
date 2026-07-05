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
            filename: 'Somdari-Quotation-Banquet-Chairs-PI-25102901Q.pdf',
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
            {/* <div className="max-w-3xl mx-auto mb-">
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
            </div> */}


            <div >
                <div ref={invoiceRef} className="max-w-3xl mx-auto bg-opacity-0 rounded-lg p-">
                    <p className='my-2 text-xs'>SDR-QUO-2025-OCT2901-xb8e4f2a1c3d9e7f5-1730232412@saharabasetech.com</p>

                    {/* Header with Logo & Invoice Title */}
                    <div className='flex items-center justify-center mt-8 '>
                        <div className='flex flex-col items-center'>
                            <Image
                                src={'/somdari.png'}
                                width={300}
                                height={300}
                                alt='Somdari Logo'
                                className='flex items-center justify-center object-contain w-2/3 mx-auto'
                            />
                            <div className='pt-4 text-sm text-center text-gray-600 '>
                                17 Alhaji Sulley Rd, Accra  |  No.5 Shuanghe Avenue, Linhe Development Zone, China <br />  +233 59 212 3054  |  +233 50 988 6584
                            </div>
                        </div>
                    </div>

                    <div className='flex items-center justify-center my-4 '>
                        <h1 className='text-3xl font-bold text-center text-gray-600'>QUOTATION</h1>
                    </div>

                    {/* quote ID Details */}
                    <div className='w-[90%] mx-auto'>
                        <p className='text-sm'><span className='font-semibold'>Quote Date:</span> 29 October, 2025</p>
                        <p className='text-sm'><span className='font-semibold'>Valid Until:</span> 05 November, 2025</p>
                        <p className='text-sm'><span className='font-semibold'>Quotation Number:</span> PI-25102901Q</p>
                        <p className='text-sm'><span className='font-semibold'>Client:</span> +233 54 302 9491</p>
                    </div>


                    <div className='w-[90%] mx-auto'>
                        <h1 className='mt-8 mb-2 text-lg font-bold text-gray-600'>Product Details</h1>
                        <p className='text-sm'><span className='font-semibold'>Item:</span> Premium Gold Frame Banquet Chairs with Red Upholstery</p>
                        <p className='text-sm'><span className='font-semibold'>Quantity:</span> 100 Chairs</p>
                        <p className='text-sm'><span className='font-semibold'>Total Volume:</span> 3.5 CBM (Cubic Meters)</p>
                    </div>

                    {/* Cost Breakdown Table */}
                    <div className='w-[90%] mx-auto'>
                        <h1 className='mt-8 mb-3 text-lg font-bold text-gray-600'>Cost Breakdown</h1>
                        <table className='w-full text-sm border-collapse'>
                            <thead>
                                <tr className='bg-gray-400'>
                                    <th className='px-4 py-2 text-left text-white border border-gray-400'>Description</th>
                                    <th className='px-4 py-2 text-right text-white border border-gray-400'>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className='px-4 py-2 border border-gray-300'>100 Banquet Chairs @ GHS 80 each</td>
                                    <td className='px-4 py-2 text-right border border-gray-300'>GHS 8,000.00</td>
                                </tr>
                                <tr>
                                    <td className='px-4 py-2 border border-gray-300'>
                                        Sea Freight Shipping (3.5 CBM)
                                        <br />
                                        <span className='text-xs text-gray-500'>3.5 CBM × $250/CBM = $875 × GHS 14.00</span>
                                    </td>
                                    <td className='px-4 py-2 text-right border border-gray-300'>GHS 12,250.00</td>
                                </tr>
                                <tr>
                                    <td className='px-4 py-2 border border-gray-300'>Import Duty & Customs Clearing</td>
                                    <td className='px-4 py-2 text-right border border-gray-300'>Included</td>
                                </tr>
                                <tr className='bg-gray-100'>
                                    <td className='px-4 py-2 font-semibold border border-gray-300'>Subtotal</td>
                                    <td className='px-4 py-2 font-semibold text-right border border-gray-300'>GHS 20,250.00</td>
                                </tr>
                                <tr className='bg-gray-400'>
                                    <td className='px-4 py-2 text-lg font-bold text-white border border-gray-400'>TOTAL COST</td>
                                    <td className='px-4 py-2 text-lg font-bold text-right text-white border border-gray-400'>GHS 20,250.00</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className='p-2 mt-2 bg-black '>
                            <p className='text-sm font-semibold text-white'>
                                Cost Per Chair (All-Inclusive): <span className='text-base font-bold text-white'>GHS 202.50</span>
                            </p>
                        </div>

                        <div className='p-3 mt-2 text-xs text-gray-700 border border-gray-300 rounded bg-gray-50'>
                            <p className='mb-2 text-sm font-bold text-gray-800'>Shipping & Exchange Rate Details:</p>
                            <p className='mb-2'>
                                <span className='font-semibold'>Volume:</span> The 100 chairs have a collective volume of <span className='font-semibold'>3.5 CBM</span> (Cubic Meters).
                                Sea freight costs <span className='font-semibold'>$250 per CBM</span>, totaling <span className='font-semibold'>$875</span> for this shipment.
                            </p>
                            <p>
                                <span className='font-semibold'>Exchange Rate:</span> The shipping company charges in USD and applies a rate of <span className='font-semibold'>GHS 14.00 per dollar</span> due to cedi volatility and exchange rate fluctuations. This protects both parties from currency risk during the 2-3 month shipping period.
                            </p>
                        </div>
                    </div>



                    {/* Delivery Information */}
                    <div className='w-[90%] mx-auto'>
                        <h1 className='mt-8 mb-2 text-lg font-bold text-gray-600'>Delivery Information</h1>
                        <div className='space-y-1 text-sm'>
                            <p><span className='font-semibold'>Shipping Method:</span> Sea Freight (China to Ghana)</p>
                            <p><span className='font-semibold'>Estimated Delivery Time:</span> 2-3 months from order confirmation</p>
                            <p><span className='font-semibold'>Delivery Location:</span> Accra, Ghana</p>
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className='w-[90%] mx-auto'>
                        <h1 className='mt-8 mb-2 text-lg font-bold text-gray-600'>Terms & Conditions</h1>
                        <ul className='space-y-1 text-sm text-gray-600'>
                            <li>• Quote valid for 7 days</li>
                            <li>• Payment terms: 60% deposit upon order confirmation, 40% balance in 45 days</li>
                        </ul>
                    </div>


                    {/* Footer & document props section */}
                    <div className="flex items-center justify-between w-[90%] mx-auto pt-6 mt-6 border-t border-gray-300">
                        {/* <div className="text-xs text-gray-600">
                            <p>Processed by: Business Development</p>
                            <p>Approved by: Richard Somda Jnr</p>
                            <p>Employee ID: ************</p>
                        </div> */}
                        <div className="pb-4 text-xs text-gray-500">
                            <p>Document ID: SDR-QUO-2025-OCT2901X-PI</p>
                            <p>Generated on System: SAH-ERP-QUO-2025</p>
                            <p>Timestamp: 2025-10-29T06:24:12Z</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}