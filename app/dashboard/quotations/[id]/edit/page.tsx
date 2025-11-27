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
import { ArrowLeft, Plus, Minus, Send, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "@/lib/toast"
import { api } from "@/lib/api-client"
import { OwnSearchableSelect } from "@/components/searchableSelect"

export default function EditQuotationPage() {
  const router = useRouter()
  const { id: quotationId } = useParams() as { id: string }

  /* ---------------- GLOBAL STATE ---------------- */
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

  const [clients, setClients] = useState<any[]>([])
  const [masterItems, setMasterItems] = useState<any[]>([])
  const [paidAmount, setPaidAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [activeTab, setActiveTab] = useState("client")

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

  const [items, setItems] = useState<QuotationItem[]>([])

  /* ---------------- ITEM CALCULATION ---------------- */
  const recalcItem = (item: QuotationItem): QuotationItem => {
    const amount = (item.price - item.discount) * item.quantity
    const taxAmount = (amount * item.taxRate) / 100
    const total = amount + taxAmount

    return { ...item, amount, taxAmount, total }
  }

  /* ---------------- LOAD SUPPORTING DATA ---------------- */
  const loadSupportingData = useCallback(async () => {
    const [loadedClients, loadedItems] = await Promise.all([
      api.clients.getAll(),
      api.items.getAll(),
    ])

    // only active items + active clients
    setClients(loadedClients.filter((c: any) => c.status === "active"))
    setMasterItems(loadedItems.filter((i: any) => i.isActive))
  }, [])

  /* ---------------- LOAD EXISTING QUOTATION ---------------- */
  const loadQuotation = useCallback(async () => {
    try {
      const data = await api.quotations.getById(quotationId)

      setQuotationNumber(data.quotationNumber ?? "")
      setDate(data.date ?? "")
      setValidityDate(data.validity ?? "")
      setNote(data.note ?? "")
      setPaidAmount(data.paidAmount ?? 0)
      setBalanceAmount(data.balanceAmount ?? 0)
      setSelectedClientId(data.clientId ?? "")
      setClientName(data.clientName ?? "")
      setClientAddress(data.clientAddress ?? "")
      setClientContact(data.clientContact ?? "")
      setClientEmail(data.clientEmail ?? "")

      const rawItems = (data.items || []).map((i: any, idx: number) => ({
        id: String(Date.now() + idx),
        type: i.type,
        itemName: i.itemName,
        description: i.description ?? "",
        quantity: i.quantity,
        price: i.price,
        discount: i.discount ?? 0,
        cgst: i.cgst ?? 0,
        sgst: i.sgst ?? 0,
        igst: i.igst ?? 0,
        taxRate: (i.cgst ?? 0) + (i.sgst ?? 0) + (i.igst ?? 0),
        taxName:
          (i.cgst + i.sgst + i.igst) > 0
            ? `CGST+SGST+IGST (${(i.cgst + i.sgst + i.igst)}%)`
            : "",
        itemId: i.itemId ?? "",
        amount: 0,
        taxAmount: 0,
        total: 0,
      }))

      const recalculated = rawItems.map((item) => recalcItem(item))
      setItems(recalculated)
    } catch (err) {
      console.error("Failed to load quotation:", err)
      toast.error("Could not load quotation")
    } finally {
      setLoading(false)
    }
  }, [quotationId])

  /* ---------------- INIT LOAD ---------------- */
  useEffect(() => {
    loadSupportingData()
    loadQuotation()
  }, [loadSupportingData, loadQuotation])

  /* ---------------- AUTO-FILL CLIENT DETAILS ---------------- */
  useEffect(() => {
    if (selectedClientId && clients.length) {
      const client = clients.find((c: any) => c._id === selectedClientId)
      if (client) {
        setClientName(client.name || client.companyName || client.clientName || "")
        setClientAddress(client.address)
        setClientContact(client.phone)
        setClientEmail(client.email)
      }
    }
  }, [selectedClientId, clients])

  /* ---------------- ITEM HELPERS ---------------- */
  const addItem = () => {
    const newItem: QuotationItem = {
      id: String(Date.now()),
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
      prev.map((item) => {
        if (item.id !== id) return item

        let updated = { ...item, [field]: value }

        // Reset item when type changes
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

        // Auto-fill on itemName change
        if (field === "itemName" && value) {
          const master = masterItems.find(
            (m: any) => m.name === value && m.type === updated.type
          )
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

        const taxRate = updated.cgst + updated.sgst + updated.igst
        updated.taxRate = taxRate
        updated.taxName = taxRate > 0 ? `CGST+SGST+IGST (${taxRate}%)` : ""

        return recalcItem(updated)
      })
    )
  }

  const quotationTotal = items.reduce((sum, i) => sum + i.total, 0)
  /* ---------------- TAB ORDER ---------------- */
  const tabs = ["client", "items", "quotation"]
  const currentTabIndex = tabs.indexOf(activeTab)
  const isLastTab = currentTabIndex === tabs.length - 1

  const handleContinue = () => {
    if (activeTab === "client") {
      if (!selectedClientId) {
        toast.error("Please select a client before continuing.")
        return
      }
    }

    if (activeTab === "quotation") {
      if (!date) {
        toast.error("Please select quotation date")
        return
      }
    }

    if (!isLastTab) {
      setActiveTab(tabs[currentTabIndex + 1])
    }
  }

/* ---------------- SAVE HANDLER ---------------- */
async function handleSave() {
  if (!selectedClientId) {
    toast.error("Please select a client.")
    return
  }

  if (!date) {
    toast.error("Please select quotation date.")
    return
  }

  if (items.length === 0) {
    toast.error("Please add at least one item.")
    return
  }

  for (const item of items) {
    if (!item.itemName.trim()) {
      toast.error("Item name cannot be empty.")
      return
    }
    if (!item.quantity || item.quantity <= 0) {
      toast.error("Quantity must be at least 1.")
      return
    }
    if (!item.price || item.price <= 0) {
      toast.error("Price must be greater than 0.")
      return
    }
  }

  // Prepare payload identical to new quotation but updates only
  const payload = {
    date,
    validity: validityDate,
    note,
    clientId: selectedClientId,
    clientName,
    clientEmail,
    clientAddress,
    clientContact,
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
    paidAmount: paidAmount,
    balanceAmount: quotationTotal - paidAmount,
    status: "pending",
  }

  try {
    await api.quotations.update(quotationId, payload)
    toast.success("Quotation updated successfully!")
    router.push("/dashboard/quotations")
  } catch (err) {
    console.error("Update failed:", err)
    toast.error("Failed to update quotation")
  }
}
  /* ---------- CLIENT DROPDOWN OPTIONS ---------- */
  const clientOptions = clients.map((c: any) => ({
    value: c._id,
    label: c.name || c.companyName || c.clientName || "Unnamed",
  }))


  /* ---------------- RENDER ---------------- */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* HEADER */}
      <div className="flex items-center justify-start">
        <div className="mr-5">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Quotation/Agreement</h1>
          <p className="text-gray-600">
            Update quotation #{quotationNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2/3 - MAIN FORM */}
        <div className="lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="client">Client Details</TabsTrigger>
              <TabsTrigger value="items">Items/Services</TabsTrigger>
              <TabsTrigger value="quotation">Quotation/Agreement Details</TabsTrigger>
            </TabsList>

            {/* ---------------- CLIENT TAB ---------------- */}
            <TabsContent value="client" className="mt-6">
              <Card>
                <CardContent className="space-y-6 pt-6">
                  {/* CLIENT SELECT */}
                  <div>
                    <Label className="font-medium">Client *</Label>

                    <OwnSearchableSelect
                      options={clientOptions}
                      value={selectedClientId}
                      onValueChange={setSelectedClientId}
                      placeholder="Search client..."
                      searchPlaceholder="Type to filter..."
                      emptyText="No clients found"
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      Select an existing client. Editing client details is not allowed here.
                    </p>
                  </div>

                  {/* ADDRESS */}
                  <div>
                    <Label>Address</Label>
                    <Textarea
                      value={clientAddress}
                      disabled
                      rows={2}
                      className="bg-gray-100"
                    />
                  </div>

                  {/* CONTACT + EMAIL */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Number</Label>
                      <Input
                        value={clientContact}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>

                    <div>
                      <Label>Email</Label>
                      <Input
                        value={clientEmail}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------------- ITEMS TAB ---------------- */}
            <TabsContent value="items" className="mt-6">
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
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          {items.length > 1 && (
                            <Button
                              onClick={() => removeItem(item.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {/* TYPE */}
                          <div>
                            <Label>Type *</Label>
                            <Select
                              value={item.type}
                              onValueChange={(v: "product" | "service") =>
                                updateItem(item.id, "type", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product">Product</SelectItem>
                                <SelectItem value="service">Service</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* ITEM NAME */}
                          <div>
                            <Label>Item Name *</Label>

                            <OwnSearchableSelect
                              options={masterItems
                                .filter(
                                  (m: any) =>
                                    m.type === item.type && m.isActive === true
                                )
                                .map((m: any) => ({
                                  value: m.name,
                                  label: m.name,
                                }))}
                              value={item.itemName}
                              onValueChange={(v) =>
                                updateItem(item.id, "itemName", v)
                              }
                              placeholder="Search item..."
                            />

                            <p className="text-xs text-gray-500 mt-1">
                              Showing active {item.type}s only
                            </p>
                          </div>

                          {/* DESCRIPTION */}
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={item.description}
                              onChange={(e) =>
                                updateItem(item.id, "description", e.target.value)
                              }
                              rows={2}
                              className="bg-white"
                            />
                          </div>

                          {/* PRICE / DISCOUNT / QTY */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Quantity *</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "quantity",
                                    Number(e.target.value) || 0
                                  )
                                }
                                min={1}
                                className="bg-white"
                              />
                            </div>

                            <div>
                              <Label>Price *</Label>
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "price",
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="bg-white"
                              />
                            </div>

                            <div>
                              <Label>Discount</Label>
                              <Input
                                type="number"
                                value={item.discount}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "discount",
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="bg-white"
                              />
                            </div>
                          </div>

                          {/* TAXES */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>CGST (%)</Label>
                              <Input disabled value={item.cgst} />
                            </div>
                            <div>
                              <Label>SGST (%)</Label>
                              <Input disabled value={item.sgst} />
                            </div>
                            <div>
                              <Label>IGST (%)</Label>
                              <Input disabled value={item.igst} />
                            </div>
                          </div>

                          {/* TOTALS */}
                          <div className="pt-3 border-t space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-medium">
                                ₹{item.amount.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Tax Amount:
                              </span>
                              <span className="font-medium">
                                ₹{item.taxAmount.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span className="text-purple-600">
                                ₹{item.total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------------- QUOTATION DETAILS TAB ---------------- */}
            <TabsContent value="quotation" className="mt-6">
              <Card>
                <CardHeader>
                  {/* <CardTitle>Quotation/Agreement Details</CardTitle> */}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* QUOTATION NUMBER */}
                    <div>
                      <Label>Quotation/Agreement Number *</Label>
                      <Input
                        value={quotationNumber}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-generated by system
                      </p>
                    </div>

                    {/* DATE */}
                    <div>
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* VALIDITY DATE */}
                  <div>
                    <Label>Validity Date</Label>
                    <Input
                      type="date"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                    />
                  </div>

                  {/* NOTE */}
                  <div>
                    <Label>Note</Label>
                    <Textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        {/* ---------------- SUMMARY SIDEBAR ---------------- */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {items.map(
                (it, i) =>
                  it.itemName && (
                    <div key={it.id} className="pb-2 border-b">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Item {i + 1}:</span>
                        <span className="font-medium">
                          ₹{it.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
              )}

              <div className="pt-2 border-t-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total:</span>
                  <span className="text-purple-600">
                    ₹{quotationTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---------------- FIXED FOOTER ---------------- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>

          <div className="flex gap-3">
            {!isLastTab ? (
              <Button
                onClick={handleContinue}
                size="lg"
                className="min-w-[200px]"
              >
                Continue to Next Step
              </Button>
            ) : (
              <Button
                size="lg"
                className="min-w-[200px]"
                onClick={() => handleSave()}
              >
                <Send className="h-4 w-4 mr-2" />
                Update Quotation/Agreement
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
