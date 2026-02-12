"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { ClientSelectSimple } from "@/components/client-select-simple"
import { ImageUpload } from "@/components/ui/image-upload"

export default function EditPurchaseInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)

  const [invoiceData, setInvoiceData] = useState<any>({})

  const [amountInWords, setAmountInWords] = useState("")
  const [activeTab, setActiveTab] = useState("invoice-details")
  const [paymentCategories, setPaymentCategories] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          invoice,
          clientsData,
          vendorsData,
          teamData,
          paymentCategoriesData
        ] = await Promise.all([
          api.purchaseInvoice.getById(id),
          api.clients.getAll(),
          api.vendors.getAll(),
          api.employees.getAll(),
          api.paymentCategories.getAll(),
        ])

        if (!invoice) {
          toast({ title: "Error", description: "Invoice not found", variant: "destructive" })
          router.push("/dashboard/purchaseInvoices")
          return
        }

        setClients(clientsData.filter((c: any) => c.status === "active" || c.isActive === true))
        setVendors(vendorsData)
        setTeamMembers(teamData.filter((t: any) => t.isActive === true))
        setPaymentCategories(paymentCategoriesData.filter((t: any) => t.isEnabled))

        // Populate form
        setInvoiceData({
          ...invoice,
          amount: invoice.invoiceTotalAmount,
          balance: invoice.balanceAmount,
          category: invoice.paymentCategory || invoice.category,
          billFile: invoice.billUpload,
          expenseAdjustmentAmount: invoice.expenseAdjustmentAmount || 0,
        })
        
        setAmountInWords(invoice.amountInWords || "")
        setLoading(false)
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({ title: "Error", description: "Failed to load invoice data", variant: "destructive" })
      }
    }

    if (id) loadData()
  }, [id, router, toast])

  const handleRecipientChange = (recipientId: string) => {
    let recipient: any = null
    let details = ""

    if (invoiceData.recipientType === "client") {
      recipient = clients.find((c) => c._id === recipientId)
      if (recipient) details = `${recipient.address}\n${recipient.phone}\n${recipient.email}`
    } else if (invoiceData.recipientType === "vendor") {
      recipient = vendors.find((v) => v._id === recipientId)
      if (recipient) details = `${recipient.category}\n${recipient.address}\n${recipient.phone}\n${recipient.email}`
    } else if (invoiceData.recipientType === "team") {
      recipient = teamMembers.find((t) => t._id === recipientId)
      if (recipient) details = `${recipient.role}\n${recipient.department || "N/A"}\n${recipient.phone}\n${recipient.email}`
    }

    if (recipient) {
      setInvoiceData({
        ...invoiceData,
        recipientId,
        recipientName: recipient.name || (recipient.employeeName + " " + recipient.surname),
        recipientDetails: details,
        recipientEmail: recipient.email || "",
        recipientPhone: recipient.phone || recipient.contactNumber || "",
        recipientAddress: recipient.address || "",
      })
    }
  }

  const handleAmountChange = (value: string) => {
    const amount = Number.parseFloat(value || "0")
    const expenseAdj = Number.parseFloat(invoiceData.expenseAdjustmentAmount || "0")
    const balance = expenseAdj > 0 ? amount - expenseAdj : amount

    setInvoiceData({
      ...invoiceData,
      amount: value,
      balance: balance.toFixed(2),
    })
    setAmountInWords(value ? `${amount.toLocaleString()} rupees only` : "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await api.purchaseInvoice.update(id, {
        recipientType: invoiceData.recipientType,
        recipientId: invoiceData.recipientId,
        recipientName: invoiceData.recipientName,
        recipientEmail: invoiceData.recipientEmail,
        recipientPhone: invoiceData.recipientPhone,
        recipientAddress: invoiceData.recipientAddress,
        date: invoiceData.date,
        dueDate: invoiceData.dueDate,
        paymentCategory: invoiceData.category,
        description: invoiceData.description,
        invoiceTotalAmount: Number(invoiceData.amount),
        balanceAmount: Number(invoiceData.balance),
        amountInWords: amountInWords,
        billUpload: invoiceData.billFile,
        expenseAdjustmentAmount: Number(invoiceData.expenseAdjustmentAmount),
        expenseAdjustmentReason: invoiceData.expenseAdjustmentReason,
      })

      toast({
        title: "Success",
        description: "Purchase Invoice updated successfully.",
      })

      router.push("/dashboard/purchaseInvoices")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update purchase invoice.",
        variant: "destructive",
      })
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/purchaseInvoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Purchase Invoice</h1>
            <p className="text-gray-600">{invoiceData.purchaseInvoiceNumber}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="invoice-details">Invoice Details</TabsTrigger>
                <TabsTrigger value="invoice-info">Bill and Expense Details</TabsTrigger>
              </TabsList>

              <TabsContent value="invoice-details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>Update basic Invoice information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Invoice Number</Label>
                        <Input value={invoiceData.purchaseInvoiceNumber} disabled />
                      </div>

                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={invoiceData.date ? new Date(invoiceData.date).toISOString().split('T')[0] : ''}
                          onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Ledger Head</Label>
                      <Select
                        value={invoiceData.category}
                        onValueChange={(value) => setInvoiceData({ ...invoiceData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ledger head" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentCategories.map((cat) => (
                            <SelectItem key={cat._id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Party Type</Label>
                      <Select
                        value={invoiceData.recipientType}
                        onValueChange={(value) => setInvoiceData({ ...invoiceData, recipientType: value, recipientId: "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select party type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Party Name</Label>
                      <ClientSelectSimple
                        options={
                          invoiceData.recipientType === "client" ? clients.map(c => ({ value: c._id, label: c.name })) :
                          invoiceData.recipientType === "vendor" ? vendors.map(v => ({ value: v._id, label: v.name })) :
                          invoiceData.recipientType === "team" ? teamMembers.map(t => ({ value: t._id, label: t.employeeName })) : []
                        }
                        value={invoiceData.recipientId}
                        onValueChange={handleRecipientChange}
                        placeholder="Select party..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={invoiceData.description}
                        onChange={(e) => setInvoiceData({ ...invoiceData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Invoice Total Amount</Label>
                      <Input
                        type="number"
                        value={invoiceData.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        required
                      />
                      {amountInWords && <p className="text-sm text-gray-600 italic">{amountInWords}</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invoice-info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bill and Expense Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="mb-2">
                      <Label>Bill Upload</Label>
                      <ImageUpload
                        label="Bill File"
                        value={invoiceData.billFile}
                        onChange={(value) => setInvoiceData({ ...invoiceData, billFile: value })}
                        previewClassName="w-32 h-32 rounded-lg"
                        allowedTypes={["image/*", "application/pdf"]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Expense Adjustment Amount</Label>
                      <Input
                        type="number"
                        value={invoiceData.expenseAdjustmentAmount}
                        onChange={(e) => {
                          const expenseAdj = Number.parseFloat(e.target.value || "0")
                          const amount = Number.parseFloat(invoiceData.amount || "0")
                          const balance = expenseAdj > 0 ? amount - expenseAdj : amount
                          setInvoiceData({
                            ...invoiceData,
                            expenseAdjustmentAmount: e.target.value,
                            balance: balance.toFixed(2),
                          })
                        }}
                      />
                      <div className="text-sm text-gray-600">
                        Payable Amount: <span className="font-semibold text-purple-600">₹{Number(invoiceData.balance || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Adjustment Reason</Label>
                      <Textarea
                        value={invoiceData.expenseAdjustmentReason}
                        onChange={(e) => setInvoiceData({ ...invoiceData, expenseAdjustmentReason: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex gap-2">
                        <Badge variant={invoiceData.paymentStatus === "Paid" ? "default" : "secondary"}>
                          Payment: {invoiceData.paymentStatus}
                        </Badge>
                        <Badge variant={invoiceData.invoiceStatus === "Closed" ? "default" : "outline"}>
                          Invoice: {invoiceData.invoiceStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{invoiceData.date ? new Date(invoiceData.date).toLocaleDateString() : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recipient:</span>
                    <span className="font-medium">{invoiceData.recipientName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{invoiceData.category || "-"}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold">₹{Number(invoiceData.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-40">
          <div className="max-w-7xl mx-auto flex justify-end gap-3">
            <Link href="/dashboard/purchaseInvoices">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">Update Invoice</Button>
          </div>
        </div>
      </form>
    </div>
  )
}