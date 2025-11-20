"use client"
import { toast } from "@/lib/toast"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Save, Plus, Edit, Power, PowerOff, Search } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { Item } from "@/lib/models/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ItemsPage() {
  const { user, loading, hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [taxRates, setTaxRates] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "product" | "service">("all")
  const [page, setPage] = useState(1)
const itemsPerPage = 10
  const [formData, setFormData] = useState({
    type: "" as "product" | "service",
    unitType: "",
    name: "",
    description: "",
    userId: user?.id,
    price: 0,
    hsnCode: "", // Added HSN code field
    applyTax: false, // Added tax checkbox
    cgst: 0,
    sgst: 0,
    igst: 0,
    isActive: true, // Added active status
  })

  useEffect(() => {
    loadItems()
    // loadTaxRates()
  }, [])

const loadItems = async () => {
  const data = await api.items.getAll()

  const mapped = data.map((i:any)=> ({
    ...i,
    id: i._id?.toString?.() || i.id   // ✅ keep both
  }))

  setItems(mapped)
}

const validateItem = (data: any) => {
  if (!data.type || !["product", "service"].includes(data.type)) {
    return "Please select a valid item type."
  }

  if (!data.name || data.name.trim().length < 2) {
    return "Item name must be at least 2 characters long."
  }

  // 🚨 Duplicate prevention (case-insensitive)
  const duplicate = items.some(
    (i) =>
      i.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
      i.id !== editingItem?.id
  )
  if (duplicate) return "Item name already exists."

  if (!data.price || data.price <= 0) {
    return "Price must be greater than 0."
  }

  if (data.type === "product" && !data.unitType) {
    return "Please select a unit type."
  }

  if (data.applyTax && !data.cgst && !data.sgst && !data.igst) {
    return "At least one tax must be selected."
  }

  return null
}

  // const loadTaxRates = async () => {
  //   const rates = (await api.taxRates.getAll()) || []
  //   setTaxRates(rates)
  // }

  useEffect(() => {
  const loadTaxData = async () => {
    try {
      const rates = await api.taxRates.getAll()
      console.log("Loaded Tax Rates:", rates)

      setTaxRates(Array.isArray(rates) ? rates : [])
      console.log("Tax Rates:", taxRates)
    } catch (err) {
      console.error("Failed loading tax data:", err)
    }
  }

  loadTaxData()
}, [])

const filteredItems = items.filter(item => {
  const matchesSearch =
    searchQuery === "" ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.hsnCode?.toLowerCase().includes(searchQuery.toLowerCase())

  const matchesType = typeFilter === "all" || item.type === typeFilter

  return matchesSearch && matchesType
})

const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
const startIndex = (page - 1) * itemsPerPage
const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage)

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({
      type: item.type as "product" | "service",
      unitType: item.unitType || "",
      name: item.name,
      description: item.description || "",
      price: item.price,
      hsnCode: item.hsnCode || "",
      applyTax: item.applyTax || false,
      cgst: item.cgst || 0,
      sgst: item.sgst || 0,
      igst: item.igst || 0,
      userId: user?.id,
      isActive: item.isActive !== false,
    })
    setIsDialogOpen(true)
  }

  const toggleActive = (id: string) => {
    const item = items.find((i) => i._id === id)
    if (item) {
      api.items.update(id, { isActive: !item.isActive  })
    setItems(items.map((i) => (i._id === id ? { ...i, isActive: !i.isActive } : i)))
     toast({ title: "Success", description: "Item status updated successfully!", variant: "success" })
    }
  }

