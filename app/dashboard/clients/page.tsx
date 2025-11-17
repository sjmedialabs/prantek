"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Eye, Building2, User } from "lucide-react"
import { api } from "@/lib/api-client"
import type { Client } from "@/lib/models/types"
import { toast } from "@/lib/toast"
import { Switch } from "@/components/ui/switch"
import { ObjectId } from "mongodb"

export default function ClientsPage() {
  const { hasPermission, loading } = useUser()
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  // Client Type
  const [clientType, setClientType] = useState<"individual" | "company">("individual")

  // Form Data
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    name: "",
    companyName: "",
    contactName: "",
    gst: "",
    pan: "",
  })

  const [errors, setErrors] = useState({
    name: "",
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    gst: "",
    pan: "",
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    const data = await api.clients.getAll()
    setClients(data)
  }

  const resetForm = () => {
    setClientType("individual")
    setFormData({
      email: "",
      phone: "",
      address: "",
      state: "",
      city: "",
      pincode: "",
      name: "",
      companyName: "",
      contactName: "",
      gst: "",
      pan: "",
    })
    setErrors({
      name: "",
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      state: "",
      city: "",
      pincode: "",
      gst: "",
      pan: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const localStored = localStorage.getItem("loginedUser")
    const parsed = localStored ? JSON.parse(localStored) : null

    let newErrors = {
      name: "",
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      state: "",
      city: "",
      pincode: "",
      gst: "",
      pan: "",
    }
    let isValid = true

    // Common Validations
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number"
      isValid = false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address"
      isValid = false
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required"
      isValid = false
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required"
      isValid = false
    }
    const pincodeRegex = /^\d{6}$/
    if (!pincodeRegex.test(formData.pincode)) {
      newErrors.pincode = "Enter a valid 6-digit pincode"
      isValid = false
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
      isValid = false
    }

    // Individual
    if (clientType === "individual") {
      if (!formData.name.trim()) {
        newErrors.name = "Client name is required"
        isValid = false
      }
    }

    // Company
    if (clientType === "company") {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Company name is required"
        isValid = false
      }
      if (!formData.contactName.trim()) {
        newErrors.contactName = "Contact name is required"
        isValid = false
      }
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (formData.gst && !gstRegex.test(formData.gst)) {
        newErrors.gst = "Enter a valid GST number"
        isValid = false
      }
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (formData.pan && !panRegex.test(formData.pan)) {
        newErrors.pan = "Enter a valid PAN number"
        isValid = false
      }
    }

    setErrors(newErrors)
    if (!isValid) return

    try {
      const payload: any = {
        type: clientType,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        userId: parsed.id,
        status: "active",
      }

      if (clientType === "individual") {
        payload.name = formData.name
      } else {
        payload.companyName = formData.companyName
        payload.name = formData.contactName
        if (formData.gst) payload.gst = formData.gst
        if (formData.pan) payload.pan = formData.pan
      }

      if (editingClient) {
        await api.clients.update(editingClient._id, payload)
        toast.success("Client Updated", "Client updated successfully")
      } else {
        await api.clients.create(payload)
        toast.success("Client Added", "New client added successfully")
      }

      await loadClients()
      setIsDialogOpen(false)
      setEditingClient(null)
      resetForm()
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Failed to save client")
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setClientType(client.type || "individual")

    setFormData({
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      state: client.state || "",
      city: client.city || "",
      pincode: client.pincode || "",
      name: client.name || "",
      companyName: client.companyName || "",
      contactName: client.contactName || "",
      gst: client.gst || "",
      pan: client.pan || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const client = clients.find((c) => c._id === id)
    if (confirm("Are you sure you want to delete this client?")) {
      try {
        await api.clients.delete(id)
        toast.success("Client Deleted", `${client?.name || client?.companyName} removed`)
        await loadClients()
      } catch (error) {
        toast.error("Error", "Failed to delete client")
      }
    }
  }

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      (client.name?.toLowerCase() || "").includes(searchLower) ||
      (client.companyName?.toLowerCase() || "").includes(searchLower) ||
      (client.email?.toLowerCase() || "").includes(searchLower) ||
      (client.phone?.toLowerCase() || "").includes(searchLower)

    let matchesDate = true
    if (dateFilter !== "all") {
      const clientDate = new Date(client.createdAt)
      const today = new Date().toISOString().split("T")[0]
      const created = clientDate.toISOString().split("T")[0]
      const diffInDays = (new Date(today).getTime() - new Date(created).getTime()) / (1000 * 60 * 60 * 24)

      if (dateFilter === "today") matchesDate = diffInDays === 0
      else if (dateFilter === "week") matchesDate = diffInDays <= 7
      else if (dateFilter === "month") matchesDate = diffInDays <= 30
    }

    return matchesSearch && matchesDate
  })
    if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotations...</p>
        </div>
      </div>
    )
  }
  if (!hasPermission("view_clients")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view clients.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">Manage customers and vendors</p>
        </div>
        {hasPermission("manage_clients") && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) {
                setEditingClient(null)
                resetForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
           <DialogContent className="!w-[90vw] sm:max-w-[90vw] h-[95vh] flex flex-col p-0 gap-0">
  {/* Sticky Header */}
  <div className="sticky top-0 bg-white border-b px-6 py-4 z-20">
    <DialogHeader>
      <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
      <DialogDescription>
        {editingClient ? "Update client information" : "Create a new client record"}
      </DialogDescription>
    </DialogHeader>
  </div>

  {/* Scrollable Form Area */}
  <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
    <form onSubmit={handleSubmit} className="space-y-5 pb-20" id="client-form">
      {/* ────── Client Type Toggle ────── */}
      <div className="flex gap-4 border-b pb-4">
        <Button
          type="button"
          variant={clientType === "individual" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setClientType("individual")}
        >
          <User className="h-4 w-4 mr-2" />
          Individual
        </Button>
        <Button
          type="button"
          variant={clientType === "company" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setClientType("company")}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Company
        </Button>
      </div>

      {/* ────── Individual Fields ────── */}
      {clientType === "individual" && (
        <div className="space-y-1">
          <Label htmlFor="ind-name" required>Client Name </Label>
          <Input
            id="ind-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>
      )}

      {/* ────── Company Fields ────── */}
      {clientType === "company" && (
        <>
          <div className="space-y-1">
            <Label htmlFor="comp-name" required>Company Name </Label>
            <Input
              id="comp-name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
            {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact-name" required>Contact Name </Label>
            <Input
              id="contact-name"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            />
            {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="gst">GST</Label>
              <Input
                id="gst"
                value={formData.gst}
                onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
              />
              {errors.gst && <p className="text-red-500 text-sm">{errors.gst}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
              />
              {errors.pan && <p className="text-red-500 text-sm">{errors.pan}</p>}
            </div>
          </div>
        </>
      )}

      {/* ────── Common Fields ────── */}
      <div className="space-y-1">
        <Label htmlFor="phone" required>Phone </Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email" required>Email </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="address" required>Address </Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={2}
        />
        {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="state" required>State </Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
          {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="city" required>City </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="pincode" required>Pincode </Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
          />
          {errors.pincode && <p className="text-red-500 text-sm">{errors.pincode}</p>}
        </div>
      </div>
    </form>
  </div>

  {/* Footer – now inside the scrollable container, no fixed positioning */}
  <div className="bg-white border-t px-6 py-4">
    <div className="flex justify-end space-x-2 max-w-[90vw] mx-auto">
      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
        Cancel
      </Button>
      <Button type="submit" form="client-form">
        {editingClient ? "Update" : "Create"} Client
      </Button>
    </div>
  </div>
</DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            All Clients ({filteredClients.length})
          </CardTitle>
          <CardDescription>Customer and vendor records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, company, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name / Company</TableHead>
                
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  {hasPermission("manage_clients") && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No clients found. Add your first client to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client._id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {client.type === "company" ? (
                            <>
                              <Building2 className="h-3.5 w-3.5" />
                              <span className="text-xs">Company</span>
                            </>
                          ) : (
                            <>
                              <User className="h-3.5 w-3.5" />
                              <span className="text-xs">Individual</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {client.type === "company" ? client.companyName : client.name}
                      </TableCell>
                      
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                      {hasPermission("manage_clients") && (
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={`/dashboard/clients/${client._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Switch
                              checked={client.status === "active"}
                              onCheckedChange={async (checked) => {
                                try {
                                  const newStatus = checked ? "active" : "inactive"
                                  await api.clients.updateStatus(client?._id, newStatus)
                                  toast.success("Status Updated", `${client.name || client.companyName} is now ${newStatus}`)
                                  await loadClients()
                                } catch (err) {
                                  toast.error("Error", "Failed to update status")
                                }
                              }}
                            />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}