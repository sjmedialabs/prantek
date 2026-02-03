import React from "react"
import { format } from "date-fns"

interface SalesInvoicePrintProps {
  invoice: any
  companyDetails: any
}

export const SalesInvoicePrint: React.FC<SalesInvoicePrintProps> = ({ invoice, companyDetails }) => {
  const totalDiscount = invoice.items.reduce((acc: number, item: any) => acc + (item.discount || 0), 0);

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
            <div className="text-sm text-gray-600 mt-1 space-y-0.5">
              <p>{companyDetails.address}</p>
              <p>Phone: {companyDetails.phone}</p>
              <p>Email: {companyDetails.email}</p>
              {companyDetails.website && <p>Web: {companyDetails.website}</p>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">TAX INVOICE</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-semibold">Invoice No:</span> {invoice.salesInvoiceNumber}</p>
            <p><span className="font-semibold">Date:</span> {format(new Date(invoice.date), "dd MMM yyyy")}</p>
            {invoice.dueDate && (
              <p><span className="font-semibold">Due Date:</span> {format(new Date(invoice.dueDate), "dd MMM yyyy")}</p>
            )}
            <p><span className="font-semibold">Status:</span> <span className="uppercase">{invoice.status}</span></p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
        <p className="font-bold text-gray-900 text-lg">{invoice.clientName}</p>
        {invoice.clientAddress && <p className="text-gray-600 mt-1">{invoice.clientAddress}</p>}
        {invoice.clientEmail && <p className="text-gray-600">{invoice.clientEmail}</p>}
        {invoice.clientPhone && <p className="text-gray-600">{invoice.clientPhone}</p>}
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Item Description</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-700">Qty</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-700">Price</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-700">Discount</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-700">Tax %</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items.map((item: any, index: number) => (
              <tr key={index}>
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                </td>
                <td className="py-3 px-4 text-right text-gray-600">{item.quantity}</td>
                <td className="py-3 px-4 text-right text-gray-600">₹{item.price.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-gray-600">₹{(item.discount || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-gray-600">{item.taxRate}%</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">₹{item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal:</span>
            <span>₹{invoice.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Discount:</span>
            <span className="text-red-600">- ₹{totalDiscount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax Amount:</span>
            <span>₹{invoice.taxAmount.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-bold text-lg text-gray-900">
            <span>Grand Total:</span>
            <span>₹{invoice?.grandTotal?.toLocaleString()}</span>
          </div>
          {invoice.balanceAmount !== undefined && (
            <div className="flex justify-between text-sm font-medium text-red-600 pt-1">
              <span>Balance Due:</span>
              <span>₹{invoice.balanceAmount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Terms & Notes */}
      {(invoice.terms || invoice.notes) && (
        <div className="border-t border-gray-200 pt-6 space-y-4">
          {invoice.notes && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-1">Notes:</h4>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-1">Terms & Conditions:</h4>
              <div 
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: invoice.terms }} 
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-gray-400">
        <p>Thank you for your business!</p>
      </div>
    </div>
  )
}