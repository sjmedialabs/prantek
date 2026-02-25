"use client"
import { toast } from "@/lib/toast"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Save, Plus, Edit2, Power, PowerOff, Search } from "lucide-react"
import { api } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TaxRate, TaxSetting } from "@/lib/models/types"
import { tokenStorage } from "@/lib/token-storage"

export default function TaxDetailsPage() {
  const { loading, hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [taxSettings, setTaxSettings] = useState<TaxSetting>({
    tan: "",
    userId: "",
    tanUrl: "",
    gst: "",
    gstUrl: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null)
  const [page, setPage] = useState(1)
const itemsPerPage = 10
  const [rateData, setRateData] = useState({
    type: "CGST" as "CGST" | "SGST" | "IGST",
    rate: "",
    description: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
const [statusFilter, setStatusFilter] = useState("all") // all | active | inactive


  useEffect(() => {
    const loadTaxData = async () => {
      const settings = await api.taxSetting.get()
      setTaxSettings(settings)
      const rates = await api.taxRates.getAll()
      console.log("Tax rates:", rates)
      setTaxRates(rates)
    }
    loadTaxData()
  }, [])
const filteredRates = taxRates
  .filter((rate) => {
    const term = searchTerm.toLowerCase()

    return (
      (rate.type || "").toLowerCase().includes(term) ||
      rate.rate.toString().toLowerCase().includes(term) ||
      (rate.description || "").toLowerCase().includes(term)
    )
  })
  .filter((rate) => {
    if (statusFilter === "active") return rate.isActive
    if (statusFilter === "inactive") return !rate.isActive
    return true
  })
  const handleTanDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setTaxSettings({ ...taxSettings, tanUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }
// Pagination logic
const startIndex = (page - 1) * itemsPerPage
const paginatedRates = filteredRates.slice(startIndex, startIndex + itemsPerPage)
const totalPages = Math.ceil(filteredRates.length / itemsPerPage)

  const handleGstDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setTaxSettings({ ...taxSettings, gstUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveRate = async () => {
    if (!rateData.rate) {
      toast({ title: "Validation Error", description: "Please fill in all fields", variant: "destructive" })
      return
    }
    console.log("Rate data:", rateData)
    console.log("Editing rate:", editingRate?._id)
    // ❌ Prevent duplicates: type + rate combination must be unique
const isDuplicate = taxRates.some(
  (r) =>
    r.type.toLowerCase() === rateData.type.toLowerCase() &&
    r.rate === Number(rateData.rate) &&
    r._id !== editingRate?._id
)

if (isDuplicate) {
  toast({
    title: "Duplicate Rate",
    description: "This tax type and rate combination already exists.",
    variant: "destructive",
  })
  return
}

    if (editingRate?._id) {
      const updated = await api.taxRates.update(editingRate._id,rateData)
      console.log("Updated rate :", updated.role)
      if (updated) {
        setTaxRates(taxRates.map((rate) => (rate._id === updated.role._id ? updated.role : rate)))
              toast({ title: "Success", description: "Rate updated successfully!", variant: "success" })
      }

      // window.location.reload()
    } else {
      const newRate = await api.taxRates.create({
        ...rateData,
        rate: Number.parseFloat(rateData.rate),
        isActive: true,
      })
      setTaxRates([...taxRates, newRate])
      toast({ title: "Success", description: "Rate created successfully!", variant: "success" })
      // window.location.reload()
    }

    setIsDialogOpen(false)
    resetRateForm()
  }

  const resetRateForm = () => {
    setRateData({
      type: "CGST",
      rate: "",
      description: "",
    })
    setEditingRate(null)
  }

  const handleEditRate = (rate: TaxRate) => {
    setEditingRate(rate)
    setRateData({
      type: rate?.type,
      rate: rate?.rate.toString(),
      description: rate?.description,
    })
    setIsDialogOpen(true)
  }

  const handleToggleRateStatus = async (rate: TaxRate) => {
    // console.log("Toggling status for rate:", rate)
    const updated = await api.taxRates.update(rate?._id, {
      isActive: !rate.isActive,
    })
    console.log("Toggled rate status :", updated)
    const toggle = updated.role
    if (toggle) {
      console.log("Toggled rate status:", toggle)
      setTaxRates(taxRates.map((r) => (r._id === toggle._id ? toggle : r)))
          toast({ title: "Success", description: "Rate status toggled successfully!", variant: "success" })
    // window.location.reload()
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Tax Rates ({filteredRates.length})</h1>
          <p className="text-gray-600">Manage your tax rates</p>
        </div>
        {/* <Button onClick={handleSaveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button> */}
                    <Button
              onClick={() => {
                resetRateForm()
                setIsDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tax Rate
            </Button>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Tax settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          {/* <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tax Rates</CardTitle>
              <CardDescription>Manage CGST, SGST, and IGST rates</CardDescription>
            </div>

          </div> */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-4">

  {/* Search Bar */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
    <Input
      placeholder="Search type, rate, description..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10 w-72"
    />
  </div>

  {/* Status Filter */}
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="border rounded-lg p-3 text-sm"
  >
    <option value="all">All Status</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>

</div>

        </CardHeader>
        <CardContent>
          {filteredRates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tax rates configured. Click "Add Tax Rate" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate (%)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRates.map((rate, index) => (
                  <TableRow key={rate?._id}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rate?.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{rate?.rate}%</TableCell>
                    <TableCell>{rate?.description}</TableCell>
                    <TableCell>
                      <Badge variant={rate?.isActive ? "default" : "secondary"}>
                        {rate?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditRate(rate)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleRateStatus(rate)}>
                          {rate?.isActive ? (
                            <PowerOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Power className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-between items-center py-4">
  <Button
    variant="outline"
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
    disabled={page === totalPages}
    onClick={() => setPage(page + 1)}
  >
    Next
  </Button>
</div>

        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRate ? "Edit Tax Rate" : "Add Tax Rate"}</DialogTitle>
            <DialogDescription>Configure tax rate for products and services</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type" required>Tax Type</Label>
              <Select
                value={rateData.type}
                onValueChange={(value: "CGST" | "SGST" | "IGST") => setRateData({ ...rateData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CGST">CGST</SelectItem>
                  <SelectItem value="SGST">SGST</SelectItem>
                  <SelectItem value="IGST">IGST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate" required>Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={rateData.rate}
                onChange={(e) => setRateData({ ...rateData, rate: e.target.value })}
                placeholder="e.g., 5, 12, 18"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={rateData.description}
                onChange={(e) => setRateData({ ...rateData, description: e.target.value })}
                placeholder="e.g., Standard rate for goods"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                resetRateForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRate}>{editingRate ? "Update Rate" : "Add Rate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
