"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { api } from "@/lib/api-client"
import { toast } from "react-toastify"

export default function EditPaymentPage() {
  const { id } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [payment, setPayment] = useState<any>(null)
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([])
  const [formData, setFormData] = useState<any>({
    amount: "",
    category: "",
    recipientType: "",
    recipientId: "",
    recipientName: "",
    paymentMethod: "cash",
    bankAccount: "",
    referenceNumber: "",
    description: "",
    purchaseInvoiceId: "",
  })

  const [clients, setClients] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [
        paymentRes,
        clientsRes,
        vendorsRes,
        teamRes,
        categoriesRes,
        bankRes,
        invoicesRes,
      ] = await Promise.all([
        api.payments.getById(id),
        api.clients.getAll(),
        api.vendors.getAll(),
        api.employees.getAll(),
        api.paymentCategories.getAll(),
        api.bankAccounts.getAll(),
        api.purchaseInvoice.getAll(),
      ])

      const p = paymentRes.payment

      setPayment(p)
setPurchaseInvoices(invoicesRes || [])

      // Try to resolve bank account object if it's a string (legacy data)
      let bankAccountData = p.bankAccount || "";
      if (typeof bankAccountData === 'string' && bankAccountData && bankRes) {
        const foundBank = bankRes.find((b: any) => b.bankName === bankAccountData);
        if (foundBank) bankAccountData = foundBank;
      }

      setFormData({
        amount: p.amount?.toString() || "",
        category: p.category || "",
        recipientType: p.recipientType || "",
        recipientId: p.recipientId || "",
        recipientName: p.recipientName || "",
        paymentMethod: p.paymentMethod || "cash",
        bankAccount: bankAccountData,
        referenceNumber: p.referenceNumber || "",
        description: p.description || "",
        purchaseInvoiceId: p.purchaseInvoiceId || "",
      })

      setClients(clientsRes)
      setVendors(vendorsRes)
      setTeam(teamRes)
      setCategories(categoriesRes)
      setBankAccounts(bankRes)
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }
  const selectedInvoice = purchaseInvoices.find(
    (inv) => inv._id === formData.purchaseInvoiceId
  )
  const isNotCash = formData.paymentMethod !== "cash"
  const isInvoiced = !!formData.purchaseInvoiceId
  const handleSubmit = async (e: any) => {
    e.preventDefault()

    if (!formData.amount) return toast.error("Amount required")

    if (isNotCash && !formData.referenceNumber) {
      return toast.error("Reference required")
    }

    try {
      setSaving(true)

      await api.payments.update(id, {
        ...formData,
        amount: Number(formData.amount),
      })

      if (isInvoiced && selectedInvoice?._id) {
        const oldPaymentAmount = Number(payment.amount || 0)
        const newPaymentAmount = Number(formData.amount)

        const currentBalance = Number(selectedInvoice.balanceAmount || 0)
        const currentPaid = Number(selectedInvoice.paidAmount || 0)

        const updatedBalance = payment.payAbleAmount - formData.amount

        const updatedPaid = currentPaid - oldPaymentAmount + newPaymentAmount
        const status =
          updatedBalance <= 0 ? "Closed" : updatedPaid > 0 ? "Partial" : "Open"

        await fetch(`/api/purchaseInvoice/${selectedInvoice._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            balanceAmount: payment.payAbleAmount - formData.amount,
            paidAmount: formData.amount,
            invoiceStatus: status,
          }),
        })
      }

      toast.success("Payment updated")
      router.push(`/dashboard/payments/${id}`)
    } catch {
      toast.error("Update failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start flex-col gap-1">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Payment</h1>
          <p className="text-gray-500">{payment?.paymentNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex lg:flex-row flex-wrap gap-2 lg:flex-nowrap">
            {/* Ledger */}
            <div className="w-full">
              <Label>Ledger (Category)</Label>
              <Select
                value={formData.category}
                onValueChange={(v) =>
                  setFormData({ ...formData, category: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select ledger" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Type */}
            <div className="w-full">
              <Label>Recipient Type</Label>
              <Select
                value={formData.recipientType}
                disabled={isInvoiced}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    recipientType: v,
                    recipientId: "",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recipient */}
            <div className="w-full">
              <Label>Recipient</Label>
              <Select
                value={formData.recipientId}
                disabled={isInvoiced}
                onValueChange={(v) =>
                  setFormData({ ...formData, recipientId: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {(formData.recipientType === "client"
                    ? clients
                    : formData.recipientType === "vendor"
                      ? vendors
                      : team
                  ).map((r: any) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name || r.employeeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
            {isInvoiced && selectedInvoice && (
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Invoice #:</span>
                    <span className="ml-2 font-medium">
                      {selectedInvoice.purchaseInvoiceNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2">
                      {new Date(selectedInvoice.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-gray-500">Party:</span>
                    <span className="ml-2 font-semibold">
                      {selectedInvoice.recipientName}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2">
                      {selectedInvoice.recipientEmail || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2">
                      {selectedInvoice.recipientPhone || "-"}
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-gray-500">Address:</span>
                    <span className="ml-2">
                      {selectedInvoice.recipientAddress || "-"}
                    </span>
                  </div>

                  <div className="md:col-span-2 border-t pt-3 mt-2">
                    <span className="text-gray-500">Balance Amount:</span>
                    <span className="ml-2 text-red-600 font-bold">
                      ₹{Number(selectedInvoice.balanceAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="flex lg:flex-row flex-wrap gap-2 lg:flex-nowrap">
            {/* Amount */}
            <div className="w-full">
              <Label>Amount *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>

            {/* Payment Method */}
            <div className="w-full">
              <Label>Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(v) =>
                  setFormData({ ...formData, paymentMethod: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger >
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bankTransfer">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank + Ref */}
            {isNotCash && (
              <>
                <div className="w-full">
                  <Label>Bank Account</Label>
                  <Select
                    value={typeof formData.bankAccount === 'object' ? formData.bankAccount?._id : formData.bankAccount}
                    onValueChange={(v) => {
                      const selectedBank = bankAccounts.find(b => b._id === v);
                      setFormData({ ...formData, bankAccount: selectedBank || v })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((b) => (
                        <SelectItem key={b._id} value={b._id}>
                          {b.bankName},{b.accountNumber},{b.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full">
                  <Label>Reference Number</Label>
                  <Input
                    value={formData.referenceNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        referenceNumber: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
            </div>
            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Updating..." : "Update Payment"}
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  )
}