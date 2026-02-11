"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Printer, Download, FileText, ExternalLink, Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { getCompanyDetails, type CompanyDetails } from "@/lib/company-utils"
import { generatePDF, printDocument } from "@/lib/pdf-utils"
import { PurchaseInvoicePrint } from "@/components/print-templates/purchase-invoice-print"

export default function ViewInvoicePage() {
  const { id } = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const data = await api.purchaseInvoice.getById(id as string)
        setInvoice(data)
      } catch (error) {
        console.error("Failed to load invoice", error)
      } finally {
        setLoading(false)
      }
    }
    if (id) loadInvoice()
    getCompanyDetails().then(setCompanyDetails)
  }, [id])

  const handlePrint = () => {
    printDocument("invoice-print-content")
  }

  const handleDownload = async () => {
    await generatePDF("print-content", `Purchase-Invoice-${invoice?.purchaseInvoiceNumber}.pdf`)
  }

  if (loading) return <div className="p-8 text-center">Loading invoice details...</div>
  if (!invoice) return <div className="p-8 text-center">Invoice not found</div>

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/purchaseInvoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.purchaseInvoiceNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={invoice.invoiceStatus === "Closed" ? "default" : "secondary"}>
                {invoice.invoiceStatus || "Open"}
              </Badge>
              <span className="text-sm text-gray-500">
                Created on {format(new Date(invoice.date), "PPP")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Invoice Number</p>
                <p className="text-lg font-semibold">{invoice.purchaseInvoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ledger Head</p>
                <p className="text-lg">{invoice.paymentCategory || invoice.category || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Invoice Date</p>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{format(new Date(invoice.date), "PPP")}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Due Date</p>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{invoice.dueDate ? format(new Date(invoice.dueDate), "PPP") : "-"}</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1 text-gray-700">{invoice.description || "No description provided."}</p>
              </div>
            </CardContent>
          </Card>

          {/* Recipient Details */}
          <Card>
            <CardHeader>
              <CardTitle>Party Details</CardTitle>
              <CardDescription>
                Type: <span className="capitalize font-medium text-gray-900">{invoice.recipientType}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{invoice.recipientName}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoice.recipientEmail && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {invoice.recipientEmail}
                  </div>
                )}
                {invoice.recipientPhone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {invoice.recipientPhone}
                  </div>
                )}
                {invoice.recipientAddress && (
                  <div className="flex items-start text-gray-600 md:col-span-2">
                    <MapPin className="h-4 w-4 mr-2 mt-1" />
                    {invoice.recipientAddress}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Financials & Files */}
        <div className="space-y-6">
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-2xl font-bold">₹{invoice.invoiceTotalAmount?.toLocaleString()}</span>
              </div>
              
              {Number(invoice.expenseAdjustmentAmount || 0) > 0 && (
                <div className="pb-4 border-b space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Expense Adjustment</span>
                    <span className="font-medium text-red-600">- ₹{Number(invoice.expenseAdjustmentAmount).toLocaleString()}</span>
                  </div>
                  {invoice.expenseAdjustmentReason && <p className="text-xs text-gray-500 italic">Reason: {invoice.expenseAdjustmentReason}</p>}
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <Badge variant={invoice.paymentStatus === "Paid" ? "default" : "outline"}>
                    {invoice.paymentStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance Due</span>
                  <span className="font-medium">₹{invoice.balanceAmount?.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {invoice.billUpload && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Bill Document</p>
                      <p className="text-xs text-gray-500">Attached file</p>
                    </div>
                  </div>
                  <a href={invoice.billUpload} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Hidden Print Component */}
      <div className="hidden" id="print-content">
        {companyDetails && (
          <PurchaseInvoicePrint
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
