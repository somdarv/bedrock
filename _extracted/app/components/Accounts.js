'use client'

import React, { useState, useEffect } from 'react';
import InvoiceTable from './InvoiceTable';

export default function Accounts() {
    const [createInvoice, setCreateInvoice] = useState(false)

    const CreateInvoiceClick = () => {
        setCreateInvoice(true)
    }

    return (
        <div className='container-component'>

            <div className='w-[90%] mx-auto my-8'>
                <div className='flex justify-end gap-x-4 '>
                    <button onClick={CreateInvoiceClick} className='bg-black hover:bg-opacity-80 text-white rounded-full font-semibold px-4 py-3 text-xs '>
                        Create Invoice
                    </button>
                    <button className='border-black border text-black hover:bg-gray-100/80 rounded-full font-semibold px-4 py-3 text-xs '>
                        Export Data
                    </button>
                </div>


                {
                    createInvoice == true ? (
                        <div>
                            sdsds
                        </div>
                    ) : (
                        <div>
                            <InvoiceTable />
                        </div>)}


            </div>


        </div>
    )
}
