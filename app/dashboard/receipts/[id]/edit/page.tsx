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
  const [quotation, setQuotation] = useState<any>(null)

  // Editable fields
  const [date, setDate] = useState("")
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [paymentType, setPaymentType] = useState<"Full Payment" | "Partial">("Full Payment")
  const [bankAccount, setBankAccount] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [note, setNote] = useState("")

  const [bankAccounts, setBankAccounts] = useState<any[]>([])

  // Calculated
  const [receiptTotal, setReceiptTotal] = useState(0)
  const [balanceAmount, setBalanceAmount] = useState(0)

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
      console.log("Loaded Reciept is::::",loadedReceipt);
      let loadedQuotation=null;

      if(loadedReceipt.quotationId){
         loadedQuotation = await api.quotations.getById(loadedReceipt.quotationId)
      setQuotation(loadedQuotation)

      }
      const banks = await api.bankAccounts.getAll()
      setBankAccounts(banks)

      // Prefill editable fields
      setDate(loadedReceipt.date?.split("T")[0] || "")
      setPaymentAmount(loadedReceipt.amountPaid || 0)
      setPaymentMethod(
        loadedReceipt.paymentMethod === "cash"
          ? "Cash"
          : loadedReceipt.paymentMethod === "bank-transfer"
            ? "Bank Transfer"
            : loadedReceipt.paymentMethod === "upi"
              ? "UPI"
              : loadedReceipt.paymentMethod === "cheque"
                ? "Cheque"
                : "Card"
      )
      setPaymentType(loadedReceipt.paymentType || "Full Payment")
      setBankAccount(loadedReceipt.bankAccount || "")
      setReferenceNumber(loadedReceipt.referenceNumber || "")
      setNote(loadedReceipt.notes || "")

    if(loadedQuotation){
        setReceiptTotal(loadedQuotation.balanceAmount + loadedReceipt.amountPaid)
      setBalanceAmount(loadedQuotation.balanceAmount)
    }
    else{
      setReceiptTotal(0);
      setBalanceAmount(0)
    }

    } catch (err) {
      console.error(err)
      toast.error("Failed to load receipt")
    } finally {
      setLoading(false)
    }
  }
/* ------------------ SUBMIT HANDLER ------------------ */

