"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Save } from "lucide-react"
import { toast } from "@/lib/toast"
import { api } from "@/lib/api-client"
import { OwnSearchableSelect } from "@/components/searchableSelect"
import { useUser } from "@/components/auth/user-context"
import Link from "next/link"

export default function CreateReceiptPage() {
  const router = useRouter()
  const { user } = useUser()
  
  // State
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("")
  const [quotations, setQuotations] = useState<any[]>([])
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null)
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [bankAccount, setBankAccount] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [status, setStatus] = useState("Received")
  
  // Quotation creation dialog state
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false)
  
  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  // Listen for quotation creation from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "quotation-created") {
        toast.success("Quotation created successfully!")
        loadData() // Reload quotations
        setSelectedQuotationId(event.data.quotation._id || event.data.quotation.id)
        setIsQuotationDialogOpen(false)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const loadData = async () => {
    try {
      const [loadedQuotations, loadedBankAccounts] = await Promise.all([
        api.quotations.getAll(),
        api.bankAccounts.getAll(),
      ])
      
      // Filter quotations with pending balance
      const pendingQuotations = (loadedQuotations || []).filter(
        (q: any) => q.status !== "cancelled" && (q.balanceAmount || 0) > 0
      )
      
      setQuotations(pendingQuotations)
      setBankAccounts(loadedBankAccounts || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load data")
    }
  }

  // When quotation is selected, populate details
  useEffect(() => {
    if (selectedQuotationId && quotations.length > 0) {
      const quotation = quotations.find(
        (q: any) => String(q._id || q.id) === String(selectedQuotationId)
      )
      
      if (quotation) {
        setSelectedQuotation(quotation)
        setPaymentAmount(quotation.balanceAmount || 0)
      }
    } else {
      setSelectedQuotation(null)
      setPaymentAmount(0)
    }
  }, [selectedQuotationId, quotations])

  // Auto-set status based on payment method
  useEffect(() => {
    if (paymentMethod === "Cash") {
      setStatus("Cleared")
    } else {
      setStatus("Received")
    }
  }, [paymentMethod])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return

    // Validation
    if (!selectedQuotationId) {
      toast.error("Please select a quotation")
      return
    }

    if (!paymentAmount || paymentAmount <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }

    if (paymentAmount > (selectedQuotation?.balanceAmount || 0)) {
      toast.error("Payment amount cannot exceed balance amount")
      return
    }

    setIsSubmitting(true)

    try {
      // Update quotation with payment
      const totalAmountPaid = (selectedQuotation.paidAmount || 0) + paymentAmount
      const totalAmountBalance = (selectedQuotation.balanceAmount || 0) - paymentAmount
      
      const quotationPayloadUpdate = {
        paidAmount: totalAmountPaid,
        balanceAmount: totalAmountBalance,
        status: totalAmountBalance <= 0 ? "completed" : "partial"
      }
      
      await api.quotations.update(selectedQuotation._id || selectedQuotation.id, quotationPayloadUpdate)

      // Create receipt
      const payload = {
        clientId: selectedQuotation.clientId,
        clientName: selectedQuotation.clientName,
        clientEmail: selectedQuotation.clientEmail || "",
        clientPhone: selectedQuotation.clientContact || "",
        clientAddress: selectedQuotation.clientAddress || "",
        quotationId: selectedQuotationId,
        quotationNumber: selectedQuotation.quotationNumber || "",
        projectName: selectedQuotation.projectName || "",
        items: (selectedQuotation.items || []).map((it: any) => ({
          itemId: it.itemId || it.id,
          id: it.id || it.itemId,
          type: it.type || "product",
          itemName: it.itemName,
          description: it.description || "",
          quantity: it.quantity,
          price: it.price,
          discount: it.discount || 0,
          taxRate: it.taxRate || 0,
        })),
        amountPaid: paymentAmount,
        paymentType: paymentAmount >= (selectedQuotation.balanceAmount || 0) ? "full" : "partial",
        paymentMethod: paymentMethod.toLowerCase().replace(" ", "-"),
        bankAccount: paymentMethod !== "Cash" ? bankAccount : "",
        referenceNumber: paymentMethod !== "Cash" ? referenceNumber : "",
        screenshot: "",
        notes: "",
        date,
        subtotal: selectedQuotation.subtotal || 0,
        taxAmount: selectedQuotation.taxAmount || 0,
        total: selectedQuotation.grandTotal || 0,
        status: status.toLowerCase(),
        userId: user?.id || "",
      }

      const receipt = await api.receipts.create(payload)
      toast.success(`Receipt ${receipt.receiptNumber || "created"} successfully!`)
      router.push("/dashboard/receipts")
    } catch (err: any) {
      console.error("Error creating receipt:", err)
      toast.error(err?.message || "Failed to create receipt")
      setIsSubmitting(false)
    }
  }

  const quotationOptions = quotations.map((q) => ({
    value: String(q._id || q.id),
    label: `${q.quotationNumber} - ${q.clientName || q.projectName || ''} (Balance: ₹${(q.balanceAmount || 0).toLocaleString()})`
  }))

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Receipt</h1>
          <p className="text-gray-600">Record payment against a quotation</p>
        </div>
        <Link href="/dashboard/receipts">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        {/* Quotation Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Quotation *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <OwnSearchableSelect
                  options={quotationOptions}
                  value={selectedQuotationId}
                  onValueChange={setSelectedQuotationId}
                  placeholder="Search and select a quotation..."
                  searchPlaceholder="Type to search quotations..."
                  emptyText="No pending quotations found."
                />
              </div>
              
              <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    
                    <Plus className="h-4 w-4 mr-2" />
                    Add Quotation
                  </Button>
                </DialogTrigger>
                <DialogContent className=":!inset-0 !m-0 !px-10 !py-30 !min-w-full !rounded-none">
                  <div className="">
                    <button 
                      onClick={() => setIsQuotationDialogOpen(false)}
                      className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100" type="button"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <iframe 
                      src="/quotation-embed" 
                      className="w-full h-screen border-0"
                      title="Create Quotation"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {selectedQuotation && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Client:</span>
                    <span className="ml-2 font-medium">{selectedQuotation.clientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Project:</span>
                    <span className="ml-2 font-medium">{selectedQuotation.projectName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="ml-2 font-medium">₹{(selectedQuotation.grandTotal || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Paid:</span>
                    <span className="ml-2 font-medium">₹{(selectedQuotation.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-semibold">Balance:</span>
                    <span className="ml-2 font-semibold text-blue-600">₹{(selectedQuotation.balanceAmount || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Items:</span>
                    <span className="ml-2 font-medium">{(selectedQuotation.items || []).length}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details - Only show when quotation is selected */}
        {selectedQuotation && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentAmount">Payment Amount *</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                    min="0"
                    max={selectedQuotation.balanceAmount || 0}
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: ₹{(selectedQuotation.balanceAmount || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label htmlFor="date">Payment Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={status}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              {paymentMethod !== "Cash" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankAccount">Bank Account</Label>
                    <Select value={bankAccount} onValueChange={setBankAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank account" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((acc) => (
                          <SelectItem key={acc._id || acc.id} value={String(acc._id || acc.id)}>
                            {acc.bankName} - {acc.accountNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="referenceNumber">Reference Number</Label>
                    <Input
                      id="referenceNumber"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Transaction ref / cheque no"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/receipts">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isSubmitting || !selectedQuotationId}
            className="min-w-[150px]"
          >
            {isSubmitting ? (
              "Creating..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Receipt
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
