"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Minus, Save, Send, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { SearchableSelect } from "@/components/searchable-select"

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
}

interface Client {
  id: string
  clientNumber: string
  clientName: string
  address: string
  phone: string
  email: string
  name?: string // Added name field for fallback
}

interface MasterItem {
  id: string
  type: "product" | "service"
  itemName: string
  description: string
  price: number
  taxName: string
  taxRate: number
}

export default function NewQuotationPage() {
  const router = useRouter()

  const [quotationNumber, setQuotationNumber] = useState(
    `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
  )
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [validityDate, setValidityDate] = useState("")
  const [note, setNote] = useState("")

  const [selectedClientId, setSelectedClientId] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [clientContact, setClientContact] = useState("")
  const [clientEmail, setClientEmail] = useState("")

  const [clients, setClients] = useState<Client[]>([])
  const [masterItems, setMasterItems] = useState<MasterItem[]>([])

  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: "1",
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
    },
  ])

  const [activeTab, setActiveTab] = useState("quotation")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    clientName: "",
    email: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    const loadData = async () => {
      const loadedClients = await api.clients.getAll()
      const loadedItems = await api.items.getAll()
      setClients(loadedClients)
      setMasterItems(loadedItems)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId)
      if (client) {
        setClientName(client.clientName || client.name)
        setClientAddress(client.address)
        setClientContact(client.phone)
        setClientEmail(client.email)
      }
    }
  }, [selectedClientId, clients])

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
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof QuotationItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          if (field === "type") {
            updatedItem.itemName = ""
            updatedItem.description = ""
            updatedItem.price = 0
            updatedItem.taxName = ""
            updatedItem.taxRate = 0
          }

          if (field === "itemName") {
            const masterItem = masterItems.find((i) => i.itemName === value)
            if (masterItem) {
              updatedItem.description = masterItem.description
              updatedItem.price = masterItem.price
              updatedItem.taxName = masterItem.taxName
              updatedItem.taxRate = masterItem.taxRate
            }
          }

          updatedItem.amount = (updatedItem.price - updatedItem.discount) * updatedItem.quantity
          updatedItem.taxAmount = (updatedItem.amount * updatedItem.taxRate) / 100
          updatedItem.total = updatedItem.amount + updatedItem.taxAmount

          return updatedItem
        }
        return item
      }),
    )
  }

  const quotationTotal = items.reduce((sum, item) => sum + item.total, 0)

  const handleSave = (status: "draft" | "sent") => {
    console.log("[v0] Saving quotation with status:", status)

    try {
      const quotationData = {
        date,
        validity: validityDate,
        note,
        clientName,
        clientEmail,
        clientAddress,
        clientContact,
        items: items.map((item) => ({
          type: item.type,
          itemName: item.itemName,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          taxName: item.taxName,
          taxRate: item.taxRate,
        })),
        grandTotal: quotationTotal,
        status: status === "sent" ? "pending" : "draft",
      }

      console.log("[v0] Creating quotation:", quotationData)
      const createdQuotation = api.quotations.create(quotationData)
      console.log("[v0] Quotation created successfully:", createdQuotation)

      toast.success(`Quotation ${status === "sent" ? "sent" : "saved as draft"} successfully!`)
      router.push("/dashboard/quotations")
    } catch (error) {
      console.error("[v0] Error saving quotation:", error)
      toast.error("Failed to save quotation. Please try again.")
    }
  }

  const handleCreateClient = async () => {
    const newClientData = await api.clients.create( {
      clientName: newClient.clientName,
      email: newClient.email,
      phone: newClient.phone,
      address: newClient.address,
    })

    setClients([...clients, newClientData])
    setSelectedClientId(newClientData.id)
    setIsCreateDialogOpen(false)
    setNewClient({ clientName: "", email: "", phone: "", address: "" })
  }

  const tabs = ["quotation", "client", "items"]
  const currentTabIndex = tabs.indexOf(activeTab)
  const isLastTab = currentTabIndex === tabs.length - 1

  const handleContinue = () => {
    if (!isLastTab) {
      setActiveTab(tabs[currentTabIndex + 1])
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Quotation</h1>
          <p className="text-gray-600">Create a new quotation for your client</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleSave("draft")}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave("sent")}>
            <Send className="h-4 w-4 mr-2" />
            Send Quotation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quotation">Quotation Details</TabsTrigger>
              <TabsTrigger value="client">Client Details</TabsTrigger>
              <TabsTrigger value="items">Items/Services</TabsTrigger>
            </TabsList>

            <TabsContent value="quotation" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quotation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quotationNumber">Quotation Number *</Label>
                      <Input id="quotationNumber" value={quotationNumber} disabled className="bg-gray-50" />
                      <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                    </div>
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                      <p className="text-xs text-gray-500 mt-1">Default system date</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="validityDate">Validity Date</Label>
                    <Input
                      id="validityDate"
                      type="date"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add any additional notes or terms"
                      rows={3}
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Quotation Total:</span>
                      <span className="text-2xl font-bold text-purple-600">₹{quotationTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="client" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="clientSelect">Client Name *</Label>
                    <div className="flex gap-2">
                      <SearchableSelect
                        options={clients.map((client) => ({
                          value: client.id,
                          label: client.clientName || client.name,
                        }))}
                        value={selectedClientId}
                        onValueChange={setSelectedClientId}
                        placeholder="Search and select a client..."
                        searchPlaceholder="Type to search clients..."
                        emptyText="No clients found."
                      />

                      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                              <Input
                                id="newClientName"
                                value={newClient.clientName}
                                onChange={(e) => setNewClient({ ...newClient, clientName: e.target.value })}
                                placeholder="Enter client name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="newClientEmail">Email</Label>
                              <Input
                                id="newClientEmail"
                                type="email"
                                value={newClient.email}
                                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                placeholder="client@example.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor="newClientPhone">Phone *</Label>
                              <Input
                                id="newClientPhone"
                                value={newClient.phone}
                                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                            <div>
                              <Label htmlFor="newClientAddress">Address</Label>
                              <Textarea
                                id="newClientAddress"
                                value={newClient.address}
                                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                                placeholder="Enter client address"
                                rows={2}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="button" onClick={handleCreateClient}>
                              Create Client
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Search by name, email, or phone</p>
                  </div>
                  <div>
                    <Label htmlFor="clientAddress">Address *</Label>
                    <Textarea
                      id="clientAddress"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Client address"
                      rows={2}
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populated from client record</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientContact">Contact Number *</Label>
                      <Input
                        id="clientContact"
                        value={clientContact}
                        onChange={(e) => setClientContact(e.target.value)}
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientEmail">Email *</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

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
                      <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          {items.length > 1 && (
                            <Button
                              onClick={() => removeItem(item.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>Type *</Label>
                            <Select
                              value={item.type}
                              onValueChange={(value: "product" | "service") => updateItem(item.id, "type", value)}
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

                          <div>
                            <Label>Item Name *</Label>
                            <SearchableSelect
                              options={masterItems
                                .filter((masterItem) => masterItem.type === item.type)
                                .map((masterItem) => ({
                                  value: masterItem.itemName,
                                  label: masterItem.itemName,
                                }))}
                              value={item.itemName}
                              onValueChange={(value) => updateItem(item.id, "itemName", value)}
                              placeholder="Search and select an item..."
                              searchPlaceholder="Type to search items..."
                              emptyText={`No ${item.type === "product" ? "products" : "services"} found.`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Showing {item.type === "product" ? "products" : "services"} only
                            </p>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={item.description}
                              onChange={(e) => updateItem(item.id, "description", e.target.value)}
                              placeholder="Item description"
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
                                onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                                min="1"
                                className="bg-white"
                              />
                            </div>
                            <div>
                              <Label>Price *</Label>
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) => updateItem(item.id, "price", Number.parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="bg-white"
                              />
                            </div>
                            <div>
                              <Label>Discount *</Label>
                              <Input
                                type="number"
                                value={item.discount}
                                onChange={(e) =>
                                  updateItem(item.id, "discount", Number.parseFloat(e.target.value) || 0)
                                }
                                min="0"
                                step="0.01"
                                placeholder="0"
                                className="bg-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Tax Name</Label>
                              <Input
                                value={item.taxName}
                                onChange={(e) => updateItem(item.id, "taxName", e.target.value)}
                                placeholder="e.g., GST"
                                className="bg-gray-100"
                              />
                            </div>
                            <div>
                              <Label>Tax Rate (%)</Label>
                              <Input
                                type="number"
                                value={item.taxRate}
                                onChange={(e) => updateItem(item.id, "taxRate", Number.parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="bg-gray-100"
                              />
                            </div>
                          </div>
                          <div className="pt-3 border-t space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tax Amount:</span>
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

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map(
                (item, index) =>
                  item.itemName && (
                    <div key={item.id} className="pb-2 border-b">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Item {index + 1}:</span>
                        <span className="font-medium">₹{item.total.toLocaleString()}</span>
                      </div>
                    </div>
                  ),
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

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard/quotations">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <div className="flex gap-3">
            {!isLastTab ? (
              <Button onClick={handleContinue} size="lg" className="min-w-[200px]">
                Continue to {tabs[currentTabIndex + 1] === "client" ? "Client Details" : "Items/Services"}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleSave("draft")} size="lg">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={() => handleSave("sent")} size="lg" className="min-w-[200px]">
                  <Send className="h-4 w-4 mr-2" />
                  Create Quotation
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
