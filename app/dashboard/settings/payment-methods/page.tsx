"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Save, Plus, Trash2, Edit2, Check, X, CreditCard } from "lucide-react"
import { api } from "@/lib/api-client"
import { toast } from "@/lib/toast"

interface PaymentMethod {
  _id?: string
  name: string
  isEnabled: boolean
}

export default function PaymentMethodsPage() {
  const { loading, hasPermission } = useUser()

  const [saved, setSaved] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [newMethod, setNewMethod] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  // ✅ Load payment methods
  useEffect(() => {
    const loadData = async () => {
      const data = await api.paymentMethods.getAll()
      console.log("Loaded payment methods:", data)
      setPaymentMethods(data ?? [])
    }
    loadData()
  }, [])
  const validateMethodName = (name: string, list: PaymentMethod[], editingId?: string) => {
  if (!name || name.trim().length < 2) return "Name must be at least 2 characters."

  const exists = list.some(
    (m) =>
      m.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      m._id !== editingId
  )

  if (exists) return "A payment method with this name already exists."

  return null
}


  // ✅ Add New Method → DB
const handleAddMethod = async () => {
  const trimmed = newMethod.trim()

  const error = validateMethodName(trimmed, paymentMethods)
  if (error) {
    toast({ title: "Validation Error", description: error, variant: "destructive" })
    return
  }

  const created = await api.paymentMethods.create({
    name: trimmed,
    isEnabled: true,
  })

  if (created) {
    setPaymentMethods([...paymentMethods, created])
    setNewMethod("")
  }
}


  // ✅ Delete Method → DB
  const handleDeleteMethod = async (id: string) => {
    await api.paymentMethods.delete(id)
    setPaymentMethods(paymentMethods.filter((m) => m._id !== id))
  }

  // ✅ Toggle Enabled → DB
  const handleToggleEnabled = async (id: string, current: boolean) => {
    const updated = await api.paymentMethods.update(id, { isEnabled: !current })

    if (updated) {
      setPaymentMethods(paymentMethods.map((m) => (m._id === id ? updated : m)))
    }
  }

  const handleStartEdit = (method: PaymentMethod) => {
    setEditingId(method._id!!)
    setEditingName(method.name)
  }

  // ✅ Edit name → DB
const handleSaveEdit = async (id: string) => {
  const trimmed = editingName.trim()

  const error = validateMethodName(trimmed, paymentMethods, id)
  if (error) {
    toast({ title: "Validation Error", description: error, variant: "destructive" })
    return
  }

  const updated = await api.paymentMethods.update(id, {
    name: trimmed,
  })

  if (updated) {
    setPaymentMethods(paymentMethods.map((m) => (m._id === id ? updated : m)))
  }

  setEditingId(null)
  setEditingName("")
}


  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName("")
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
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600">Manage available payment methods</p>
        </div>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Payment methods saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Methods List ({paymentMethods.length})
          </CardTitle>
          <CardDescription>Add and manage accepted payment methods</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add Input */}
          <div className="flex space-x-2">
            <Input
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              placeholder="Enter new payment method name"
              onKeyDown={(e) => e.key === "Enter" && handleAddMethod()}
            />
            <Button onClick={handleAddMethod}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* List */}
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div
                key={method._id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  !method.isEnabled ? "bg-gray-50 opacity-60" : ""
                }`}
              >
                {editingId === method._id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 mr-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(method._id!!)
                        if (e.key === "Escape") handleCancelEdit()
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleSaveEdit(method._id!!)}>
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
                      <span className={`font-medium ${!method.isEnabled ? "text-gray-500" : ""}`}>
                        {method.name}
                      </span>
                      {!method.isEnabled && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Disabled</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleStartEdit(method)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={method.isEnabled}
                        onCheckedChange={() => handleToggleEnabled(method._id!!, method.isEnabled)}
                      />
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