async function handleSubmit(e?: any) {
  if (e) e.preventDefault()

  if (submitting) return
  if (!receipt) return toast.error("Missing receipt/quotation")

  // VALIDATION
  if (!date) return toast.error("Please select a payment date")
  if (paymentAmount <= 0) return toast.error("Payment amount must be greater than zero")

    let previousPaid=0;
    let originalPaidTotal=0;
    let originalBalance=0;
    let  restoredTotalBeforeEdit=0;

    if(quotation){
       previousPaid = receipt.amountPaid            // what this receipt originally added
     originalPaidTotal = quotation?.paidAmount || 0     // total paid including this receipt
   originalBalance = quotation?.balanceAmount || 0
   restoredTotalBeforeEdit = originalBalance + previousPaid
    } 
    else{
      previousPaid=receipt.amountPaid
      originalPaidTotal=receipt.amountPaid
      originalBalance=receipt.balanceAmount
      restoredTotalBeforeEdit=originalBalance + previousPaid
    }

  // if (paymentAmount > restoredTotalBeforeEdit) {
  //   return toast.error("Payment amount cannot exceed total remaining amount")
  // }

  setSubmitting(true)

  try {
    /* ----------------------------------------------
       1️⃣ UPDATE QUOTATION — UNDO OLD RECEIPT PAYMENT
    ---------------------------------------------- */

    const updatedPaidAmount =
      originalPaidTotal - previousPaid + paymentAmount

    const updatedBalanceAmount =
      restoredTotalBeforeEdit - paymentAmount

    let updatedStatus = "pending"
    if (updatedBalanceAmount <= 0) updatedStatus = "cleared"
    else if (updatedPaidAmount > 0) updatedStatus = "partial"

   if(quotation){
     await api.quotations.update(quotation._id, {
      paidAmount: updatedPaidAmount,
      balanceAmount: updatedBalanceAmount,
      status: updatedStatus,
    })
   }

    /* ----------------------------------------------
       2️⃣ UPDATE RECEIPT
    ---------------------------------------------- */

    const payload = {
      amountPaid: paymentAmount,
      paymentType: paymentType,
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
      bankAccount,
      balanceAmount:updatedBalanceAmount,
      referenceNumber,
      date,
      notes: note,
    }

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
    if (!quotation) return

    if (paymentType === "Full Payment") {
      setPaymentAmount(receiptTotal)
      setBalanceAmount(0)
    } else {
      const remaining = receiptTotal - paymentAmount
      setBalanceAmount(remaining < 0 ? 0 : remaining)
    }
  }, [paymentType, paymentAmount, receiptTotal, quotation])

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

      {/* QUOTATION DETAILS (Locked) */}
     {
      (quotation) && (
         <Card>
        <CardHeader>
          <CardTitle>Quotation / Agreement Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">

            <div>
              <span className="text-gray-600">Quotation Number:</span>
              <span className="ml-2 font-medium">{quotation.quotationNumber}</span>
            </div>

            <div>
              <span className="text-gray-600">Client:</span>
              <span className="ml-2 font-medium">{quotation.clientName}</span>
            </div>

            <div>
              <span className="text-gray-600">Total Amount:</span>
              <span className="ml-2 font-medium">
                ₹{quotation.grandTotal?.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-gray-600">Paid Before This Receipt:</span>
              <span className="ml-2 font-medium">
                ₹{(quotation.paidAmount - receipt.amountPaid)?.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-gray-600">Paid In This Receipt:</span>
              <span className="ml-2 font-medium text-purple-600">
                ₹{receipt.amountPaid?.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-gray-600 font-semibold">Current Balance:</span>
              <span className="ml-2 font-semibold text-blue-600">
                ₹{(quotation.balanceAmount + receipt.amountPaid)?.toLocaleString()}
              </span>
            </div>

          </div>
        </CardContent>
      </Card>
      )
     }

     {/*without quotation */}

     {
      (!quotation) &&(
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
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <Badge variant="outline" className="mt-1">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="font-bold text-lg">₹{(((item.price*item.quantity)-item.discount)+(((item.price*item.quantity)-item.discount)*(item.taxRate || 0)/100))?.toLocaleString() || "0"}</p>
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
                          <p className="font-semibold">₹{((item.price*item.quantity)-item.discount)?.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tax ({item.taxRate || 0}%)</p>
                          <p className="font-semibold">₹{(((item.price*item.quantity)-item.discount)*(item.taxRate || 0)/100)?.toLocaleString() || "0"}</p>
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
                ₹{receipt.amountPaid?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Amount:</span>
              <span className="ml-2 font-medium text-purple-600">
                ₹{receipt.total?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Balance Due:</span>
              <span className="ml-2 font-medium text-purple-600">
                ₹{receipt.balanceAmount?.toLocaleString()}
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
          <CardTitle>Update Payment Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Date */}
          <div>
            <Label htmlFor="date" required>Payment Date</Label>
            <Input
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
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                value={paymentType}
                onValueChange={(v: any) => setPaymentType(v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Payment">Full Payment</SelectItem>
                  <SelectItem value="Partial">Partial Payment</SelectItem>
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
          {paymentType === "Partial" && (
            <div className="grid grid-cols-2 gap-4">

              <div>
                <Label required>Payment Amount</Label>
                <Input
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
                  Max: ₹{receiptTotal.toLocaleString()}
                </p>
              </div>

              <div>
                <Label>Remaining Balance</Label>
                <Input value={balanceAmount} disabled className="bg-gray-50" />
              </div>

            </div>
          )}

          {/* Amount in Words */}
          <div>
            <Label>Amount in Words</Label>
            <Input
              value={numberToWords(paymentAmount)}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* BANK DETAILS */}
          {paymentMethod !== "Cash" && (
            <div className="grid grid-cols-2 gap-4">

              <div>
                <Label>Bank Account</Label>
                <Select value={bankAccount} onValueChange={setBankAccount}>
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
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
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
