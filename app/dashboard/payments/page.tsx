"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Download, Filter, X } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"

interface Payment {
  id: string
  paymentNumber: string
  date: string
  recipientType: "client" | "vendor" | "team" // Added recipient type
  recipientName: string // Changed from clientName to recipientName
  category: string
  description: string
  amount: number
  paymentMethod: string
  bankAccount?: string
  referenceNumber?: string
  status: "completed" | "pending" | "failed" // Updated status values
  createdBy: string
}

export default function PaymentsPage() {
  const { hasPermission, user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [minAmountFilter, setMinAmountFilter] = useState("")
  const [maxAmountFilter, setMaxAmountFilter] = useState("")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [vendorFilter, setVendorFilter] = useState<string>("all")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [recipientFilter, setRecipientFilter] = useState<string>("all") // Declared recipientFilter

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    const data = await api.payments.getAll()
    setPayments(data)
    setLoading(false)
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesCategory = categoryFilter === "all" || payment.category === categoryFilter
    const matchesPaymentMethod = paymentMethodFilter === "all" || payment.paymentMethod === paymentMethodFilter

    const matchesDateFrom = !dateFromFilter || new Date(payment.date) >= new Date(dateFromFilter)
    const matchesDateTo = !dateToFilter || new Date(payment.date) <= new Date(dateToFilter)

    const matchesMinAmount = !minAmountFilter || payment.amount >= Number.parseFloat(minAmountFilter)
    const matchesMaxAmount = !maxAmountFilter || payment.amount <= Number.parseFloat(maxAmountFilter)

    const matchesClient = clientFilter === "all" || payment.recipientName === clientFilter
    const matchesVendor = vendorFilter === "all" || payment.recipientName === vendorFilter
    const matchesTeam = teamFilter === "all" || payment.recipientName === teamFilter

    const matchesRecipientType = recipientFilter === "all" || payment.recipientType === recipientFilter

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesPaymentMethod &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesMinAmount &&
      matchesMaxAmount &&
      matchesClient &&
      matchesVendor &&
      matchesTeam &&
      matchesRecipientType
    )
  })

  const uniqueClients = Array.from(
    new Set(payments.filter((p) => p.recipientType === "client" && p.recipientName).map((p) => p.recipientName)),
  )
  const uniqueVendors = Array.from(
    new Set(payments.filter((p) => p.recipientType === "vendor" && p.recipientName).map((p) => p.recipientName)),
  )
  const uniqueTeams = Array.from(
    new Set(payments.filter((p) => p.recipientType === "team" && p.recipientName).map((p) => p.recipientName)),
  )
  const uniqueCategories = Array.from(new Set(payments.filter((p) => p.category).map((p) => p.category)))
  const uniquePaymentMethods = Array.from(new Set(payments.filter((p) => p.paymentMethod).map((p) => p.paymentMethod)))

  const clearFilters = () => {
    setStatusFilter("all")
    setCategoryFilter("all")
    setPaymentMethodFilter("all")
    setDateFromFilter("")
    setDateToFilter("")
    setMinAmountFilter("")
    setMaxAmountFilter("")
    setClientFilter("all")
    setVendorFilter("all")
    setTeamFilter("all")
    setRecipientFilter("all") // Added setRecipientFilter
    setSearchTerm("")
  }

  const totalPaid = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
  const completedAmount = filteredPayments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = filteredPayments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const failedAmount = filteredPayments.filter((p) => p.status === "failed").reduce((sum, p) => sum + p.amount, 0)

  if (!hasPermission("view_payments")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view payments.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage all payment transactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {hasPermission("manage_payments") && (
            <Link href="/dashboard/payments/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Payment
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{totalPaid.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">{filteredPayments.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{completedAmount.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {filteredPayments.filter((p) => p.status === "completed").length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Clearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {filteredPayments.filter((p) => p.status === "pending").length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Failed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{failedAmount.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {filteredPayments.filter((p) => p.status === "failed").length} payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View and manage all payment transactions</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              {(statusFilter !== "all" ||
                categoryFilter !== "all" ||
                paymentMethodFilter !== "all" ||
                dateFromFilter ||
                dateToFilter ||
                minAmountFilter ||
                maxAmountFilter ||
                clientFilter !== "all" ||
                vendorFilter !== "all" ||
                teamFilter !== "all" ||
                recipientFilter !== "all") && ( // Added recipientFilter check
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {uniquePaymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient Type</label>
                  <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {uniqueClients.map((client) => (
                        <SelectItem key={client} value={client}>
                          {client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Vendor</label>
                  <Select value={vendorFilter} onValueChange={setVendorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {uniqueVendors.map((vendor) => (
                        <SelectItem key={vendor} value={vendor}>
                          {vendor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Team</label>
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {uniqueTeams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date From</label>
                  <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date To</label>
                  <Input type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minAmountFilter}
                    onChange={(e) => setMinAmountFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={maxAmountFilter}
                    onChange={(e) => setMaxAmountFilter(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recipient Type</TableHead> {/* Added recipient type column */}
                <TableHead>Recipient</TableHead> {/* Changed from Client to Recipient */}
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {hasPermission("manage_payments") && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                  <TableCell>{payment.date ? new Date(payment.date).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {payment.recipientType}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.recipientName}</TableCell> {/* Changed from clientName to recipientName */}
                  <TableCell>
                    <Badge variant="outline">{payment.category}</Badge>
                  </TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === "completed"
                          ? "default"
                          : payment.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">₹{payment.amount ? payment.amount.toLocaleString() : "0"}</TableCell>
                  {hasPermission("manage_payments") && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/dashboard/payments/${payment.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
