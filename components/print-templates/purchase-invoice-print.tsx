import React from "react"
import { format } from "date-fns"

interface PurchaseInvoicePrintProps {
  invoice: any
  companyDetails: any
}

export const PurchaseInvoicePrint: React.FC<PurchaseInvoicePrintProps> = ({ invoice, companyDetails }) => {
  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black" id="invoice-print-content">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          {companyDetails.logo && (
            <img
              src={companyDetails.logo}
              crossOrigin="anonymous"
              alt="Company Logo"
              className="h-16 w-auto object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyDetails.name}</h1>
            <div className="text-sm text-gray-600 mt-1 space-y-0.5 flex flex-col gap-1">
              <p className="py-0">{companyDetails.address}</p>
              <p className="py-0">Phone: {companyDetails.phone}</p>
              <p className="py-0">Email: {companyDetails.email}</p>
              {companyDetails.website && <p>Web: {companyDetails.website}</p>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">PURCHASE INVOICE</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-semibold">Invoice No:</span> {invoice.purchaseInvoiceNumber}</p>
            <p><span className="font-semibold">Date:</span> {format(new Date(invoice.date), "dd MMM yyyy")}</p>
            {invoice.dueDate && (
              <p><span className="font-semibold">Due Date:</span> {format(new Date(invoice.dueDate), "dd MMM yyyy")}</p>
            )}
            <p><span className="font-semibold">Status:</span> <span className="uppercase">{invoice.invoiceStatus || "Open"}</span></p>
          </div>
        </div>
      </div>

      {/* Bill From (Vendor) */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-1">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Bill From (Vendor)</h3>
        <p className="font-bold text-gray-900 text-lg py-0">{invoice.recipientName}</p>
        {invoice.recipientAddress && <p className="text-gray-600 mt-1 py-0">{invoice.recipientAddress}</p>}
        {invoice.recipientEmail && <p className="text-gray-600 py-0">{invoice.recipientEmail}</p>}
        {invoice.recipientPhone && <p className="text-gray-600 py-0">{invoice.recipientPhone}</p>}
        {invoice.recipientType && <p className="text-gray-500 text-xs mt-1 uppercase">{invoice.recipientType}</p>}
      </div>

      {/* Details Table */}
      <div className="mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Description / Category</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
             {/* If items exist, map them. Otherwise show description/category as a single line item */}
            {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="py-3 px-4 flex flex-col gap-2">
                      <p className="font-medium text-gray-900 py-0">{item.itemName || item.name}</p>
                      {item.description && <p className="text-xs text-gray-500 py-0">{item.description}</p>}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                        ₹{(item.total || item.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
            ) : (
                <tr>
                    <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{invoice.description || "Purchase Invoice"}</p>
                        <p className="text-xs text-gray-500">{invoice.paymentCategory || invoice.category}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                        ₹{(invoice.invoiceTotalAmount || 0).toLocaleString()}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          {Number(invoice.expenseAdjustmentAmount || 0) > 0 && (
             <div className="flex justify-between text-sm text-gray-600">
                <span>Adjustment:</span>
                <span className="text-red-600">-₹{Number(invoice.expenseAdjustmentAmount).toLocaleString()}</span>
             </div>
          )}
          
          <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-bold text-lg text-gray-900">
            <span>Total Amount:</span>
            <span>₹{(invoice.invoiceTotalAmount || 0).toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 pt-1">
             <span>Payment Status:</span>
             <span className="font-medium">{invoice.paymentStatus}</span>
          </div>

          {invoice.balanceAmount !== undefined && (
            <div className="flex justify-between text-sm font-medium text-red-600 pt-1">
              <span>Balance Due:</span>
              <span>₹{invoice.balanceAmount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-gray-400">
        <p>Generated by {companyDetails.name}</p>
      </div>
    </div>
  )
}