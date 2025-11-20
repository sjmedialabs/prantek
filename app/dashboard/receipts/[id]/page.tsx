"use client"

import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Printer, ReceiptIcon } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { generatePDF, printDocument } from "@/lib/pdf-utils"
import { ReceiptPrint } from "@/components/print-templates/receipt-print"
import { getCompanyDetails, type CompanyDetails } from "@/lib/company-utils"
import { api } from "@/lib/api-client"
import type { Receipt } from "@/lib/models/types"

export default function ReceiptDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const receiptId = params.id as string
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompanyDetails().then(setCompanyDetails)
    loadReceipt()
  }, [receiptId])

  const loadReceipt = async () => {
    try {
      const data = await api.receipts.getById(receiptId)
      console.log("Getting recipt data from api",data)
      setReceipt(data)
    } catch (error) {
      setReceipt(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    await generatePDF("print-content", `Receipt-${receipt?.receiptNumber}.pdf`)
  }

  const handlePrint = () => {
    printDocument("print-content")
  }

  const receiptForPrint = receipt &&
    receipt.items && {
      receiptNumber: receipt.receiptNumber,
      date: receipt.date,
      description: receipt.description || "",
      client: {
        name: receipt.clientName,
        address: receipt.clientAddress || "",
        phone: receipt.clientPhone || "",
        email: receipt.clientEmail || "",
      },
      items: receipt.items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        taxName: item.taxName,
        taxRate: item.taxRate,
      })),
      receiptTotal: receipt.amountPaid || 0,
      paymentType: receipt.paymentType,
      paymentMethod: receipt.paymentMethod,
      referenceNumber: receipt.referenceNumber || "",
      status: receipt.status,
      quotationNumber: receipt.quotationNumber || "",
      balanceAmount: receipt.balanceAmount || 0,
    }

  const companyDetailsForPrint = companyDetails || {
    logo: "/generic-company-logo.png",
    companyName: "Your Company Name",
    address: "123 Business Street, City, State 12345",
    mobileNo1: "+1 (555) 123-4567",
    email: "info@company.com",
    website: "www.company.com",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Receipt Not Found</h2>
        <p className="text-gray-600 mb-4">The receipt you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/receipts")}>Back to Receipts</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Receipt Details</h1>
            <p className="text-gray-600">{receipt.receiptNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div id="receipt-content-display" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Receipt Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ReceiptIcon className="h-5 w-5 mr-2" />
                Receipt Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Receipt Number</p>
                  <p className="font-semibold">{receipt.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">{new Date(receipt.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Type</p>
                  <Badge variant="default">
                    {receipt.paymentType === "full"
                      ? "Full Payment"
                      : receipt.paymentType === "partial"
                        ? "Partial"
                        : "Advance Payment"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={receipt.status === "cleared" ? "default" : "secondary"}>
                    {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                  </Badge>
                </div>
              </div>
              {receipt.quotationNumber && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Quotation Number</p>
                      <Link href={`/dashboard/quotations/${receipt.quotationNumber}`}>
                        <p className="font-semibold text-blue-600 hover:underline">{receipt.quotationNumber}</p>
                      </Link>
                    </div>
                    {receipt.quotationAcceptedDate && (
                      <div>
                        <p className="text-sm text-gray-600">Quotation Accepted Date</p>
                        <p className="font-semibold">{new Date(receipt.quotationAcceptedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              {receipt.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="font-semibold">{receipt.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Client Name</p>
                <p className="font-semibold">{receipt.clientName}</p>
              </div>
              {receipt.clientEmail && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{receipt.clientEmail}</p>
                </div>
              )}
              {receipt.clientPhone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{receipt.clientPhone}</p>
                </div>
              )}
              {receipt.clientAddress && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold">{receipt.clientAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items/Services */}
          <Card>
            <CardHeader>
              <CardTitle>Items/Services</CardTitle>
            </CardHeader>
            <CardContent>
              {receipt.items && receipt.items.length > 0 ? (
                <div className="space-y-4">
                  {receipt.items.map((item, index) => (
                    <div key={item.id || index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{item.itemName}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <Badge variant="outline" className="mt-1">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="font-bold text-lg">₹{item.total?.toLocaleString() || "0"}</p>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Quantity</p>
                          <p className="font-semibold">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Price</p>
                          <p className="font-semibold">₹{item.price || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Discount</p>
                          <p className="font-semibold">₹{(item.discount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-semibold">₹{item.amount?.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tax ({item.taxRate || 0}%)</p>
                          <p className="font-semibold">₹{item.taxAmount?.toLocaleString() || "0"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No items found for this receipt</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold">{receipt.paymentMethod}</p>
                </div>
                {receipt.bankAccount && (
                  <div>
                    <p className="text-sm text-gray-600">Bank Account</p>
                    <p className="font-semibold">{receipt.bankAccount}</p>
                  </div>
                )}
                {receipt.referenceNumber && (
                  <div>
                    <p className="text-sm text-gray-600">Reference Number</p>
                    <p className="font-semibold">{receipt.referenceNumber}</p>
                  </div>
                )}
                {receipt.createdBy && (
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-semibold">{receipt.createdBy}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Amount Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{(receipt.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tax</span>
                <span className="font-semibold">₹{(receipt.totalTax || 0).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Grand Total</span>
                <span className="font-bold">₹{(receipt.total || 0).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-green-600">
                <span className="font-semibold">Amount Paid</span>
                <span className="font-bold">₹{(receipt.amountPaid || 0).toLocaleString()}</span>
              </div>
              {(receipt.balanceAmount || 0) > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span className="font-semibold">Balance Due</span>
                  <span className="font-bold">₹{(receipt.balanceAmount || 0).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <Badge variant={receipt.status === "cleared" ? "default" : "secondary"}>
                    {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                  </Badge>
                </div>
                {(receipt.balanceAmount || 0) === 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">Payment Completed</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden" id="print-content">
        {receiptForPrint && (
          <ReceiptPrint
            receipt={receiptForPrint}
            companyDetails={{
              logo: companyDetailsForPrint.logo,
              name: companyDetailsForPrint.companyName,
              address: companyDetailsForPrint.address,
              phone: companyDetailsForPrint.mobileNo1,
              email: companyDetailsForPrint.email,
              website: companyDetailsForPrint.website,
            }}
          />
        )}
      </div>
    </div>
  )
}
