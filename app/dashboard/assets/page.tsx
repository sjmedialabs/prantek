"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Plus, Search, Package, Laptop, Car, Building, Wrench, TrendingDown, AlertTriangle, UserPlus, UserX, UserCheck, Edit } from "lucide-react"
import { api } from "@/lib/api-client"
import { toast } from "@/lib/toast"

interface AssignmentHistory {
  employeeId: string
  employeeName: string
  assignedDate: string
  submittedDate?: string
  assignedBy: string
}

interface Asset {
  id: string
  name?: string
  category?: "equipment" | "vehicle" | "property" | "software" | "furniture"
  purchasePrice?: number
  currentValue?: number
  purchaseDate?: string
  condition?: "excellent" | "good" | "fair" | "poor"
  location?: string
  serialNumber?: string
  userId: String
  warranty?: string
  maintenanceSchedule?: string
  lastMaintenance?: string
  nextMaintenance?: string
  depreciationRate?: number
  status: "active" | "maintenance" | "retired" | "sold" | "assigned" | "available"
  assignedTo?: string
  assignedToName?: string
  assignedDate?: string
  assignedBy?: string
  submittedDate?: string
  assignmentHistory?: AssignmentHistory[]
}

const COLORS = ["#8b5cf6", "#06b6d4", "##10b981", "#f59e0b", "#ef4444"]

export default function AssetsPage() {
  const { hasPermission, user } = useUser()
  const [categories, setCategories] = useState<any[]>([])
  const [conditions, setConditions] = useState<any[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedAssetForAssignment, setSelectedAssetForAssignment] = useState<Asset | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)

  const [newAsset, setNewAsset] = useState({
    name: "",
    category: "equipment" as const,
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    condition: "excellent" as const,
    location: "",
    serialNumber: "",
    warranty: "",
  })
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user])

  const userid = user?.id
  const loadData = async () => {
    const loadedCategories = await api.assetCategories.getAll()
    setCategories(loadedCategories || [])
    console.log("loadedCategories", loadedCategories)
    const loadedConditions = await api.assetConditions.getAll()
    setConditions(loadedConditions || [])
    console.log("loadedConditions", loadedConditions)
    const loadedEmployees = await api.employees.getAll()
    setEmployees(loadedEmployees || [])
    console.log("loadedEmployees", loadedEmployees)
    console.log("user details are ", userid)
    const loadedAssets = await api.assets.getAll(user?.id)
    console.log("loadedAssets", loadedAssets, user?.id)
    setAssets(loadedAssets || [])

    setLoading(false)
  }


  // const saveAssets = (updatedAssets: Asset[]) => {
  //   localStorage.setItem("assets", JSON.stringify(updatedAssets))
  //   setAssets(updatedAssets)
  // }

  // Calculate asset metrics
  const totalAssetValue = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0)
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)
  const totalDepreciation = totalPurchaseValue - totalAssetValue
  const assignedAssets = assets.filter((asset) => asset.assignedTo && !asset.submittedDate).length
  const availableAssets = assets.filter((asset) => !asset.assignedTo || asset.submittedDate).length

