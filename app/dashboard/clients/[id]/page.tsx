"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CreditCard, Pencil, Download } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { downloadCSV, formatCurrencyForExport, formatDateForExport } from "@/lib/export-utils"
import { tokenStorage } from "@/lib/token-storage"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/lib/toast"
import { Plus, Building2, User } from "lucide-react"

interface Transaction {
  id: string
  type: "quotation" | "receipt" | "payment" | "salesInvoice" | "purchaseInvoice"
  number: string
  date: string
  items: string[]
  amount: number
  paidAmount: number
  balanceAmount: number
  status: string
}

interface Client {
  id: string
  _id?: string
  clientNumber: string
  clientName?: string
  name?: string
  companyName?: string
  contactName?: string
  email: string
  phone: string
  address: string
  state?: string
  city?: string
  pincode?: string
  gst?: string
  pan?: string
  bankAccount?: string
  upiId?: string
  startDate?: string
  status: string
  type?: "individual" | "company"
  note?: string
}

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const [client, setClient] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [planFeatures, setPlanFeatures] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [transactionNumberQuery, setTransactionNumberQuery] = useState("")
  // Client Type
  const [clientType, setClientType] = useState<"individual" | "company">("individual")
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<
    "all" | "pending" | "partial" | "completed" | "cancelled" | "overdue"
  >("all")
  // Form Data
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    name: "",
    companyName: "",
    contactName: "",
    gst: "",
    pan: "",
    note: "",
  })

  const [errors, setErrors] = useState({
    name: "",
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    gst: "",
    pan: "",
  })

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

    const loadClientData = async () => {
      if (params.id) {
        try {
          const [loadedClient, allQuotations, allReceipts, allPayments, allSalesInvoices, allPurchaseInvoices] = await Promise.all([
            api.clients.getById(params.id as string),
            api.quotations.getAll(),
            api.receipts.getAll(),
            api.payments.getAll(),
            api.salesInvoice.getAll(),
            api.purchaseInvoice.getAll(),
          ]);

          if (!loadedClient) {
            setClient(null)
            return
          }
          setClient(loadedClient)

          const clientQuotations = (allQuotations || [])
            .filter((q: any) => q.clientId === params.id)
            .map((q: any) => ({
              id: q._id,
              type: "quotation" as const,
              number: q.quotationNumber,
              date: q.date,
              items: q.items?.map((item: any) => item.itemName) || [],
              amount: q.grandTotal || 0,
              paidAmount: q.paidAmount || 0,
              balanceAmount: q.balanceAmount || 0,
              status: q.status,
            }));

          const clientReceipts = (allReceipts || [])
            .filter((r: any) => r.clientId === params.id)
            .map((r: any) => ({
              id: r._id,
              type: "receipt" as const,
              number: r.receiptNumber,
              date: r.date,
              items: r.items?.map((item: any) => item.itemName || item.name) || [r.receiptType || "Receipt"],
              amount: r.total || r.ReceiptAmount || 0,
              paidAmount: r.ReceiptAmount || r.amountPaid || 0,
              balanceAmount: r.balanceAmount || 0,
              status: r.status,
            }));

          const clientPayments = (allPayments || [])
            .filter((p: any) => p.recipientId === params.id && p.recipientType === "client")
            .map((p: any) => ({
              id: p._id,
              type: "payment" as const,
              number: p.paymentNumber,
              date: p.date,
              items: [p.description || p.category || "Payment"],
              amount: p.amount || 0,
              paidAmount: p.amount || 0,
              balanceAmount: 0,
              status: p.status,
            }));

          const clientSalesInvoices = (allSalesInvoices || [])
            .filter((s: any) => s.clientId === params.id)
            .map((s: any) => ({
              id: s._id,
              type: "salesInvoice" as const,
              number: s.salesInvoiceNumber,
              date: s.date,
              items: s.items?.map((item: any) => item.itemName) || [],
              amount: s.grandTotal || 0,
              paidAmount: s.paidAmount || 0,
              balanceAmount: s.balanceAmount || 0,
              status: s.status,
            }));

            const clientPurchaseInvoices = (allPurchaseInvoices || [])
            .filter((p: any) => p.clientId === params.id || p.recipientId === params.id)
            .map((p: any) => ({
              id: p._id,
              type: "purchaseInvoice" as const,
              number: p.purchaseInvoiceNumber,
              date: p.date,
              items: p.items?.map((item: any) => item.itemName || item.name) || [],
              amount: p.invoiceTotalAmount || p.total || 0,
              paidAmount: p.invoiceTotalAmount - p.balanceAmount - p.expenseAdjustmentAmount || 0,
              balanceAmount: p.balanceAmount || 0,
              status: p.invoiceStatus,
            }));

          const combinedTransactions = [
            ...clientQuotations,
            ...clientReceipts,
            ...clientPayments,
            ...clientSalesInvoices,
            ...clientPurchaseInvoices,
          ].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          setTransactions(combinedTransactions)
        } catch (error) {
          console.error("Failed to load client data:", error)
        }
      }
    }
    loadClientData()
  }, [params.id])

  if (!client) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading client details...</p>
      </div>
    )
  }
  
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
  const rec = transactions.filter((t) => t.type === "receipt")
  const totalPaid = rec.reduce((sum, t) => sum + t.paidAmount, 0)
  const invoice = transactions.filter((t) => t.type === "salesInvoice")
  const totalBalance = invoice.reduce((sum, t) => sum + t.balanceAmount, 0)

  const handleExportTransactions = () => {
    const exportData = transactions.map((t) => ({
      transactionNumber: t.number,
      type: t.type,
      date: t.date,
      items: t.items.join("; "),
      amount: t.amount,
      paidAmount: t.paidAmount,
      balanceAmount: t.balanceAmount,
      status: t.status,
    }))

    downloadCSV(
      `client-${client.clientNumber}-transactions-${new Date().toISOString().split("T")[0]}.csv`,
      exportData,
      [
        { key: "transactionNumber", label: "Transaction #", format: (v) => `="${v}"` },
        { key: "type", label: "Type" },
        { key: "date", label: "Date", format: formatDateForExport },
        { key: "items", label: "Items" },
        { key: "status", label: "Status" },
        { key: "amount", label: "Amount", format: formatCurrencyForExport },
        { key: "paidAmount", label: "Paid", format: formatCurrencyForExport },
        { key: "balanceAmount", label: "Balance", format: formatCurrencyForExport },
      ],
    )
  }

  const filteredTransactions = transactions.filter((t) => {
    const q = transactionNumberQuery.trim().toLowerCase()
    if (!q) return true
    const matchesNumber = (t.number || "").toLowerCase().includes(q)
    const matchesStatus = (t.status || "").toLowerCase().includes(q)
    return matchesNumber || matchesStatus
  })
  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setClientType((client.type as "individual" | "company") || "individual")

    setFormData({
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      state: client.state || "",
      city: client.city || "",
      pincode: client.pincode || "",
      name: client.name || "",
      companyName: client.companyName || "",
      contactName: client.contactName || "",
      gst: client.gst || "",
      pan: client.pan || "",
      note: client.note || "",
    })

    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setClientType("individual")
    setFormData({
      email: "",
      phone: "",
      address: "",
      state: "",
      city: "",
      pincode: "",
      name: "",
      companyName: "",
      contactName: "",
      gst: "",
      pan: "",
      note: "",
    })
    setErrors({
      name: "",
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      state: "",
      city: "",
      pincode: "",
      gst: "",
      pan: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const localStored = localStorage.getItem("loginedUser")
    const parsed = localStored ? JSON.parse(localStored) : null

    let newErrors = { ...errors }
    let isValid = true

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number"
      isValid = false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address"
      isValid = false
    }

    if (!formData.state.trim()) { newErrors.state = "State is required"; isValid = false }
    if (!formData.city.trim()) { newErrors.city = "City is required"; isValid = false }
    const pincodeRegex = /^\d{6}$/
    if (!pincodeRegex.test(formData.pincode)) { newErrors.pincode = "Enter a valid 6-digit pincode"; isValid = false }
    if (!formData.address.trim()) { newErrors.address = "Address is required"; isValid = false }

    if (clientType === "individual" && !formData.name.trim()) {
      newErrors.name = "Client name is required"
      isValid = false
    }

    if (clientType === "company") {
      if (!formData.companyName.trim()) { newErrors.companyName = "Company name is required"; isValid = false }
      if (!formData.contactName.trim()) { newErrors.contactName = "Contact name is required"; isValid = false }
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (formData.gst && !gstRegex.test(formData.gst)) { newErrors.gst = "Enter a valid GST number"; isValid = false }
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (formData.pan && !panRegex.test(formData.pan)) { newErrors.pan = "Enter a valid PAN number"; isValid = false }
    }

    setErrors(newErrors)
    if (!isValid) return

    try {
      const payload: any = {
        type: clientType,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        userId: parsed.id,
        pan: formData.pan || undefined,
        status: "active",
        note: formData.note,
      }

      if (clientType === "individual") {
        payload.name = formData.name
      } else {
        payload.companyName = formData.companyName
        payload.name = formData.contactName
        if (formData.gst) payload.gst = formData.gst
        if (formData.pan) payload.pan = formData.pan
      }

      if (editingClient?._id) {
        await api.clients.update(editingClient._id, payload)
        toast.success("Client Updated", "Client updated successfully")
        setClient({ ...client, ...payload }) // Update UI instantly
      }

      setIsDialogOpen(false)
      setEditingClient(null)
      resetForm()
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Failed to save client")
    }
  }

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800"
    const s = status.toLowerCase()
    if (
      s.includes("complete") ||
      s.includes("cleared") ||
      s.includes("collected") ||
      s.includes("confirmed") ||
      s.includes("accepted")
    ) {
      return "bg-green-100 text-green-800"
    }
    if (s.includes("partial")) {
      return "bg-yellow-100 text-yellow-800"
    }
    if (s.includes("pending") || s.includes("overdue") || s.includes("expired") || s.includes("not") || s.includes("cancelled")) {
      return "bg-red-100 text-red-800"
    }
    return "bg-blue-100 text-blue-800" // for other statuses like 'sent'
  }


 
    const renderTransactionTable = (
      data: Transaction[],
      options?: {
        descriptionHeaderLabel?: string
        descriptionCellClassName?: string
      },
    ) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>{options?.descriptionHeaderLabel ?? "Items"}</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            data.map((transaction) => {
              let viewLink = ""
              switch (transaction.type) {
                case "quotation":
                  viewLink = `/dashboard/quotations/${transaction.id}`
                  break
                case "salesInvoice":
                  viewLink = `/dashboard/salesInvoices/${transaction.id}`
                  break
                case "receipt":
                  viewLink = `/dashboard/receipts/${transaction.id}`
                  break
                case "purchaseInvoice":
                  viewLink = `/dashboard/purchaseInvoices/${transaction.id}`
                  break
                case "payment":
                  viewLink = `/dashboard/payments/${transaction.id}`
                  break
              }

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.number}</TableCell>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                  <div className={`text-sm ${options?.descriptionCellClassName ?? ""}`}>
                  {transaction.items.slice(0, 2).join(", ")}
                      {transaction.items.length > 2 && ` +${transaction.items.length - 2} more`}
                    </div>
                  </TableCell>
                  <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">₹{transaction.paidAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-red-600">₹{transaction.balanceAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusBadgeClass(transaction.status)} capitalize`}>{transaction.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {viewLink && (
                      <Link href={viewLink}>
                        <Button size="sm" variant="outline" className="h-8">View</Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/clients">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          {planFeatures?.csv && (
            <Button variant="outline" size="sm" onClick={handleExportTransactions}>
              <Download className="h-4 w-4 mr-2" />
              Export Transactions
            </Button>
          )}
          {/* <Button size="sm" onClick={() => handleEdit(client)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Client
          </Button> */}
        </div>
      </div>

      {/* === Client Info & Transactions UI (unchanged) === */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
        {(() => {
            const infoItems: Array<{ label: string; value: string | JSX.Element }> = []
            const pushIf = (label: string, value?: string) => {
              if (value && value.trim()) infoItems.push({ label, value: value.trim() })
            }

            pushIf("Company Name", client.companyName)
            pushIf("Client Name", client.name || client.companyName || client.clientName)
            pushIf("Email", client.email)
            pushIf("Phone", client.phone)
            pushIf("Address", client.address)
            pushIf("State", client.state)
            pushIf("City", client.city)
            pushIf("Pincode", client.pincode)
            pushIf("PAN Number", client.pan)
            pushIf("GST", client.gst)
            pushIf("Bank Account", client.bankAccount)
            pushIf("UPI ID", client.upiId)
            if (client.status && client.status.trim()) {
              infoItems.push({
                label: "Status",
                value: <Badge variant={client.status === "active" ? "default" : "secondary"} className="capitalize">{client.status}</Badge>,
              })
            }
            pushIf("Note", client.note)

            return (
              <>
                {infoItems.length > 0 && (
                  <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                  </CardHeader>
                )}
                <CardContent className="space-y-4">
                  {infoItems.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-6">No client information available.</div>
                  ) : (
                    infoItems.map((item) => (
                      <div key={item.label}>
                        <p className="text-sm text-gray-600">{item.label}</p>
                        <div className="font-medium">{item.value}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </>
            )
          })()}
        </Card>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
              </CardContent>
            </Card> */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Balance Due</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">₹{totalBalance.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All transactions for this client</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by transaction number, date, or status....."
                    value={transactionNumberQuery}
                    onChange={(e) => setTransactionNumberQuery(e.target.value)}
                  />
                </div>
              </div>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="px-2 w-full xl:w-130 ">
                  <div className="overflow-x-auto flex justify-between">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="receipt">Receipt</TabsTrigger>
                  <TabsTrigger value="salesInvoice">Sales Invoice</TabsTrigger>
                  <TabsTrigger value="purchaseInvoice">Purchase Invoice</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="quotation">Quotation</TabsTrigger>
                 </div>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                {renderTransactionTable(filteredTransactions)}
                </TabsContent>
                <TabsContent value="receipt" className="mt-4">
                {renderTransactionTable(filteredTransactions.filter((t) => t.type === "receipt"))}
                </TabsContent>
                <TabsContent value="salesInvoice" className="mt-4">
                  {renderTransactionTable(filteredTransactions.filter((t) => t.type === "salesInvoice"))}
                </TabsContent>
                <TabsContent value="purchaseInvoice" className="mt-4">
                {renderTransactionTable(filteredTransactions.filter((t) => t.type === "purchaseInvoice"), {
                    descriptionHeaderLabel: "Description",
                    descriptionCellClassName: "truncate whitespace-nowrap max-w-[280px] sm:max-w-[420px]",
                  })}
                </TabsContent>
                <TabsContent value="payment" className="mt-4">
                {renderTransactionTable(filteredTransactions.filter((t) => t.type === "payment"), {
                    descriptionHeaderLabel: "Description",
                    descriptionCellClassName: "truncate whitespace-nowrap max-w-[280px] sm:max-w-[420px]",
                  })}
                </TabsContent>
                <TabsContent value="quotation" className="mt-4">
                  {renderTransactionTable(filteredTransactions.filter((t) => t.type === "quotation"))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FIXED DIALOG — Always rendered, no trigger, controlled open state */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingClient(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="!w-[90vw] sm:max-w-[90vw] h-[95vh] flex flex-col p-0 gap-0">
          <div className="sticky top-0 bg-white border-b px-6 py-4 z-20">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
              <DialogDescription>
                {editingClient ? "Update client information" : "Create a new client record"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5 pb-20" id="client-form">
              <div className="pb-4">
                <Label className="text-sm font-medium">Client Type</Label>
                <Select value={clientType} onValueChange={(v) => setClientType(v as "individual" | "company")}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Individual
                      </div>
                    </SelectItem>
                    <SelectItem value="company">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Company
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {clientType === "individual" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="ind-name">Client Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="ind-name"
                      value={formData.name}
                      placeholder="Client name"
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pan">PAN</Label>
                    <Input
                      id="pan"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F"
                    />
                    {errors.pan && <p className="text-red-500 text-sm">{errors.pan}</p>}
                  </div>
                </div>
              )}

              {clientType === "company" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="comp-name">Company Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="comp-name"
                        value={formData.companyName}
                        placeholder="Company Name"
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                      {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="contact-name">Contact Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="contact-name"
                        value={formData.contactName}
                        placeholder="Contact Holder Name"
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      />
                      {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="gst">GST</Label>
                      <Input
                        id="gst"
                        value={formData.gst}
                        onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                        placeholder="22AAAAA0000A1Z5"
                      />
                      {errors.gst && <p className="text-red-500 text-sm">{errors.gst}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pan">PAN</Label>
                      <Input
                        id="pan"
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        placeholder="ABCDE1234F"
                      />
                      {errors.pan && <p className="text-red-500 text-sm">{errors.pan}</p>}
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    placeholder="Enter a valid 10-digit Indian mobile number"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter a valid email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  placeholder="Enter address"
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
                {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                  <Input
                    id="state"
                    value={formData.state}
                    placeholder="Enter state"
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                  {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                  <Input
                    id="city"
                    value={formData.city}
                    placeholder="Enter city"
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pincode">Pincode <span className="text-red-500">*</span></Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    placeholder="Enter pincode"
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                  {errors.pincode && <p className="text-red-500 text-sm">{errors.pincode}</p>}
                </div>
              </div>
               <div className="space-y-1">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  placeholder="Enter note"
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                />
                {/* {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>} */}
              </div>
            </form>
          </div>

          <div className="bg-white border-t px-6 py-4">
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="client-form">
                {editingClient ? "Update" : "Create"} Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}