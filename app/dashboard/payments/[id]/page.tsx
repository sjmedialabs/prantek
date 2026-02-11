"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Printer, Trash2, Download } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@/components/auth/user-context"
import { getCompanyDetails, type CompanyDetails } from "@/lib/company-utils"
import { generatePDF, printDocument } from "@/lib/pdf-utils"
import { PaymentPrint } from "@/components/print-templates/payment-print"

// Helper component for displaying details
const DetailItem = ({ label, value, isBadge = false }: { label: string; value: any; isBadge?: boolean }) => {
  if (!value && value !== 0) return null
  return (
    <div className="grid grid-cols-2 gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">
        {isBadge ? <Badge>{value}</Badge> : value}
      </dd>
    </div>
  )
}

export default function PaymentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { hasPermission } = useUser()
  const paymentId = params.id as string

  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)

  useEffect(() => {
    if (paymentId) {
      const loadPayment = async () => {
        try {
          setLoading(true)
          const paymentData = await api.payments.getById(paymentId)
          console.log("paymentData", paymentData.payment)
          if (!paymentData) {
            toast({
              title: "Error",
              description: "Payment not found.",
              variant: "destructive",
            })
            router.push("/dashboard/payments")
          } else {
            setPayment(paymentData.payment)

          }
        } catch (error) {
          console.error("Failed to load payment:", error)
          toast({
            title: "Error",
            description: "Failed to load payment details.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
      loadPayment()
      getCompanyDetails().then(setCompanyDetails)
    }
  }, [paymentId, router, toast])

  const handlePrint = () => {
    printDocument("print-content")
  }

  const handleDownload = async () => {
    await generatePDF("print-content", `Payment-${payment?.paymentNumber}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
        <p className="text-gray-600 mb-4">The payment you are looking for does not exist.</p>
        <Link href="/dashboard/payments">
          <Button>Back to Payments</Button>
        </Link>
      </div>
    )
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "cleared":
      case "paid":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/payments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            <p className="text-gray-600">
              {payment.paymentNumber} &bull; {new Date(payment.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {hasPermission("edit_payments") && payment.status === "pending" && (
            <Link href={`/dashboard/payments/${payment._id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {/* {hasPermission("delete_payments") && (
            <Button variant="destructive" disabled>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )} */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recipient Details */}
          <Card>
            <CardHeader>
              <CardTitle>Recipient Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <DetailItem label="Recipient Type" value={payment.recipientType} isBadge />
                <DetailItem label="Name" value={payment.recipientName} />
                <DetailItem label="Email" value={payment.recipientEmail} />
                <DetailItem label="Phone" value={payment.recipientPhone} />
                <DetailItem label="Address" value={payment.recipientAddress} />
              </dl>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          {payment.purchaseInvoiceId && (
            <Card>
              <CardHeader>
                <CardTitle>Associated Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <DetailItem label="Invoice Number" value={payment.purchaseInvoiceNumber} />
                  <DetailItem label="Invoice Date" value={payment.invoiceDate ? new Date(payment.invoiceDate).toLocaleDateString() : '-'} />
                  <DetailItem label="Payable Amount" value={`₹${Number(payment.payAbleAmount || 0).toLocaleString()}`} />
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Payment Method Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <DetailItem label="Method" value={payment.paymentMethod} />
                <DetailItem label="Bank Account" value={payment.bankAccount} />
                <DetailItem label="Reference Number" value={payment.referenceNumber} />
              </dl>
            </CardContent>
          </Card>

{/* Attachments */}
{(payment.billFile || payment.screenshotFile) && (
  <Card>
    <CardHeader>
      <CardTitle>Attachments</CardTitle>
    </CardHeader> 

    <CardContent className="flex gap-4 flex-wrap">
      {[
        { label: "Bill File", file: payment.billFile },
        { label: "Screenshot", file: payment.screenshotFile },
      ].map(
        (item) =>
          item.file && (
            <div
              key={item.label}
              className="border rounded-md px-4 py-3 w-48 flex items-center justify-between text-sm"
            >
              <span className="font-medium truncate">{item.label}</span>

              <a
                href={item.file}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Open
              </a>
            </div>
          )
      )}
    </CardContent>
  </Card>
)}

        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₹{Number(payment.amount || 0).toLocaleString()}
                </span>
              </div>
              {payment.amountInWords && (
                <p className="text-xs text-gray-600 italic">{payment.amountInWords}</p>
              )}
              <Separator />
              <dl className="space-y-2">
                <DetailItem label="Category" value={payment.category} />
                <DetailItem label="Payment Type" value={payment.paymentType} isBadge />
                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">
                    <Badge variant={getStatusVariant(payment.status)}>{payment.status}</Badge>
                  </dd>
                </div>
                <DetailItem label="Description" value={payment.description} />
                <DetailItem label="Created By" value={payment.createdBy} />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden Print Component */}
      <div className="hidden" id="print-content">
        {payment && (
          <PaymentPrint
            payment={{
              ...payment,
              paymentCategory: payment.category || payment.paymentCategory,
              amount: Number(payment.amount || 0)
            }}
            companyDetails={companyDetails ? {
              name: companyDetails.companyName,
              address: companyDetails.address,
              phone: companyDetails.mobileNo1,
              email: companyDetails.email,
              website: companyDetails.website,
              logo: companyDetails.logo
            } : undefined}
          />
        )}
      </div>
    </div>
  )
}