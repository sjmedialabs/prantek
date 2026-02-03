"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trash2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api-client"
import { Client, Item, Quotation } from "@/lib/models/types"
import { Textarea } from "@/components/ui/textarea"
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })
import "react-quill/dist/quill.snow.css"

export default function NewSalesInvoicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const editId = searchParams.get("id")

  const [activeTab, setActiveTab] = useState("quotation")
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Data
  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [availableTerms, setAvailableTerms] = useState<any[]>([])

  // Scenario 1: From Quotation
  const [selectedQuotationId, setSelectedQuotationId] = useState("")
  const [quotationDetails, setQuotationDetails] = useState<Quotation | null>(null)
  const [terms, setTerms] = useState("")

  // Scenario 2: Direct Invoice
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null)
  const [itemToAdd, setItemToAdd] = useState<string>("")
  const [invoiceItems, setInvoiceItems] = useState<Array<{
    itemId: string
    name: string
    quantity: number
    price: number
    discount: number
    taxRate: number
    total: number
  }>>([])
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    loadData()
    if (editId) {
      loadInvoiceForEdit(editId)
    }
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c._id === selectedClientId)
      setSelectedClientDetails(client || null)
    } else {
      setSelectedClientDetails(null)
    }
  }, [])

  const loadData = async () => {
    try {
      const [clientsData, itemsData, quotationsData] = await Promise.all([
        api.clients.getAll(),
        api.items.getAll(),
        api.quotations.getAll(),
      ])

      setClients(clientsData.filter((c: any) => c.status === "active"))
      setItems(itemsData.filter((i: any) => i.isActive))
      setQuotations(quotationsData.filter((q: any) => q.isActive === "active"))

      // Fetch default terms
           const termsRes = await fetch("/api/terms?type=invoice")
        if (termsRes.ok) {
          const termsData = await termsRes.json()
          const formattedTerms = termsData
            .filter((t: any) => t.isActive)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .map((t: any) => (t.title ? `<p><strong>${t.title}</strong></p>${t.content}` : t.content))
            .join("")
          setTerms(formattedTerms)
        }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({ title: "Error", description: "Failed to load initial data", variant: "destructive" })
    }
  }

  const loadInvoiceForEdit = async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/salesInvoice/${id}`)
      const result = await res.json()
      
      if (result.success) {
        const invoice = result.data
        setIsEditing(true)
        setActiveTab("direct")
        setSelectedClientId(invoice.clientId)
        setInvoiceDate(new Date(invoice.date).toISOString().split("T")[0])
        if (invoice.dueDate) {
          setDueDate(new Date(invoice.dueDate).toISOString().split("T")[0])
        }
        setTerms(invoice.terms || "")
        setInvoiceItems(invoice.items.map((item: any) => ({
          itemId: item.itemId || item._id, // Handle potential difference in ID field
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          taxRate: item.taxRate,
          total: item.total
        })))
      }
    } catch (error) {
      console.error("Error loading invoice for edit:", error)
      toast({ title: "Error", description: "Failed to load invoice details", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Handle Quotation Selection
  const handleQuotationSelect = (quotationId: string) => {
    setSelectedQuotationId(quotationId)
    const quotation = quotations.find(q => q._id === quotationId)
    if (quotation) {
      setQuotationDetails(quotation)
      // if (quotation.terms) {
      //   setTerms(quotation.terms)
      // }
    }
  }

  // const handleTermSelect = (termId: string) => {
  //   const term = availableTerms.find(t => t._id === termId)
  //   if (term) {
  //     setTerms(term.content) // ✅ keep HTML
  //   }
  // }


  // Handle Item Addition for Direct Invoice
  const handleAddItem = () => {
    if (!itemToAdd) return
    const item = items.find(i => i._id === itemToAdd)
    if (!item) return

    const newItem = {
      itemId: item._id!,
      name: item.name,
      quantity: 1,
      price: item.price,
      discount: 0,
      taxRate: (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0),
      total: item.price * (1 + ((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0)) / 100)
    }
    setInvoiceItems([...invoiceItems, newItem])
    setItemToAdd("") // Reset selector
  }

  const handleUpdateItem = (index: number, field: string, value: number) => {
    const updated = [...invoiceItems]
    const item = updated[index]

    if (field === 'quantity') item.quantity = value || 0
    if (field === 'price') item.price = value || 0
    if (field === 'discount') item.discount = value || 0

    // Recalculate total
    const amount = item.quantity * item.price
    const discountedAmount = amount - item.discount
    const tax = discountedAmount * (item.taxRate / 100)
    item.total = discountedAmount + tax

    setInvoiceItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
  }

  const calculateTotals = (itemsList: any[]) => {
    const subtotal = itemsList.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalDiscount = itemsList.reduce((sum, item) => sum + (item.discount || 0), 0);
    const taxAmount = itemsList.reduce((sum, item) => {
      const itemAmount = item.quantity * item.price;
      const discountedAmount = itemAmount - (item.discount || 0);
      return sum + (discountedAmount * item.taxRate / 100);
    }, 0);
    const total = subtotal - totalDiscount + taxAmount;
    return { subtotal, totalDiscount, taxAmount, total };
  }

  // Create Invoice from Quotation
  const handleCreateFromQuotation = async () => {
    if (!quotationDetails) return

    setLoading(true)

    try {
      const payload = {
        ...quotationDetails,

        // 🔑 override / add invoice-only fields
        invoiceType: "quotation",
        sourceQuotationId: quotationDetails._id,
        quotationId: quotationDetails._id,
        date: new Date().toISOString(),
        status: "pending",
        terms,

        // ❌ remove quotation-only fields
        validity: undefined,
        isActive: undefined,
        updatedAt: undefined,
        createdAt: undefined,
        __v: undefined,
      }

      const res = await fetch("/api/salesInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create invoice")
      }

      // Optional but recommended
      await api.quotations.update(quotationDetails._id!, {
        status: "confirmed",
      })

      toast({
        title: "Success",
        description: "Invoice created successfully",
      })

      router.push("/dashboard/salesInvoices")
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update Existing Invoice
  const handleUpdateInvoice = async () => {
    if (!selectedClientId || invoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select client and add items",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const client = clients.find(c => c._id === selectedClientId)
      const directTotals = calculateTotals(invoiceItems)

      const payload = {
        clientId: selectedClientId,
        clientName: client?.name || "",
        clientAddress: client?.address || "",
        clientPhone: client?.phone || "",
        clientEmail: client?.email || "",
        items: invoiceItems,
        subtotal: directTotals.subtotal,
        taxAmount: directTotals.taxAmount,
        grandTotal: directTotals.total,
        balanceAmount: directTotals.total, // Note: This resets balance. In a real app, you might want to preserve payments.
        date: new Date(invoiceDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        terms,
      }

      const res = await fetch(`/api/salesInvoice/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      toast({ title: "Success", description: "Invoice updated successfully" })
      router.push("/dashboard/salesInvoices")
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to update invoice", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Create Direct Invoice
  const handleCreateDirect = async () => {
    if (!selectedClientId || invoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select client and add items",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const client = clients.find(c => c._id === selectedClientId)
      const directTotals = calculateTotals(invoiceItems)

      const payload = {
        invoiceType: "direct",

        // ❌ no quotation fields
        quotationId: undefined,
        quotationNumber: undefined,

        clientId: selectedClientId,
        clientName: client?.name || "",
        clientAddress: client?.address || "",
        clientPhone: client?.phone || "",
        clientEmail: client?.email || "",

        items: invoiceItems.map(item => ({
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          taxRate: item.taxRate,
          total: item.total,
        })),

        subtotal: directTotals.subtotal,
        taxAmount: directTotals.taxAmount,
        grandTotal: directTotals.total,
        balanceAmount: directTotals.total,

        date: new Date(invoiceDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: "pending",
        terms,
      }

      const res = await fetch("/api/salesInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create invoice")
      }

      toast({
        title: "Success",
        description: "Invoice created successfully",
      })

      router.push("/dashboard/salesInvoices")
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const directTotals = calculateTotals(invoiceItems)

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard/salesInvoices")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Sales Invoice" : "Create Sales Invoice"}</CardTitle>
          <CardDescription>{isEditing ? "Update invoice details" : "Create a new invoice from quotation or directly"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quotation" disabled={isEditing}>From Quotation</TabsTrigger>
              <TabsTrigger value="direct">New Invoice</TabsTrigger>
            </TabsList>

            {/* FROM QUOTATION TAB */}
            <TabsContent value="quotation" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label>Select Quotation</Label>
                  <Select value={selectedQuotationId} onValueChange={handleQuotationSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a quotation" />
                    </SelectTrigger>
                    <SelectContent>
                      {quotations.map((q) => (
                        <SelectItem key={q._id} value={q._id!}>
                          {q.quotationNumber} - {q.clientName} - ₹{q.grandTotal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {quotationDetails && (
                  <div className="border rounded-lg p-4 space-y-2 bg-gray-50">
                    <h3 className="font-semibold">Quotation Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Client: {quotationDetails.clientName}</div>
                      <div>Date: {new Date(quotationDetails.date).toLocaleDateString()}</div>
                      <div>Total Amount: ₹{quotationDetails.grandTotal.toLocaleString()}</div>
                      <div>Items: {quotationDetails.items.length}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  {/* <Select onValueChange={handleTermSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms template" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTerms.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}
                  <div className="[&_.ql-editor]:min-h-[150px]">
                    <ReactQuill
                      theme="snow"
                      value={terms}
                      onChange={setTerms}
                      placeholder="Enter terms and conditions..."
                    />
                  </div>

                </div>

                <Button
                  onClick={handleCreateFromQuotation}
                  disabled={!quotationDetails || loading}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </TabsContent>

            {/* DIRECT INVOICE TAB */}
            <TabsContent value="direct" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client *</Label>
                    <Select value={selectedClientId || ""} onValueChange={setSelectedClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c._id} value={c._id!}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-row gap-4">
                  <div>
                    <Label>Invoice Date</Label>
                    <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                  </div>
                                    <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  </div>
                </div>

                {selectedClientDetails && (
                  <Card className="mt-4 bg-slate-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Client Details</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Name:</strong> {selectedClientDetails.name}</p>
                      <p><strong>Email:</strong> {selectedClientDetails.email}</p>
                      <p><strong>Phone:</strong> {selectedClientDetails.phone}</p>
                      <p><strong>Address:</strong> {selectedClientDetails.address}</p>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <Label>Add Items *</Label>
                  <div className="flex gap-2">
                    <Select value={itemToAdd} onValueChange={setItemToAdd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item._id} value={item._id!}>
                            {item.name} - ₹{item.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddItem} variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {invoiceItems.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold">Items</h3>
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex-1 space-y-2">
                          <div className="font-medium">{item.name}</div>
                          <div className="flex gap-2 items-end">
                            <div>
                              <Label className="text-xs font-normal">Quantity</Label>
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-20 h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-normal">Price</Label>
                              <Input
                                type="number"
                                placeholder="Price"
                                value={item.price}
                                onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value) || 0)}
                                className="w-24 h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-normal">Discount (₹)</Label>
                              <Input
                                type="number"
                                placeholder="Discount"
                                value={item.discount}
                                onChange={(e) => handleUpdateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                className="w-24 h-9"
                              />
                            </div>
                            <div className="text-sm flex items-center text-gray-500 pb-2">
                              Tax: {item.taxRate}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-[100px] pt-3">
                          <div className="font-semibold">₹{item.total.toFixed(2)}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="mt-4"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}

                    <div className="border-t pt-4 mt-4 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>₹{directTotals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Discount:</span>
                        <span className="text-red-600">- ₹{directTotals.totalDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>₹{directTotals.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                        <span>Grand Total:</span>
                        <span>₹{directTotals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  {/* <Select onValueChange={handleTermSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms template" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTerms.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}

                  <div className="[&_.ql-editor]:min-h-[150px]">
                    <ReactQuill
                      theme="snow"
                      value={terms}
                      onChange={setTerms}
                      placeholder="Enter terms and conditions..."
                    />
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-4">
                </div>

                <Button
                  onClick={isEditing ? handleUpdateInvoice : handleCreateDirect}
                  disabled={loading || !selectedClientId || invoiceItems.length === 0}
                  className="w-full"
                >
                  {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Invoice" : "Create Invoice")}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
