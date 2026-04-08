"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, FileText, Download, ExternalLink, Printer, Mail } from "lucide-react"
import { SendEmailDialog } from "@/components/ui/send-email-dialog"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { getCompanyDetails, type CompanyDetails } from "@/lib/company-utils"
import { generatePDF, printDocument } from "@/lib/pdf-utils"
import { tokenStorage } from "@/lib/token-storage"
import { PurchaseInvoicePrint } from "@/components/print-templates/purchase-invoice-print"

export default function ViewPurchaseInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<any>(null)
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)
  const [planFeatures, setPlanFeatures] = useState<any>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  useEffect(() => {
    const fetchPlanFeatures = async () => {
      try {
        const token = tokenStorage.getAccessToken()
        const response = await fetch("/api/user/plan-features", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (data.success) setPlanFeatures(data.planFeatures)
      } catch (error) {
        console.error("Failed to fetch plan features", error)
      }
    }
    fetchPlanFeatures()

    const loadInvoice = async () => {
      try {
        const data = await api.purchaseInvoice.getById(id)
        if (!data) {
          toast({ title: "Error", description: "Invoice not found", variant: "destructive" })
          router.push("/dashboard/purchaseInvoices")
          return
        }
        setInvoice(data)
        getCompanyDetails().then(setCompanyDetails)
      } catch (error) {
        console.error("Failed to load invoice:", error)
        toast({ title: "Error", description: "Failed to load invoice details", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    if (id) loadInvoice()
  }, [id, router, toast])

  if (loading) return <div className="p-8 text-center">Loading invoice details...</div>
  if (!invoice) return <div className="p-8 text-center">Invoice not found</div>

  const isEditable = invoice.invoiceStatus === "Open"

  const handlePrint = () => {
    printDocument("invoice-print-content")
  }

  const handleDownload = async () => {
    await generatePDF("invoice-print-content", `Purchase-Invoice-${invoice?.purchaseInvoiceNumber}.pdf`)
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start flex-col gap-1 space-x-4">
          <Link href="/dashboard/purchaseInvoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Invoice Details</h1>
            <p className="text-gray-600">{invoice.purchaseInvoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditable && (
            <Link href={`/dashboard/purchaseInvoices/${id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Invoice
              </Button>
            </Link>
          )}
          {planFeatures?.pdf && (
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          {planFeatures?.print && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
          {planFeatures?.email && (
            <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Invoice Number</p>
                  <p className="text-lg font-semibold">{invoice.purchaseInvoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Vendor Invoice Number</p>
                  <p className="text-lg font-semibold">{invoice.vendorInvoiceNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-base">{new Date(invoice.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Due Date</p>
                  <p className="text-base">
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Ledger Head</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {invoice.paymentCategory || invoice.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="text-base">{invoice.createdBy || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 min-h-[60px]">
                  {invoice.description || "No description provided."}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Party Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Party Type</p>
                  <p className="text-base capitalize">{invoice.recipientType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Party Name</p>
                  <p className="text-lg font-semibold">{invoice.recipientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base">{invoice.recipientEmail || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-base">{invoice.recipientPhone || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-base whitespace-pre-line">{invoice.recipientAddress || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bill Attachment */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Attachment</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.billUpload ? (
                <div className="border rounded-lg p-4">
                  {invoice.billUpload.toLowerCase().endsWith(".pdf") ? (
                    <div className="flex items-center gap-4">
                      <FileText className="h-12 w-12 text-red-500" />
                      <div>
                        <p className="font-medium">Bill Document (PDF)</p>
                        <a
                          href={invoice.billUpload}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center mt-1"
                        >
                          View / Download <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative h-64 w-full bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={invoice.billUpload}
                          alt="Bill"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="text-right">
                        <a
                          href={invoice.billUpload}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Full Size
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                  No bill attached
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Invoice Status</span>
                  <Badge variant={invoice.invoiceStatus === "Closed" ? "default" : "secondary"} className="capitalize">
                    {invoice.invoiceStatus}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Status</span>
                  <Badge variant={invoice.paymentStatus === "Paid" ? "default" : "secondary"} className="capitalize">
                    {invoice.paymentStatus}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{Number(invoice.invoiceTotalAmount || 0).toLocaleString()}</span>
                </div>
                {invoice.expenseAdjustmentAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Adjustment</span>
                    <span>- ₹{Number(invoice.expenseAdjustmentAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-bold text-lg">Total Payable</span>
                  <span className="font-bold text-xl text-purple-600">
                    ₹{Number(invoice.balanceAmount || 0).toLocaleString()}
                  </span>
                </div>
                {invoice.amountInWords && (
                  <p className="text-xs text-gray-500 italic text-right">{invoice.amountInWords}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {invoice.expenseAdjustmentReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adjustment Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{invoice.expenseAdjustmentReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <SendEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        documentType="purchaseInvoice"
        documentId={invoice?._id || invoice?.id || id}
        defaultEmail={invoice?.vendorEmail || ""}
        defaultName={invoice?.vendorName || ""}
      />

      {/* Hidden Print Component */}
      <div className="hidden" id="invoice-print-content">
        {companyDetails && (
          <PurchaseInvoicePrint
            invoice={invoice}
            companyDetails={{
              name: companyDetails.companyName,
              address: companyDetails.address,
              phone: companyDetails.mobileNo1,
              email: companyDetails.email,
              website: companyDetails.website,
              logo: companyDetails.logo,
            }}
          />
        )}
      </div>
    </div>
  )
}