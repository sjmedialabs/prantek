"use client"

import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Download, Printer, ReceiptIcon, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { generatePDF, printDocument } from "@/lib/pdf-utils"
import { ReceiptPrint } from "@/components/print-templates/receipt-print"
import { getCompanyDetails, type CompanyDetails } from "@/lib/company-utils"
import { api } from "@/lib/api-client"
import type { Receipt } from "@/lib/models/types"
import { tokenStorage } from "@/lib/token-storage"
import { toast } from "sonner"
import { useUser } from "@/components/auth/user-context"


function numberToIndianCurrencyWords(amount: number): string {
  if (isNaN(amount)) return "";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty",
    "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const convertBelowThousand = (num: number): string => {
    let str = "";

    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }

    if (num > 0) {
      str += ones[num] + " ";
    }

    return str.trim();
  };

  const convert = (num: number): string => {
    if (num === 0) return "Zero";

    let result = "";

    if (Math.floor(num / 10000000) > 0) {
      result += convertBelowThousand(Math.floor(num / 10000000)) + " Crore ";
      num %= 10000000;
    }

    if (Math.floor(num / 100000) > 0) {
      result += convertBelowThousand(Math.floor(num / 100000)) + " Lakh ";
      num %= 100000;
    }

    if (Math.floor(num / 1000) > 0) {
      result += convertBelowThousand(Math.floor(num / 1000)) + " Thousand ";
      num %= 1000;
    }

    if (num > 0) {
      result += convertBelowThousand(num);
    }

    return result.trim();
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = convert(rupees) + " Rupees";

  if (paise > 0) {
    words += " and " + convert(paise) + " Paise";
  }

  words += " Only";

  return words;
}
export default function ReceiptDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = useUser()
  const receiptId = params.id as string
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundSubmitting, setRefundSubmitting] = useState(false)
  const [planFeatures, setPlanFeatures] = useState<any>(null)
  const [refundError, setRefundError] = useState("")

  useEffect(() => {
    getCompanyDetails().then(setCompanyDetails)
    loadReceipt()
  }, [receiptId])

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
  }, [])

  const loadReceipt = async () => {
    try {
      const data = await api.receipts.getById(receiptId)
      console.log("Getting recipt data from api", data)
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

  const refundableBalance =
    receipt != null
      ? Number(
        (receipt as any).balanceAmount ??
        receipt.balanceAmount ??
        receipt.ReceiptAmount ??
        0
      )
      : 0
  const isAdvanceReceipt =
    (receipt?.receiptType === "advance" || receipt?.paymentType === "advance") ?? false
  const isCleared = (receipt?.status || "").toLowerCase() === "cleared"
  const showRefundButton =
    hasPermission("add_receipts") &&
    isAdvanceReceipt &&
    isCleared &&
    refundableBalance > 0

  const openRefundModal = () => {
    setRefundAmount(String(refundableBalance))
    setRefundError("")
    setRefundModalOpen(true)
  }

  const handleRefundSubmit = async () => {
    if (!receiptId || !receipt) return
    const num = Number(refundAmount)
    if (!Number.isFinite(num) || num <= 0) {
      setRefundError("Refund amount must be greater than 0")
      return
    }
    if (num > refundableBalance) {
      setRefundError("Refund amount cannot exceed receipt balance")
      return
    }
    setRefundSubmitting(true)
    setRefundError("")
    try {
      await api.receipts.refund(receiptId, { amount: num })
      toast.success("Refund processed successfully")
      setRefundModalOpen(false)
      setRefundAmount("")
      loadReceipt()
    } catch (e: any) {
      const msg = e?.message ?? "Refund failed"
      setRefundError(msg)
      toast.error(msg)
    } finally {
      setRefundSubmitting(false)
    }
  }

  const receiptForPrint =
    receipt &&
    receipt.items && {
      receiptNumber: receipt.receiptNumber,
      date: receipt.date,
      notes: receipt.notes || "",
      advanceAppliedAmount: receipt.advanceAppliedAmount || 0,
      client: {
        name: receipt.clientName,
        address: receipt.clientAddress || "",
        phone: receipt.clientContact || "",
        email: receipt.clientEmail || "",
      },

      items: receipt.items.map((item: any) => ({
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        taxName: item.taxName,
        taxRate: item.taxRate,
        amount: item.amount,
        total: item.total,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst
      })),

      receiptTotal: receipt.ReceiptAmount || 0,
      paymentType: receipt.paymentType,
      paymentMethod: receipt.paymentMethod,
      referenceNumber: receipt.referenceNumber || "",
      status: receipt.status,
      terms: receipt?.terms || "",
      invoiceDate: receipt.invoiceDate,
      salesInvoiceNumber: receipt.salesInvoiceNumber || "",
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
          {showRefundButton && (
            <Button variant="outline" onClick={openRefundModal}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refund
            </Button>
          )}
          {planFeatures?.pdf && (
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
          {planFeatures?.print && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
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
                  <Badge variant="default" className="capitalize">
                    {receipt.paymentType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge
                    variant={
                      receipt.status === "cleared" || receipt.status === "refunded"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {(receipt.status || "")
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </div>
              </div>
              {receipt.salesInvoiceNumber && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Sales Invoice Number</p>
                      <p className="font-semibold">{receipt.salesInvoiceNumber}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Invoice Date</p>
                      <p className="font-semibold">
                        {new Date(receipt.invoiceDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {(receipt as any).advanceAppliedAmount > 0 && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Advance Applied</p>
                      <p className="font-semibold text-blue-600">
                        ₹{(receipt as any).advanceAppliedAmount.toLocaleString()}
                      </p>
                    </div>
                    {(receipt as any).parentReceiptNumber && (
                      <div>
                        <p className="text-sm text-gray-600">Advance Receipt Ref</p>
                        <p className="font-semibold">{(receipt as any).parentReceiptNumber}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {receipt.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-semibold">{receipt.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card>
            <CardHeader>
              {/* <CardTitle>Client Details</CardTitle> */}
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
              {receipt.clientContact && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{receipt.clientContact}</p>
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
          {receipt?.items?.length > 0 && (<Card>
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
                        <p className="font-bold text-lg">₹{(((item.price - item.discount) * item.quantity) + (((item.price - item.discount) * item.quantity) * (item.taxRate || 0) / 100))?.toLocaleString() || "0"}</p>
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
                          <p className="font-semibold">₹{((item.price - item.discount) * item.quantity)?.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tax ({item.taxRate || 0}%)</p>
                          <p className="font-semibold">₹{(((item.price - item.discount) * item.quantity) * (item.taxRate || 0) / 100)?.toLocaleString() || "0"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No items found for this receipt</p>
              )}
            </CardContent>
          </Card>)}

          {(receipt as any).terms && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-200 text-sm text-gray-600 
                   break-words break-all whitespace-pre-wrap leading-relaxed
                   [&_p]:mb-2 
                   [&_ul]:list-disc [&_ul]:pl-5 
                   [&_ol]:list-decimal [&_ol]:pl-5 
                   [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: (receipt as any).terms }} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Grand Total</span>
              <span className="font-semibold">
                ₹{(receipt?.invoicegrandTotal || receipt?.total || 0).toLocaleString()}

              </span>
            </div>

            <Separator />
            {(receipt as any).advanceAppliedAmount > 0 && (
              <>
                <div className="flex justify-between text-blue-600">
                  <span className="font-semibold">Advance Applied</span>
                  <span className="font-bold mb-2">
                    ₹{(receipt as any).advanceAppliedAmount.toLocaleString()}
                  </span>

                </div>  <Separator /></>
            )}
            <div className="flex justify-between text-green-600">
              <span className="font-semibold">Receipt Amount(Paid)</span>
              <span className="font-bold">
                ₹{(receipt.ReceiptAmount || 0).toLocaleString()}
              </span>

            </div>
            <span className="text-sm">In words: {numberToIndianCurrencyWords(receipt.ReceiptAmount || 0)}</span>
            {receipt?.badDeptAmount > 0 && (<>
              <Separator />
              <div className="flex justify-between text-green-600">
                <span className="font-semibold">BadDept Amount</span>
                <span className="font-bold">
                  ₹{(receipt.badDeptAmount || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-gray-200 text-xs capitalize">{receipt.badDeptReason}</span>
            </>)}

            <Separator />
            {(receipt as any).refundedAmount > 0 && (
              <>
                <div className="flex justify-between text-amber-600">
                  <span className="font-semibold">Refunded</span>
                  <span className="font-bold">
                    ₹{Number((receipt as any).refundedAmount).toLocaleString()}
                  </span>
                </div>
                <Separator />
              </>
            )}
            {(receipt.invoiceBalance ?? receipt.balanceAmount ?? 0) > 0 && (
              <div className="flex justify-between text-orange-600">
                <span className="font-semibold">Balance Due</span>
                <span className="font-bold">
                  ₹{(receipt.invoiceBalance ?? receipt.balanceAmount ?? 0).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold">{receipt.paymentMethod}</p>
                </div>
                {/* {receipt.bankAccount && (
                  <div>
                    <p className="text-sm text-gray-600">Bank Account</p>
                    <p className="font-semibold">{receipt.bankAccount}</p>
                  </div>
                )} */}
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
          {(receipt?.paymentMethod?.toLowerCase() !== "cash" && (receipt?.bankDetails || receipt.bankAccount)) && (
            <div className="border flex flex-col gap-1 rounded-lg mt-2 p-4 bg-white text-sm space-y-1">
              <h3 className="text-base font-medium py-2">Bank Details</h3>
              <p><strong>Bank:</strong> {receipt?.bankDetails?.bankName || receipt?.bankAccount?.bankName}</p>
              <p><strong>Account Name:</strong> {receipt?.bankDetails?.accountName || receipt.bankAccount.accountName}</p>
              <p><strong>Account Number:</strong> {receipt?.bankDetails?.accountNumber || receipt?.bankAccount?.accountNumber}</p>
              <p><strong>IFSC:</strong> {receipt?.bankDetails?.ifscCode || receipt?.bankAccount?.ifscCode}</p>
              <p><strong>Branch:</strong> {receipt?.bankDetails?.branchName || receipt?.bankAccount?.branchName}</p>

              {(receipt?.bankDetails?.upiId || receipt?.bankAccount?.upiId) && (
                <p>
                  <strong>UPI ID:</strong>{" "}
                  {receipt?.bankDetails?.upiId || receipt?.bankAccount?.upiId}
                </p>
              )}
              {(receipt?.bankDetails?.upiScanner || receipt?.bankAccount?.upiScanner) && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">
                    UPI QR Code
                  </p>
                  <img
                    src={receipt?.bankDetails?.upiScanner || receipt?.bankAccount?.upiScanner}
                    alt="UPI Scanner"
                    className="h-40 w-40 object-contain border rounded"
                  />
                </div>
              )}

            </div>
          )}
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
                {(receipt.balanceAmount ?? 0) === 0 &&
                  receipt.status !== "refunded" &&
                  receipt.status !== "partially_refunded" && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">Payment Completed</p>
                    </div>
                  )}
                {(receipt.status === "refunded" || receipt.status === "partially_refunded") && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 font-medium">
                      {receipt.status === "refunded" ? "Fully refunded" : "Partially refunded"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refund</DialogTitle>
            <DialogDescription>
              Enter the refund amount. Maximum: ₹{refundableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })} (receipt balance).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund amount (₹)</Label>
              <Input
                id="refund-amount"
                type="number"
                min={0}
                max={refundableBalance}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                className={refundError ? "border-destructive" : ""}
              />
              {refundError && (
                <p className="text-sm text-destructive">{refundError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundModalOpen(false)}
              disabled={refundSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleRefundSubmit} disabled={refundSubmitting}>
              {refundSubmitting ? "Processing…" : "Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
