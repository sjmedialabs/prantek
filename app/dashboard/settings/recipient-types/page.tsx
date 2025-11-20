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
import { Plus, Edit, CheckCircle2, XCircle, PowerOff, Power } from "lucide-react"
import { api } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/components/auth/user-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface RecipientType {
  _id?: string
  id?: string
  name: string
  value: string
  isEnabled: boolean
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
        // const defaults = [
        //   { name: "Client", value: "client" },
        //   { name: "Vendor", value: "vendor" },
        //   { name: "Team Member", value: "team" },
        // ]

        // for (const defaultType of defaults) {
        //   await api.recipientTypes.create({ ...defaultType, isEnabled: true })
        // }

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
    // Duplicate name protection
    const duplicate = recipientTypes.some(
      (t) =>
        t.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
        t._id !== editingType?._id
    )

    if (duplicate) {
      toast({
        title: "Duplicate Name",
        description: "This party type name already exists.",
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
        await api.recipientTypes.create({ ...formData, isEnabled: true })
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
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const startIndex = (page - 1) * itemsPerPage
  const paginatedData = recipientTypes.slice(startIndex, startIndex + itemsPerPage)
  const totalPages = Math.ceil(recipientTypes.length / itemsPerPage)

  const handleToggleStatus = async (type: RecipientType) => {
    try {
      const id = type._id || type.id
      if (!id) throw new Error("No ID found")
      await api.recipientTypes.update(id, { isEnabled: !type.isEnabled })
      toast({
        title: "Success",
        description: `Recipient type ${type.isEnabled ? "deactivated" : "activated"} successfully`,
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

          {/* Table Wrapper */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">S.No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      No Party Types Found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((type, index) => (
                    <TableRow key={type._id || type.id}>
                      <TableCell>{startIndex + index + 1}</TableCell>

                      <TableCell className="font-medium">{type.name}</TableCell>

                      <TableCell>
                        <Badge variant="outline">{type.value}</Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={type.isEnabled ? "default" : "secondary"}>{type.isEnabled ? "Active" : "Inactive"}</Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(type)}
                            title={type.isEnabled ? "Deactivate" : "Activate"}
                          >
                            {type.isEnabled ? (
                              <PowerOff className="h-4 w-4 text-red-500" />
                            ) : (
                              <Power className="h-4 w-4 text-green-500" />
                            )}
                          </Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>

              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
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
