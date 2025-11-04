"use client"

import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Printer, FileText, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { generatePDF, printDocument } from "@/lib/pdf-utils"
import { QuotationPrint } from "@/components/print-templates/quotation-print"
import { getCompanyDetails, type CompanyDetails } from "@/lib/company-utils"
import { api } from "@/lib/api-client"
import type { Quotation } from "@/lib/data-store"

export default function QuotationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const quotationId = params.id as string
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [acceptedDate, setAcceptedDate] = useState(new Date().toISOString().split("T")[0])
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompanyDetails().then(setCompanyDetails)
    loadQuotation()
  }, [quotationId])

  const loadQuotation = () => {
    try {
      const data = api.quotations.getById(quotationId)
      if (data) {
        setQuotation(data)
      } else {
        console.error("[v0] Quotation not found:", quotationId)
      }
    } catch (error) {
      console.error("[v0] Error loading quotation:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotation...</p>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quotation Not Found</h2>
        <p className="text-gray-600 mb-4">The quotation you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/quotations")}>Back to Quotations</Button>
      </div>
    )
  }

  const quotationForPrint = {
    quotationNumber: quotation.quotationNumber,
    date: quotation.date,
    validityDate: quotation.validity,
    note: quotation.note || "",
    client: {
      name: quotation.clientName,
      address: quotation.clientAddress || "",
      phone: quotation.clientPhone || "",
      email: quotation.clientEmail,
    },
    items: (quotation.items || []).map((item) => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount || 0,
      taxName: item.taxName,
      taxRate: item.taxRate,
    })),
    status: quotation.status === "accepted" ? "Accepted" : "Pending",
    acceptedDate: quotation.acceptedDate,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAccept = () => {
    setAcceptDialogOpen(true)
  }

  const confirmAcceptance = () => {
    const updatedQuotation = api.quotations.update(quotationId, {
      status: "accepted",
      acceptedDate: acceptedDate,
    })
    if (updatedQuotation) {
      setQuotation(updatedQuotation)
    }
    setAcceptDialogOpen(false)
    // Redirect to receipts page with quotation ID
    router.push(`/dashboard/receipts/new?quotationId=${quotationId}`)
  }

  const handleDownloadPDF = async () => {
    await generatePDF("print-content", `Quotation-${quotation.quotationNumber}.pdf`)
  }

  const handlePrint = () => {
    printDocument("print-content")
  }

  const companyDetailsForPrint = companyDetails || {
    logo: "/generic-company-logo.png",
    companyName: "Your Company Name",
    address: "123 Business Street, City, State 12345",
    mobileNo1: "+1 (555) 123-4567",
    email: "info@company.com",
    website: "www.company.com",
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
            <h1 className="text-2xl font-bold text-gray-900">Quotation Details</h1>
            <p className="text-gray-600">{quotation.quotationNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {quotation.status === "pending" && (
            <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Accept Quotation
            </Button>
          )}
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

      <div id="quotation-content-display" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quotation Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Quotation Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Quotation Number</p>
                  <p className="font-semibold">{quotation.quotationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">{new Date(quotation.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valid Until</p>
                  <p className="font-semibold">{new Date(quotation.validity).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(quotation.status)}>
                    {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                  </Badge>
                </div>
              </div>
              {quotation.acceptedDate && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Accepted Date</p>
                    <p className="font-semibold text-green-600">
                      {new Date(quotation.acceptedDate).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
              {quotation.note && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Note</p>
                    <p className="font-semibold">{quotation.note}</p>
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
                <p className="font-semibold">{quotation.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{quotation.clientEmail}</p>
              </div>
              {quotation.clientPhone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{quotation.clientPhone}</p>
                </div>
              )}
              {quotation.clientAddress && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold">{quotation.clientAddress}</p>
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
              <div className="space-y-4">
                {(quotation.items || []).map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <Badge variant="outline" className="mt-1">
                          {item.type}
                        </Badge>
                      </div>
                      <p className="font-bold text-lg">₹{(item.total || 0).toLocaleString()}</p>
                    </div>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Quantity</p>
                        <p className="font-semibold">{item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Price</p>
                        <p className="font-semibold">₹{(item.price || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Discount</p>
                        <p className="font-semibold">₹{(item.discount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-semibold">₹{(item.amount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tax ({item.taxRate}%)</p>
                        <p className="font-semibold">₹{(item.taxAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
                <span className="font-semibold">₹{(quotation.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tax</span>
                <span className="font-semibold">₹{(quotation.totalTax || 0).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Grand Total</span>
                <span className="font-bold">₹{(quotation.total || 0).toLocaleString()}</span>
              </div>
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
                  <span className="text-gray-600">Current Status</span>
                  <Badge className={getStatusColor(quotation.status)}>
                    {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                  </Badge>
                </div>
                {quotation.status === "accepted" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">Quotation Accepted</p>
                    {quotation.acceptedDate && (
                      <p className="text-xs text-green-700 mt-1">
                        Accepted on {new Date(quotation.acceptedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                {quotation.status === "pending" && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">Awaiting Acceptance</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accept Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
            <DialogDescription>
              Mark this quotation as accepted. This action cannot be undone and the quotation cannot be edited after
              acceptance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Accepted Date</label>
              <Input type="date" value={acceptedDate} onChange={(e) => setAcceptedDate(e.target.value)} />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quotation Number:</span>
                <span className="font-medium">{quotation.quotationNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{quotation.clientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₹{(quotation.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAcceptance} className="bg-green-600 hover:bg-green-700">
              Confirm Acceptance
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print template for PDF generation */}
      <div className="hidden" id="print-content">
        <QuotationPrint
          quotation={quotationForPrint}
          companyDetails={{
            logo: companyDetailsForPrint.logo,
            name: companyDetailsForPrint.companyName,
            address: companyDetailsForPrint.address,
            phone: companyDetailsForPrint.mobileNo1,
            email: companyDetailsForPrint.email,
            website: companyDetailsForPrint.website,
          }}
        />
      </div>
    </div>
  )
}
