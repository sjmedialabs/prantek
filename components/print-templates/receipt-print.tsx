interface ReceiptPrintProps {
  receipt: {
    receiptNumber: string
    date: string
    description?: string
    client: {
      name: string
      address?: string
      phone?: string
      email?: string
    }
    items?: Array<{
      name: string
      description?: string
      quantity: number
      price: number
      discount: number
      taxName?: string
      taxRate: number
    }>
    receiptTotal: number
    paymentType: string
    paymentMethod: string
    referenceNumber?: string
    status: string
    quotationNumber?: string
    balanceAmount?: number
  }
  companyDetails?: {
    logo?: string
    name: string
    address: string
    phone: string
    email: string
    website?: string
  }
}

export function ReceiptPrint({ receipt, companyDetails }: ReceiptPrintProps) {
  const calculateItemTotal = (item: any) => {
    const amount = (item.price - item.discount) * item.quantity
    const taxAmount = amount * (item.taxRate / 100)
    return amount + taxAmount
  }

  const subtotal =
    receipt.items?.reduce((sum, item) => {
      return sum + (item.price - item.discount) * item.quantity
    }, 0) || 0

  const totalTax =
    receipt.items?.reduce((sum, item) => {
      const amount = (item.price - item.discount) * item.quantity
      return sum + amount * (item.taxRate / 100)
    }, 0) || 0

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-0" id="print-content">
      {/* Header with Company Logo and Details */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
        <div className="flex items-start space-x-4">
          {companyDetails?.logo && (
            <img
              src={companyDetails.logo || "/placeholder.svg"}
              alt="Company Logo"
              className="w-20 h-20 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyDetails?.name || "Company Name"}</h1>
            <p className="text-sm text-gray-600 mt-1">{companyDetails?.address}</p>
            <p className="text-sm text-gray-600">
              Phone: {companyDetails?.phone} | Email: {companyDetails?.email}
            </p>
            {companyDetails?.website && <p className="text-sm text-gray-600">Website: {companyDetails.website}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-green-600">RECEIPT</h2>
          <p className="text-sm text-gray-600 mt-2">#{receipt.receiptNumber}</p>
        </div>
      </div>

      {/* Receipt and Client Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">RECEIVED FROM:</h3>
          <div className="text-sm">
            <p className="font-semibold text-gray-900">{receipt.client.name}</p>
            {receipt.client.address && <p className="text-gray-600">{receipt.client.address}</p>}
            {receipt.client.phone && <p className="text-gray-600">Phone: {receipt.client.phone}</p>}
            {receipt.client.email && <p className="text-gray-600">Email: {receipt.client.email}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Date:</span>
              <span className="text-gray-900">{new Date(receipt.date).toLocaleDateString()}</span>
            </div>
            {receipt.quotationNumber && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Quotation:</span>
                <span className="text-gray-900">{receipt.quotationNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Payment Type:</span>
              <span className="text-gray-900">{receipt.paymentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Payment Method:</span>
              <span className="text-gray-900">{receipt.paymentMethod}</span>
            </div>
            {receipt.referenceNumber && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Reference:</span>
                <span className="text-gray-900">{receipt.referenceNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Status:</span>
              <span className={`font-semibold ${receipt.status === "Cleared" ? "text-green-600" : "text-yellow-600"}`}>
                {receipt.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table (if items exist) */}
      {receipt.items && receipt.items.length > 0 && (
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Qty</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Discount</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Tax</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-4">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  {item.description && <p className="text-xs text-gray-600">{item.description}</p>}
                </td>
                <td className="text-right py-3 px-4 text-sm text-gray-900">{item.quantity}</td>
                <td className="text-right py-3 px-4 text-sm text-gray-900">₹{item.price.toFixed(2)}</td>
                <td className="text-right py-3 px-4 text-sm text-gray-900">₹{item.discount.toFixed(2)}</td>
                <td className="text-right py-3 px-4 text-sm text-gray-600">
                  {item.taxName} ({item.taxRate}%)
                </td>
                <td className="text-right py-3 px-4 text-sm font-medium text-gray-900">
                  ₹{calculateItemTotal(item).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Payment Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          {receipt.items && receipt.items.length > 0 && (
            <>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-gray-900 font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-700">Tax:</span>
                <span className="text-gray-900 font-medium">₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm border-t border-gray-300">
                <span className="text-gray-700">Total Amount:</span>
                <span className="text-gray-900 font-medium">₹{(subtotal + totalTax).toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between py-3 border-t-2 border-gray-300">
            <span className="text-lg font-bold text-gray-900">Amount Paid:</span>
            <span className="text-lg font-bold text-green-600">₹{receipt.receiptTotal.toFixed(2)}</span>
          </div>
          {receipt.balanceAmount !== undefined && receipt.balanceAmount > 0 && (
            <div className="flex justify-between py-2 text-sm border-t border-gray-300">
              <span className="text-gray-700">Balance Due:</span>
              <span className="text-red-600 font-medium">₹{receipt.balanceAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {receipt.description && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Description:</h3>
          <p className="text-sm text-gray-600">{receipt.description}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-4 text-center">
        <p className="text-xs text-gray-600">Thank you for your payment!</p>
        <p className="text-xs text-gray-500 mt-1">
          This is a computer-generated receipt and does not require a signature.
        </p>
      </div>
    </div>
  )
}
