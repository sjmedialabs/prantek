"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Receipt, Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { api } from "@/lib/api-client"

interface Category {
  _id: string
  name: string
  isEnabled: boolean
}

export default function ReceiptCategoriesPage() {
  const { hasPermission } = useUser()

  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const list = await api.receiptCategories.getAll()
    setCategories(list)
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    await api.receiptCategories.create({ name: newCategory })
    await loadCategories()
    setNewCategory("")
  }

  const handleToggleEnabled = async (id: string, current: boolean) => {
    const updated = await api.receiptCategories.update(id, { isEnabled: !current })
    setCategories(categories.map(c => (c._id === id ? updated : c)))
  }

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return
    const updated = await api.receiptCategories.update(id, { name: editingName })
    setCategories(categories.map(c => (c._id === id ? updated : c)))
    setEditingId(null)
    setEditingName("")
  }

  const handleDeleteCategory = async (id: string) => {
    await api.receiptCategories.delete(id)
    setCategories(categories.filter((c) => c._id !== id))
  }

  if (!hasPermission("tenant_settings")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Receipt Categories</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Receipt Categories
          </CardTitle>
          <CardDescription>Add and manage receipt categories</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category"
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <Button onClick={handleAddCategory}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category?._id} className="flex items-center justify-between p-3 border rounded">
                {editingId === category?._id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 mr-2"
                      autoFocus
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleSaveEdit(category?._id)}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{category?.name}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={category?.isEnabled}
                        onCheckedChange={() => handleToggleEnabled(category?._id, category?.isEnabled)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(category?._id)
                        setEditingName(category?.name)
                      }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
