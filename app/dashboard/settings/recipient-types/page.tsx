"use client"
import { toast } from "@/lib/toast"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, CheckCircle2, XCircle } from "lucide-react"
import { api } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/components/auth/user-context"

interface RecipientType {
  _id?: string
  id?: string
  name: string
  value: string
  isActive: boolean
}

export default function RecipientTypesPage() {
  const { hasPermission } = useUser()
  const [recipientTypes, setRecipientTypes] = useState<RecipientType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<RecipientType | null>(null)
  const [formData, setFormData] = useState({ name: "", value: "" })

  useEffect(() => {
    loadRecipientTypes()
  }, [])

  const loadRecipientTypes = async () => {
    try {
      const data = await api.recipientTypes.getAll()
      if (!data || data.length === 0) {
        // Seed default recipient types
        const defaults = [
          { name: "Client", value: "client" },
          { name: "Vendor", value: "vendor" },
          { name: "Team Member", value: "team" },
        ]
        
        for (const defaultType of defaults) {
          await api.recipientTypes.create({ ...defaultType, isActive: true })
        }
        
        const newData = await api.recipientTypes.getAll()
        setRecipientTypes(newData)
      } else {
        setRecipientTypes(data)
      }
    } catch (error) {
      console.error("Failed to load recipient types:", error)
      toast({
        title: "Error",
        description: "Failed to load recipient types",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.value.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingType) {
        const id = editingType._id || editingType.id
        if (!id) throw new Error("No ID found")
        await api.recipientTypes.update(id, formData)
        toast({
          title: "Success",
          description: "Recipient type updated successfully",
        })
      } else {
        await api.recipientTypes.create({ ...formData, isActive: true })
        toast({
          title: "Success",
          description: "Recipient type created successfully",
        })
      }
      setIsDialogOpen(false)
      setFormData({ name: "", value: "" })
      setEditingType(null)
      await loadRecipientTypes()
    } catch (error) {
      console.error("Failed to save recipient type:", error)
      toast({
        title: "Error",
        description: "Failed to save recipient type",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (type: RecipientType) => {
    setEditingType(type)
    setFormData({ name: type.name, value: type.value })
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingType(null)
    setFormData({ name: "", value: "" })
    setIsDialogOpen(true)
  }

  const handleToggleStatus = async (type: RecipientType) => {
    try {
      const id = type._id || type.id
      if (!id) throw new Error("No ID found")
      await api.recipientTypes.update(id, { isActive: !type.isActive })
      toast({
        title: "Success",
        description: `Recipient type ${type.isActive ? "deactivated" : "activated"} successfully`,
      })
      await loadRecipientTypes()
    } catch (error) {
      console.error("Failed to toggle recipient type status:", error)
      toast({
        title: "Error",
        description: "Failed to update recipient type status",
        variant: "destructive",
      })
    }
  }

  if (!hasPermission("tenant_settings")) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don&apos;t have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Party Types</h1>
          <p className="text-muted-foreground">Manage Part types for payments</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Part Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Types List ({recipientTypes.length})</CardTitle>
          <CardDescription>Manage types for payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recipientTypes.map((type) => (
              <div
                key={type?._id || type?.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{type.name}</span>
                  <Badge variant="outline">{type.value}</Badge>
                  {type.isActive ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(type)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={type.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleStatus(type)}
                  >
                    {type.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? "Edit Recipient Type" : "Add Recipient Type"}</DialogTitle>
            <DialogDescription>
              {editingType ? "Update the recipient type details" : "Create a new recipient type"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Client, Vendor"
              />
            </div>
            <div>
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g., client, vendor"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
