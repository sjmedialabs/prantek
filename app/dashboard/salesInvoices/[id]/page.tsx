"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Printer, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCompanyDetails, type CompanyDetails } from "@/lib/company-utils"
import { generatePDF, printDocument } from "@/lib/pdf-utils"
import { SalesInvoicePrint } from "@/components/print-templates/sales-invoice-print"
import { SalesInvoice } from "@/lib/models/types"

// interface SalesInvoice {
//   _id: string
//   salesInvoiceNumber: string
//   date: string
//   dueDate?: string
//   clientName: string
//   clientId: string
//   clientEmail?: string
//   clientPhone?: string
//   clientAddress?: string
//   items: Array<{
//     itemId: string
//     name: string
//     description?: string
//     quantity: number
//     price: number
//     discount: number
//     taxRate: number
//     total: number
//   }>
//   subtotal: number
//   taxAmount: number
//   grandTotal: number
//   balanceAmount: number
//   status: string
//   notes?: string
//   terms?: string
// }

export default function SalesInvoiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string

  const [invoice, setInvoice] = useState<SalesInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)

  useEffect(() => {
    if (id) {
      loadInvoice()
      getCompanyDetails().then(setCompanyDetails)
    }
  }, [id])

  const loadInvoice = async () => {
    try {
      const response = await fetch(`/api/salesInvoice/${id}`)
      const result = await response.json()
      
      if (result.success) {
        setInvoice(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load invoice details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading invoice:", error)
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    printDocument("invoice-print-content")
  }

  const handleDownload = async () => {
      await generatePDF("print-content", `Invoice-${invoice?.salesInvoiceNumber}.pdf`)
  }
//   const handleDownloadPDF = async () => {
//     await generatePDF("print-content", `Quotation-${quotation.quotationNumber}.pdf`)
//   }
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  const taxAmount = invoice?.items.reduce((total, item) => total + (item?.taxAmount || 0) || 0, 0)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
        <p className="text-gray-600 mb-4">The invoice you are looking for does not exist.</p>
        <Button onClick={() => router.push("/dashboard/salesInvoices")}>
          Back to Invoices
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/salesInvoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.salesInvoiceNumber}</h1>
          <Badge className={getStatusColor(invoice.status)}><span className="capitalize">{invoice.status}</span></Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} title="While downloading please cross verify Your owned company Detils in settings">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handlePrint} title="While Printing please cross verify Your owned company Detils in setting">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-gray-500" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Invoice Date</p>
                  <p className="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Due Date</p>
                    <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created By</p>
                  <p className="font-medium capitalize">{invoice.createdBy}</p>
                </div>
              </div>

              <Separator />

              {/* Items Table */}
              <div>
                <h3 className="font-semibold mb-4">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-gray-500">Item</th>
                        <th className="text-right py-2 font-medium text-gray-500">Qty</th>
                        <th className="text-right py-2 font-medium text-gray-500" title="Price per unit">Price</th>
                        <th className="text-right py-2 font-medium text-gray-500" title="Tax applied on one quatity">Tax</th>
                        <th className="text-right py-2 font-medium text-gray-500" title="Discount Applied on one Quantity">Discount</th>
                        <th className="text-right py-2 font-medium text-gray-500" title="Total including Tax and Discount">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3">
                            <p className="font-medium">{item.itemName || "Item " + (index + 1)}</p>
                            {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                          </td>
                          <td className="text-right py-3">{item.quantity}</td>
                          <td className="text-right py-3">₹{item.price.toLocaleString()}</td>
                          <td className="text-right py-3">{item.cgst + item.sgst + item.igst}%</td>
                          <td className="text-right py-3">₹{item?.discount}</td>
                          <td className="text-right py-3 font-medium">₹{item?.total?.toLocaleString() || `${item.price * item.quantity}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full md:w-1/2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{invoice?.subtotal?.toLocaleString() || `${invoice.items.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax Amount</span>
                    <span>₹{invoice?.items?.reduce((acc, item) => acc + (item.taxAmount || 0), 0).toLocaleString() || 0}</span>
                  </div>
                   <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount Amount</span>
                    <span>₹{invoice?.items?.reduce((acc, item) => acc + (item.discount*item.quantity || 0), 0).toLocaleString() || 0}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
                    <span>₹{invoice?.grandTotal?.toLocaleString()}</span>
                  </div>
                  {invoice.balanceAmount > 0 && (
                    <div className="flex justify-between text-sm font-medium text-red-600 mt-2">
                      <span>Balance Due</span>
                      <span>₹{invoice?.balanceAmount?.toLocaleString() || 0}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

{/* Terms and Notes */}
{(invoice.terms || invoice.description) && (
  <Card>
    <CardContent className="space-y-4">
      {invoice.description && (
        <div>
          <h4 className="font-semibold text-sm mb-1" title="Only for Admin Visiblility">Description</h4>
          <p className="text-sm text-gray-600">
            {invoice.description}
          </p>
        </div>
      )}

      {invoice.terms && (
        <div>
          <h4 className="font-semibold text-lg mb-1 flex items-center">
             <FileText className="h-5 w-5 mr-2 text-gray-500" />
            Terms & Conditions
          </h4>

          <div
            className="prose prose-sm max-w-none text-gray-600"
            dangerouslySetInnerHTML={{
              __html: invoice.terms,
            }}
          />
        </div>
      )}
    </CardContent>
  </Card>
)}

        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
                    
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{invoice.clientName}</p>
              </div>
              {invoice.clientEmail && (
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{invoice.clientEmail}</p>
                </div>
              )}
              {invoice.clientContact && (
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{invoice.clientContact}</p>
                </div>
              )}
              {invoice.clientAddress && (
                <div>
                  <p className="text-gray-500">Address</p>
                  <p className="font-medium">{invoice.clientAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>
                  {invoice.bankDetails && (
                    <div className="border rounded-lg mt-2 p-4 bg-gray-50 text-sm space-y-1">
                      <h3 className="text-base font-medium py-2">Bank Details</h3>
                      <p><strong>Bank:</strong> {invoice.bankDetails.bankName}</p>
                      <p><strong>Account Name:</strong> {invoice.bankDetails.accountName}</p>
                      <p><strong>Account Number:</strong> {invoice.bankDetails.accountNumber}</p>
                      <p><strong>IFSC:</strong> {invoice.bankDetails.ifscCode}</p>
                      <p><strong>Branch:</strong> {invoice.bankDetails.branchName}</p>

                      {invoice.bankDetails.upiId && (
                        <p><strong>UPI ID:</strong> {invoice.bankDetails.upiId}</p>
                      )}
                      {invoice.bankDetails?.upiScanner && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">UPI QR Code</p>
                          <img
                            src={invoice.bankDetails.upiScanner}
                            alt="UPI Scanner"
                            className="h-40 w-40 object-contain border rounded"
                          />
                        </div>
                      )}

                    </div>
                  )}
        </div>
      </div>

      {/* Hidden Print Component */}
      <div className="hidden" id="print-content">
        {companyDetails && (
          <SalesInvoicePrint 
            invoice={invoice} 
            companyDetails={{
              name: companyDetails.companyName,
              address: companyDetails.address,
              phone: companyDetails.mobileNo1,
              email: companyDetails.email,
              website: companyDetails.website,
              logo: companyDetails.logo
            }} 
          />
        )}
      </div>
    </div>
  )
}