"use client"

import { CommandGroup } from "@/components/ui/command"
import { CommandEmpty } from "@/components/ui/command"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Check, ChevronsUpDown } from "lucide-react"
import { api } from "@/lib/api-client"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

interface Category {
  id: string
  name: string
  type: "income" | "expense"
}

interface Quotation {
  id: string
  quotationNumber: string
  clientName: string
  total: number
  amountPending?: number
  nextDueDate?: string
}

interface AddIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction: (transaction: any) => void
}

export default function AddIncomeDialog({ open, onOpenChange, onAddTransaction }: AddIncomeDialogProps) {
  const [step, setStep] = useState<"quotation" | "details">("quotation")
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [isNewClient, setIsNewClient] = useState(false)
  const [quotationSearch, setQuotationSearch] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)

  const [formData, setFormData] = useState({
    quotationId: "",
    clientId: "",
    categoryId: "",
    amount: "",
    paymentType: "full", // 'full' or 'partial'
    description: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    nextDueDate: "",
  })

  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "income" as const,
  })

  const [clients, setClients] = useState<Client[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedClients = await api.clients.getAll()
        const loadedQuotations = await api.quotations.getAll()

        const defaultCategories: Category[] = [
          { id: "1", name: "Client Payments", type: "income" },
          { id: "2", name: "Service Revenue", type: "income" },
          { id: "3", name: "Consulting", type: "income" },
          { id: "4", name: "Product Sales", type: "income" },
          { id: "5", name: "Subscription Revenue", type: "income" },
        ]

        setClients(loadedClients)
        setQuotations(loadedQuotations)
        setCategories(defaultCategories)
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }

    loadData()
  }, [])

  const filteredQuotations = quotations.filter(
    (q) =>
      q.quotationNumber.toLowerCase().includes(quotationSearch.toLowerCase()) ||
      q.clientName.toLowerCase().includes(clientSearch.toLowerCase()),
  )

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase()),
  )

  const filteredCategories = categories.filter(
    (c) => c.type === "income" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  )

  const handleQuotationSelect = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setFormData((prev) => ({
      ...prev,
      quotationId: quotation.id,
      amount: quotation.amountPending?.toString() || "",
      clientId: clients.find((c) => c.name === quotation.clientName)?.id || "",
      nextDueDate: quotation.nextDueDate || "",
    }))
    setStep("details")
  }

  const handleNewTransaction = () => {
    setSelectedQuotation(null)
    setFormData((prev) => ({ ...prev, quotationId: "", amount: "" }))
    setStep("details")
  }

  const handleAddClient = async () => {
    try {
      const client = await api.clients.create({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
      })

      setClients([...clients, client])
      setFormData((prev) => ({ ...prev, clientId: client.id }))
      setNewClient({ name: "", email: "", phone: "", address: "" })
      setShowNewClientDialog(false)
    } catch (error) {
      console.error("Failed to create client:", error)
    }
  }

  const handleAddCategory = () => {
    const category: Category = {
      id: Date.now().toString(),
      ...newCategory,
    }
    setCategories([...categories, category])
    setFormData((prev) => ({ ...prev, categoryId: category.id }))
    setNewCategory({ name: "", type: "income" })
    setShowNewCategoryDialog(false)
  }

  const handleSubmit = () => {
    const selectedClient = clients.find((c) => c.id === formData.clientId)
    const selectedCategory = categories.find((c) => c.id === formData.categoryId)

    const transaction = {
      id: Date.now().toString(),
      type: "income",
      amount: Number.parseFloat(formData.amount),
      description: formData.description,
      category: selectedCategory?.name || "",
      date: formData.date,
      status: "completed",
      reference: formData.reference,
      clientVendor: selectedClient?.name || "",
      quotationId: formData.quotationId,
      paymentType: formData.paymentType,
      nextDueDate: formData.nextDueDate,
    }

    onAddTransaction(transaction)

    setFormData({
      quotationId: "",
      clientId: "",
      categoryId: "",
      amount: "",
      paymentType: "full",
      description: "",
      date: new Date().toISOString().split("T")[0],
      reference: "",
      nextDueDate: "",
    })
    setStep("quotation")
    setSelectedQuotation(null)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!w-[90vw] sm:max-w-[90vw] h-[95vh] flex flex-col p-0 gap-0">
          <div className="sticky top-0 bg-white border-b px-6 py-4 z-20">
            <DialogHeader>
              <DialogTitle>Add Income Transaction</DialogTitle>
              <DialogDescription>
                {step === "quotation" ? "Select a quotation or create a new transaction" : "Enter transaction details"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {step === "quotation" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search quotations..."
                      value={quotationSearch}
                      onChange={(e) => setQuotationSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleNewTransaction} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    New Transaction
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredQuotations.map((quotation) => (
                    <div
                      key={quotation.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleQuotationSelect(quotation)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{quotation.quotationNumber}</h4>
                          <p className="text-sm text-gray-600">{quotation.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{quotation.total.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">
                            Balance: ₹{(quotation.amountPending || 0).toLocaleString()}
                          </p>
                          {quotation.nextDueDate && (
                            <Badge variant="outline" className="mt-1">
                              Due: {new Date(quotation.nextDueDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "details" && (
              <div className="space-y-4">
                {selectedQuotation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900">Selected Quotation</h4>
                    <p className="text-sm text-blue-700">
                      {selectedQuotation.quotationNumber} - {selectedQuotation.clientName}
                    </p>
                    <p className="text-sm text-blue-700">
                      Total: ₹{selectedQuotation.total.toLocaleString()}, Balance: ₹
                      {(selectedQuotation.amountPending || 0).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between bg-transparent">
                          {formData.clientId
                            ? clients.find((c) => c.id === formData.clientId)?.name
                            : "Select client..."}
                          <div className="flex items-center space-x-1">
                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowNewClientDialog(true)
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search clients..."
                            value={clientSearch}
                            onValueChange={setClientSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No client found.</CommandEmpty>
                            <CommandGroup>
                              {filteredClients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.id}
                                  onSelect={() => setFormData((prev) => ({ ...prev, clientId: client.id }))}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${formData.clientId === client.id ? "opacity-100" : "opacity-0"}`}
                                  />
                                  <div>
                                    <p className="font-medium">{client.name}</p>
                                    <p className="text-sm text-gray-500">{client.email}</p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between bg-transparent">
                          {formData.categoryId
                            ? categories.find((c) => c.id === formData.categoryId)?.name
                            : "Select category..."}
                          <div className="flex items-center space-x-1">
                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowNewCategoryDialog(true)
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search categories..."
                            value={categorySearch}
                            onValueChange={setCategorySearch}
                          />
                          <CommandList>
                            <CommandEmpty>No category found.</CommandEmpty>
                            <CommandGroup>
                              {filteredCategories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  value={category.id}
                                  onSelect={() => setFormData((prev) => ({ ...prev, categoryId: category.id }))}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${formData.categoryId === category.id ? "opacity-100" : "opacity-0"}`}
                                  />
                                  {category.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {selectedQuotation && (
                  <div className="space-y-2">
                    <Label>Payment Type</Label>
                    <Select
                      value={formData.paymentType}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Payment</SelectItem>
                        <SelectItem value="partial">Partial Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Transaction description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reference</Label>
                    <Input
                      placeholder="Invoice/Receipt #"
                      value={formData.reference}
                      onChange={(e) => setFormData((prev) => ({ ...prev, reference: e.target.value }))}
                    />
                  </div>
                  {formData.paymentType === "partial" && (
                    <div className="space-y-2">
                      <Label>Next Due Date</Label>
                      <Input
                        type="date"
                        value={formData.nextDueDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nextDueDate: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {step === "details" && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-4 z-30 shadow-lg">
              <div className="flex justify-end space-x-2 max-w-[90vw] mx-auto">
                <Button variant="outline" onClick={() => setStep("quotation")}>
                  Back
                </Button>
                <Button onClick={handleSubmit}>Add Income</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>Create a new client for your transactions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input
                value={newClient.name}
                onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={newClient.phone}
                onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={newClient.address}
                onChange={(e) => setNewClient((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClient}>Add Client</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new category for your transactions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>Add Category</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
