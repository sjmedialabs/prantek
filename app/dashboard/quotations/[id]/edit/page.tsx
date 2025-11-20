"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Minus, Save, Send, UserPlus, Loader2,ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "@/lib/toast"
import { api } from "@/lib/api-client"
import { OwnSearchableSelect } from "@/components/searchableSelect"

interface QuotationItem {
  id: string
  type: "product" | "service"
  itemName: string
  description: string
  quantity: number
  price: number
  discount: number
  amount: number
  taxName: string
  taxRate: number
  taxAmount: number
  total: number
  cgst: number
  sgst: number
  igst: number
  itemId: string
}

interface Client {
  _id: string
  clientNumber?: string
  clientName: string
  address: string
  phone: string
  email: string
  name?: string
}

interface MasterItem {
  _id: string
  type: "product" | "service"
  name: string
  description: string
  price: number
  applyTax?: boolean
  cgst?: number
  sgst?: number
  igst?: number
}

/* ---------- EDIT PAGE ---------- */
export default function EditQuotationPage() {
  const router = useRouter()
  const { id: quotationId } = useParams() as { id: string }

  /* ---------- GLOBAL STATE ---------- */
  const [loading, setLoading] = useState(true)

  const [quotationNumber, setQuotationNumber] = useState("")
  const [date, setDate] = useState("")
  const [validityDate, setValidityDate] = useState("")
  const [note, setNote] = useState("")

  const [selectedClientId, setSelectedClientId] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [clientContact, setClientContact] = useState("")
  const [clientEmail, setClientEmail] = useState("")

  const [clients, setClients] = useState<Client[]>([])
  const [masterItems, setMasterItems] = useState<MasterItem[]>([])

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const [items, setItems] = useState<QuotationItem[]>([])

  const [activeTab, setActiveTab] = useState("quotation")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    clientName: "",
    email: "",
    phone: "",
    address: "",
  })

  /* ---------- ITEM CALCULATION ---------- */
  const recalcItem = (item: QuotationItem): QuotationItem => {
    const amount = (item.price - item.discount) * item.quantity
    const taxAmount = (amount * item.taxRate) / 100
    const total = amount + taxAmount
    return { ...item, amount, taxAmount, total }
  }

  /* ---------- LOAD DATA ---------- */
  const loadSupportingData = useCallback(async () => {
    const [loadedClients, loadedItems] = await Promise.all([
      api.clients.getAll(),
      api.items.getAll(),
    ])
    setClients(loadedClients)
    setMasterItems(loadedItems)
  }, [])

  const loadQuotation = useCallback(async () => {
    try {
      const data = await api.quotations.getById(quotationId)
      console.log("[EDIT] Loaded quotation:", data)

      // ---- Header ----
      setQuotationNumber(data.quotationNumber ?? "")
      setDate(data.date?.split("T")[0] ?? "")
      setValidityDate(data.validity?.split("T")[0] ?? "")
      setNote(data.note ?? "")

      // ---- Client ----
      setSelectedClientId(data.clientId ?? "")
      setClientName(data.clientName ?? "")
      setClientAddress(data.clientAddress ?? "")
      setClientContact(data.clientContact ?? "")
      setClientEmail(data.clientEmail ?? "")

      // ---- Items: Map + Recalculate ----
      const rawItems: QuotationItem[] = (data.items ?? []).map((i: any, idx: number) => ({
        id: Date.now().toString() + idx,
        type: i.type,
        itemName: i.itemName,
        description: i.description ?? "",
        quantity: i.quantity,
        price: i.price,
        discount: i.discount ?? 0,
        amount: 0,
        taxName: "",
        taxRate: 0,
        taxAmount: 0,
        total: 0,
        cgst: i.cgst ?? 0,
        sgst: i.sgst ?? 0,
        igst: i.igst ?? 0,
        itemId: i.itemId ?? "",
      }))

      // Recalculate taxRate, taxName, and totals
      const recalculatedItems = rawItems.map((item) => {
        const taxRate = item.cgst + item.sgst + item.igst
        const updated = {
          ...item,
          taxRate,
          taxName: taxRate > 0 ? `CGST+SGST+IGST (${taxRate}%)` : "",
        }
        return recalcItem(updated)
      })

      setItems(recalculatedItems)
    } catch (err) {
      console.error("[EDIT] Failed to load quotation", err)
      toast.error("Could not load quotation")
    } finally {
      setLoading(false)
    }
  }, [quotationId])

  useEffect(() => {
    loadSupportingData()
    loadQuotation()
  }, [loadSupportingData, loadQuotation])

  /* ---------- CLIENT AUTO-FILL ---------- */
  useEffect(() => {
    if (selectedClientId && clients.length) {
      const client = clients.find((c) => c._id === selectedClientId)
      if (client) {
        setClientName(client.clientName || client.name || "")
        setClientAddress(client.address)
        setClientContact(client.phone)
        setClientEmail(client.email)
      }
    }
  }, [selectedClientId, clients])

  /* ---------- ITEM HELPERS ---------- */
  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      type: "product",
      itemName: "",
      description: "",
      quantity: 1,
      price: 0,
      discount: 0,
      amount: 0,
      taxName: "",
      taxRate: 0,
      taxAmount: 0,
      total: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      itemId: "",
    }
    setItems((prev) => [...prev, recalcItem(newItem)])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i

        let updated = { ...i, [field]: value }

        // Reset fields when type changes
        if (field === "type") {
          updated = {
            ...updated,
            itemName: "",
            description: "",
            price: 0,
            discount: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            taxRate: 0,
            taxName: "",
            itemId: "",
          }
        }

        // Auto-fill from master item
        if (field === "itemName" && value) {
          const master = masterItems.find((m) => m.name === value && m.type === updated.type)
          if (master) {
            updated.description = master.description ?? ""
            updated.price = master.price
            updated.itemId = master._id

            if (master.applyTax) {
              updated.cgst = master.cgst ?? 0
              updated.sgst = master.sgst ?? 0
              updated.igst = master.igst ?? 0
            } else {
              updated.cgst = updated.sgst = updated.igst = 0
            }
          }
        }

        // Always recompute tax rate and name
        const taxRate = updated.cgst + updated.sgst + updated.igst
        updated.taxRate = taxRate
        updated.taxName = taxRate > 0 ? `CGST+SGST+IGST (${taxRate}%)` : ""

        // Recalculate amounts
        return recalcItem(updated)
      })
    )
  }

  const quotationTotal = items.reduce((s, i) => s + i.total, 0)

  /* ---------- SAVE / UPDATE ---------- */
  const handleSave = async (status: "draft" | "sent") => {
    if (!clientName.trim()) return toast.error("Please select a client.")
    if (!items.length) return toast.error("Add at least one item.")
    for (const it of items) {
      if (!it.itemName.trim()) return toast.error("Item name required.")
      if (it.quantity <= 0) return toast.error("Quantity must be > 0.")
      if (it.price <= 0) return toast.error("Price must be > 0.")
    }
    if (!date) return toast.error("Select a date.")
    // Validity date is now optional
    if (!clientEmail.trim()) return toast.error("Client email required.")

    try {
      const payload = {
        date,
        validity: validityDate,
        note,
        clientName,
        clientEmail,
        clientAddress,
        clientContact,
        clientId: selectedClientId,
        items: items.map((i) => ({
          type: i.type,
          itemName: i.itemName,
          description: i.description,
          quantity: i.quantity,
          price: i.price,
          discount: i.discount,
          cgst: i.cgst,
          sgst: i.sgst,
          igst: i.igst,
          itemId: i.itemId,
        })),
        grandTotal: quotationTotal,
        status: status === "sent" ? "pending" : "draft",
      }

      await api.quotations.update(quotationId, payload)
      toast.success(`Quotation updated successfully!`)
      router.push("/dashboard/quotations")
    } catch (e) {
      console.error(e)
      toast.error("Failed to update quotation")
    }
  }

  /* ---------- CLIENT CREATION ---------- */
  const handleCreateClient = async () => {
    const local = localStorage.getItem("loginedUser")
    const user = local ? JSON.parse(local) : null

    const newErrs = { name: "", email: "", phone: "", address: "" }
    let ok = true

    if (!newClient.clientName.trim()) { newErrs.name = "Required"; ok = false }
    if (!/^[6-9]\d{9}$/.test(newClient.phone)) { newErrs.phone = "Invalid Indian mobile"; ok = false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email)) { newErrs.email = "Invalid email"; ok = false }
    if (!newClient.address.trim()) { newErrs.address = "Required"; ok = false }

    setErrors(newErrs)
    if (!ok) return

    try {
      const created = await api.clients.create({
        name: newClient.clientName,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        status: "active",
        userId: user?.id,
      })
      toast.success(`new client ${newClient.clientName} is added`)
      const fresh = await api.clients.getAll()
      setClients(fresh)
      const match = fresh.find((c: any) => c.name === newClient.clientName)
      if (match) setSelectedClientId(match._id)
      setIsCreateDialogOpen(false)
      setNewClient({ clientName: "", email: "", phone: "", address: "" })
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create client")
    }
  }

  /* ---------- TAB NAVIGATION ---------- */
  const tabs = ["quotation", "client", "items"]
  const curIdx = tabs.indexOf(activeTab)
  const isLast = curIdx === tabs.length - 1

  const handleContinue = () => {
    if (activeTab === "quotation" && !date) {
      toast.error("Please select a date")
      return
    }
    if (activeTab === "client" && (!clientName || !clientAddress || !clientContact || !clientEmail)) {
      toast.error("Complete client fields")
      return
    }
    if (!isLast) setActiveTab(tabs[curIdx + 1])
  }

  const clientOptions = clients.map((c) => ({
    value: c._id,
    label: c.clientName || c.name || "Unnamed",
  }))

  /* ---------- RENDER ---------- */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-start">
        <div className="mr-5">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Quotation</h1>
          <p className="text-gray-600">Update quotation #{quotationNumber}</p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN TABS */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quotation">Quotation Details</TabsTrigger>
              <TabsTrigger value="client">Client Details</TabsTrigger>
              <TabsTrigger value="items">Items/Services</TabsTrigger>
            </TabsList>

            {/* ---------- QUOTATION TAB ---------- */}
            <TabsContent value="quotation" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quotation Number</Label>
                      <Input value={quotationNumber} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Date *</Label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Validity Date</Label>
                    <Input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Note</Label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Quotation Total:</span>
                      <span className="text-2xl font-bold text-purple-600">
                        ₹{quotationTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------- CLIENT TAB ---------- */}
            <TabsContent value="client" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Client Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Client Name *</Label>
                    <div className="flex gap-2">
                      <OwnSearchableSelect
                        options={clientOptions}
                        value={selectedClientId}
                        onValueChange={setSelectedClientId}
                        placeholder="Search client..."
                      />
                      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon"><UserPlus className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Client</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Client Name *</Label>
                              <Input
                                value={newClient.clientName}
                                onChange={(e) => setNewClient({ ...newClient, clientName: e.target.value })}
                                placeholder="Enter name"
                              />
                              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                            </div>
                            <div>
                              <Label>Email *</Label>
                              <Input
                                type="email"
                                value={newClient.email}
                                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                placeholder="client@example.com"
                              />
                              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                            </div>
                            <div>
                              <Label>Phone *</Label>
                              <Input
                                value={newClient.phone}
                                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                placeholder="9876543210"
                              />
                              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                            </div>
                            <div>
                              <Label>Address *</Label>
                              <Textarea
                                value={newClient.address}
                                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                                rows={2}
                              />
                              {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateClient}>Create</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div>
                    <Label>Address *</Label>
                    <Textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={2} className="bg-gray-50" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Number *</Label>
                      <Input value={clientContact} onChange={(e) => setClientContact(e.target.value)} className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="bg-gray-50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------- ITEMS TAB ---------- */}
            <TabsContent value="items" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Items/Services</CardTitle>
                    <Button onClick={addItem} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Item {idx + 1}</h4>
                          {items.length > 1 && (
                            <Button onClick={() => removeItem(item.id)} size="sm" variant="outline" className="text-red-600">
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label>Type *</Label>
                            <Select value={item.type} onValueChange={(v: "product" | "service") => updateItem(item.id, "type", v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product">Product</SelectItem>
                                <SelectItem value="service">Service</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Item Name *</Label>
                            <OwnSearchableSelect
                              options={masterItems
                                .filter((m) => m.type === item.type)
                                .map((m) => ({ value: m.name, label: m.name }))}
                              value={item.itemName}
                              onValueChange={(v) => updateItem(item.id, "itemName", v)}
                              placeholder="Search item..."
                            />
                          </div>

                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={item.description}
                              onChange={(e) => updateItem(item.id, "description", e.target.value)}
                              rows={2}
                              className="bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Quantity *</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value) || 0)}
                                min={1}
                                className="bg-white"
                              />
                            </div>
                            <div>
                              <Label>Price *</Label>
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) => updateItem(item.id, "price", Number(e.target.value) || 0)}
                                step="0.01"
                                className="bg-white"
                              />
                            </div>
                            <div>
                              <Label>Discount</Label>
                              <Input
                                type="number"
                                value={item.discount}
                                onChange={(e) => updateItem(item.id, "discount", Number(e.target.value) || 0)}
                                step="0.01"
                                className="bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div><Label>CGST (%)</Label><Input value={item.cgst} disabled className="bg-gray-100" /></div>
                            <div><Label>SGST (%)</Label><Input value={item.sgst} disabled className="bg-gray-100" /></div>
                            <div><Label>IGST (%)</Label><Input value={item.igst} disabled className="bg-gray-100" /></div>
                          </div>

                          <div className="pt-3 border-t space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tax:</span>
                              <span className="font-medium">₹{item.taxAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span className="text-purple-600">₹{item.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ---------- SUMMARY SIDEBAR ---------- */}
        <div>
          <Card className="sticky top-6">
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {items.map(
                (it, i) =>
                  it.itemName && (
                    <div key={it.id} className="pb-2 border-b">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Item {i + 1}:</span>
                        <span className="font-medium">₹{it.total.toLocaleString()}</span>
                      </div>
                    </div>
                  )
              )}
              <div className="pt-2 border-t-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total:</span>
                  <span className="text-purple-600">₹{quotationTotal.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---------- FIXED FOOTER ---------- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard/quotations">
            <Button variant="outline">Cancel</Button>
          </Link>

          <div className="flex gap-3">
            {!isLast ? (
              <Button onClick={handleContinue} size="lg" className="min-w-[200px]">
                Continue to {tabs[curIdx + 1] === "client" ? "Client Details" : "Items/Services"}
              </Button>
            ) : (
              <>
               
                <Button onClick={() => handleSave("sent")} size="lg" className="min-w-[200px]">
                  <Send className="h-4 w-4 mr-2" />Update Quotation
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}