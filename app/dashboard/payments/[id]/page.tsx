"use client"

import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Printer, CreditCard } from "lucide-react"
import { useState, useEffect } from "react"
import { generatePDF, printDocument } from "@/lib/pdf-utils"
import { PaymentPrint } from "@/components/print-templates/payment-print"
import { getCompanyDetails, type CompanyDetails } from "@/lib/company-utils"
import { api } from "@/lib/api-client"
import type { Payment } from "@/lib/data-store"

export default function PaymentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params.id as string
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompanyDetails().then(setCompanyDetails)
  }, [])

  useEffect(() => {
    const loadPayment = async () => {
      try {
        const paymentData = await api.payments.getById(paymentId)
        setPayment(paymentData)
      } catch (error) {
        console.error("[v0] Error loading payment:", error)
      } finally {
        setLoading(false)
      }
    }
    loadPayment()
  }, [paymentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading payment details...</p>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
        <p className="text-gray-600 mb-4">The payment you're looking for doesn't exist.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const paymentForPrint = {
    paymentNumber: payment.paymentNumber,
    date: payment.date,
    client: {
      name: payment.clientName,
      address: payment.clientAddress || "",
      phone: payment.clientPhone || "",
      email: payment.clientEmail || "",
    },
    paymentCategory: payment.category,
    description: payment.description,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber || "",
    status: payment.status,
    createdBy: payment.createdBy || "N/A",
  }

  const handleDownloadPDF = async () => {
    await generatePDF("print-content", `Payment-${payment.paymentNumber}.pdf`)
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
            <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            <p className="text-gray-600">{payment.paymentNumber}</p>
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

      <div id="payment-content-display" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Number</p>
                  <p className="font-semibold">{payment.paymentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">{new Date(payment.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <Badge variant="outline">{payment.category}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={payment.status === "Cleared" ? "default" : "secondary"}>{payment.status}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-semibold">{payment.description}</p>
              </div>
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
                <p className="font-semibold">{payment.clientName}</p>
              </div>
              {payment.clientEmail && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{payment.clientEmail}</p>
                </div>
              )}
              {payment.clientPhone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{payment.clientPhone}</p>
                </div>
              )}
              {payment.clientAddress && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold">{payment.clientAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold capitalize">{payment.paymentMethod.replace("-", " ")}</p>
                </div>
                {payment.bankAccount && (
                  <div>
                    <p className="text-sm text-gray-600">Bank Account</p>
                    <p className="font-semibold">{payment.bankAccount}</p>
                  </div>
                )}
                {payment.referenceNumber && (
                  <div>
                    <p className="text-sm text-gray-600">Reference Number</p>
                    <p className="font-semibold">{payment.referenceNumber}</p>
                  </div>
                )}
                {payment.createdBy && (
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-semibold">{payment.createdBy}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-semibold">{new Date(payment.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Amount Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Payment Amount</p>
                <p className="text-3xl font-bold text-gray-900">₹{payment.amount.toLocaleString()}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount in Words</p>
                <p className="font-semibold text-gray-900">{payment.amountInWords}</p>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Status</span>
                  <Badge variant={payment.status === "Cleared" ? "default" : "secondary"}>{payment.status}</Badge>
                </div>
                {payment.status === "Cleared" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">Payment Cleared Successfully</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden" id="print-content">
        <PaymentPrint
          payment={paymentForPrint}
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
