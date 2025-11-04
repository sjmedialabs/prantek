"use client"

import { useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Receipt, Save, Plus, Trash2, Edit2, Check, X } from "lucide-react"

interface Category {
  id: string
  name: string
  enabled: boolean
}

export default function ReceiptCategoriesPage() {
  const { hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Miscellaneous", enabled: true },
    { id: "2", name: "Other", enabled: true },
  ])
  const [newCategory, setNewCategory] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, { id: Date.now().toString(), name: newCategory, enabled: true }])
      setNewCategory("")
    }
  }

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((cat) => cat.id !== id))
  }

  const handleToggleEnabled = (id: string) => {
    setCategories(categories.map((cat) => (cat.id === id ? { ...cat, enabled: !cat.enabled } : cat)))
  }

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      setCategories(categories.map((cat) => (cat.id === id ? { ...cat, name: editingName } : cat)))
      setEditingId(null)
      setEditingName("")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName("")
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
          <h1 className="text-2xl font-bold text-gray-900">Receipt Categories</h1>
          <p className="text-gray-600">Manage categories for receipt classification</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Receipt categories saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Receipt Categories
          </CardTitle>
          <CardDescription>Add and manage receipt categories for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter new category name"
              onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <Button onClick={handleAddCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  !category.enabled ? "bg-gray-50 opacity-60" : ""
                }`}
              >
                {editingId === category.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 mr-2"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSaveEdit(category.id)
                        if (e.key === "Escape") handleCancelEdit()
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleSaveEdit(category.id)}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`font-medium ${!category.enabled ? "text-gray-500" : ""}`}>{category.name}</span>
                      {!category.enabled && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Disabled</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={category.enabled} onCheckedChange={() => handleToggleEnabled(category.id)} />
                      <Button variant="ghost" size="sm" onClick={() => handleStartEdit(category)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
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
