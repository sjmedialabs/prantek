"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Client, Item, Quotation, Receipt } from "@/lib/models/types"

export default function ReceiptsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Shared state
  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(false)
  
  // Tab state
  const [activeTab, setActiveTab] = useState("quotation")
  
  // Scenario 1: Quotation state
  const [selectedQuotation, setSelectedQuotation] = useState("")
  const [quotationDetails, setQuotationDetails] = useState<Quotation | null>(null)
  
  // Scenario 2: With Items state
  const [scenario2Client, setScenario2Client] = useState("")
  const [scenario2Items, setScenario2Items] = useState<Array<{
    itemId: string
    name: string
    quantity: number
    price: number
    taxRate: number
    total: number
  }>>([])
  const [scenario2PaymentMethod, setScenario2PaymentMethod] = useState("cash")
  const [scenario2AmountPaid, setScenario2AmountPaid] = useState("")
  
  // Scenario 3: Quick Receipt state
  const [scenario3Client, setScenario3Client] = useState("")
  const [scenario3Amount, setScenario3Amount] = useState("")
  const [scenario3AmountPaid, setScenario3AmountPaid] = useState("")
  const [scenario3PaymentMethod, setScenario3PaymentMethod] = useState("cash")
  
  // Dialogs
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  
  // Client form
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gst: ""
  })
  
  // Item form
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    unit: "pcs",
    price: "",
    taxRate: ""
  })

  // Load data
  useEffect(() => {
    loadClients()
    loadItems()
    loadQuotations()
  }, [])

  const loadClients = async () => {
    try {
      const response = await fetch("/api/clients", { credentials: "include" })
      const result = await response.json()
      if (result.success) {
        setClients(result.data)
      }
    } catch (error) {
      console.error("Error loading clients:", error)
    }
  }

  const loadItems = async () => {
    try {
      const response = await fetch("/api/items", { credentials: "include" })
      const result = await response.json()
      if (result.success) {
        setItems(result.data)
      }
    } catch (error) {
      console.error("Error loading items:", error)
    }
  }

  const loadQuotations = async () => {
    try {
      const response = await fetch("/api/quotations", { credentials: "include" })
      const result = await response.json()
      if (result.success) {
        // Only show approved quotations
        setQuotations(result.data.filter((q: Quotation) => q.status === "approved"))
      }
    } catch (error) {
      console.error("Error loading quotations:", error)
    }
  }

  // Create client inline
  const handleCreateClient = async () => {
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient)
      })
      const result = await response.json()
      if (result.success) {
        toast({ title: "Success", description: "Client created successfully" })
        setClients([...clients, result.data])
        setShowClientDialog(false)
        setNewClient({
          name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          gst: ""
        })
        // Auto-select the new client
        if (activeTab === "items") {
          setScenario2Client(result.data._id)
        } else if (activeTab === "quick") {
          setScenario3Client(result.data._id)
        }
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create client", variant: "destructive" })
    }
  }

  // Create item inline
  const handleCreateItem = async () => {
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItem,
          price: parseFloat(newItem.price),
          taxRate: parseFloat(newItem.taxRate)
        })
      })
      const result = await response.json()
      if (result.success) {
        toast({ title: "Success", description: "Item created successfully" })
        setItems([...items, result.data])
        setShowItemDialog(false)
        setNewItem({
          name: "",
          description: "",
          unit: "pcs",
          price: "",
          taxRate: ""
        })
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create item", variant: "destructive" })
    }
  }

  // Scenario 1: Load quotation details
  const handleQuotationSelect = async (quotationId: string) => {
    setSelectedQuotation(quotationId)
    const quotation = quotations.find(q => q._id === quotationId)
    setQuotationDetails(quotation || null)
  }

  // Scenario 1: Create receipt from quotation
  const handleCreateFromQuotation = async () => {
    if (!quotationDetails) return
    
    setLoading(true)
    try {
      const receiptData = {
        receiptType: "quotation",
        quotationId: quotationDetails._id,
        quotationNumber: quotationDetails.quotationNumber,
        clientId: quotationDetails.clientId,
        clientName: quotationDetails.clientName,
        items: quotationDetails.items,
        subtotal: quotationDetails.subtotal,
        taxAmount: quotationDetails.taxAmount,
        total: quotationDetails.total,
        amountPaid: quotationDetails.total,
        balanceAmount: 0,
        paymentType: "full",
        paymentMethod: "cash",
        date: new Date().toISOString(),
        status: "pending"
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData)
      })

      const result = await response.json()
      if (result.success) {
        toast({ title: "Success", description: "Receipt created successfully" })
        router.push("/dashboard/receipts")
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create receipt", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Scenario 2: Add item to list
  const handleAddItem = (itemId: string) => {
    const item = items.find(i => i._id === itemId)
    if (!item) return

    const newItem = {
      itemId: item._id!,
      name: item.name,
      quantity: 1,
      price: item.price,
      taxRate: item.taxRate,
      total: item.price
    }
    setScenario2Items([...scenario2Items, newItem])
  }

  // Scenario 2: Update item quantity/price
  const handleUpdateItem = (index: number, field: string, value: number) => {
    const updated = [...scenario2Items]
    updated[index] = {
      ...updated[index],
      [field]: value,
      total: field === 'quantity' || field === 'price' 
        ? (field === 'quantity' ? value : updated[index].quantity) * (field === 'price' ? value : updated[index].price)
        : updated[index].total
    }
    setScenario2Items(updated)
  }

  // Scenario 2: Remove item
  const handleRemoveItem = (index: number) => {
    setScenario2Items(scenario2Items.filter((_, i) => i !== index))
  }

  // Scenario 2: Calculate totals
  const calculateScenario2Totals = () => {
    const subtotal = scenario2Items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    const taxAmount = scenario2Items.reduce((sum, item) => 
      sum + (item.quantity * item.price * item.taxRate / 100), 0
    )
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total }
  }

  // Scenario 2: Create receipt with items
  const handleCreateWithItems = async () => {
    if (!scenario2Client || scenario2Items.length === 0) {
      toast({ title: "Error", description: "Please select client and add items", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const { subtotal, taxAmount, total } = calculateScenario2Totals()
      const amountPaid = parseFloat(scenario2AmountPaid) || 0
      const client = clients.find(c => c._id === scenario2Client)

      const receiptData = {
        receiptType: "items",
        clientId: scenario2Client,
        clientName: client?.name || "",
        items: scenario2Items,
        subtotal,
        taxAmount,
        total,
        amountPaid,
        balanceAmount: total - amountPaid,
        paymentType: amountPaid < total ? "partial" : "full",
        paymentMethod: scenario2PaymentMethod,
        date: new Date().toISOString(),
        status: "pending"
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData)
      })

      const result = await response.json()
      if (result.success) {
        toast({ title: "Success", description: "Receipt created successfully" })
        router.push("/dashboard/receipts")
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create receipt", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Scenario 3: Create quick receipt
  const handleCreateQuickReceipt = async () => {
    if (!scenario3Client || !scenario3Amount) {
      toast({ title: "Error", description: "Please select client and enter amount", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const totalAmount = parseFloat(scenario3Amount)
      const amountPaid = parseFloat(scenario3AmountPaid) || 0
      const client = clients.find(c => c._id === scenario3Client)

      const receiptData = {
        receiptType: "quick",
        clientId: scenario3Client,
        clientName: client?.name || "",
        items: [],
        subtotal: totalAmount,
        taxAmount: 0,
        total: totalAmount,
        amountPaid,
        balanceAmount: totalAmount - amountPaid,
        paymentType: amountPaid < totalAmount ? "advance" : "full",
        paymentMethod: scenario3PaymentMethod,
        date: new Date().toISOString(),
        status: "pending"
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData)
      })

      const result = await response.json()
      if (result.success) {
        toast({ title: "Success", description: "Receipt created successfully" })
        router.push("/dashboard/receipts")
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create receipt", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const scenario2Totals = calculateScenario2Totals()
  const scenario3Balance = parseFloat(scenario3Amount || "0") - parseFloat(scenario3AmountPaid || "0")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard/receipts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Receipts
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Receipt</CardTitle>
          <CardDescription>Choose how you want to create a receipt</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quotation">From Quotation</TabsTrigger>
              <TabsTrigger value="items">With Items</TabsTrigger>
              <TabsTrigger value="quick">Quick Receipt</TabsTrigger>
            </TabsList>

            {/* Scenario 1: From Quotation */}
            <TabsContent value="quotation" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Select Quotation</Label>
                  <Select value={selectedQuotation} onValueChange={handleQuotationSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a quotation" />
                    </SelectTrigger>
                    <SelectContent>
                      {quotations.map((q) => (
                        <SelectItem key={q._id} value={q._id!}>
                          {q.quotationNumber} - {q.clientName} - ₹{q.total}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {quotationDetails && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold">Quotation Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Client: {quotationDetails.clientName}</div>
                      <div>Quotation: {quotationDetails.quotationNumber}</div>
                      <div>Subtotal: ₹{quotationDetails.subtotal}</div>
                      <div>Tax: ₹{quotationDetails.taxAmount}</div>
                      <div className="font-semibold">Total: ₹{quotationDetails.total}</div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleCreateFromQuotation} 
                  disabled={!quotationDetails || loading}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Receipt"}
                </Button>
              </div>
            </TabsContent>

            {/* Scenario 2: With Items */}
            <TabsContent value="items" className="space-y-4">
              <div className="space-y-4">
                {/* Client Selector */}
                <div>
                  <Label>Client *</Label>
                  <div className="flex gap-2">
                    <Select value={scenario2Client} onValueChange={setScenario2Client}>
                      <SelectTrigger className="flex-1">
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
                    <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Client</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={newClient.name}
                              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Phone *</Label>
                            <Input
                              value={newClient.phone}
                              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={newClient.email}
                              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Address</Label>
                            <Input
                              value={newClient.address}
                              onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateClient}>Create Client</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Item Selector */}
                <div>
                  <Label>Add Items *</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={handleAddItem}>
                      <SelectTrigger className="flex-1">
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
                    <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={newItem.name}
                              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={newItem.description}
                              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Price *</Label>
                            <Input
                              type="number"
                              value={newItem.price}
                              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Tax Rate (%)</Label>
                            <Input
                              type="number"
                              value={newItem.taxRate}
                              onChange={(e) => setNewItem({ ...newItem, taxRate: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateItem}>Create Item</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Items List */}
                {scenario2Items.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold mb-2">Items</h3>
                    {scenario2Items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center border-b pb-2">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="number"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value))}
                              className="w-20"
                            />
                            <Input
                              type="number"
                              placeholder="Price"
                              value={item.price}
                              onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value))}
                              className="w-24"
                            />
                            <div className="text-sm flex items-center">
                              Tax: {item.taxRate}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="font-semibold">₹{item.total.toFixed(2)}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="border-t pt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{scenario2Totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₹{scenario2Totals.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>₹{scenario2Totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                <div className="space-y-3">
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={scenario2PaymentMethod} onValueChange={setScenario2PaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount Paid</Label>
                    <Input
                      type="number"
                      value={scenario2AmountPaid}
                      onChange={(e) => setScenario2AmountPaid(e.target.value)}
                      placeholder="Enter amount paid (full or advance)"
                    />
                    {scenario2AmountPaid && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Balance: ₹{(scenario2Totals.total - parseFloat(scenario2AmountPaid)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleCreateWithItems}
                  disabled={loading || !scenario2Client || scenario2Items.length === 0}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Receipt"}
                </Button>
              </div>
            </TabsContent>

            {/* Scenario 3: Quick Receipt */}
            <TabsContent value="quick" className="space-y-4">
              <div className="space-y-4">
                {/* Client Selector */}
                <div>
                  <Label>Client *</Label>
                  <div className="flex gap-2">
                    <Select value={scenario3Client} onValueChange={setScenario3Client}>
                      <SelectTrigger className="flex-1">
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
                    <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Client</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={newClient.name}
                              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Phone *</Label>
                            <Input
                              value={newClient.phone}
                              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={newClient.email}
                              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Address</Label>
                            <Input
                              value={newClient.address}
                              onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateClient}>Create Client</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <Label>Total Amount *</Label>
                  <Input
                    type="number"
                    value={scenario3Amount}
                    onChange={(e) => setScenario3Amount(e.target.value)}
                    placeholder="Enter total amount"
                  />
                </div>

                {/* Payment Details */}
                <div className="space-y-3">
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={scenario3PaymentMethod} onValueChange={setScenario3PaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount Paid</Label>
                    <Input
                      type="number"
                      value={scenario3AmountPaid}
                      onChange={(e) => setScenario3AmountPaid(e.target.value)}
                      placeholder="Enter amount paid (full or advance)"
                    />
                    {scenario3AmountPaid && scenario3Amount && (
                      <div className="text-sm mt-2 p-2 bg-muted rounded">
                        <div className="flex justify-between">
                          <span>Total Amount:</span>
                          <span className="font-semibold">₹{parseFloat(scenario3Amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount Paid:</span>
                          <span className="font-semibold">₹{parseFloat(scenario3AmountPaid).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t mt-1 pt-1">
                          <span>Balance:</span>
                          <span className="font-semibold text-primary">
                            ₹{scenario3Balance.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Payment Type: {parseFloat(scenario3AmountPaid) < parseFloat(scenario3Amount) ? "Advance Payment" : "Full Payment"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleCreateQuickReceipt}
                  disabled={loading || !scenario3Client || !scenario3Amount}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Quick Receipt"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
