
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
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api-client"
import { OwnSearchableSelect } from "@/components/searchableSelect"
import dynamic from "next/dynamic"
import { TaxRate, QuotationItem, SalesInvoice } from "@/lib/models/types"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })
import "react-quill/dist/quill.snow.css"

export default function EditSalesInvoicePage() {
  const router = useRouter()
  const { id: invoiceId } = useParams() as { id: string }
  const { toast } = useToast()

  /* ---------------- GLOBAL STATE ---------------- */
  const [loading, setLoading] = useState(true)

  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [quotationNumber, setQuotationNumber] = useState("")
  const [date, setDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [terms, setTerms] = useState("")
  const [description, setDescription] = useState("")
  const [createdBy, setCreatedBy] = useState("")

  const [selectedClientId, setSelectedClientId] = useState("")

  const [clientName, setClientName] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [clientContact, setClientContact] = useState("")
  const [clientEmail, setClientEmail] = useState("")

  const [clients, setClients] = useState<any[]>([])
  const [masterItems, setMasterItems] = useState<any[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [paidAmount, setPaidAmount] = useState(0)
  const [balanceAmount, setBalanceAmount] = useState(0)
  const [activeTab, setActiveTab] = useState("client")
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null)

  interface InvoiceItem {
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
    // Logic adapted for Sales Invoice: Discount is typically total for the line in this module
    const baseAmount = item.price - item.discount
    const discountedAmount = baseAmount * item.quantity
    const taxRate = (item.cgst + item.sgst + item.igst) || 0
    const taxAmount = discountedAmount * taxRate / 100
    const total = discountedAmount + taxAmount || item.total

    return { ...item, amount: discountedAmount, taxAmount, total }
  }

  /* ---------------- LOAD SUPPORTING DATA ---------------- */
  const loadSupportingData = useCallback(async () => {
    try {
      const [loadedClients, loadedItems, loadedTaxRates, bankAccountsData] = await Promise.all([
        api.clients.getAll(),
        api.items.getAll(),
        api.taxRates.getAll(),
        api.bankAccounts.getAll(),
      ])

      setClients(loadedClients.filter((c: any) => c.status === "active"))
      setMasterItems(loadedItems.filter((i: any) => i.isActive))
      setTaxRates(loadedTaxRates || [])
      setBankAccounts(bankAccountsData.filter((b: any) => b.isActive))
    } catch (error) {
      console.error("Failed to load supporting data", error)
      toast({ title: "Error", description: "Failed to load clients or items", variant: "destructive" })
    }
  }, [toast])

  /* ---------------- LOAD EXISTING INVOICE ---------------- */
  const loadInvoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/salesInvoice/${invoiceId}`)
      const result = await res.json()
      const termsRes = await fetch("/api/terms?type=invoice").then((res) => res.json())
      if (!result.success) throw new Error(result.error)
      const data = result.data
      if (termsRes) {
        const termsData = termsRes
        const formattedTerms = termsData
          .filter((t: any) => t.isActive)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          .map((t: any) => (t.title ? `<p><strong>${t.title}</strong></p>${t.content}` : t.content))
          .join("")
        console.log("terms from api ", formattedTerms)
        setTerms(data?.terms || formattedTerms)

      }
      console.log("terms from db ", data.terms)

      setInvoiceNumber(data.salesInvoiceNumber ?? "")
      setQuotationNumber(data.quotationNumber ?? "")
      setDate(data.date ? new Date(data.date).toISOString().split("T")[0] : "")
      setDueDate(data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : "")
      setPaidAmount(data.paidAmount ?? 0)
      setBalanceAmount(data.balanceAmount ?? 0)
      setSelectedClientId(data.clientId ?? "")
      setClientName(data.clientName ?? "")
      setClientAddress(data.clientAddress ?? "")
      setClientContact(data.clientPhone ?? "")
      setClientEmail(data.clientEmail ?? "")
      setDescription(data.description ?? "")
      setCreatedBy(data.createdBy ?? "")
      setItems(data.items || [])
      if (data.bankDetails) {
        setSelectedBankAccount(data.bankDetails)
      }

      console.log("items from db ", data.items)
      const rawItems = (data.items || []).map((i: any, idx: number) => {
        const cgst = Number(i.cgst || 0)
        const sgst = Number(i.sgst || 0)
        const igst = Number(i.igst || 0)

        return {
          id: String(Date.now() + idx),
          type: i.type || "product",
          itemName: i.name || i.itemName,
          description: i.description ?? "",
          quantity: Number(i.quantity || 1),
          price: Number(i.price || 0),
          discount: Number(i.discount || 0),

          cgst,
          sgst,
          igst,

          taxRate: cgst + sgst + igst,
          taxName:
            cgst || sgst || igst
              ? [
                cgst ? `CGST (${cgst}%)` : "",
                sgst ? `SGST (${sgst}%)` : "",
                igst ? `IGST (${igst}%)` : "",
              ]
                .filter(Boolean)
                .join(" + ")
              : "",

          itemId: i.itemId ?? "",

          amount: 0,
          taxAmount: 0,
          total: 0,
        }
      })


      const recalculated = rawItems.map((item: any) => {
        const taxRate = item?.taxRate || item.cgst + item.sgst + item.igst
        item.taxName = taxRate > 0 ? `Tax (%)` : ""
        return recalcItem(item)
      })
      // setItems(rawItems.map(recalcItem))
    } catch (err) {
      console.error("Failed to load invoice:", err)
      toast({ title: "Error", description: "Could not load invoice", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [invoiceId, toast])
  useEffect(() => {
    if (!masterItems.length || !items.length) return

    setItems(prev =>
      prev.map(item => {
        const master = masterItems.find(
          m => m.name === item.itemName && m.type === item.type
        )

        if (!master) return item

        const updated = {
          ...item,
          description: master.description ?? item.description,
          price: master.price ?? item.price,
        }

        return recalcItem(updated)
      })
    )
  }, [masterItems])

  /* ---------------- INIT LOAD ---------------- */
  useEffect(() => {
    loadSupportingData()
    loadInvoice()
  }, [loadSupportingData, loadInvoice])

  /* ---------------- AUTO-FILL CLIENT DETAILS ---------------- */
  useEffect(() => {
    if (selectedClientId && clients.length) {
      const client = clients.find((c: any) => c._id === selectedClientId)
      if (client) {
        setClientName(client.name || client.companyName || client.clientName || "")
        setClientAddress(`${client.address}, ${client.city}, ${client.state}, ${client.pincode}`)
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
        if (item.itemId !== id) return item

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

        const taxRate = (Number(updated.cgst) || 0) + (Number(updated.sgst) || 0) + (Number(updated.igst) || 0)
        updated.taxRate = taxRate

        const taxParts = []
        if (updated.cgst) taxParts.push(`CGST (${updated.cgst}%)`)
        if (updated.sgst) taxParts.push(`SGST (${updated.sgst}%)`)
        if (updated.igst) taxParts.push(`IGST (${updated.igst}%)`)
        updated.taxName = taxParts.length > 0 ? taxParts.join(" + ") : ""

        return recalcItem(updated)
      })
    )
  }

  const invoiceTotal = items.reduce((sum, i) => sum + i.total, 0)
  const subTotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0) // Gross subtotal
  const totalDiscount = items.reduce((sum, i) => sum + (i.discount * i.quantity), 0)
  const totalTax = items.reduce((sum, i) => sum + (i?.taxAmount || 0), 0)

  /* ---------------- TAB ORDER ---------------- */
  const tabs = ["client", "items", "invoice"]
  const currentTabIndex = tabs.indexOf(activeTab)
  const isLastTab = currentTabIndex === tabs.length - 1

  const handleContinue = () => {
    if (activeTab === "client") {
      if (!selectedClientId) {
        toast({ title: "Error", description: "Please select a client before continuing.", variant: "destructive" })
        return
      }
    }

    if (activeTab === "invoice") {
      if (!date) {
        toast({ title: "Error", description: "Please select invoice date", variant: "destructive" })
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
      toast({ title: "Error", description: "Please select a client.", variant: "destructive" })
      return
    }

    if (!date) {
      toast({ title: "Error", description: "Please select invoice date.", variant: "destructive" })
      return
    }

    if (items.length === 0) {
      toast({ title: "Error", description: "Please add at least one item.", variant: "destructive" })
      return
    }

    for (const item of items) {
      if (!item.itemName.trim()) {
        toast({ title: "Error", description: "Item name cannot be empty.", variant: "destructive" })
        return
      }
      if (!item.quantity || item.quantity <= 0) {
        toast({ title: "Error", description: "Quantity must be at least 1.", variant: "destructive" })
        return
      }
      if (!item.price || item.price <= 0) {
        toast({ title: "Error", description: "Price must be greater than 0.", variant: "destructive" })
        return
      }
      if (!selectedBankAccount) {
        toast({
          title: "Bank Required",
          description: "Please select a bank account",
          variant: "destructive",
        })
        return
      }

    }

    const payload = {
      date: new Date(date).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      terms,
      description,
      clientId: selectedClientId,
      clientName,
      clientEmail,
      clientAddress,
      clientPhone: clientContact,
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
        taxRate: i.taxRate,
        taxName: i.taxName,
        taxAmount: i.taxAmount,
        amount: i.amount,
        itemId: i.itemId,
        total: i.total
      })),
      subtotal: subTotal,
      taxAmount: totalTax,
      grandTotal: invoiceTotal,
      balanceAmount: invoiceTotal - paidAmount,
      bankDetails: selectedBankAccount,
    }

    try {
      const res = await fetch(`/api/salesInvoice/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      toast({ title: "Success", description: "Invoice updated successfully!" })
      router.push("/dashboard/salesInvoices")
    } catch (err) {
      console.error("Update failed:", err)
      toast({ title: "Error", description: "Failed to update invoice", variant: "destructive" })
    }
  }

  const clientOptions = clients.map((c: any) => ({
    value: c._id,
    label: c.name || c.companyName || c.clientName || "Unnamed",
  }))

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
          <h1 className="text-2xl font-bold text-gray-900">Edit Sales Invoice</h1>
          <p className="text-gray-600">
            Update invoice #{invoiceNumber}
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
              <TabsTrigger value="invoice">Invoice Details</TabsTrigger>
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
                      emptyText="No clients found. Create a client first."
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      Select an existing client. Editing client details is not allowed here.
                    </p>
                  </div>

                  {/* ADDRESS */}
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={`${clientAddress}` || ""}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>

                  {/* CONTACT  EMAIL */}
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
                        key={item.itemId}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          {items.length > 1 && (
                            <Button
                              onClick={() => removeItem(item.itemId)}
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
                                updateItem(item.itemId, "type", v)
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
                                updateItem(item.itemId, "itemName", v)
                              }
                              placeholder="Search item..."
                              emptyText="No items found. Create one first."
                            />

                            <p className="text-xs text-gray-500 mt-1">
                              Showing active {item.type}s only
                            </p>
                          </div>

                          {/* DESCRIPTION */}
                          {/* <div>
                            <Label>Description</Label>
                            <Textarea
                              value={item.description}
                              onChange={(e) =>
                                updateItem(item.id, "description", e.target.value)
                              }
                              rows={2}
                              className="bg-white"
                            />
                          </div> */}

                          {/* PRICE / DISCOUNT / QTY */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Quantity *</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(
                                    item.itemId,
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
                                    item.itemId,
                                    "price",
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="bg-white"
                              />
                            </div>

                            <div>
                              <Label>Discount (Total)</Label>
                              <Input
                                type="number"
                                value={item.discount}
                                onChange={(e) =>
                                  updateItem(
                                    item.itemId,
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
                              <Select
                                value={String(item.cgst || 0)}
                                onValueChange={(v) => updateItem(item.itemId, "cgst", Number(v))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select CGST" />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* <SelectItem value="0">0%</SelectItem> */}
                                  {taxRates
                                    .filter((r) => r.type === "CGST" && r.isActive)
                                    .map((r) => (
                                      <SelectItem key={r.id || String(r._id)} value={String(r.rate)}>{r.rate}%</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>SGST (%)</Label>
                              <Select
                                value={String(item.sgst || 0)}
                                onValueChange={(v) => updateItem(item.itemId, "sgst", Number(v))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select SGST" />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* <SelectItem value="0">0%</SelectItem> */}
                                  {taxRates
                                    .filter((r) => r.type === "SGST" && r.isActive)
                                    .map((r) => (
                                      <SelectItem key={r.id || String(r._id)} value={String(r.rate)}>{r.rate}%</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>IGST (%)</Label>
                              <Select
                                value={String(item.igst || 0)}
                                onValueChange={(v) => updateItem(item.itemId, "igst", Number(v))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select IGST" />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* <SelectItem value="0">0%</SelectItem> */}
                                  {taxRates
                                    .filter((r) => r.type === "IGST" && r.isActive)
                                    .map((r) => (
                                      <SelectItem key={r.id || String(r._id)} value={String(r.rate)}>{r.rate}%</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* TOTALS */}
                          <div className="pt-3 border-t space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Amount (Excl. Tax):</span>
                              <span className="font-medium">
                                ₹{item?.amount?.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Tax Amount:
                              </span>
                              <span className="font-medium">
                                ₹{item?.taxAmount?.toLocaleString()}
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

            {/* ---------------- INVOICE DETAILS TAB ---------------- */}
            <TabsContent value="invoice" className="mt-6">
              <Card>
                <CardHeader>
                  {/* <CardTitle>Invoice Details</CardTitle> */}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* INVOICE NUMBER */}
                    <div>
                      <Label>Invoice Number *</Label>
                      <Input
                        value={invoiceNumber}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-generated by system
                      </p>
                    </div>

                    {/* DATE */}
                    <div>
                      <Label>Invoice Date *</Label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* DUE DATE */}
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                    {/* CREATED BY */}
                    <div>
                      <Label>Created By</Label>
                      <Input value={createdBy} disabled className="bg-gray-100" />
                    </div>
                  </div>
                  <div>
                    <Label>
                      Bank Account <span className="text-red-500">*</span>
                    </Label>

                    <Select
                      value={selectedBankAccount?._id}
                      onValueChange={(id) => {
                        const bank = bankAccounts.find((b: any) => b._id === id)
                        setSelectedBankAccount(bank)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Bank Account" />
                      </SelectTrigger>

                      <SelectContent className="z-[9999]">
                        {bankAccounts.length !==0 ?(bankAccounts.map((acc: any) => (
                          <SelectItem key={acc._id} value={acc._id}>
                            {acc.bankName}
                          </SelectItem>
                        ))):(
                          <SelectItem value="0">No Bank Account Please Add Bank Account</SelectItem>)}
                      </SelectContent>
                    </Select>

                    {selectedBankAccount && (
                      <div className="border rounded-lg mt-2 p-4 bg-gray-50 text-sm space-y-1">
                        <p><strong>Bank:</strong> {selectedBankAccount.bankName}</p>
                        <p><strong>Account Name:</strong> {selectedBankAccount.accountName}</p>
                        <p><strong>Account Number:</strong> {selectedBankAccount.accountNumber}</p>
                        <p><strong>IFSC:</strong> {selectedBankAccount.ifscCode}</p>
                        <p><strong>Branch:</strong> {selectedBankAccount.branchName}</p>

                        {selectedBankAccount.upiId && (
                          <p><strong>UPI ID:</strong> {selectedBankAccount.upiId}</p>
                        )}

                        {selectedBankAccount.upiScanner && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">UPI QR Code</p>
                            <img
                              src={selectedBankAccount.upiScanner}
                              className="h-40 w-40 object-contain border rounded"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description for the invoice"
                    />
                  </div>

                  {/* QUOTATION REF */}
                  {quotationNumber && (
                    <div>
                      <Label>Quotation Reference</Label>
                      <Input
                        value={quotationNumber}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  )}

                  {/* TERMS */}
                  <div>
                    <Label>Terms & Conditions</Label>
                    <div className="mt-2 [&_.ql-editor]:min-h-[200px]">
                      <ReactQuill
                        theme="snow"
                        value={terms}
                        onChange={setTerms}
                      />
                    </div>
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

              <div className="pt-2 border-t-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span className="text-red-600">- ₹{totalDiscount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>₹{totalTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Grand Total:</span>
                  <span className="text-purple-600">
                    ₹{invoiceTotal.toLocaleString()}
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
                Update Invoice
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
