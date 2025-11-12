"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react"
import { api } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { MemberType } from "@/lib/models/types"

export default function MemberTypesPage() {
  const [memberTypes, setMemberTypes] = useState<MemberType[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<MemberType | null>(null)

  const [form, setForm] = useState({
    name: "",
  })

  useEffect(() => {
    loadMemberTypes()
  }, [])

  const loadMemberTypes = async () => {
    const types = await api.memberTypes.getAll()
    setMemberTypes(types)
  }


  const generateUniqueCode = (name: string) => {
    // Generate base code from name
    let baseCode = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);

    // Add unique identifier (timestamp + random)
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    return `${baseCode}_${uniqueId}`;
  }

const handleSubmit = async () => {
  if (!form.name) {
    toast.error("Missing Information", "Please fill in the name field")
    return
  }

  // ✅ Check duplicate name
  const isDuplicate = memberTypes.some(
    (t) =>
      t.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
      (!editingType || editingType._id !== t._id) // allow same name for the one being edited
  )

  if (isDuplicate) {
    toast.error("Duplicate Type", "A member type with this name already exists")
    return
  }

  try {
    if (editingType) {
      // ✅ UPDATE
      await api.memberTypes.update(editingType._id, form)

      toast.success(
        "Employment Type Updated",
        `${form.name} has been updated successfully`
      )
    } else {
      // ✅ CREATE
      await api.memberTypes.create(form)

      toast.success(
        "Employment Type Created",
        `${form.name} has been added to employment types`
      )
    }

    await loadMemberTypes()
    resetForm()
    setIsAddDialogOpen(false)
  } catch (err: any) {
    toast.error(
      "Error",
      err?.message || "Failed to save employment type"
    )
  }
}


  const handleEdit = (type: MemberType) => {
    setEditingType(type)
    setForm({
      name: type.name,
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const type = memberTypes.find((t) => t.id === id)
    if (confirm("Are you sure you want to delete this employment type?")) {
      await api.memberTypes.delete(id)
      await loadMemberTypes()
      if (type) {
        toast.success("Employment Type Deleted", `${type.name} has been removed`)
      }
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    console.log("toggleActive", id, isActive)
    try {
      const updated = await api.memberTypes.toggle(id, isActive)

      setMemberTypes((prev) =>
        prev.map((type) =>
          type.id === id ? { ...type, isActive } : type
        )

      )
      toast({ title: "Success", description: "status updated successfully!" })   // ✅ ADDED
    } catch (err: any) {
      toast({ title: "Notification", description: "Failed to update status: " + (err.message || "Something went wrong"), variant: "default" })   // ✅ ADDED
    }
  }



  const resetForm = () => {
    setForm({
      name: "",
    })
    setEditingType(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employment Type</h1>
          <p className="text-gray-600">Configure employment types for your organization</p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employment Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? "Edit Employment Type" : "Add Employment Type"}</DialogTitle>
              <DialogDescription>
                {editingType ? "Update employment type details" : "Create a new employment type for your organization"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Employment Type Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Full-time, Part-time, Contract"
                />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {editingType ? "Update Employment Type" : "Create Employment Type"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employment Types</CardTitle>
          <CardDescription>Manage different types of employment in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(type?.id || "")}
                      title={type.isActive === false ? "Enable" : "Disable"}
                    >
                      {type.isActive === false ? (
                        <Power className="h-4 w-4 text-green-500" />
                      ) : (
                        <PowerOff className="h-4 w-4 text-red-500" />
                      )}
                    </Button> */}
                      {/* <Switch
                        checked={!!type.isActive}   // ✅ ensures boolean
                        onCheckedChange={(checked) => toggleActive(type?._id, checked)}
                      disabled={type.isSystem || type.userCount > 0}
                      /> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
