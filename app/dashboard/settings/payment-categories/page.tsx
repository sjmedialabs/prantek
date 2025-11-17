"use client"
import { toast } from "@/lib/toast"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Save, Plus, Edit2, Power, PowerOff, Search } from "lucide-react"
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
  isActive: boolean // Added isActive field
  createdAt: string
  updatedAt: string
}

export default function PaymentCategoriesPage() {
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
const validateCategoryName = (name: string, list: Category[], editingId?: string) => {
  if (!name || name.trim().length < 2) {
    return "Category name must be at least 2 characters."
  }

  const duplicate = list.some(
    (cat) =>
      cat.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      cat._id !== editingId
  )

  if (duplicate) return "Category name already exists."

  return null
}

const loadCategories = async () => {
  const data = await api.paymentCategories.getAll()

  // ✅ Always load only what exists in DB
  setCategories(data ?? [])
}

const filteredCategories = categories
  .filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter((cat) => {
    if (statusFilter === "active") return cat.isActive
    if (statusFilter === "inactive") return !cat.isActive
    return true
  })

const handleSave = async () => {
  const trimmedName = categoryName.trim()

  // 🔥 Validate before saving
  const error = validateCategoryName(trimmedName, categories, editingCategory?._id)
  if (error) {
    toast({ title: "Validation Error", description: error, variant: "destructive" })
    return
  }

  console.log("Editing category:", editingCategory?._id)

  if (editingCategory) {
    // Update existing category
    const updated = await api.paymentCategories.update(editingCategory._id, {
      name: trimmedName,
    })

    if (updated) {
      setCategories(categories.map((cat) => (cat._id === updated._id ? updated : cat)))
    }
  } else {
    // Create new category
    const newCategory = await api.paymentCategories.create({
      name: trimmedName,
      isActive: true,
    })

    setCategories([...categories, newCategory])
  }

  setSaved(true)
  setTimeout(() => setSaved(false), 3000)
  setIsDialogOpen(false)
  toast({ title: "Success", description: "Category saved successfully" })
  resetForm()
}


  const resetForm = () => {
    setCategoryName("")
    setEditingCategory(null)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setIsDialogOpen(true)
  }

  const handleToggleStatus = async (category: Category) => {
    console.log("Toggling status for category:", category._id)
    const updated = await api.paymentCategories.update( category._id, {
      isActive: !category.isActive,
    })
    if (updated) {
      setCategories(categories.map((cat) => (cat._id === updated._id ? updated : cat)))
    }
    toast({ title: "Success", description: "Category status updated successfully!" })
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
          <h1 className="text-2xl font-bold text-gray-900">Ledger Heads</h1>
          <p className="text-gray-600">Manage Ledger for payment classification</p>
        </div>
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

      {saved && (
        <Alert>
          <AlertDescription>Ledger Head saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
<CardHeader>
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <CardTitle>Categories List ({filteredCategories.length})</CardTitle>
      <CardDescription>Manage Ledger Heads used inside the application</CardDescription>
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
        className="border rounded-lg p-3 text-sm"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  </div>
</CardHeader>

        <CardContent className="space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No Ledger Heads added yet. Click "Add Ledger" to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCategories.filter(cat => cat && (cat._id || cat.id)).map((category) => (
                <div
                  key={category._id || category.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${category?.isActive ? "" : "opacity-50 bg-gray-50"}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{category?.name}</span>
                    <Badge variant={category?.isActive ? "default" : "secondary"}>
                      {category?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(category)}>
                      {category?.isActive ? (
                        <PowerOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Power className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the category name" : "Create a new payment category"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name"
                onKeyPress={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {editingCategory ? "Update Category" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
