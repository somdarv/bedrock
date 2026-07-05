// import Accounts from '@/components/Accounts'



import React from 'react'
import NavAdmin from '../components/NavAdmin'
import Accounts from '../components/Accounts'


export default function Page() {
    return (
        <div className='bg-primary'>
            <NavAdmin />

            <div className='bg-white'>
                <Accounts />
                <div ref={proposalRef} className="max-w-3xl mx-auto bg-primary/5 p-8 rounded-lg shadow-lg">
                    <p className='text-xs my-2'>SAH-TECH-20241015-PRO-42-7x3dff1a2b3c67d5e6f-172401632402@saharabasetech.com</p>

                    <div className="flex bg-primary/10 rounded-lg p-4 justify-between items-start mb-8">
                        <div>
                            <h1 className='text-black text-uptown text-5xl  mb-4'>Saharabase Technologies</h1>
                            <p className="text-gray-600 text-sm">17 Alhaji Sulley Road,</p>
                            <p className="text-gray-600 text-sm">Abelemkpe, Accra</p>
                            <p className="text-gray-600 text-sm">contact@saharabasetech.com</p>
                            <p className="text-gray-600 text-sm my-2">www.saharabasetech.com</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">PROPOSAL</h2>
                            <p className="text-gray-600 text-sm">Proposal #: OCT1524</p>
                            <p className="text-gray-600 text-sm">Issue Date: Oct 15, 2024</p>
                            <p className="text-gray-600 text-sm">Valid Until: Nov 15, 2024</p>
                        </div>
                    </div>

                    <div className='flex items-start justify-between'>
                        <div className="mb-8">
                            <h3 className="text-gray-600 font-semibold mb-2">Proposed To:</h3>
                            <p className="text-gray-800 font-semibold">Doppler Engineering Consult</p>
                            <p className="text-gray-600 text-sm">Ghana, West Africa</p>
                            {/* <p className="text-gray-600 text-sm">Accra, Ghana</p> */}
                        </div>
                    </div>

                    {/* Proposal Services */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-300 text-gray-600">
                                    <th className="py-3 text-left">Service Description</th>
                                    <th className="py-3 text-right">Units</th>
                                    <th className="py-3 text-right">Unit Price</th>
                                    <th className="py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-800">Cloud Infrastructure Setup</p>
                                        <p className="text-gray-600 text-sm">AWS Architecture Design & Deployment</p>
                                    </td>
                                    <td className="py-4 text-right">1 Project</td>
                                    <td className="py-4 text-right">$12,500.00</td>
                                    <td className="py-4 text-right">$12,500.00</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-800">Data Analytics Platform</p>
                                        <p className="text-gray-600 text-sm">Custom BI Solution Development</p>
                                    </td>
                                    <td className="py-4 text-right">1 System</td>
                                    <td className="py-4 text-right">$8,200.00</td>
                                    <td className="py-4 text-right">$8,200.00</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-800">Cybersecurity Audit</p>
                                        <p className="text-gray-600 text-sm">Full Infrastructure Penetration Testing</p>
                                    </td>
                                    <td className="py-4 text-right">1 Audit</td>
                                    <td className="py-4 text-right">$5,750.00</td>
                                    <td className="py-4 text-right">$5,750.00</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-800">Technical Support</p>
                                        <p className="text-gray-600 text-sm">24/7 Premium Support (6 Months)</p>
                                    </td>
                                    <td className="py-4 text-right">6 Months</td>
                                    <td className="py-4 text-right">$1,500.00</td>
                                    <td className="py-4 text-right">$9,000.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                        <div className="w-64">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-800">$35,450.00</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Service Fee (5%)</span>
                                <span className="text-gray-800">$1,772.50</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-300 pt-2">
                                <span className="font-semibold text-gray-800">Total</span>
                                <span className="font-semibold text-gray-800">$37,222.50</span>
                            </div>
                        </div>
                    </div>

                    {/* Approval Section */}
                    <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-300">
                        <div className="text-xs text-gray-600">
                            <p>Prepared by: Technical Solutions Team</p>
                            <p>Approved by: Nana Kwesi Asare</p>
                            <p>Position: Business Development Manager</p>
                            <p>Employee ID: SAH-TECH-2020-07</p>
                        </div>
                        <div className="text-xs text-gray-500">
                            <p>Document ID: SAH-TECH-20241015-PRO-42</p>
                            <p>Generated on System: SAH-CRM-PRO-2024</p>
                            <p>Timestamp: 2024-10-15T09:30:00Z</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
