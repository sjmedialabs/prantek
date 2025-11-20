interface PaymentPrintProps {
  payment: {
    _id: string
    paymentNumber: string
    date: string
    recipientName: string
    recipientType: string
    recipientId: string
    paymentCategory: string
    description?: string
    amount: number
    paymentMethod: string
    referenceNumber?: string
    status: string
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

export function PaymentPrint({ payment, companyDetails }: PaymentPrintProps) {
  const amountInWords = (num: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ]

    if (num === 0) return "Zero Rupees"

    const numStr = Math.floor(num).toString()
    let result = ""

    if (numStr.length > 6) {
      const millions = Number.parseInt(numStr.slice(0, -6))
      result += ones[millions] + " Million "
    }

    if (numStr.length > 3) {
      const thousands = Number.parseInt(numStr.slice(-6, -3))
      if (thousands > 0) {
        if (thousands >= 100) {
          result += ones[Math.floor(thousands / 100)] + " Hundred "
        }
        const remainder = thousands % 100
        if (remainder >= 10 && remainder < 20) {
          result += teens[remainder - 10] + " "
        } else {
          result += tens[Math.floor(remainder / 10)] + " " + ones[remainder % 10] + " "
        }
        result += "Thousand "
      }
    }

    const lastThree = Number.parseInt(numStr.slice(-3))
    if (lastThree >= 100) {
      result += ones[Math.floor(lastThree / 100)] + " Hundred "
    }
    const remainder = lastThree % 100
    if (remainder >= 10 && remainder < 20) {
      result += teens[remainder - 10] + " "
    } else {
      result += tens[Math.floor(remainder / 10)] + " " + ones[remainder % 10] + " "
    }

    return result.trim() + " Rupees"
  }
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
          <h2 className="text-3xl font-bold text-red-600">PAYMENT</h2>
          <p className="text-sm text-gray-600 mt-2">#{payment.paymentNumber}</p>
        </div>
      </div>

      {/* Payment and Client Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">PAID TO:</h3>
          <div className="text-sm">
            <p className="font-semibold text-gray-900">{payment.recipientName}</p>
            {payment.recipientId && <p className="text-gray-600">{payment.recipientId}</p>}
            {payment.recipientType && <p className="text-gray-600">Phone: {payment.recipientType}</p>}
            {/* {payment.recipientName && <p className="text-gray-600">Email: {payment.recipientName}</p>} */}
          </div>
        </div>
        <div className="text-right">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Date:</span>
              <span className="text-gray-900">{new Date(payment.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Category:</span>
              <span className="text-gray-900">{payment.paymentCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Payment Method:</span>
              <span className="text-gray-900">{payment.paymentMethod}</span>
            </div>
            {payment.referenceNumber && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Reference:</span>
                <span className="text-gray-900">{payment.referenceNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Status:</span>
              <span className={`font-semibold ${payment.status === "Cleared" ? "text-green-600" : "text-yellow-600"}`}>
                {payment.status}
              </span>
            </div>
            {/* <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Created By:</span>
              <span className="text-gray-900">{payment.createdBy}</span>
            </div> */}
          </div>
        </div>
      </div>

      {/* Payment Amount */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-700">Payment Amount:</span>
          <span className="text-3xl font-bold text-red-600">₹{payment?.amount?.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-300 pt-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Amount in Words:</span> {amountInWords(payment.amount)}
          </p>
        </div>
      </div>

      {/* Description */}
      {payment.description && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Description:</h3>
          <p className="text-sm text-gray-600">{payment.description}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-4 text-center">
        <p className="text-xs text-gray-600">Payment processed successfully</p>
        <p className="text-xs text-gray-500 mt-1">
          This is a computer-generated payment voucher and does not require a signature.
        </p>
      </div>
    </div>
  )
}
