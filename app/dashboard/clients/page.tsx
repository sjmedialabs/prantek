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
import { BulkUploadDialogClient } from "@/components/admin/bulk-upload-clients"

export default function ClientsPage() {
  const { hasPermission, loading } = useUser()
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10  // ← Updated: Now 10 items per page

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
    note: "",
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
      note: "",
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
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number"
      isValid = false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
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
        pan: formData.pan,
        note: formData.note,
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
      setCurrentPage(1) // Reset to first page after add/edit
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
      contactName: client.name || "",
      gst: client.gst || "",
      pan: client.pan || "",
      note: client.note || "",
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
        setCurrentPage(1) // Reset pagination after delete
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
      const today = new Date()
      const created = clientDate
      const diffInDays = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

      if (dateFilter === "today") matchesDate = diffInDays === 0
      else if (dateFilter === "week") matchesDate = diffInDays <= 7
      else if (dateFilter === "month") matchesDate = diffInDays <= 30
    }

    return matchesSearch && matchesDate
  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
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

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">Manage customers and vendors</p>
        </div>
        {(hasPermission("add_clients") || hasPermission("edit_clients")) && (
          <div className="flex gap-4">
          {
            (hasPermission("add_clients")) && (
               <BulkUploadDialogClient onSuccess={loadClients} />
            )
          }
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
            {
              (hasPermission("add_clients")) && (
                <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
              )
            }
            <DialogContent className="!w-[90vw] sm:max-w-[90vw] h-[95vh] flex flex-col p-0 gap-0">
              <div className="sticky top-0 bg-white border-b px-6 py-4 z-20">
                <DialogHeader>
                  <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                  <DialogDescription>
                    {editingClient ? "Update client information" : "Create a new client record"}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
                <form onSubmit={handleSubmit} className="space-y-5 pb-20" id="client-form">
                  <div className="pb-4">
                    <Label className="text-sm font-medium">Client Type</Label>
                    <Select value={clientType} onValueChange={(v) => setClientType(v as "individual" | "company")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select client type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" /> Individual
                          </div>
                        </SelectItem>
                        <SelectItem value="company">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Company
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {clientType === "individual" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="ind-name" required>Client Name </Label>
                        <Input
                          id="ind-name"
                          value={formData.name}
                          placeholder="Client name"
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
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
                  )}

                  {clientType === "company" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="comp-name" required>Company Name </Label>
                          <Input
                            id="comp-name"
                            value={formData.companyName}
                            placeholder="Company Name"
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          />
                          {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="contact-name" required>Contact Name </Label>
                          <Input
                            id="contact-name"
                            value={formData.contactName}
                            placeholder="Contact Holder Name"
                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          />
                          {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName}</p>}
                        </div>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="phone" required>Phone </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        placeholder="Enter a valid 10-digit Indian mobile number"
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email" required>Email </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter a valid email address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                      {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="address" required>Address </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      placeholder="Enter address"
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
                        placeholder="Enter state"
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                      {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="city" required>City </Label>
                      <Input
                        id="city"
                        value={formData.city}
                        placeholder="Enter city"
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                      {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pincode" required>Pincode </Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        placeholder="Enter pincode"
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      />
                      {errors.pincode && <p className="text-red-500 text-sm">{errors.pincode}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="note">Note </Label>
                    <Textarea
                      id="note"
                      value={formData.note}
                      placeholder="Enter note"
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      rows={2}
                    />
                    {/* {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>} */}
                  </div>
                </form>
              </div>

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
          </div>
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
                  <TableHead>Sr No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Name / Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  {(hasPermission("add_clients") || hasPermission("edit_clients")) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={hasPermission("add_clients") || hasPermission("edit_clients") ? 7 : 6} className="text-center py-12 text-gray-500">
                      No clients found. Add your first client to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClients.map((client, index) => (
                    <TableRow key={client._id}>
                      <TableCell>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
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
                      {(hasPermission("add_clients") || hasPermission("edit_clients")) && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Link href={`/dashboard/clients/${client._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {
                              (hasPermission("edit_clients")) && (
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                              )
                            }
                            {
                              (hasPermission("edit_clients")) && (
                                 <Switch
                              checked={client.status === "active"}
                              onCheckedChange={async (checked) => {
                                try {
                                  const newStatus = checked ? "active" : "inactive"
                                  await api.clients.updateStatus(client._id, newStatus)
                                  toast.success("Status Updated", `${client.name || client.companyName} is now ${newStatus}`)
                                  await loadClients()
                                } catch (err) {
                                  toast.error("Error", "Failed to update status")
                                }
                              }}
                            />
                              )
                            }
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {filteredClients.length > itemsPerPage && (
              <div className="flex items-center justify-between px-4 py-4 border-t bg-gray-50">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>

                <div className="text-sm text-gray-700">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> 
                  {" "} ({filteredClients.length} total clients)
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}