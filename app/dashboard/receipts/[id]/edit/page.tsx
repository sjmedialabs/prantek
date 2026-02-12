"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ArrowLeft, Car, Save } from "lucide-react"
import { api } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { OwnSearchableSelect } from "@/components/searchableSelect"
import { useUser } from "@/components/auth/user-context"
import { noSSR } from "next/dynamic"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
export default function EditReceiptPage() {
  const params = useParams()
  const receiptId = params.id as string
  const router = useRouter()
  const { user } = useUser()

  // -------- STATES --------
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [receipt, setReceipt] = useState<any>(null)
  // const [quotation, setQuotation] = useState<any>(null)

  // Editable fields
  const [date, setDate] = useState("")
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [paymentType, setPaymentType] = useState<"Full Payment" | "Partial">("Full Payment")
  const [bankAccount, setBankAccount] = useState<any>(null)
  const [referenceNumber, setReferenceNumber] = useState("")
  const [note, setNote] = useState("")
  const [salesInvoice, setSalesInvoice] = useState<any>(null)
  const [badDeptAmount, setBadDeptAmount] = useState(0)
  const [badDeptReason, setBadDeptReason] = useState("")

  const [bankAccounts, setBankAccounts] = useState<any[]>([])

  // Calculated
  const [receiptTotal, setReceiptTotal] = useState(0)
  const [balanceAmount, setBalanceAmount] = useState(0)

  const [advanceReceipts, setAdvanceReceipts] = useState<any[]>([])
  const [selectedAdvanceReceipt, setSelectedAdvanceReceipt] = useState<any>(null)
  const [advanceApplyAmount, setAdvanceApplyAmount] = useState(0)

  // -------- LOAD RECEIPT & QUOTATION --------
  useEffect(() => {
    loadData()
  }, [receiptId])

  const loadData = async () => {
    try {
      const loadedReceipt = await api.receipts.getById(receiptId)
      if (!loadedReceipt) {
        toast.error("Receipt not found")
        router.push("/dashboard/receipts")
        return
      }

      setReceipt(loadedReceipt)
      console.log("Loaded Reciept is::::", loadedReceipt.ReceiptAmount);
      let loadedInvoice = null

      if (loadedReceipt.invoiceId) {
        const res = await fetch(`/api/salesInvoice/${loadedReceipt.invoiceId}`)
        const inv = await res.json()
        loadedInvoice = inv.data || inv
        setSalesInvoice(loadedInvoice)
      }

      const banks = await api.bankAccounts.getAll()
      setBankAccounts(banks)

      // Fetch advance receipts if applicable
      if ((loadedReceipt.receiptType === "salesInvoiced" || loadedReceipt.receiptType === "nonInvoiced") && !loadedReceipt.advanceAppliedAmount) {
        const res = await fetch("/api/receipts")
        const result = await res.json()
        if (result.success) {
          const advances = result.data.filter((r: any) =>
            r.receiptType === "advance" &&
            r.status === "cleared" &&
            !r.parentReceiptNumber &&
            r.clientId === loadedReceipt.clientId
          )
          setAdvanceReceipts(advances)
        }
      }

      // Prefill editable fields 
      setDate(loadedReceipt.date?.split("T")[0] || "")

      setPaymentMethod(
        loadedReceipt.paymentMethod === "cash"
          ? "Cash"
          : loadedReceipt.paymentMethod === "bank-transfer"
            ? "Bank Transfer"
            : loadedReceipt.paymentMethod === "UPI"
              ? "UPI"
              : loadedReceipt.paymentMethod === "cheque"
                ? "Cheque"
                : "Card"
      )
        setPaymentAmount(parseFloat(loadedReceipt.ReceiptAmount) || 0)
      setPaymentType(loadedReceipt.paymentType || "Full Payment")
      setBankAccount(loadedReceipt.bankDetails || loadedReceipt.bankAccount || "")
      setReferenceNumber(loadedReceipt.referenceNumber || "")
      setNote(loadedReceipt.notes || "")
      setBadDeptAmount(loadedReceipt.badDeptAmount || 0)
      setBadDeptReason(loadedReceipt.badDeptReason || "")

      if (loadedInvoice) {
        setReceiptTotal(
          Number(loadedInvoice.balanceAmount) + Number(loadedReceipt.ReceiptAmount)
        )
        setBalanceAmount(loadedInvoice.balanceAmount)
      }

      else {
        setReceiptTotal(loadedReceipt.total || loadedReceipt.invoicegrandTotal || 0);
        setBalanceAmount(loadedReceipt?.balanceAmount || 0)
      }

    } catch (err) {
      console.error(err)
      toast.error("Failed to load receipt")
    } finally {
      setLoading(false)
    }
  }
  /* ------------------ SUBMIT HANDLER ------------------ */
console.log("payment amount is ", paymentAmount)
  async function handleSubmit(e?: any) {
    if (e) e.preventDefault()

    if (submitting) return
    if (!receipt) return toast.error("Missing receipt data")

    // VALIDATION
    if (!date) return toast.error("Please select a payment date")
    if (paymentAmount <= 0) return toast.error("Payment amount must be greater than zero")

    const previousPaid = receipt.ReceiptAmount || 0
    const previousAdvance = receipt.advanceAppliedAmount || 0

    const originalPaidTotal = salesInvoice?.paidAmount || 0
    // Calculate restored total based on current balance + what was paid in this receipt (cash + advance)
    const currentBalance = salesInvoice?.balanceAmount ?? receipt.balanceAmount ?? 0
    const restoredTotalBeforeEdit = currentBalance + previousPaid + previousAdvance

    const updatedPaidAmount =
      originalPaidTotal - previousPaid - previousAdvance + paymentAmount + advanceApplyAmount

    const updatedBalanceAmount =
      restoredTotalBeforeEdit - paymentAmount - advanceApplyAmount

    const updatedStatus =
      updatedBalanceAmount <= 0 ? "Cleared" : "Partial"


    setSubmitting(true)
  console.log("submitting")
    try {
      /* ----------------------------------------------
         1️⃣ UPDATE QUOTATION — UNDO OLD RECEIPT PAYMENT
      ---------------------------------------------- */

      // await fetch(`/api/salesInvoice/${salesInvoice._id}`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     paidAmount: updatedPaidAmount,
      //     balanceAmount: updatedBalanceAmount,
      //     status: updatedStatus,
      //   }),
      // })


      /* ----------------------------------------------
         2️⃣ UPDATE RECEIPT
      ---------------------------------------------- */

      if (selectedAdvanceReceipt) {
        await fetch(`/api/receipts/${selectedAdvanceReceipt._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentReceiptNumber: receipt.receiptNumber
          })
        })
      }

      const payload = {
        ReceiptAmount: paymentAmount,
        paymentType,
        paymentMethod:
          paymentMethod === "Cash"
            ? "cash"
            : paymentMethod === "Bank Transfer"
              ? "bank-transfer"
              : paymentMethod === "Cheque"
                ? "cheque"
                : paymentMethod === "UPI"
                  ? "upi"
                  : "card",

        bankDetails: bankAccount,
        invoiceBalance: updatedBalanceAmount,
        referenceNumber,
        date,
        notes: note,
        badDeptAmount,
        badDeptReason,
        advanceAppliedAmount: (receipt.advanceAppliedAmount || 0) + advanceApplyAmount,
        parentReceiptNumber: selectedAdvanceReceipt?.receiptNumber || receipt.parentReceiptNumber,
      }

      console.log("Payload to update receipt:::", payload)
      await api.receipts.update(receiptId, payload)

      toast.success("Receipt updated successfully")
      router.push(`/dashboard/receipts/${receiptId}`)

    } catch (err: any) {
      console.error(err)
      toast.error("Failed to update receipt")
    } finally {
      setSubmitting(false)
    }
  }
  // -------- PAYMENT TYPE LOGIC --------
  useEffect(() => {
    if (!receipt) return

    const effectiveTotal = receiptTotal - advanceApplyAmount

    if (paymentType === "Full Payment") {
      setPaymentAmount(effectiveTotal > 0 ? effectiveTotal : 0)
      setBalanceAmount(0)
    } else {
      const remaining = effectiveTotal - paymentAmount
      setBalanceAmount(remaining < 0 ? 0 : remaining)
    }
  }, [paymentType, paymentAmount, receiptTotal, receipt, advanceApplyAmount])

  // Auto update status
  useEffect(() => {
    // nothing here yet (done in Part 2)
  }, [paymentMethod])
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
        <p className="text-gray-600 mb-4">The receipt you're trying to edit doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/receipts")}>Back to Receipts</Button>
      </div>
    )
  }

  // Words
  const numberToWords = (num: number): string =>
    `${num.toLocaleString()} Rupees Only`

  const isCleared = receipt.status?.toLowerCase() === "cleared" || receipt.status?.toLowerCase() === "completed" || receipt.status?.toLowerCase() === "paid"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Receipt</h1>
          <p className="text-gray-600">{receipt.receiptNumber}</p>
        </div>
      </div>

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
      {/* QUOTATION DETAILS (Locked) */}
      {
        (salesInvoice) && (
          <Card>
            <CardHeader>
              <CardTitle>Sales Invoice Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">

                <div>
                  <span className="text-gray-600">Invoice Number:</span>
                  <span className="ml-2 font-medium">
                    {salesInvoice.salesInvoiceNumber}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600">Client:</span>
                  <span className="ml-2 font-medium">
                    {salesInvoice.clientName}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600">Invoice Total:</span>
                  <span className="ml-2 font-medium">
                    ₹{salesInvoice.grandTotal}
                  </span>
                </div>


                <div>
                  <span className="text-gray-600">Paid Before This Receipt:</span>
                  <span className="ml-2 font-medium">
                    ₹{(
                      Number(salesInvoice.paidAmount || 0) -
                      Number(receipt.ReceiptAmount || 0)
                    ).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600">Paid In This Receipt:</span>
                  <span className="ml-2 font-medium text-purple-600">
                    ₹{Number(receipt.ReceiptAmount || 0).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600 font-semibold">Current Balance:</span>
                  <span className="ml-2 font-semibold text-blue-600">
                    ₹{(receipt?.invoiceBalance || receipt?.balanceAmount || 0).toLocaleString()}
                  </span>
                </div>


              </div>
            </CardContent>
          </Card>
        )
      }

      {/*without quotation */}

      {
        (receipt.items.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Items/Services</CardTitle>
            </CardHeader>
            <CardContent>
              {receipt.items && receipt.items.length > 0 ? (
                <div className="space-y-4">
                  {receipt.items.map((item: any, index: number) => (
                    <div key={item.id || index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{item.itemName}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <Badge variant="outline" className="mt-1">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="font-bold text-lg">₹{(((item.price * item.quantity) - item.discount) + (((item.price * item.quantity) - item.discount) * (item.taxRate || 0) / 100))?.toLocaleString() || "0"}</p>
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
                          <p className="font-semibold">₹{((item.price * item.quantity) - item.discount)?.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tax ({item.taxRate || 0}%)</p>
                          <p className="font-semibold">₹{(((item.price * item.quantity) - item.discount) * (item.taxRate || 0) / 100)?.toLocaleString() || "0"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No items found for this receipt</p>
              )}
              <div className="my-5">
                <div>
                  <span className="text-gray-600">Paid In This Receipt:</span>
                  <span className="ml-2 font-medium text-purple-600">
                    ₹{receipt.ReceiptAmount?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="ml-2 font-medium text-purple-600">
                    ₹{(receipt.total || receipt.invoicegrandTotal)?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Balance Due:</span>
                  <span className="ml-2 font-medium text-purple-600">
                    ₹{(receipt?.balanceAmount || receipt?.invoiceBalance || 0)?.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* PAYMENT SECTION */}
      <Card>
          <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
      <CardContent className="space-y-3">
{(receipt?.receiptType !== "advance" && receipt.receiptType !== "quick") && ( <> <div className="flex justify-between">
    <span className="text-gray-600">Grand Total</span>
    <span className="font-semibold">
      ₹{(receipt?.invoicegrandTotal || receipt?.total || 0).toLocaleString()}
    </span>
  </div>

  <Separator /></>)}

  <div className="flex justify-between text-green-600">
    <span className="font-semibold">Receipt Amount(Paid)</span>
    <span className="font-bold">
      ₹{(receipt.ReceiptAmount || 0).toLocaleString()}
    </span>
  </div>

  {(receipt.invoiceBalance || receipt.balanceAmount) > 0 && (
    <div className="flex justify-between text-orange-600">
      <span className="font-semibold">Balance Due</span>
      <span className="font-bold">
        ₹{(receipt?.invoiceBalance || receipt.balanceAmount || 0).toLocaleString()}
      </span>
    </div>
  )}
</CardContent>
      </Card>
      {/* PAYMENT SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Update Payment Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Advance Receipt Selection */}
          {(receipt.receiptType === "salesInvoiced" || receipt.receiptType === "nonInvoiced") &&
            !receipt.advanceAppliedAmount &&
            advanceReceipts.length > 0 && (
              <div className="p-4 border rounded-lg bg-blue-50 space-y-4 mb-4">
                <h3 className="font-medium text-blue-900">Apply Advance Payment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Select Advance Receipt</Label>
                    <Select
                      disabled={isCleared}
                      value={selectedAdvanceReceipt?._id}
                      onValueChange={(id) => {
                        const adv = advanceReceipts.find(r => r._id === id)
                        setSelectedAdvanceReceipt(adv)
                        setAdvanceApplyAmount(adv?.ReceiptAmount || 0)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select advance receipt" />
                      </SelectTrigger>
                      <SelectContent>
                        {advanceReceipts.map((adv) => (
                          <SelectItem key={adv._id} value={adv._id}>
                            {adv.receiptNumber} — ₹{adv.ReceiptAmount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAdvanceReceipt && (
                    <div>
                      <Label>Advance Amount to Apply</Label>
                      <Input
                        disabled={isCleared}
                        type="number"
                        value={advanceApplyAmount}
                        max={selectedAdvanceReceipt.ReceiptAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setAdvanceApplyAmount(
                            val > selectedAdvanceReceipt.ReceiptAmount
                              ? selectedAdvanceReceipt.ReceiptAmount
                              : val
                          )
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max available: ₹{selectedAdvanceReceipt.ReceiptAmount}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Date */}
          <div>
            <Label htmlFor="date" required>Payment Date</Label>
            <Input
              disabled={isCleared}
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Method + Payment Type */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label required>Payment Method</Label>
              <Select disabled={isCleared} value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label required>Payment Type</Label>
              <Select
                disabled={isCleared}
                value={paymentType}
                onValueChange={(v: any) => setPaymentType(v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Payment">Full Payment</SelectItem>
                  <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                 {receipt?.receiptType === "advance" && (<SelectItem value="Advance Payment">Advance Payment</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Input
                value={paymentMethod === "Cash" ? "Cleared" : "Received"}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* PARTIAL PAYMENT MODE */}
          {paymentType === "Partial Payment" && (
            <div className="grid grid-cols-2 gap-4">

              <div>
                <Label required>Payment Amount</Label>
                <Input
                  disabled={isCleared}
                  type="number"
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max: ₹{(receiptTotal).toLocaleString()}
                </p>
              </div>

              <div>
                <Label>Remaining Balance</Label>
                <Input value={balanceAmount} disabled className="bg-gray-50" />
              </div>
                
          {/* Amount in Words */}
          <div>
            <Label>Amount in Words</Label>
            <Input
              value={numberToWords(paymentAmount)}
              disabled
              className="bg-gray-50"
            />
          </div>  
            </div>
          )}

          {/* BANK DETAILS */}
          {paymentMethod !== ("Cash" || "cash") && (
            <div className="grid grid-cols-2 gap-4">

              <div>
                <Label>Bank Account</Label>
                <Select disabled={isCleared} value={bankAccount._id} onValueChange={(id) => {
                  const bank = bankAccounts.find((b: any) => b._id === id)
                  setBankAccount(bank)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((acc) => (
                      <SelectItem
                        key={acc._id}
                        value={String(acc._id)}
                      >
                        {acc.bankName} - {acc.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reference Number</Label>
                <Input
                  disabled={isCleared}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Transaction reference / cheque no."
                />
              </div>

            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Note</Label>
            <Textarea
              disabled={isCleared}
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Bad Debt Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Bad Debt Amount</Label>
              <Input
                type="number"
                value={badDeptAmount}
                onChange={(e) => setBadDeptAmount(Number(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Bad Debt Reason</Label>
              <Textarea
                value={badDeptReason}
                onChange={(e) => setBadDeptReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>

        </CardContent>
      </Card>
      {/* SUBMIT BUTTON */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="min-w-[150px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
