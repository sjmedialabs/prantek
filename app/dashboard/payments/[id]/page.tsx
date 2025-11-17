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
  const numberToWords = (num: number) => {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred " + (n % 100 ? inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand " + (n % 1000 ? inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh " + (n % 100000 ? inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore " + (n % 10000000 ? inWords(n % 10000000) : "");
  };

  return inWords(num).trim() + " Rupees Only";
};

  useEffect(() => {
    getCompanyDetails().then(setCompanyDetails)
  }, [])

  useEffect(() => {
    const loadPayment = async () => {
      try {
        const paymentData = await api.payments.getById(paymentId)
        setPayment(paymentData.payment)
        console.log("[v0] Payment data:", paymentData.payment)
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
    _id : payment._id,
    paymentNumber: payment.paymentNumber,
    date: payment.date,
    recipientType: payment.recipientType,
    recipientName: payment.recipientName,
    recipientId: payment.recipientId,
    paymentCategory: payment.category,
    description: payment.description,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber || "",
    status: payment.status,
  }
  console.log("payment for view page",paymentForPrint)
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
                  <Badge variant={payment.status === "completed" ? "default" : "secondary"}>{payment.status}</Badge>
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
              <CardTitle>Party Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Party Name</p>
                <p className="font-semibold">{payment.recipientName}</p>
              </div>
              {payment.recipientId && (
                <div>
                  <p className="text-sm text-gray-600">Party ID</p>
                  <p className="font-semibold">{payment.recipientId}</p>
                </div>
              )}
              {payment.recipientType && (
                <div>
                  <p className="text-sm text-gray-600">Party Type</p>
                  <p className="font-semibold">{payment.recipientType}</p>
                </div>
              )}
              {/* {payment.clientAddress && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold">{payment.clientAddress}</p>
                </div>
              )} */}
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
                  <p className="font-semibold capitalize">{payment.paymentMethod}</p>
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
                {/* {payment.createdBy && (
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-semibold">{payment.createdBy}</p>
                  </div>
                )} */}
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
                <p className="text-3xl font-bold text-gray-900">₹{(payment.amount || 0).toLocaleString()}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount in Words</p>
                <p className="font-semibold text-gray-900">{payment.amount ? numberToWords(Number(payment.amount)) : "-"}</p>
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
                  <Badge variant={payment.status === "completed" ? "default" : "secondary"}>{payment.status}</Badge>
                </div>
                {payment.status === "completed" && (
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
