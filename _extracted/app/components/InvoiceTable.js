'use client'

import React, { useState, useEffect } from 'react';


export default function InvoiceTable() {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        fetchInvoices();
    }, []);


    const fetchInvoices = async () => {
        try {
            const response = await fetch('/api/invoices');
            const data = await response.json();
            setInvoices(data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusStyle = (status) => {
        const styles = {
            draft: 'bg-gray-500',
            sent: 'bg-blue-500',
            paid: 'bg-green-500',
            overdue: 'bg-red-500'
        };
        return styles[status] || 'bg-gray-500';
    };


    if (isLoading) {
        return <div className="text-center p-4">Loading invoices...</div>;
    }
    return (
        <div className='container-component'>
            <div className='container-sectio py-8 w-full mx-auto'>




                <h1 className="text-2xl font-bold">Invoices</h1>

                <div className="overflow-x-auto border rounded-lg my-2">
                    <table className="min-w-full divide-y  divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        No invoices found
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                                            {invoice.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {invoice.clientDetails.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {formatDate(invoice.dateIssued)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {formatDate(invoice.dateDue)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusStyle(invoice.status)}`}>
                                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => window.open(`/invoices/${invoice._id}`, '_blank')}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => window.location.href = `/invoices/${invoice._id}/edit`}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {/* Add delete logic */ }}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