const handleSave = async () => {
  try {
    // ✅ VALIDATE FIRST
    const errMsg = validateItem(formData)
    if (errMsg) {
      toast({ title: "Notification", description: errMsg, variant: "default" })
      return
    }

    if (editingItem?.id) {
      await api.items.update(editingItem.id, {
        ...formData,
      })
    } else {
      await api.items.create({
        ...formData,
      })
    }

    await loadItems()
    resetForm()
    setEditingItem(null)
    setIsDialogOpen(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    toast({ title: "Success", description: "Item saved successfully!" })

  } catch (err) {
    console.error("Failed to save", err)
    toast({ title: "Error", description: "Failed to save item", variant: "destructive" })
  }
}


  const resetForm = () => {
    setFormData({
      type: "" as "product" | "service",
      unitType: "",
      name: "",
      description: "",
      price: 0,
      hsnCode: "",
      applyTax: false,
      cgst: 0,
      sgst: 0,
      igst: 0,
      isActive: true,
      userId: user?.id
    })
  }
      if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  if (!hasPermission("tenant_settings")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage products and services</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product/Service
            </Button>
          </DialogTrigger>
          <DialogContent className="!w-[90vw] sm:max-w-[90vw] h-[95vh] flex flex-col p-0 gap-0">
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-20">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Product/Service" : "Add New Product/Service"}</DialogTitle>
                <DialogDescription>Enter item details below. Fields marked with * are required.</DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 min-h-0 max-h-full mb-20 overflow-y-auto px-6 py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Select Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "product" | "service") =>
                      setFormData({ ...formData, type: value, unitType: value === "service" ? "" : formData.unitType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product/Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === "product" && (
                  <div className="space-y-2">
                    <Label htmlFor="unitType" required>Unit Type</Label>
                    <Select
                      value={formData.unitType}
                      onValueChange={(value) => setFormData({ ...formData, unitType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gm">Grams (gm)</SelectItem>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="ml">Milliliters (ml)</SelectItem>
                        <SelectItem value="qty">Quantity (qty)</SelectItem>
                        <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="dozen">Dozen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hsnCode">HSN Code</Label>
                  <Input
                    id="hsnCode"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    placeholder="Enter HSN code"
                  />
                </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter item description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="applyTax"
                      checked={formData.applyTax}
                      onCheckedChange={(checked) => setFormData({ ...formData, applyTax: checked as boolean })}
                    />
                    <Label htmlFor="applyTax" className="cursor-pointer">
                      Apply Tax
                    </Label>
                  </div>

                  {formData.applyTax && (
                    <div className="grid grid-cols-3 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="cgst">CGST (%)</Label>
                        <Select
                          value={formData.cgst.toString()}
                          onValueChange={(value) => setFormData({ ...formData, cgst: Number.parseFloat(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CGST" />
                          </SelectTrigger>
                          <SelectContent>
                            {taxRates
                              .filter((rate) => rate.type === "CGST" && rate.isActive)
                              .map((rate) => (
                                <SelectItem key={rate._id} value={rate.rate.toString()}>
                                  {rate.rate}%
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sgst">SGST (%)</Label>
                        <Select
                          value={formData.sgst.toString()}
                          onValueChange={(value) => setFormData({ ...formData, sgst: Number.parseFloat(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select SGST" />
                          </SelectTrigger>
                          <SelectContent>
                            {taxRates
                              .filter((rate) => rate.type === "SGST" && rate.isActive)
                              .map((rate) => (
                                <SelectItem key={rate._id} value={rate.rate.toString()}>
                                  {rate.rate}%
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="igst">IGST (%)</Label>
                        <Select
                          value={formData.igst.toString()}
                          onValueChange={(value) => setFormData({ ...formData, igst: Number.parseFloat(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select IGST" />
                          </SelectTrigger>
                          <SelectContent>
                            {taxRates
                              .filter((rate) => rate.type === "IGST" && rate.isActive)
                              .map((rate) => (
                                <SelectItem key={rate._id} value={rate.rate.toString()}>
                                  {rate.rate}%
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-4 z-30 shadow-lg">
              <div className="flex justify-end space-x-2 max-w-[90vw] mx-auto">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Item saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product/Service List ({items.filter(item => {
                  const matchesSearch = searchQuery === "" || 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.hsnCode?.toLowerCase().includes(searchQuery.toLowerCase())
                  const matchesType = typeFilter === "all" || item.type === typeFilter
                  return matchesSearch && matchesType
                }).length})
              </CardTitle>
              <CardDescription>All products and services in your catalog</CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, description, or HSN code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value: "all" | "product" | "service") => setTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="product">Products Only</SelectItem>
                <SelectItem value="service">Services Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
<CardContent>
  {filteredItems.length === 0 ? (
    <div className="text-center py-12 text-gray-500">
      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p>No products/services found.</p>
    </div>
  ) : (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="p-2 text-left">S.No</TableHead>
            <TableHead className="p-2 text-left">Type</TableHead>
            <TableHead className="p-2 text-left">Name</TableHead>
            <TableHead className="p-2 text-left">HSN</TableHead>
            <TableHead className="p-2 text-left">Unit</TableHead>
            <TableHead className="p-2 text-left">Price</TableHead>
            <TableHead className="p-2 text-left">Tax</TableHead>
            <TableHead className="p-2 text-left">Status</TableHead>
            <TableHead className="p-2 text-left">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedItems.map((item, index) => (
            <TableRow
              key={item.id}
              className={`border-b ${item.isActive === false ? "opacity-50 bg-gray-50" : ""}`}
            >
              <TableCell className="p-2">{startIndex + index + 1}</TableCell>

              <TableCell className="p-2">
                {item.type === "product" ? (
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">Product</span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Service</span>
                )}
              </TableCell>

              <TableCell className="p-2 font-medium">{item.name}</TableCell>
              <TableCell className="p-2">{item.hsnCode || "-"}</TableCell>
              <TableCell className="p-2">{item.unitType || "-"}</TableCell>
              <TableCell className="p-2">₹{item.price.toFixed(2)}</TableCell>

              <TableCell className="p-2 text-sm">
                {item.applyTax ? (
                  <>
                    CGST {item.cgst}%<br />
                    SGST {item.sgst}%<br />
                    IGST {item.igst}%
                  </>
                ) : (
                  "-"
                )}
              </TableCell>

              <TableCell className="p-2">
                {item.isActive ? (
                  <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Active</span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Disabled</span>
                )}
              </TableCell>

              <TableCell className="p-2">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(item?._id)}
                  >
                    {item.isActive ? (
                      <PowerOff className="h-4 w-4 text-red-500" />
                    ) : (
                      <Power className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>

        <span>Page {page} of {totalPages}</span>

        <Button
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </>
  )}
</CardContent>

      </Card>
    </div>
  )
}
