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
import { Plus, Search, Edit, Eye, Store } from "lucide-react"
import { api } from "@/lib/api-client"
import type { Vendor } from "@/lib/models/types"
import { toast } from "@/lib/toast"
import { Switch } from "@/components/ui/switch"

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  "Other",
];

export default function VendorsPage() {
  const { hasPermission, loading } = useUser()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
    notes: "",
  })

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
  })

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    const data = await api.vendors.getAll()
    setVendors(data)
  }

  const resetForm = () =>
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
      pan: "",
      notes: "",
    })

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const localStored = localStorage.getItem("loginedUser")
  const parsed = localStored ? JSON.parse(localStored) : null

  let newErrors: any = {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
  }

  let isValid = true

  // --------- Name ---------
  if (!formData.name.trim()) {
    newErrors.name = "Vendor name is required"
    isValid = false
  }

  // --------- Email ---------
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (formData.email && !emailRegex.test(formData.email)) {
    newErrors.email = "Enter a valid email address"
    isValid = false
  }

  // --------- Phone ---------
  const phoneRegex = /^[6-9]\d{9}$/
  if (!phoneRegex.test(formData.phone)) {
    newErrors.phone = "Enter a valid 10-digit Indian mobile number"
    isValid = false
  }

  // --------- Address ---------
  // Optional: only validate if provided

  // --------- City ---------
  // Optional: only validate if provided

  // --------- State ---------
  if (!formData.state.trim()) {
    newErrors.state = "State is required"
    isValid = false
  }

  // --------- Pincode ---------
  const pincodeRegex = /^\d{6}$/
  if (formData.pincode && !pincodeRegex.test(formData.pincode)) {
    newErrors.pincode = "Enter a valid 6-digit pincode"
    isValid = false
  }

  // --------- GSTIN (optional but validate if entered) ---------
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  if (formData.gstin && !gstRegex.test(formData.gstin)) {
    newErrors.gstin = "Enter a valid GSTIN number"
    isValid = false
  }

  // --------- PAN (optional but validate if entered) ---------
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  if (formData.pan && !panRegex.test(formData.pan)) {
    newErrors.pan = "Enter a valid PAN number"
    isValid = false
  }

  setErrors(newErrors)
  if (!isValid) return

  try {
    const payload: any = {
      ...formData,
      userId: parsed?.id,
    }

    if (editingVendor) {
      if (!editingVendor._id) throw new Error("Vendor id not found")
      await api.vendors.update(String(editingVendor._id), payload)
      toast.success("Vendor Updated", "Vendor updated successfully")
    } else {
      payload.status = "active"
      await api.vendors.create(payload)
      toast.success("Vendor Added", "New vendor added successfully")
    }

    await loadVendors()
    setIsDialogOpen(false)
    setEditingVendor(null)
    resetForm()
  } catch (error) {
    toast.error("Error","Vendor with the same email or phone already exists" )
  }
}


  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      pincode: vendor.pincode || "",
      gstin: vendor.gstin || "",
      pan: vendor.pan || "",
      notes: vendor.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const vendor = vendors.find((v) => String(v._id) === id)
    if (confirm("Are you sure you want to delete this vendor?")) {
      try {
        await api.vendors.delete(id)
        toast.success("Vendor Deleted", `${vendor?.name} removed`)
        await loadVendors()
      } catch (err) {
        toast.error("Error", "Failed to delete vendor")
      }
    }
  }

  const filteredVendors = vendors.filter((vendor) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      vendor.name?.toLowerCase().includes(search) ||
      vendor.email?.toLowerCase().includes(search) ||
      vendor.phone?.toLowerCase().includes(search)

    let matchesDate = true
    if (dateFilter !== "all") {
      const vendorDate = new Date(vendor.createdAt)
      const today = new Date().toISOString().split("T")[0]
      const created = vendorDate.toISOString().split("T")[0]
      const diff = (new Date(today).getTime() - new Date(created).getTime()) / (1000 * 60 * 60 * 24)

      if (dateFilter === "today") matchesDate = diff === 0
      else if (dateFilter === "week") matchesDate = diff <= 7
      else if (dateFilter === "month") matchesDate = diff <= 30
    }

    return matchesSearch && matchesDate
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    )
  }

  if (!hasPermission("view_vendors")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You don't have permission to view vendors.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Management</h1>
          <p className="text-gray-600">Manage supplier and vendor records</p>
        </div>

        {(hasPermission("add_vendors") || hasPermission("edit_vendors")) && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) {
                setEditingVendor(null)
                resetForm()
              }
            }}
          >
           {
            (hasPermission("add_vendors")) && ( <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>)
           }

            <DialogContent className="!w-[90vw] sm:max-w-[70vw] max-h-[95vh] p-0 flex flex-col">
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 z-20 rounded-t-2xl">
                <DialogHeader>
                  <DialogTitle>{editingVendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
                  <DialogDescription>
                    {editingVendor ? "Update vendor information" : "Create a new vendor record"}
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <form onSubmit={handleSubmit} className="space-y-5 pb-20" id="vendor-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label required>Vendor Name</Label>
                      <Input
                        value={formData.name}
                        placeholder="Enter Vendor Name"
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                      {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        placeholder="Enter Vendor Email"
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                      {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label required>Phone</Label>
                      <Input
                        value={formData.phone}
                        placeholder="Enter Vendor Phone Number"
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>PAN</Label>
                      <Input
                        value={formData.pan}
                        placeholder="Enter Vendor PAN Number"
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      />
                      {errors.pan && <p className="text-red-500 text-sm">{errors.pan}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>GSTIN</Label>
                      <Input
                        value={formData.gstin}
                        placeholder="Enter Vendor GSTIN"
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      />
                      {errors.gstin && <p className="text-red-500 text-sm">{errors.gstin}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label required>State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => setFormData({ ...formData, state: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent>
                          {indianStates.map((stateName) => (
                            <SelectItem key={stateName} value={stateName}>
                              {stateName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label>City</Label>
                      <Input
                        value={formData.city}
                        placeholder="Enter Vendor City"
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label>Pincode</Label>
                      <Input
                        value={formData.pincode}
                        placeholder="Enter Vendor Pincode"
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      />
                    {errors.pincode && <p className="text-red-500 text-sm">{errors.pincode}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Address</Label>
                      <Textarea
                        rows={2}
                        value={formData.address}
                        placeholder="Vendor Address"
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                      {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label>Notes</Label>
                      <Textarea
                        rows={2}
                        value={formData.notes}
                        placeholder="Additional notes about the vendor"
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="bg-white border-t px-6 py-4 flex justify-end rounded-b-2xl">
                <Button variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="vendor-form">
                  {editingVendor ? "Update" : "Create"} Vendor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Vendors List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" /> All Vendors ({filteredVendors.length})
          </CardTitle>
          <CardDescription>Supplier and vendor directory</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Search + filter */}
          <div className="mb-4 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
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

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Sr No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  {(hasPermission("add_vendors") || hasPermission("edit_vendors")) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No vendors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((vendor, index) => (
                      <TableRow key={String(vendor._id)}>
                          <TableCell>
    {(currentPage - 1) * itemsPerPage + (index + 1)}
  </TableCell>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{vendor.phone}</TableCell>
                        <TableCell>{new Date(vendor.createdAt).toLocaleDateString()}</TableCell>

                 
                          <TableCell>
                            <div className="flex space-x-2 items-center">
                              <Link href={`/dashboard/vendor/${String(vendor._id)}`}>
                                <Button variant="ghost" size="sm" title="View vendor">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {
                                (hasPermission("edit_vendors"))&&(
                                   <Button variant="ghost" size="sm" onClick={() => handleEdit(vendor)} title="Edit details">
                                <Edit className="h-4 w-4" />
                              </Button>
                                )
                              }
                              {/* <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400"
                                onClick={() => handleDelete(vendor._id)}
                              >
                                Delete
                              </Button> */}
                                          { (hasPermission("edit_vendors"))&&(      <Switch
                                                          checked={vendor?.status === "active" ? true : false}
                                                          title="Handle the status"
                                                          onCheckedChange={async (checked) => {
                                                            try {
                                                              const newStatus = checked ? "active" : "inactive"
                                                              await api.vendors.updateStatus(String(vendor._id), newStatus)
                                                              toast.success("Status Updated", `${vendor?.name} is now ${newStatus}`)
                                                              await loadVendors()
                                                            } catch (err) {
                                                              toast.error("Error", "Failed to update status")
                                                            }
                                                          }}
                                                        />  )
                              }
                            </div>
                                                     
                          </TableCell>
                
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredVendors.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4 px-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(filteredVendors.length / itemsPerPage)}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === Math.ceil(filteredVendors.length / itemsPerPage)}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
