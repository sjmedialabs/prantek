"use client"
import { toast } from "@/lib/toast"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, Save, Plus, Edit2, Power, PowerOff, Trash2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/api-client"

interface Category {
  _id: string
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AssetCategoriesPage() {
  const { loading, hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
const [statusFilter, setStatusFilter] = useState("all") // all | active | inactive

  useEffect(() => {
    loadCategories()
  }, [])

  const validateCategory = (name: string, categories: Category[], editingId?: string) => {
  if (!name || name.trim().length < 2) {
    return "Category name must be at least 2 characters."
  }

  // 🔥 Duplicate check — ignores the category currently being edited
  const duplicate = categories.some(
    (c) =>
      c.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      c._id !== editingId
  )

  if (duplicate) return "Category name already exists."

  return null
}


  const loadCategories = async () => {
    const data = await api.assetCategories.getAll()
    if (data.length === 0) {
      // Initialize with default categories
      const defaultCategories = ["Equipment", "Vehicle", "Property", "Software", "Furniture", "Office Supplies", "Electronics"]
      for (const name of defaultCategories) {
        await api.assetCategories.create({ name, isActive: true })
      }
      const newData = await api.assetCategories.getAll()
      setCategories(newData)
    } else {
      setCategories(data)
    }
  }

const handleSave = async () => {
  const trimmedName = categoryName.trim()

  // Validation
  const error = validateCategory(trimmedName, categories, editingCategory?._id)
  if (error) {
    toast({ title: "Validation Error", description: error, variant: "destructive" })
    return
  }

  try {
    if (editingCategory) {
      // Update category
      const updated = await api.assetCategories.update(editingCategory._id, { name: trimmedName })
      if (updated) {
        setCategories(categories.map((cat) => (cat._id === updated._id ? updated : cat)))
      }
    } else {
      // Create category
      const newCategory = await api.assetCategories.create({ name: trimmedName, isActive: true })
      setCategories([...categories, newCategory])
    }

    toast({ title: "Success", description: "Asset category saved successfully" })
    setIsDialogOpen(false)
    resetForm()
    
  } catch (err: any) {
    toast({
      title: "Error",
      description: err?.message || "Failed to save category",
      variant: "destructive"
    })
  }
}
const filteredCategories = categories
  .filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter(cat => {
    if (statusFilter === "active") return cat.isActive
    if (statusFilter === "inactive") return !cat.isActive
    return true
  })

  const resetForm = () => {
    setCategoryName("")
    setEditingCategory(null)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (category: Category) => {
    const updated = await api.assetCategories.update(category._id, { isActive: !category.isActive })
    if (updated) {
      setCategories(categories.map((cat) => (cat._id === updated._id ? updated : cat)))
      toast({ title: "Success", description: `Category ${updated.isActive ? "activated" : "deactivated"}` })
    }
  }

  const handleDelete = async (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      await api.assetCategories.delete(category._id)
      setCategories(categories.filter((cat) => cat._id !== category._id))
      toast({ title: "Success", description: "Category deleted successfully" })
    }
  }
    if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Asset categories...</p>
        </div>
      </div>
    )
  }

  if (!hasPermission("tenant_settings")) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to manage asset categories.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
        <h1 className="text-2xl font-bold text-gray-900">Asset Categories</h1>
        <p className="text-gray-600">Manage categories for asset classification</p>
        </div>
        
      {/* Add Button */}
      <Button
        onClick={() => {
          resetForm()
          setIsDialogOpen(true)
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Category
      </Button>
      </div>

        <Card>
<CardHeader>
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <div>
      <CardTitle>Category List ({filteredCategories.length})</CardTitle>
      <CardDescription>Create and manage asset categories for your organization</CardDescription>
      </div>
      
    </div>

    <div className="flex items-center gap-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-72"
        />
      </div>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border rounded-lg px-2  py-3 text-sm"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  </div>
</CardHeader>

          <CardContent>
            <div className="space-y-2">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No asset categories found</p>
                  <p className="text-sm">Click "Add Category" to create one</p>
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <div key={category._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-500">
                          Created {new Date(category.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(category)}
                      >
                        {category.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      {/* <Button variant="ghost" size="sm" onClick={() => handleDelete(category)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button> */}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the category name" : "Create a new asset category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                placeholder="e.g., Laptops, Vehicles, Office Equipment"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
