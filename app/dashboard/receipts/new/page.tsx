"use client"

import type React from "react"
// import { toast } from "sonner"
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
import { SearchableSelect } from "@/components/searchable-select"
import { OwnSearchableSelect } from "@/components/searchableSelect"

interface ReceiptItem {
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

export default function NewReceiptPage() {
  const router = useRouter()
  const { user } = useUser()

  const [clients, setClients] = useState<any[]>([])
  const[bankDetails,setBankDetails]=useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>(""); // <-- NEW
  const[selectUpiId,setSelectedUpiId]=useState<String>("")
  const [quotations, setQuotations] = useState<any[]>([])
  const [allQuotations, setAllQuotations] = useState<any[]>([])
  const [masterItems, setMasterItems] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [bankAccounts, setBankAccounts] = useState<string[]>([])

  const [receiptNumber, setReceiptNumber] = useState("Loading...")
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

  const [items, setItems] = useState<ReceiptItem[]>([
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

  const [receiptTotal, setReceiptTotal] = useState(0)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [balanceAmount, setBalanceAmount] = useState(0)
  const [paymentType, setPaymentType] = useState<"Full Payment" | "Partial">("Full Payment")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [status, setStatus] = useState<"Received" | "Cleared">("Received")

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

  useEffect(() => {
    const loadData = async () => {
      const loadedClients = await api.clients.getAll()
      const loadedQuotations = await api.quotations.getAll()
      const loadedItems = await api.items.getAll()
      const loadedBankDetails=await api.bankAccounts.getAll();
      
      // Fetch the next receipt number
      const nextReceiptNumber = await api.receipts.getNextNumber()

      console.log("[v0] Loaded clients:", loadedClients)
      console.log("[v0] Loaded quotations:", loadedQuotations)
      console.log("[v0] Loaded items:", loadedItems)
      // console.log("[v0] Loaded BANK DETAILS:", loadedBankDetails)
      console.log("[v0] Next receipt number:", nextReceiptNumber)

      setClients(loadedClients)
      setAllQuotations(loadedQuotations)
      setMasterItems(loadedItems)
      setBankDetails(loadedBankDetails)

      setReceiptNumber(nextReceiptNumber)
      // Set default payment methods and bank accounts
      setPaymentMethods(["Cash", "Bank Transfer", "UPI", "Check", "Credit Card", "Debit Card"])
      setBankAccounts(["HDFC Bank - 1234567890", "ICICI Bank - 0987654321", "SBI - 5555666677"])
    }
    loadData()
  }, [])

  useEffect(() => {
    const filterQuotations = async () => {
      if (selectedClientId && !selectedQuotationId) {
        const clientQuotations = allQuotations.filter((eachItem:any)=>eachItem.clientId===selectedClientId)
        console.log("[v0] Filtered quotations for client:", selectedClientId, clientQuotations)
        setQuotations(clientQuotations)
      } else if (!selectedClientId) {
        setQuotations([])
      }
    }
    filterQuotations()
  }, [selectedClientId, selectedQuotationId])

  useEffect(() => {
    if (!selectedQuotationId) {
      const total = items.reduce((sum, item) => sum + item.total, 0)
      setReceiptTotal(total)
    }
  }, [items, selectedQuotationId])

  useEffect(() => {
    if (paymentType === "Partial") {
      setBalanceAmount(receiptTotal - paymentAmount)
    } else {
      setBalanceAmount(0)
      setPaymentAmount(receiptTotal)
    }
  }, [paymentType, receiptTotal, paymentAmount])

  useEffect(() => {
    if (selectedQuotationId) {
      const quotation = allQuotations.find((q) => q.id === selectedQuotationId)
      if (quotation) {
        console.log("[v0] Selected quotation:", quotation)
        setQuotationAcceptedDate(quotation.acceptedDate || quotation.date)
        setProjectName(quotation.projectName || "") // Set project name from quotation
        setReceiptTotal(quotation.total)
        setPaymentAmount(quotation.amountPending || quotation.total)

        // Find and set client details
        const client = clients.find((c) => c.id === quotation.clientId)
        if (client) {
          setSelectedClientId(client.id)
          setClientName(client.name)
          setClientAddress(client.address)
          setClientPhone(client.phone)
          setClientEmail(client.email)
        }
      }
    }
  }, [selectedQuotationId, allQuotations, clients])

  useEffect(() => {
    if (selectedClientId && !selectedQuotationId) {
     
      const client = clients.find((c) => c._id === selectedClientId)
       console.log("Entered into selectedClientId if client ::",client)
      if (client) {
        setClientName(client.name)
        setClientAddress(client.address)
        setClientPhone(client.phone)
        setClientEmail(client.email)
      }
    }
  }, [selectedClientId, selectedQuotationId, clients])

  useEffect(() => {
    if (paymentMethod === "Cash") {
      setStatus("Cleared")
    } else {
      setStatus("Received")
    }
  }, [paymentMethod])

  const addItem = () => {
    const newItem: ReceiptItem = {
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
    console.log("Selected Item Id is:::",id)
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
              const masterItem = masterItems.find((i) => i.name === value)

              if (masterItem) {
                updatedItem.description = masterItem.description
                updatedItem.price = masterItem.price
                updatedItem.itemId=masterItem._id;

                if (masterItem.applyTax) {
                 

                  // Show all taxes in UI
                  updatedItem.cgst = masterItem.cgst || 0
                  updatedItem.sgst = masterItem.sgst || 0
                  updatedItem.igst = masterItem.igst || 0

                  // ✅ TaxRate = sum of all applicable taxes
                  updatedItem.taxRate =
                    (masterItem.cgst || 0) +
                    (masterItem.sgst || 0) +
                    (masterItem.igst || 0)

                  updatedItem.taxName = "CGST + SGST + IGST"
                } else {
                  
                  updatedItem.cgst = 0
                  updatedItem.sgst = 0
                  updatedItem.igst = 0
                  updatedItem.taxRate = 0
                  updatedItem.taxName = ""
                }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) {
      console.log("[v0] Already submitting, ignoring duplicate submission")
      return
    }

    console.log("[v0] ===== RECEIPT SUBMISSION STARTED =====")
    console.log("[v0] Form data:", {
      selectedClientId,
      clientName,
      selectedQuotationId,
      projectName,
      paymentType,
      paymentAmount,
      receiptTotal,
      paymentMethod,
      referenceNumber,
      items: items.filter((item) => item.itemName),
    })

    if (!selectedClientId) {
      console.log("[v0] ERROR: No client selected")
      toast.error("Please select a client")
      return
    }

    if (!selectedQuotationId && !projectName) {
      console.log("[v0] ERROR: No project name provided")
      toast.error("Please enter a project name")
      return
    }

    if (paymentType === "Partial" && paymentAmount <= 0) {
      console.log("[v0] ERROR: Invalid payment amount for partial payment")
      toast.error("Please enter a valid payment amount")
      return
    }

    if (paymentMethod !== "Cash" && !referenceNumber) {
      console.log("[v0] ERROR: Missing reference number for non-cash payment")
      toast.error("Reference number is required for non-cash payments")
      return
    }

    if (!selectedQuotationId && !items.some((item) => item.itemName)) {
      console.log("[v0] ERROR: No quotation selected and no items provided")
      toast.error("Please either select a quotation or add items")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("[v0] Calling createReceiptWithQuotation...")

      const receipt = await api.receipts.create({
        clientId: selectedClientId,
        clientName,
        clientEmail,
        clientPhone,
        clientAddress,
        quotationId: selectedQuotationId || undefined,
        projectName: projectName || undefined,
        items:
          !selectedQuotationId && items.some((item) => item.itemName)
            ? items.map((item) => ({
                itemId: item.id,
                itemName: item.itemName,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.price,
                taxRate: item.taxRate,
                amount: item.amount,
              }))
            : undefined,
        amountPaid: paymentType === "Partial" ? paymentAmount : receiptTotal,
        paymentType: paymentType === "Full Payment" ? "full" : "partial",
        paymentMethod: paymentMethod.toLowerCase().replace(" ", "-") as any,
        bankAccount,
        referenceNumber,
        screenshot: screenshot?.name,
        notes: description,
      })

      // console.log("[v0] Receipt created successfully:", receipt)
      // console.log("[v0] Receipt ID:", receipt.id)
      // console.log("[v0] Receipt Number:", receipt.receiptNumber)
      // console.log("[v0] Quotation ID:", receipt.quotationId)
      // console.log("[v0] ===== RECEIPT SUBMISSION COMPLETED =====")

      toast.success(`Receipt ${receipt.receiptNumber} created successfully!`)

      setTimeout(() => {
        router.push("/dashboard/receipts")
      }, 500)
    } catch (error) {
      console.error("[v0] ===== RECEIPT SUBMISSION FAILED =====")
      console.error("[v0] Error creating receipt:", error)
      console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
      toast.error(error instanceof Error ? error.message : "Failed to create receipt. Please try again.")
      setIsSubmitting(false)
    }
  }

  
  const handleCreateClient = async () => {
      const localStored = localStorage.getItem("loginedUser");
      const parsed = localStored ? JSON.parse(localStored) : null;
       let newErrors = { name: "", email: "", phone: "", address: "" }
    let isValid = true
  
    // Name required
    if (!newClient.clientName.trim()) {
      newErrors.name = "Client name is required"
      isValid = false
    }
  
    // Phone validation (Indian 10-digit)
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(newClient.phone)) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number"
      isValid = false
    }
  
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newClient.email)) {
      newErrors.email = "Enter a valid email address"
      isValid = false
    }
  
    // Address required
    if (!newClient.address.trim()) {
      newErrors.address = "Address is required"
      isValid = false
    }
  
    setErrors(newErrors)
    if (!isValid) return // <-- Stop submit if invalid
     
    try{
       const newClientData = await api.clients.create( {
        name: newClient.clientName,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        status:"active",
        userId: parsed.id
      })
      toast.success("Client Added", `${newClient.clientName} has been added to your clients`)
      const loadedClients = await api.clients.getAll()
      setClients(loadedClients)
      const filteredClinets=loadedClients.filter((eachItem:any)=>eachItem.name===newClient.clientName);
      setSelectedClientId(filteredClinets[0]._id);
      setIsCreateClientOpen(false)
      setNewClient({ clientName: "", email: "", phone: "", address: "" })
    }catch(error){
      toast.error("Error", error instanceof Error ? error.message : "Failed to save client")
    }
  
    }

