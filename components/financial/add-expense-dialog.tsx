"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, CommandInput, CommandItem, CommandList, CommandGroup, CommandEmpty } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Check, ChevronsUpDown } from "lucide-react"
import { api } from "@/lib/api-client"

interface Vendor {
  id: string
  name: string
  gst: string
  email: string
  phone: string
  address: string
}

interface Category {
  id: string
  name: string
  type: "income" | "expense"
}

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction: (transaction: any) => void
}

export default function AddExpenseDialog({ open, onOpenChange, onAddTransaction }: AddExpenseDialogProps) {
  const [vendorSearch, setVendorSearch] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [showNewVendorDialog, setShowNewVendorDialog] = useState(false)
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)

  const [formData, setFormData] = useState({
    vendorId: "",
    categoryId: "",
    amount: "",
    paymentType: "full", // 'full' or 'partial'
    description: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    nextDueDate: "",
    notes: "",
  })

  const [newVendor, setNewVendor] = useState({
    name: "",
    gst: "",
    email: "",
    phone: "",
    address: "",
  })

  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense" as const,
  })

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const loadedVendors = dataStore.getAll<Vendor>("vendors")

    const defaultCategories: Category[] = [
      { id: "1", name: "Office Expenses", type: "expense" },
      { id: "2", name: "Software & Subscriptions", type: "expense" },
      { id: "3", name: "Utilities", type: "expense" },
      { id: "4", name: "Travel & Transportation", type: "expense" },
      { id: "5", name: "Marketing & Advertising", type: "expense" },
      { id: "6", name: "Professional Services", type: "expense" },
      { id: "7", name: "Equipment & Supplies", type: "expense" },
    ]

    setVendors(loadedVendors)
    setCategories(defaultCategories)
  }, [])

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.email.toLowerCase().includes(vendorSearch.toLowerCase()),
  )

  const filteredCategories = categories.filter(
    (c) => c.type === "expense" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  )

  const handleAddVendor = () => {
    const vendor = dataStore.create<Vendor>("vendors", {
      name: newVendor.name,
      email: newVendor.email,
      phone: newVendor.phone,
      address: newVendor.address,
      category: "Supplier", // Default category
    })

    setVendors([...vendors, vendor])
    setFormData((prev) => ({ ...prev, vendorId: vendor.id }))
    setNewVendor({ name: "", gst: "", email: "", phone: "", address: "" })
    setShowNewVendorDialog(false)
  }

  const handleAddCategory = () => {
    const category: Category = {
      id: Date.now().toString(),
      ...newCategory,
    }
    setCategories([...categories, category])
    setFormData((prev) => ({ ...prev, categoryId: category.id }))
    setNewCategory({ name: "", type: "expense" })
    setShowNewCategoryDialog(false)
  }

  const handleSubmit = () => {
    const selectedVendor = vendors.find((v) => v.id === formData.vendorId)
    const selectedCategory = categories.find((c) => c.id === formData.categoryId)

    const transaction = {
      id: Date.now().toString(),
      type: "expense",
      amount: Number.parseFloat(formData.amount),
      description: formData.description,
      category: selectedCategory?.name || "",
      date: formData.date,
      status: formData.paymentType === "partial" ? "pending" : "completed",
      reference: formData.reference,
      clientVendor: selectedVendor?.name || "",
      paymentType: formData.paymentType,
      nextDueDate: formData.nextDueDate,
      notes: formData.notes,
      vendorGst: selectedVendor?.gst,
    }

    onAddTransaction(transaction)

    setFormData({
      vendorId: "",
      categoryId: "",
      amount: "",
      paymentType: "full",
      description: "",
      date: new Date().toISOString().split("T")[0],
      reference: "",
      nextDueDate: "",
      notes: "",
    })
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!w-[90vw] sm:max-w-[90vw] h-[95vh] flex flex-col p-0 gap-0">
          <div className="sticky top-0 bg-white border-b px-6 py-4 z-20">
            <DialogHeader>
              <DialogTitle>Add Expense Transaction</DialogTitle>
              <DialogDescription>Record a new expense with vendor and category details</DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vendor/Supplier</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between bg-transparent">
                        {formData.vendorId ? vendors.find((v) => v.id === formData.vendorId)?.name : "Select vendor..."}
                        <div className="flex items-center space-x-1">
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowNewVendorDialog(true)
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
                          placeholder="Search vendors..."
                          value={vendorSearch}
                          onValueChange={setVendorSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No vendor found.</CommandEmpty>
                          <CommandGroup>
                            {filteredVendors.map((vendor) => (
                              <CommandItem
                                key={vendor.id}
                                value={vendor.id}
                                onSelect={() => setFormData((prev) => ({ ...prev, vendorId: vendor.id }))}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${formData.vendorId === vendor.id ? "opacity-100" : "opacity-0"}`}
                                />
                                <div>
                                  <p className="font-medium">{vendor.name}</p>
                                  <p className="text-sm text-gray-500">{vendor.email}</p>
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
                  placeholder="Expense description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input
                    placeholder="Invoice/Bill #"
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

              {formData.paymentType === "partial" && (
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes about partial payment..."
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-4 z-30 shadow-lg">
            <div className="flex justify-end space-x-2 max-w-[90vw] mx-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Add Expense</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewVendorDialog} onOpenChange={setShowNewVendorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vendor/Supplier</DialogTitle>
            <DialogDescription>Create a new vendor for your expense transactions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Input
                value={newVendor.name}
                onChange={(e) => setNewVendor((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter vendor name"
              />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input
                value={newVendor.gst}
                onChange={(e) => setNewVendor((prev) => ({ ...prev, gst: e.target.value }))}
                placeholder="Enter GST number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={newVendor.address}
                onChange={(e) => setNewVendor((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewVendorDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddVendor}>Add Vendor</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new expense category</DialogDescription>
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
