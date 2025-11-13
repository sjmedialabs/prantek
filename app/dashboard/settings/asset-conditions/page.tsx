"use client"
import { toast } from "@/lib/toast"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Activity, Save, Plus, Edit2, Power, PowerOff, Trash2, Search } from "lucide-react"
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

interface Condition {
  _id: string
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AssetConditionsPage() {
  const { loading, hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [conditions, setConditions] = useState<Condition[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCondition, setEditingCondition] = useState<Condition | null>(null)
  const [conditionName, setConditionName] = useState("")
const [searchTerm, setSearchTerm] = useState("")
const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadConditions()
  }, [])

  const loadConditions = async () => {
    const data = await api.assetConditions.getAll()
    if (data.length === 0) {
      // Initialize with default conditions
      const defaultConditions = ["Excellent", "Good", "Fair", "Poor", "Damaged"]
      for (const name of defaultConditions) {
        await api.assetConditions.create({ name, isActive: true })
      }
      const newData = await api.assetConditions.getAll()
      setConditions(newData)
    } else {
      setConditions(data)
    }
  }
  const filteredConditions = conditions
  .filter((cond) =>
    cond.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter((cond) => {
    if (statusFilter === "active") return cond.isActive
    if (statusFilter === "inactive") return !cond.isActive
    return true
  })

  const handleSave = async () => {
    if (!conditionName.trim()) {
      toast({ title: "Validation Error", description: "Please enter a condition name", variant: "destructive" })
      return
    }

    if (editingCondition) {
      const updated = await api.assetConditions.update(editingCondition._id, { name: conditionName })
      if (updated) {
        setConditions(conditions.map((cond) => (cond._id === updated._id ? updated : cond)))
      }
    } else {
      const newCondition = await api.assetConditions.create({ name: conditionName, isActive: true })
      setConditions([...conditions, newCondition])
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setIsDialogOpen(false)
    toast({ title: "Success", description: "Asset condition saved successfully" })
    resetForm()
  }

  const resetForm = () => {
    setConditionName("")
    setEditingCondition(null)
  }

  const handleEdit = (condition: Condition) => {
    setEditingCondition(condition)
    setConditionName(condition.name)
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (condition: Condition) => {
    const updated = await api.assetConditions.update(condition._id, { isActive: !condition.isActive })
    if (updated) {
      setConditions(conditions.map((cond) => (cond._id === updated._id ? updated : cond)))
      toast({ title: "Success", description: `Condition ${updated.isActive ? "activated" : "deactivated"}` })
    }
  }

  const handleDelete = async (condition: Condition) => {
    if (confirm(`Are you sure you want to delete "${condition.name}"?`)) {
      await api.assetConditions.delete(condition._id)
      setConditions(conditions.filter((cond) => cond._id !== condition._id))
      toast({ title: "Success", description: "Condition deleted successfully" })
    }
  }
      if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Asset Conditions...</p>
        </div>
      </div>
    )
  }

  if (!hasPermission("tenant_settings")) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to manage asset conditions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
        <h1 className="text-2xl font-bold text-gray-900">Asset Conditions</h1>
        <p className="text-gray-600">Manage condition statuses for asset tracking</p>
        </div>
                    <Button
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Condition List ({filteredConditions.length})</CardTitle>
              <CardDescription>Create and manage asset condition statuses</CardDescription>
            </div>
            
    <div className="flex items-center gap-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search conditions..."
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
            {filteredConditions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No asset conditions found</p>
                <p className="text-sm">Click "Add Condition" to create one</p>
              </div>
            ) : (
              filteredConditions.map((condition) => (
                <div key={condition._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{condition.name}</p>
                      <p className="text-sm text-gray-500">
                        Created {new Date(condition.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={condition.isActive ? "default" : "secondary"}>
                      {condition.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(condition)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(condition)}
                    >
                      {condition.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                    {/* <Button variant="ghost" size="sm" onClick={() => handleDelete(condition)}>
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
            <DialogTitle>{editingCondition ? "Edit Condition" : "Add New Condition"}</DialogTitle>
            <DialogDescription>
              {editingCondition ? "Update the condition name" : "Create a new asset condition status"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conditionName">Condition Name</Label>
              <Input
                id="conditionName"
                placeholder="e.g., New, Like New, Used, Needs Repair"
                value={conditionName}
                onChange={(e) => setConditionName(e.target.value)}
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