  const handleClearQuotation = () => {
    setSelectedQuotationId("")
    setQuotationAcceptedDate("")
    setProjectName("") // Clear project name
    setSelectedClientId("")
    setClientName("")
    setClientAddress("")
    setClientPhone("")
    setClientEmail("")
    setReceiptTotal(0)
    setPaymentAmount(0)
  }

  const numberToWords = (num: number): string => {
    // Simplified conversion - in real app, use a proper library
    return `${num.toLocaleString()} Rupees Only`
  }

  // Transform your backend array exactly as before
const clientOptions = clients.map((c) => ({
  value: String(c._id),
  label: c.clientName || c.name || "Unnamed",
}));
console.log("bankDetails are:::",bankDetails)
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
                  <p className="text-xs text-gray-500 mt-1">Will be auto-generated on submit (RC000XXX)</p>
                </div>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  <p className="text-xs text-gray-500 mt-1">Default system date</p>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any notes or description"
                  rows={2}
                />
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
                          <Input
                            id="newClientName"
                            value={newClient.clientName}
                            onChange={(e) => setNewClient({ ...newClient, clientName: e.target.value })}
                            placeholder="Enter client name"
                          />
                          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
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
                           {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                        </div>
                        <div>
                          <Label htmlFor="newClientPhone">Phone *</Label>
                          <Input
                            id="newClientPhone"
                            value={newClient.phone}
                            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                          />
                           {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
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
                           {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateClientOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={handleCreateClient}>
                          Create Client
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {selectedQuotationId && (
                  <p className="text-xs text-gray-500 mt-1">Auto-selected from quotation, can be changed</p>
                )}
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
                    options={quotations.map((q) => ({
                      value: q.id,
                      label: `${q.quotationNumber} - ${q.projectName} (Pending: ₹${(q.amountPending || 0).toLocaleString()})`,
                    }))}
                    value={selectedQuotationId}
                    onValueChange={setSelectedQuotationId}
                    placeholder={selectedClientId ? "Search quotations..." : "Select a client first"}
                    searchPlaceholder="Type to search quotations..."
                    emptyText="No quotations found for this client."
                    className={!selectedClientId ? "opacity-50 cursor-not-allowed" : ""}
                  />
                  {selectedQuotationId && (
                    <Button type="button" variant="outline" size="icon" onClick={handleClearQuotation}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedClientId
                    ? "Select a quotation to auto-populate details, or leave empty to create new"
                    : "Select a client first to see their quotations"}
                </p>
              </div>
              {quotationAcceptedDate && (
                <div>
                  <Label>Quotation Acceptance Date</Label>
                  <Input value={new Date(quotationAcceptedDate).toLocaleDateString()} disabled className="bg-gray-50" />
                </div>
              )}
              {!selectedQuotationId && selectedClientId && (
                <div>
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Required to create a new quotation for this receipt</p>
                </div>
              )}
              {selectedQuotationId && projectName && (
                <div>
                  <Label>Project Name</Label>
                  <Input value={projectName} disabled className="bg-gray-50" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* {!selectedQuotationId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Items/Services</CardTitle>
                  <Button onClick={addItem} size="sm" variant="outline" type="button">
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
                            type="button"
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
                                value: masterItem.name || masterItem.itemName,
                                label: masterItem.name || masterItem.itemName,
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
                              onChange={(e) => updateItem(item.id, "discount", Number.parseFloat(e.target.value) || 0)}
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
          )} */}
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
                            <OwnSearchableSelect
                              options={masterItems
                                .filter((masterItem) => masterItem.type === item.type)
                                .map((masterItem) => ({
                                  value: masterItem.name,
                                  label: masterItem.name,
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
                           {item.type==="product" && (
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
                           )}
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
                          
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label>CGST (%)</Label>
                                <Input value={item.cgst} disabled className="bg-gray-100" />
                              </div>
                              <div>
                                <Label>SGST (%)</Label>
                                <Input value={item.sgst} disabled className="bg-gray-100" />
                              </div>
                              <div>
                                <Label>IGST (%)</Label>
                                <Input value={item.igst} disabled className="bg-gray-100" />
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
          )}


          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="receiptTotal">Receipt Total *</Label>
                <Input id="receiptTotal" type="number" value={receiptTotal} disabled className="bg-gray-50" />
                {selectedQuotationId ? (
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated from quotation</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated from items</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentType">Payment Type *</Label>
                  <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)} required>
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
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {paymentType === "Partial" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentAmount">Payment Amount *</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number.parseFloat(e.target.value) || 0)}
                      required
                      min="0"
                      max={receiptTotal}
                      step="0.01"
                    />
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
                <Input
                  value={numberToWords(paymentType === "Partial" ? paymentAmount : receiptTotal)}
                  disabled
                  className="bg-gray-50"
                />
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
                      <SelectItem key={account._id} value={account.accountNumber}>
                        {`${account.bankName} - ${account.accountNumber}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                </div>
              )}
              {paymentMethod && paymentMethod !== "Cash" && (
                <>
                  <div>
                    <Label htmlFor="referenceNumber">Reference Number *</Label>
                    <Input
                      id="referenceNumber"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Transaction/Check reference number"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Mandatory for non-cash payments</p>
                  </div>
                  <div>
                    <Label htmlFor="screenshot">Screenshot Upload *</Label>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Mandatory for non-cash payments</p>
                  </div>
                </>
              )}
              <div>
                <Label>Status</Label>
                <Input value={status} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">
                  {paymentMethod === "Cash"
                    ? "Cash payments are automatically Cleared"
                    : "Non-cash payments start as Received, cleared in Reconciliation"}
                </p>
              </div>
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
                    <span className="font-medium">
                      {allQuotations.find((q) => q.id === selectedQuotationId)?.quotationNumber || "N/A"}
                    </span>
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
            <Button type="button" variant="outline">
              Cancel
            </Button>
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