const categoryData = categories
  .filter((c) => c.isActive) // only active categories
  .map((cat, index) => ({
    name: cat.name,
    value: assets.filter((a) => a.category?.toLowerCase() === cat.name.toLowerCase()).length,
    fill: COLORS[index % COLORS.length], // rotate colors
  }))
  .filter((item) => item.value > 0) // show only if assets exist


  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assignedToName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || asset.category === filterCategory
    const matchesStatus = filterStatus === "all" || asset.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleAddAsset = async () => {
    try {

      // 🔍 1. Check serial uniqueness
      const serialExists = assets.some(
        (a) => a.serialNumber?.toLowerCase() === newAsset.serialNumber.toLowerCase()
      )

      if (serialExists) {
        alert("Serial number already exists! Please use a unique serial number.")
        return
      }

      // 🔵 2. Continue with creating asset
      const payload = {
        userId: user?.id,
        name: newAsset.name || "",
        category: newAsset.category,
        purchasePrice: newAsset.purchasePrice ? Number(newAsset.purchasePrice) : undefined,
        currentValue: newAsset.purchasePrice ? Number(newAsset.purchasePrice) : undefined,
        purchaseDate: newAsset.purchaseDate,
        condition: newAsset.condition,
        location: newAsset.location,
        serialNumber: newAsset.serialNumber,
        warranty: newAsset.warranty,
        status: "available",
        assignmentHistory: [],
      }

      console.log("sending payload", payload)
      const created = await api.assets.create(payload)

      const loadedAssets = await api.assets.getAll(user?.id)
      setAssets(loadedAssets)

      setIsAddAssetOpen(false)
      toast.success("Asset created successfully!")

    } catch (error: any) {
      alert(error.message)
    }
  }



  const handleAssignAsset = async () => {
    console.log("enter in on click function ")
    if (!selectedAssetForAssignment || !selectedEmployeeId) return
    console.log("selectedAssetForAssignment", selectedAssetForAssignment)
    const employee = employees.find(
      (e) => String(e._id || e.id) === selectedEmployeeId
    )

    const updatedData = {
      userId: selectedAssetForAssignment.userId,
      assignedTo: employee._id,
      assignedToName: employee.employeeName + " " + employee.surname,
      assignedDate: new Date().toISOString(),
      submittedDate: null,
      status: "assigned",

      assignmentHistoryItem: {
        employeeId: employee._id,
        employeeName: employee.employeeName + " " + employee.surname,
        assignedDate: new Date().toISOString(),
        assignedBy: user?.email || "Admin",
      }
    }

    console.log("updatedData", updatedData)
    console.log("selectedAssetForAssignment id ", selectedAssetForAssignment._id)
    await api.assets.update(selectedAssetForAssignment._id, updatedData)

    const loadedAssets = await api.assets.getAll(user?.id)

    setAssets(loadedAssets)

    setIsAssignDialogOpen(false)
    setSelectedEmployeeId("")
    toast.success("Asset assigned successfully!")
  }


  const handleSubmitAsset = async (assetId: string) => {

    await api.assets.update(assetId, {
      submittedDate: new Date().toISOString(),
      userId: user?.id,
      status: "available",
    })

    const refreshedAssets = await api.assets.getAll(user?.id)
    setAssets(refreshedAssets)
  }


  const handleReassignAsset = (asset: Asset) => {
    setSelectedAssetForAssignment(asset)
    setSelectedEmployeeId("")
    setIsAssignDialogOpen(true)
  }
  const totalPages = Math.ceil(filteredAssets.length / rowsPerPage)

  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const getSerial = (index: number) => (currentPage - 1) * rowsPerPage + index + 1

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "equipment":
        return <Laptop className="h-4 w-4" />
      case "vehicle":
        return <Car className="h-4 w-4" />
      case "property":
        return <Building className="h-4 w-4" />
      case "furniture":
        return <Package className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }
  const handleUpdateAsset = async () => {
    try {
      if (!editingAssetId) return;

      const payload = {
        name: newAsset.name,
        category: newAsset.category,
        purchasePrice: Number(newAsset.purchasePrice),
        currentValue: Number(newAsset.purchasePrice),
        purchaseDate: newAsset.purchaseDate,
        condition: newAsset.condition,
        location: newAsset.location,
        serialNumber: newAsset.serialNumber,
        warranty: newAsset.warranty,
      };

      await api.assets.update(editingAssetId, payload)

      const refreshed = await api.assets.getAll(user?.id)
      setAssets(refreshed)

      toast.success("Asset updated successfully!")
      setIsAddAssetOpen(false)

      // reset edit mode
      setIsEditMode(false)
      setEditingAssetId(null)

    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleEdit = (asset: Asset) => {
    setIsEditMode(true)
    setEditingAssetId(asset._id)

    setNewAsset({
      name: asset.name || "",
      category: asset.category || "equipment",
      purchasePrice: asset.purchasePrice?.toString() || "",
      purchaseDate: asset.purchaseDate || new Date().toISOString().split("T")[0],
      condition: asset.condition || "excellent",
      location: asset.location || "",
      serialNumber: asset.serialNumber || "",
      warranty: asset.warranty || ""
    })

    setIsAddAssetOpen(true)
  }

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "fair":
        return "bg-yellow-100 text-yellow-800"
      case "poor":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "available":
        return "bg-green-100 text-green-800"
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      case "retired":
        return "bg-gray-100 text-gray-800"
      case "sold":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!hasPermission("manage_assets")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage assets.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600">Track and manage your organization's assets</p>
        </div>
        <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setIsEditMode(false)
                setEditingAssetId(null)
                setNewAsset({
                  name: "",
                  category: "equipment",
                  purchasePrice: "",
                  purchaseDate: new Date().toISOString().split("T")[0],
                  condition: "excellent",
                  location: "",
                  serialNumber: "",
                  warranty: "",
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
              <DialogDescription>Register a new asset in your inventory (all fields optional)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    placeholder="Asset name (optional)"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newAsset.category}
                    onValueChange={(value: any) => setNewAsset({ ...newAsset, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.isActive).map(cat => (
                        <SelectItem key={cat._id} value={cat.name.toLowerCase()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    placeholder="0.00 (optional)"
                    value={newAsset.purchasePrice}
                    onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={newAsset.purchaseDate}
                    onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={newAsset.condition}
                    onValueChange={(value: any) => setNewAsset({ ...newAsset, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.filter(c => c.isActive).map(cond => (
                        <SelectItem key={cond._id} value={cond.name.toLowerCase()}>{cond.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Asset location (optional)"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="Serial number (optional)"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty">Warranty Expiry</Label>
                  <Input
                    id="warranty"
                    type="date"
                    value={newAsset.warranty}
                    onChange={(e) => setNewAsset({ ...newAsset, warranty: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddAssetOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={isEditMode ? handleUpdateAsset : handleAddAsset}>
                  {isEditMode ? "Update Asset" : "Add Asset"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset to Employee</DialogTitle>
            <DialogDescription>
              {selectedAssetForAssignment?.name || "Asset"} - Select an employee to assign this asset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((emp) => emp.isActive)
                    .map((employee) => (
                      <SelectItem key={employee._id || employee.id} value={String(employee._id || employee.id)}>
                        {employee.employeeName} {employee.surname} - {employee.employeeNumber}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAssignDialogOpen(false)
                  setSelectedAssetForAssignment(null)
                  setSelectedEmployeeId("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignAsset} disabled={!selectedEmployeeId}>
                Assign Asset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-gray-600 mt-1">Total inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Assigned Assets</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignedAssets}</div>
            <p className="text-xs text-gray-600 mt-1">Currently with employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available Assets</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableAssets}</div>
            <p className="text-xs text-gray-600 mt-1">Ready for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">₹{(totalAssetValue || 0).toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">Current market value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asset Inventory</CardTitle>
                  <CardDescription>Manage your organization's assets</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search assets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.filter(c => c.isActive).map(cat => (
                        <SelectItem key={cat._id} value={cat.name.toLowerCase()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAssets.map((asset, index) => (

                    <TableRow key={asset.id || asset._id}>
                      <TableCell>{getSerial(index)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(asset.category)}
                          <div>
                            <div className="font-medium">{asset.name || "Unnamed Asset"}</div>
                            {asset.serialNumber && (
                              <div className="text-sm text-gray-500">SN: {asset.serialNumber}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {asset.category && <Badge variant="outline">{asset.category}</Badge>}
                      </TableCell>
                      <TableCell>{asset.location || "-"}</TableCell>
                      <TableCell>
                        {asset.condition && (
                          <Badge className={getConditionColor(asset.condition)}>{asset.condition}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {asset.assignedTo && !asset.submittedDate ? (
                          <div>
                            <div className="font-medium">{asset.assignedToName}</div>
                            <div className="text-xs text-gray-500">
                              Since: {new Date(asset.assignedDate!).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {asset.assignedTo && !asset.submittedDate ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSubmitAsset(asset._id)}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Submit
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReassignAsset(asset)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {paginatedAssets.length} of {filteredAssets.length} assets
                </p>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    Previous
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
              <CardDescription>Track asset assignments and submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets
                  .filter((asset) => asset.assignmentHistory && asset.assignmentHistory.length > 0)
                  .map((asset) => (
                    <div key={asset.id || asset._id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(asset.category)}
                          <div>
                            <h4 className="font-medium">{asset.name || "Unnamed Asset"}</h4>
                            <p className="text-sm text-gray-600">
                              {asset.serialNumber && `SN: ${asset.serialNumber}`}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Assignment History:</p>
                        {asset.assignmentHistory?.map((history, index) => (
                          <div key={index} className="ml-4 p-3 bg-gray-50 rounded text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">{history.employeeName}</span>
                              <span className="text-gray-600">
                                {new Date(history.assignedDate).toLocaleDateString()}
                              </span>
                            </div>
                            {history.submittedDate && (
                              <div className="text-green-600 mt-1">
                                Submitted: {new Date(history.submittedDate).toLocaleDateString()}
                              </div>
                            )}
                            {!history.submittedDate && index === asset.assignmentHistory!.length - 1 && (
                              <div className="text-blue-600 mt-1">Currently assigned</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Assigned by: {history.assignedBy}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Distribution by Category</CardTitle>
                <CardDescription>Breakdown of assets by type</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ChartContainer
                    config={{
                      value: {
                        label: "Count",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" fill="#8884d8">
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Legend />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No asset data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment Status</CardTitle>
                <CardDescription>Current assignment statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">Assigned Assets</p>
                        <p className="text-sm text-gray-600">Currently with employees</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{assignedAssets}</div>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium">Available Assets</p>
                        <p className="text-sm text-gray-600">Ready for assignment</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-600">{availableAssets}</div>
                  </div>
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="font-medium">Total Assignments</p>
                        <p className="text-sm text-gray-600">All-time assignments made</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-orange-600">
                      {assets.reduce((sum, asset) => sum + (asset.assignmentHistory?.length || 0), 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
