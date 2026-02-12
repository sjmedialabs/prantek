"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, ReceiptIcon, Filter, X, Eye } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import type { Receipt } from "@/lib/models/types"


export default function ReceiptsPage() {
  const { hasPermission, user } = useUser()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [minAmountFilter, setMinAmountFilter] = useState("")
  const [maxAmountFilter, setMaxAmountFilter] = useState("")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // rows per page

  useEffect(() => {
    loadReceipts()
  }, [])

  const loadReceipts = async () => {
    const data = await api.receipts.getAll()
    setReceipts(data)
    setLoading(false)
  }

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      (receipt.receiptNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (receipt.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (receipt.salesInvoiceNumber && receipt.salesInvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || receipt.status === statusFilter

    const matchesPaymentType =
      paymentTypeFilter === "all" ||
      receipt.paymentType === paymentTypeFilter ||
      (paymentTypeFilter === "Full Payment" && receipt.paymentType === "full") ||
      (paymentTypeFilter === "Partial" && receipt.paymentType === "partial")

    const matchesPaymentMethod = paymentMethodFilter === "all" || receipt.paymentMethod === paymentMethodFilter

    const receiptDate = new Date(receipt.date || receipt.createdAt)
    const matchesDateFrom = !dateFromFilter || receiptDate >= new Date(dateFromFilter)
    const matchesDateTo = !dateToFilter || receiptDate <= new Date(dateToFilter)

    const matchesMinAmount = !minAmountFilter || (receipt.ReceiptAmount || 0) >= Number.parseFloat(minAmountFilter)
    const matchesMaxAmount = !maxAmountFilter || (receipt.ReceiptAmount || 0) <= Number.parseFloat(maxAmountFilter)

    const matchesClient = clientFilter === "all" || receipt.clientName === clientFilter

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPaymentType &&
      matchesPaymentMethod &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesMinAmount &&
      matchesMaxAmount &&
      matchesClient
    )
  })

  const uniqueClients = Array.from(new Set(receipts.map((r) => r.clientName).filter(name => name && name.trim() !== "")))
  const uniquePaymentMethods = Array.from(new Set(receipts.map((r) => r.paymentMethod).filter(method => method && method.trim() !== "")))
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    paymentTypeFilter,
    paymentMethodFilter,
    dateFromFilter,
    dateToFilter,
    minAmountFilter,
    maxAmountFilter,
    clientFilter
  ]);
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);

  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setStatusFilter("all")
    setPaymentTypeFilter("all")
    setPaymentMethodFilter("all")
    setDateFromFilter("")
    setDateToFilter("")
    setMinAmountFilter("")
    setMaxAmountFilter("")
    setClientFilter("all")
    setSearchTerm("")
  }

  const formatPaymentType = (type: string) => {
    if (type === "full") return "Full Payment"
    if (type === "partial") return "Partial"
    // if (type === "advance") return "Advance Payment"
    return type
  }

  const formatStatus = (status: string) => {
    return status
  }

  if (!hasPermission("view_receipts")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view receipts.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600">Manage payment receipts</p>
        </div>
        {hasPermission("add_receipts") && (
          <Link href="/dashboard/receipts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Receipt
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{receipts.reduce((sum, r) => sum + (r.ReceiptAmount || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        {/* <Card>
          <CardHeader className="pb-3">
            <CardDescription>Received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {receipts.filter((r) => r.status === "pending").length}
            </div>
          </CardContent>
        </Card> */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cleared</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {receipts.filter((r) => r.status === "cleared").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ReceiptIcon className="h-5 w-5 mr-2" />
            All Receipts
          </CardTitle>
          <CardDescription>Payment receipts from clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search receipts..."
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
                paymentTypeFilter !== "all" ||
                paymentMethodFilter !== "all" ||
                dateFromFilter ||
                dateToFilter ||
                minAmountFilter ||
                maxAmountFilter ||
                clientFilter !== "all") && (
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
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="cleared">Cleared</SelectItem>
                      {/* <SelectItem value="cleared">Failed</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Type</label>
                  <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Full Payment">Full Payment</SelectItem>
                      <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                      <SelectItem value="Advance Payment">Advance Payment</SelectItem>
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
                  <label className="text-sm font-medium">Date From</label>
                  <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date To</label>
                  <Input type="date" value={dateToFilter} min={dateFromFilter} onChange={(e) => setDateToFilter(e.target.value)} />
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

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Agreement Number</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  {hasPermission("manage_receipts") && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReceipts.map((receipt, index) => {
                  const serial = (currentPage - 1) * itemsPerPage + (index + 1)
                  return (
                    <TableRow key={receipt._id?.toString() || `receipt-${index}`}>
                      <TableCell>{serial}</TableCell>
                      <TableCell>{new Date(receipt.date || receipt.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                      <TableCell>{receipt.clientName}</TableCell>
                      <TableCell>{receipt.salesInvoiceNumber}</TableCell>
                      <TableCell className="font-semibold">₹{(receipt?.ReceiptAmount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={receipt.paymentType === "full" ? "default" : "secondary"}>
                          {formatPaymentType(receipt.paymentType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{receipt.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge variant={receipt.status === ("cleared") ? "default" : "secondary"}>
                          {formatStatus(receipt.status)}
                        </Badge>
                      </TableCell>
                      {(hasPermission("edit_receipts") || hasPermission("add_receipts")) && (
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={`/dashboard/receipts/${receipt._id?.toString()}`}>
                              <Button variant="ghost" size="sm"title="View in detail"><Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                           {
                            (hasPermission("edit_receipts")) && (
                               <Link href={`/dashboard/receipts/${receipt._id?.toString()}/edit`}>
                              <Button variant="ghost" size="sm" title="Edit Receipt">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            )
                           }
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
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
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
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
