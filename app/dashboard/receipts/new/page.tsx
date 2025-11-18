"use client"

import type React from "react"
import { toast } from "@/lib/toast"
import { api } from "@/lib/api-client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Save, ArrowLeft, UserPlus, X, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { OwnSearchableSelect } from "@/components/searchableSelect"
import { QuotationItem } from "@/lib/models/types"

export default function NewReceiptPage() {
  const router = useRouter()
  const { user } = useUser()

  const [clients, setClients] = useState<any[]>([])
  const [bankDetails, setBankDetails] = useState<any[]>([])
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [quotations, setQuotations] = useState<any[]>([])
  const [allQuotations, setAllQuotations] = useState<any[]>([])
  const [masterItems, setMasterItems] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])

  const [receiptNumber, setReceiptNumber] = useState("Auto-generated")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")

  const [selectedQuotationId, setSelectedQuotationId] = useState("")
  const [quotationAcceptedDate, setQuotationAcceptedDate] = useState("")
  const [projectName, setProjectName] = useState("")

  const [selectedClientId, setSelectedClientId] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")

  const [items, setItems] = useState<QuotationItem[]>([])

  const [receiptTotal, setReceiptTotal] = useState(0)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [balanceAmount, setBalanceAmount] = useState(0)
  const [paymentType, setPaymentType] = useState<"Full Payment" | "Partial">("Full Payment")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [status, setStatus] = useState<"Pending" | "Cleared" | "Failed">("Pending")

  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    clientName: "",
    email: "",
    phone: "",
    address: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const [loadedClients, loadedQuotations, loadedItems, loadedBankDetails] = await Promise.all([
        api.clients.getAll(),
        api.quotations.getAll(),
        api.items.getAll(),
        api.bankAccounts.getAll(),
      ])

      setClients(loadedClients || [])
      setAllQuotations(loadedQuotations || [])
      setMasterItems(loadedItems || [])
      setBankDetails(loadedBankDetails || [])

      setPaymentMethods(["Cash", "Bank Transfer", "UPI", "Check", "Credit Card", "Debit Card"])
    }
    loadData()
  }, [])

  // When client is selected: filter quotations for that client
  useEffect(() => {
    if (selectedClientId) {
      const filtered = (allQuotations || []).filter((q: any) => String(q.clientId) === String(selectedClientId) || String(q.clientId) === selectedClientId)
      setQuotations(filtered)
    } else {
      setQuotations([])
    }

    // Clear quotation selection when client changes
    setSelectedQuotationId("")
    setQuotationAcceptedDate("")
    setProjectName("")

    // Reset items if client changed and no quotation selected
    setItems([])
  }, [selectedClientId, allQuotations])

  // When a quotation is selected: load its items (read-only) and auto-populate client/project fields
  useEffect(() => {
    if (!selectedQuotationId) {
      // no quotation -> enable manual items
      setQuotationAcceptedDate("")
      // ensure items remain whatever the user had (do not override) if they already added
      setReceiptTotal((items || []).reduce((s, it) => s + (it.total || 0), 0))
      setPaymentAmount((items || []).reduce((s, it) => s + (it.total || 0), 0))
      return
    }

    const q = (allQuotations || []).find((x: any) => String(x._id) === String(selectedQuotationId) || String(x.id) === String(selectedQuotationId))
    console.log("q:::",q)
    if (!q) return

    // Map quotation items to QuotationItem shape and calculate amounts
    const mapped: QuotationItem[] = (q.items || []).map((it: any, idx: number) => {
      const taxRate = it.taxRate ?? ((it.cgst || 0) + (it.sgst || 0) + (it.igst || 0))
      const quantity = Number(it.quantity || 1)
      const price = Number(it.price || it.unitPrice || 0)
      const discount = Number(it.discount || 0)
      const amount = quantity * price * (1 - discount / 100)
      const taxAmount = (amount * (taxRate || 0)) / 100
      const total = amount + taxAmount

      return {
        itemId: it.itemId || it.id || `q-${idx}`,
        id: it.itemId || it.id || `q-${idx}`,
        type: it.type || "product",
        itemName: it.itemName || it.name || "",
        description: it.description || "",
        quantity,
        price,
        discount,
        cgst: 0,
        sgst: 0,
        igst: 0,
        taxName: it.taxName || "",
        taxRate,
        // attach computed fields for UI convenience
        amount,
        taxAmount,
        total,
      } as QuotationItem
    })
   
    setItems(mapped)
    // setReceiptTotal(Number(q.grandTotal || mapped.reduce((s, it) => s + (it.total || 0), 0)))
    // setPaymentAmount(Number(q.paidAmount ? Math.min(q.paidAmount, q.grandTotal || 0) : q.grandTotal || mapped.reduce((s, it) => s + (it.total || 0), 0)))
    setReceiptTotal(q.grandTotal-q.paidAmount)
    setPaymentAmount(q.balanceAmount)
    
    setProjectName(q.projectName || "")
    setQuotationAcceptedDate(q.acceptedDate || q.date || "")

    // auto-fill client fields from the quotation (safe because quotation is for that client)
    if (q.clientName) setClientName(q.clientName)
    if (q.clientEmail) setClientEmail(q.clientEmail)
    if (q.clientPhone || q.clientContact) setClientPhone(q.clientPhone || q.clientContact)
    if (q.clientAddress) setClientAddress(q.clientAddress)
  }, [selectedQuotationId, allQuotations])

  // Recalculate totals when items change (only relevant when no quotation selected or manual edits allowed)
  useEffect(() => {
    if (selectedQuotationId) return // locked by quotation
    const total = (items || []).reduce((s, it) => s + (it.total || ( (it.quantity||0) * (it.price||0) * (1 - (it.discount||0)/100) )), 0)
    setReceiptTotal(total)
    setPaymentAmount(paymentType === "Full Payment" ? total : paymentAmount)
  }, [items, selectedQuotationId])

  // Payment amount / balance logic
  useEffect(() => {
    if (paymentType === "Partial") {
      setBalanceAmount(receiptTotal - paymentAmount)
    } else {
      setBalanceAmount(0)
      setPaymentAmount(receiptTotal)
    }
  }, [paymentType, receiptTotal, paymentAmount])

  useEffect(() => {
    if (paymentMethod === "Cash") setStatus("Cleared")
    else setStatus("Received")
  }, [paymentMethod])

  // Helpers for items
  const addItem = () => {
    if (selectedQuotationId) return // locked
    const newItem: QuotationItem = {
      itemId: Date.now().toString(),
      id: Date.now().toString(),
      type: "product",
      itemName: "",
      description: "",
      quantity: 1,
      price: 0,
      discount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      taxRate: 0,
    }
    setItems((s) => [...s, newItem])
  }

  const removeItem = (id: string) => {
    if (selectedQuotationId) return // locked
    if (items.length > 1) setItems(items.filter((it) => it.id !== id))
  }

  const updateItem = (id: string, field: keyof QuotationItem, value: string | number) => {
    if (selectedQuotationId) return // locked - we don't allow editing quotation items

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value } as any
        const qty = Number(updated.quantity || 0)
        const price = Number(updated.price || 0)
        const discount = Number(updated.discount || 0)
        const taxRate = Number(updated.taxRate || 0)

        const amount = qty * price * (1 - discount / 100)
        const taxAmount = (amount * (taxRate || 0)) / 100
        const total = amount + taxAmount

        return { ...updated, amount, taxAmount, total }
      }),
    )
  }

  // Submit handler
  const handleSubmit = async (e?: React.FormEvent) => {

    if (e) e.preventDefault()
    
    if (isSubmitting) return

    if (!selectedClientId) {
      toast.error("Please select a client")
      return
    }

    if (!selectedQuotationId && !(items && items.some((it) => it.itemName))) {
      toast.error("Please add at least one item when no quotation is selected")
      return
    }

    // For option 1 (locked), quotation items are read-only and used as-is

    setIsSubmitting(true)

    try {
      if(selectedQuotationId){
        console.log("selected quotation id is::",selectedQuotationId)
        console.log("Payment Amount in frontend:::",paymentAmount)
        const filteredQuotation=allQuotations.filter((eachItem:any)=>eachItem._id===selectedQuotationId);
        const totalAmountPaid=filteredQuotation[0].paidAmount+paymentAmount
        const  totalAmountBalance=filteredQuotation[0].balanceAmount-paymentAmount
        console.log("total AMount Paid is:::",totalAmountPaid);
        console.log("Total Balance Amount:::",totalAmountBalance);
        const quotationPayloadUpdate={paidAmount:totalAmountPaid,balanceAmount:totalAmountBalance}
         await api.quotations.update(filteredQuotation[0]._id, quotationPayloadUpdate)
        console.log(filteredQuotation);
      }
      const payload = {
        clientId: selectedClientId,
        clientName: clientName,
        clientEmail,
        clientPhone,
        clientAddress,
        quotationId: selectedQuotationId || "",
        quotationNumber: selectedQuotationId ? (allQuotations.find((q:any)=>String(q._id)===String(selectedQuotationId) || String(q.id)===String(selectedQuotationId))?.quotationNumber || '') : '',
        projectName: projectName || undefined,
        items: (items || []).map((it) => ({
          itemId: it.itemId,
          id: it.id,
          type: it.type,
          itemName: it.itemName,
          description: it.description,
          quantity: it.quantity,
          price: it.price,
          discount: it.discount,
          taxRate: it.taxRate,
        })),
        amountPaid: paymentType === "Partial" ? paymentAmount : receiptTotal,
        paymentType: paymentType === "Full Payment" ? "full" : "partial",
        paymentMethod: paymentMethod.toLowerCase().replace(" ", "-"),
        bankAccount,
        referenceNumber,
        screenshot: screenshot?.name,
        notes: description,
        date,
        subtotal: items.reduce((s, it) => s + (it.amount || 0), 0),
        taxAmount: items.reduce((s, it) => s + (it.taxAmount || 0), 0),
        total: receiptTotal,
        status: status.toLowerCase() as any,
        userId: user?.id || undefined,
      }

      const receipt = await api.receipts.create(payload)
      toast.success(`Receipt ${receipt.receiptNumber || "created"} created successfully!`)
      router.push("/dashboard/receipts")
    } catch (err: any) {
      console.error("Error creating receipt", err)
      toast.error(err?.message || "Failed to create receipt")
      setIsSubmitting(false)
    }
  }

  // Create client helper (unchanged)
  const handleCreateClient = async () => {
    let newErrors = { name: "", email: "", phone: "", address: "" }
    let isValid = true

    if (!newClient.clientName.trim()) {
      newErrors.name = "Client name is required"
      isValid = false
    }
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(newClient.phone)) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number"
      isValid = false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newClient.email)) {
      newErrors.email = "Enter a valid email address"
      isValid = false
    }
    if (!newClient.address.trim()) {
      newErrors.address = "Address is required"
      isValid = false
    }

    setErrors(newErrors)
    if (!isValid) return

    try {
      const localStored = localStorage.getItem("loginedUser")
      const parsed = localStored ? JSON.parse(localStored) : null
      const newClientData = await api.clients.create({
        name: newClient.clientName,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        status: "active",
        userId: parsed?.id,
      })
      toast.success("Client Added")
      const loadedClients = await api.clients.getAll()
      setClients(loadedClients)
      const found = loadedClients.find((c:any)=>c.name===newClient.clientName||c.clientName===newClient.clientName)
      if (found) setSelectedClientId(found._id || found.id)
      setIsCreateClientOpen(false)
      setNewClient({ clientName: "", email: "", phone: "", address: "" })
    } catch (error:any) {
      toast.error(error?.message || "Failed to save client")
    }
  }

  const numberToWords = (num: number): string => `${num.toLocaleString()} Rupees Only`

  const clientOptions = clients.map((c) => ({ value: String(c._id || c.id), label: c.clientName || c.name || "Unnamed" }))

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/receipts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Receipt</h1>
            <p className="text-gray-600">Create a new payment receipt</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Saving..." : "Save Receipt"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receiptNumber">Receipt Number *</Label>
                  <Input id="receiptNumber" value={receiptNumber} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated: REC-Year-Number</p>
                </div>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  <p className="text-xs text-gray-500 mt-1">Default system date</p>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client">Client Name *</Label>
                <div className="flex gap-2">
                  <OwnSearchableSelect
                    options={clientOptions}
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                    placeholder="Search and select a client..."
                    searchPlaceholder="Type to search clients..."
                    emptyText="No clients found."
                  />

                  <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Client</DialogTitle>
                        <DialogDescription>Add a new client to your records</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="newClientName">Client Name *</Label>
                          <Input id="newClientName" value={newClient.clientName} onChange={(e) => setNewClient({ ...newClient, clientName: e.target.value })} placeholder="Enter client name" />
                          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                        </div>
                        <div>
                          <Label htmlFor="newClientEmail">Email</Label>
                          <Input id="newClientEmail" type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="client@example.com" />
                          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                        </div>
                        <div>
                          <Label htmlFor="newClientPhone">Phone *</Label>
                          <Input id="newClientPhone" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="Mobile number" />
                          {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                        </div>
                        <div>
                          <Label htmlFor="newClientAddress">Address</Label>
                          <Textarea id="newClientAddress" value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} rows={2} />
                          {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateClientOpen(false)}>Cancel</Button>
                        <Button type="button" onClick={handleCreateClient}>Create Client</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {selectedQuotationId && <p className="text-xs text-gray-500 mt-1">Auto-selected from quotation, read-only items</p>}
              </div>

              {selectedClientId && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <Input value={clientPhone} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={clientEmail} disabled className="bg-gray-50" />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea value={clientAddress} disabled className="bg-gray-50" rows={2} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotation Details (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quotation">Quotation Number</Label>
                <div className="flex gap-2">
                  <OwnSearchableSelect
                    options={quotations.map((q) => ({ value: String(q._id || q.id), label: `${q.quotationNumber} - ${q.projectName || q.clientName || ''} (Pending: ₹${(q.balanceAmount || q.grandTotal || 0).toLocaleString()})` }))}
                    value={selectedQuotationId}
                    onValueChange={setSelectedQuotationId}
                    placeholder={selectedClientId ? "Search quotations..." : "Select a client first"}
                    searchPlaceholder="Type to search quotations..."
                    emptyText="No quotations found for this client."
                    className={!selectedClientId ? "opacity-50 cursor-not-allowed" : ""}
                  />
                  {selectedQuotationId && (
                    <Button type="button" variant="outline" size="icon" onClick={() => { setSelectedQuotationId(""); setItems([]); setProjectName("") }}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select a quotation to auto-populate items (read-only). Leave empty to create new items.</p>

                {quotationAcceptedDate && (
                  <div className="mt-2">
                    <Label>Quotation Acceptance Date</Label>
                    <Input value={new Date(quotationAcceptedDate).toLocaleDateString()} disabled className="bg-gray-50" />
                  </div>
                )}

                {!selectedQuotationId && selectedClientId && (
                  <div className="mt-2">
                    <Label htmlFor="projectName">Project Name *</Label>
                    <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Enter project name" />
                    <p className="text-xs text-gray-500 mt-1">Required to create a new quotation for this receipt</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!selectedQuotationId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Items/Services</CardTitle>
                  <Button onClick={addItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id || index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        {items.length > 1 && (
                          <Button onClick={() => removeItem(item.id)} size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label>Type *</Label>
                          <Select value={item.type} onValueChange={(value: any) => updateItem(item.id, "type", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Item Name *</Label>
                          <OwnSearchableSelect
                            options={masterItems.filter((m:any)=>m.type===item.type).map((m:any)=>({ id: m._id, value: m.name, label: m.name }))}
                            value={item.itemName}
                            onValueChange={(value:any) => updateItem(item.id, "itemName", value)}
                            placeholder="Search and select an item..."
                            searchPlaceholder="Type to search items..."
                            emptyText={`No ${item.type === "product" ? "products" : "services"} found.`}
                          />
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} rows={2} className="bg-white" />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {item.type === "product" && (
                            <div>
                              <Label>Quantity *</Label>
                              <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)} min="1" className="bg-white" />
                            </div>
                          )}
                          <div>
                            <Label>Price *</Label>
                            <Input type="number" value={item.price} onChange={(e) => updateItem(item.id, "price", Number.parseFloat(e.target.value) || 0)} min="0" step="0.01" className="bg-white" />
                          </div>
                          <div>
                            <Label>Discount (%)</Label>
                            <Input type="number" value={item.discount} onChange={(e) => updateItem(item.id, "discount", Number.parseFloat(e.target.value) || 0)} min="0" step="0.01" placeholder="0" className="bg-white" />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label>Tax Rate (%)</Label>
                            <Input value={item.taxRate} onChange={(e) => updateItem(item.id, "taxRate", Number.parseFloat(e.target.value) || 0)} className="bg-gray-100" />
                          </div>
                          <div>
                            <Label>Amount</Label>
                            <Input value={Number(item.amount || 0).toFixed(2)} disabled className="bg-gray-50" />
                          </div>
                          <div>
                            <Label>Total</Label>
                            <Input value={Number(item.total || 0).toFixed(2)} disabled className="bg-gray-50" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedQuotationId && (
            <Card>
              <CardHeader>
                <CardTitle>Quotation Items (read-only)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div key={item.id || idx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{item.itemName}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <BadgeArea item={item} />
                        </div>
                        <div className="text-right">
                          <p className="text-purple-600 font-semibold">₹{Number(item.total || 0).toLocaleString()}</p>
                          <p className="text-sm">{item.quantity} × ₹{Number(item.price).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="receiptTotal">Receipt Total *</Label>
                <Input id="receiptTotal" type="number" value={receiptTotal} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">{selectedQuotationId ? "Auto-calculated from quotation" : "Auto-calculated from items"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentType">Payment Type *</Label>
                  <Select value={paymentType} onValueChange={(value:any) => setPaymentType(value)} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Payment">Full Payment</SelectItem>
                      <SelectItem value="Partial">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {paymentType === "Partial" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentAmount">Payment Amount *</Label>
                    <Input id="paymentAmount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number.parseFloat(e.target.value) || 0)} required min="0" max={receiptTotal} step="0.01" />
                    <p className="text-xs text-gray-500 mt-1">Amount being paid now</p>
                  </div>
                  <div>
                    <Label htmlFor="balanceAmount">Balance Amount</Label>
                    <Input id="balanceAmount" type="number" value={balanceAmount} disabled className="bg-gray-50" />
                    <p className="text-xs text-red-600 mt-1">Remaining balance to be paid</p>
                  </div>
                </div>
              )}

              <div>
                <Label>Amount in Words</Label>
                <Input value={numberToWords(paymentType === "Partial" ? paymentAmount : receiptTotal)} disabled className="bg-gray-50" />
              </div>

              {(paymentMethod === "Bank Transfer" || paymentMethod === "UPI") && (
                <div>
                  <Label htmlFor="bankAccount">Bank Account *</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankDetails.map((account) => (
                        <SelectItem key={account._id} value={account.accountNumber}>{`${account.bankName} - ${account.accountNumber}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {paymentMethod && paymentMethod !== "Cash" && (
                <>
                  <div>
                    <Label htmlFor="referenceNumber">Reference Number *</Label>
                    <Input id="referenceNumber" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Transaction/Check reference number" required />
                    <p className="text-xs text-gray-500 mt-1">Mandatory for non-cash payments</p>
                  </div>
                  <div>
                    <Label htmlFor="screenshot">Screenshot Upload *</Label>
                    <Input id="screenshot" type="file" accept="image/*" onChange={(e:any) => setScreenshot(e.target.files?.[0] || null)} required />
                    <p className="text-xs text-gray-500 mt-1">Mandatory for non-cash payments</p>
                  </div>
                </>
              )}

              <div>
                <Label>Created By</Label>
                <Input value={user?.name || ""} disabled className="bg-gray-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Receipt Number:</span>
                  <span className="font-medium">{receiptNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                </div>
                {selectedQuotationId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quotation:</span>
                    <span className="font-medium">{allQuotations.find((q:any) => String(q._id) === String(selectedQuotationId) || String(q.id) === String(selectedQuotationId))?.quotationNumber || "N/A"}</span>
                  </div>
                )}
                {projectName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Project:</span>
                    <span className="font-medium">{projectName}</span>
                  </div>
                )}
                {clientName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{clientName}</span>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Receipt Total:</span>
                  <span className="text-purple-600">₹{receiptTotal.toLocaleString()}</span>
                </div>
                {paymentType === "Partial" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Amount:</span>
                      <span className="font-medium text-green-600">₹{paymentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Balance Due:</span>
                      <span className="font-medium text-red-600">₹{balanceAmount.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex justify-end gap-3">
          <Link href="/dashboard/receipts">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSubmit} size="lg" className="min-w-[200px]" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Creating Receipt..." : "Create Receipt"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Small helper component used above (keeps UI unchanged)
function BadgeArea({ item }: { item: any }) {
  return (
    <div className="mt-2">
      <div className="text-sm text-gray-600">Quantity: {item.quantity} • Price: ₹{Number(item.price).toLocaleString()}</div>
      <div className="text-sm text-gray-600">Tax: {item.taxRate || 0}%</div>
    </div>
  )
}
