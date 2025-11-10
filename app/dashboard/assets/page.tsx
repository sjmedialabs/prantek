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
import { Plus, Search, Package, Laptop, Car, Building, Wrench, TrendingDown, AlertTriangle } from "lucide-react"

interface Asset {
  id: string
  name: string
  category: "equipment" | "vehicle" | "property" | "software" | "furniture"
  purchasePrice: number
  currentValue: number
  purchaseDate: string
  condition: "excellent" | "good" | "fair" | "poor"
  location: string
  serialNumber?: string
  warranty?: string
  maintenanceSchedule?: string
  lastMaintenance?: string
  nextMaintenance?: string
  depreciationRate?: number
  status: "active" | "maintenance" | "retired" | "sold"
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export default function AssetsPage() {
  const { hasPermission } = useUser()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
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

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = () => {
    try {
      const storedAssets = localStorage.getItem("assets")
      if (storedAssets) {
        setAssets(JSON.parse(storedAssets))
      } else {
        // Initialize with demo data if no assets exist
        const demoAssets: Asset[] = [
          {
            id: "1",
            name: "MacBook Pro 16-inch",
            category: "equipment",
            purchasePrice: 250000,
            currentValue: 180000,
            purchaseDate: "2023-06-15",
            condition: "excellent",
            location: "Office - Desk 1",
            serialNumber: "MBP2023001",
            warranty: "2025-06-15",
            maintenanceSchedule: "Annual",
            lastMaintenance: "2024-01-10",
            nextMaintenance: "2025-01-10",
            depreciationRate: 20,
            status: "active",
          },
          {
            id: "2",
            name: "Company Vehicle - Toyota Camry",
            category: "vehicle",
            purchasePrice: 2800000,
            currentValue: 2200000,
            purchaseDate: "2022-03-20",
            condition: "good",
            location: "Parking Lot A",
            serialNumber: "TC2022VIN123",
            warranty: "2025-03-20",
            maintenanceSchedule: "Every 6 months",
            lastMaintenance: "2024-01-05",
            nextMaintenance: "2024-07-05",
            depreciationRate: 15,
            status: "active",
          },
        ]
        localStorage.setItem("assets", JSON.stringify(demoAssets))
        setAssets(demoAssets)
      }
    } catch (error) {
      console.error("Error loading assets:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveAssets = (updatedAssets: Asset[]) => {
    localStorage.setItem("assets", JSON.stringify(updatedAssets))
    setAssets(updatedAssets)
  }

  // Calculate asset metrics
  const totalAssetValue = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0)
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)
  const totalDepreciation = totalPurchaseValue - totalAssetValue
  const assetsNeedingMaintenance = assets.filter((asset) => {
    if (!asset.nextMaintenance) return false
    const nextDate = new Date(asset.nextMaintenance)
    const today = new Date()
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 30
  }).length

  const categoryData = [
    { name: "Equipment", value: assets.filter((a) => a.category === "equipment").length, fill: COLORS[0] },
    { name: "Vehicle", value: assets.filter((a) => a.category === "vehicle").length, fill: COLORS[1] },
    { name: "Property", value: assets.filter((a) => a.category === "property").length, fill: COLORS[2] },
    { name: "Software", value: assets.filter((a) => a.category === "software").length, fill: COLORS[3] },
    { name: "Furniture", value: assets.filter((a) => a.category === "furniture").length, fill: COLORS[4] },
  ].filter((item) => item.value > 0)

  const depreciationData = assets.map((asset) => ({
    name: asset.name.substring(0, 15) + (asset.name.length > 15 ? "..." : ""),
    original: asset.purchasePrice || 0,
    current: asset.currentValue || 0,
    depreciation: (asset.purchasePrice || 0) - (asset.currentValue || 0),
  }))

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || asset.category === filterCategory
    const matchesStatus = filterStatus === "all" || asset.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleAddAsset = () => {
    const asset: Asset = {
      id: Date.now().toString(),
      ...newAsset,
      purchasePrice: Number.parseFloat(newAsset.purchasePrice),
      currentValue: Number.parseFloat(newAsset.purchasePrice), // Initially same as purchase price
      status: "active",
    }
    saveAssets([asset, ...assets])
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
    setIsAddAssetOpen(false)
  }

  const getCategoryIcon = (category: string) => {
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

  const getConditionColor = (condition: string) => {
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
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      case "retired":
        return "bg-gray-100 text-gray-800"
      case "sold":
        return "bg-blue-100 text-blue-800"
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
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
              <DialogDescription>Register a new asset in your inventory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    placeholder="Asset name"
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
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
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
                    placeholder="0.00"
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
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Asset location"
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
                <Button onClick={handleAddAsset}>Add Asset</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Asset Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-gray-600 mt-1">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{(totalAssetValue || 0).toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">Current market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Depreciation</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{(totalDepreciation || 0).toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {totalPurchaseValue > 0 ? ((totalDepreciation / totalPurchaseValue) * 100).toFixed(1) : 0}% total
              depreciation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Maintenance Due</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{assetsNeedingMaintenance}</div>
            <p className="text-xs text-gray-600 mt-1">Assets need attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
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
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
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
                    <TableHead>Asset</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Depreciation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(asset.category)}
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            {asset.serialNumber && (
                              <div className="text-sm text-gray-500">SN: {asset.serialNumber}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{asset.category}</Badge>
                      </TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>
                        <Badge className={getConditionColor(asset.condition)}>{asset.condition}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
                      </TableCell>
                      <TableCell>₹{(asset.purchasePrice || 0).toLocaleString()}</TableCell>
                      <TableCell>₹{(asset.currentValue || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-red-600">
                            -₹{((asset.purchasePrice || 0) - (asset.currentValue || 0)).toLocaleString()}
                          </span>
                          <Progress
                            value={((asset.purchasePrice - asset.currentValue) / asset.purchasePrice) * 100}
                            className="w-16 h-2"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                <CardTitle>Asset Value vs Depreciation</CardTitle>
                <CardDescription>Current value compared to purchase price</CardDescription>
              </CardHeader>
              <CardContent>
                {depreciationData.length > 0 ? (
                  <ChartContainer
                    config={{
                      original: {
                        label: "Purchase Price",
                        color: "#8b5cf6",
                      },
                      current: {
                        label: "Current Value",
                        color: "#10b981",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={depreciationData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="original" fill="#8b5cf6" />
                        <Bar dataKey="current" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No asset data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Maintenance Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets
                  .filter((asset) => asset.nextMaintenance)
                  .sort((a, b) => new Date(a.nextMaintenance!).getTime() - new Date(b.nextMaintenance!).getTime())
                  .map((asset) => {
                    const nextDate = new Date(asset.nextMaintenance!)
                    const today = new Date()
                    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    const isOverdue = daysUntil < 0
                    const isDueSoon = daysUntil <= 30 && daysUntil >= 0

                    return (
                      <div
                        key={asset.id}
                        className={`p-4 border rounded-lg ${
                          isOverdue
                            ? "border-red-200 bg-red-50"
                            : isDueSoon
                              ? "border-orange-200 bg-orange-50"
                              : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getCategoryIcon(asset.category)}
                            <div>
                              <h4 className="font-medium">{asset.name}</h4>
                              <p className="text-sm text-gray-600">{asset.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-medium ${
                                isOverdue ? "text-red-600" : isDueSoon ? "text-orange-600" : "text-gray-900"
                              }`}
                            >
                              {isOverdue
                                ? `${Math.abs(daysUntil)} days overdue`
                                : isDueSoon
                                  ? `Due in ${daysUntil} days`
                                  : `Due in ${daysUntil} days`}
                            </div>
                            <p className="text-sm text-gray-600">Next: {nextDate.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button size="sm" variant={isOverdue ? "destructive" : isDueSoon ? "default" : "outline"}>
                            {isOverdue ? "Schedule Now" : "Schedule Maintenance"}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depreciation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="h-5 w-5 mr-2" />
                Depreciation Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => {
                  const depreciationAmount = (asset.purchasePrice || 0) - (asset.currentValue || 0)
                  const depreciationPercent = (depreciationAmount / (asset.purchasePrice || 1)) * 100
                  const yearsOwned = Math.floor(
                    (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365),
                  )

                  return (
                    <div key={asset.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(asset.category)}
                          <div>
                            <h4 className="font-medium">{asset.name}</h4>
                            <p className="text-sm text-gray-600">
                              Purchased: {new Date(asset.purchaseDate).toLocaleDateString()} ({yearsOwned} years ago)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-red-600">
                            -₹{(depreciationAmount || 0).toLocaleString()}
                          </div>
                          <p className="text-sm text-gray-600">{depreciationPercent.toFixed(1)}% depreciation</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Purchase Price:</span>
                          <div className="font-medium">₹{(asset.purchasePrice || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Current Value:</span>
                          <div className="font-medium">₹{(asset.currentValue || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Annual Rate:</span>
                          <div className="font-medium">{asset.depreciationRate || "N/A"}%</div>
                        </div>
                      </div>
                      <Progress value={depreciationPercent} className="mt-3" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
