"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Save, Plus, Edit, Power, PowerOff } from "lucide-react"
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

export default function ItemsPage() {
  const { user, hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [taxRates, setTaxRates] = useState<any[]>([])
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
    const item = items.find((i) => i.id === id)
    if (item) {
      api.items.update(id, { isActive: !item.isActive  })
      loadItems()
    }
    alert("Item status updated successfully!")
  }

const handleSave = async () => {
  try {
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
    alert("Item saved successfully!")
  } catch (err) {
    console.error("Failed to save", err)
    alert("Failed to save item")
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
                    <Label htmlFor="unitType">Unit Type (Optional)</Label>
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
                                <SelectItem key={rate.id} value={rate.rate.toString()}>
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
                                <SelectItem key={rate.id} value={rate.rate.toString()}>
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
                                <SelectItem key={rate.id} value={rate.rate.toString()}>
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
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Product/Service List ({items.length})
          </CardTitle>
          <CardDescription>All products and services in your catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No products/services added yet. Click "Add Product/Service" to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${item.isActive === false ? "opacity-50 bg-gray-50" : ""}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${item.type === "product" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                      >
                        {item.type === "product" ? "Product" : "Service"}
                      </span>
                      <span className="font-medium">{item.name}</span>
                      {item.hsnCode && <span className="text-sm text-gray-500">HSN: {item.hsnCode}</span>}
                      {item.type === "product" && item.unitType && (
                        <span className="text-sm text-gray-500">({item.unitType})</span>
                      )}
                      <span className="text-gray-600">₹{item.price.toFixed(2)}</span>
                      {item.isActive === false && (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Disabled</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    {item.applyTax && (
                      <div className="text-xs text-gray-500 mt-1">
                        Tax: CGST {item.cgst}% + SGST {item.sgst}% + IGST {item.igst}%
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(item?.id || "")}
                      title={item.isActive === false ? "Enable" : "Disable"}
                    >
                      {item.isActive === false ? (
                        <Power className="h-4 w-4 text-green-500" />
                      ) : (
                        <PowerOff className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
