"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" 
import { Plus, Search, FileText, Filter, X, Eye, Ban, ShieldOff } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SalesInvoice } from "@/lib/models/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// interface SalesInvoice {
//   _id: string
// salesInvoiceNumber: string
//   date: string
//   dueDate?: string
//   clientName: string
//   quotationNumber?: string
//   total: number
//   status: string 
//   balanceAmount?: number
//   createdAt: string
//   isActive?: boolean
// }

export default function SalesInvoicesPage() {
  const { hasPermission } = useUser()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<SalesInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [minAmountFilter, setMinAmountFilter] = useState("")
  const [maxAmountFilter, setMaxAmountFilter] = useState("")

  const [isBadDebtDialogOpen, setIsBadDebtDialogOpen] = useState(false)
  const [selectedInvoiceForBadDebt, setSelectedInvoiceForBadDebt] = useState<SalesInvoice | null>(null)
  const [badDebtAmount, setBadDebtAmount] = useState(0)
  const [badDebtReason, setBadDebtReason] = useState("")

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const response = await fetch("/api/salesInvoice")
      const result = await response.json()
      if (result.success) {
        const data = result.data
        setInvoices(data)

        // Check for overdue invoices
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        data.forEach(async (inv: SalesInvoice) => {
          if (inv.status === 'Not Cleared' && inv.dueDate) {
            const due = new Date(inv.dueDate)
            due.setHours(0, 0, 0, 0)
            if (due < today) {
               await fetch(`/api/salesInvoice/${inv._id}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ status: 'overdue' })
               })
            }
          }
        })
      } else {
        setInvoices([])
      }
    } catch (error) {
      console.error("Failed to load invoices", error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      (invoice.salesInvoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.quotationNumber && invoice.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const dateFromMatch = !dateFromFilter || new Date(invoice.date) >= new Date(dateFromFilter)
    const dateToMatch = !dateToFilter || new Date(invoice.date) <= new Date(dateToFilter)

    const minMatch = !minAmountFilter || invoice.grandTotal >= Number(minAmountFilter)
    const maxMatch = !maxAmountFilter || invoice.grandTotal <= Number(maxAmountFilter)
    return matchesSearch && dateFromMatch &&
      dateToMatch &&
      minMatch &&
      maxMatch && matchesStatus
  })

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const clearFilters = () => {
    setStatusFilter("all")
    setSearchTerm("")
  }

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/salesInvoice/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Invoice status updated" })
        loadInvoices()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
    }
  }

  const handleCancelInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this invoice?")) return

    try {
      const res = await fetch(`/api/salesInvoice/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', balanceAmount: 0 })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Invoice cancelled" })
        loadInvoices()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel invoice", variant: "destructive" })
    }
  }

  const handleOpenBadDebtDialog = (invoice: SalesInvoice) => {
    setSelectedInvoiceForBadDebt(invoice)
    setBadDebtAmount(invoice.balanceAmount || 0)
    setBadDebtReason("test")
    setIsBadDebtDialogOpen(true)
  }

  const handleBadDebtSubmit = async () => {
    if (!selectedInvoiceForBadDebt) return
    if (badDebtAmount <= 0) {
      toast({ title: "Error", description: "Bad debt amount must be greater than 0.", variant: "destructive" })
      return
    }
    if (badDebtAmount > (selectedInvoiceForBadDebt.balanceAmount || 0)) {
      toast({ title: "Error", description: "Bad debt amount cannot be greater than the balance amount.", variant: "destructive" })
      return
    }

    const newBalanceAmount = (selectedInvoiceForBadDebt.balanceAmount || 0) - badDebtAmount
    const newStatus = newBalanceAmount <= 0 ? 'collected' : selectedInvoiceForBadDebt.status

    try {
      const res = await fetch(`/api/salesInvoice/${selectedInvoiceForBadDebt._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          badDeptAmount: (selectedInvoiceForBadDebt.badDeptAmount || 0) + badDebtAmount,
          badDeptReason: badDebtReason,
          balanceAmount: newBalanceAmount,
          status: newStatus
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Bad debt recorded and invoice updated." })
        setIsBadDebtDialogOpen(false)
        loadInvoices()
      } else {
        throw new Error(data.error || "API request failed")
      }
    } catch (error) {
      console.error("Failed to update bad debt", error)
      toast({ title: "Error", description: "Failed to record bad debt.", variant: "destructive" })
    }
  }

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "collected":
        return "bg-green-100 text-green-800"
      case "not collected":
        return "bg-blue-100 text-blue-800"
      case "partially collected":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-orange-100 text-orange-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!hasPermission("view_sales_invoice")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view sales invoices.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Invoices</h1>
          <p className="text-gray-600">Manage sales invoices</p>
        </div>
        {hasPermission("add_sales_invoice") && (
          <Link href="/dashboard/salesInvoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-3">
            <CardDescription>Unclear Payment</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-orange-600">
              {invoices.filter(i => i.status === 'Not Cleared').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            All Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              {(statusFilter !== "all" || searchTerm) && (
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
                      <SelectItem value="not collected">Not Collected</SelectItem>
                      <SelectItem value="collected">Collected</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="partially collected">Partial Collected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input type="date" value={dateToFilter} min={dateFromFilter} onChange={(e) => setDateToFilter(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium">Min Amount</label>
                <Input type="number" value={minAmountFilter} onChange={(e) => setMinAmountFilter(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium">Max Amount</label>
                <Input type="number" value={maxAmountFilter} onChange={(e) => setMaxAmountFilter(e.target.value)} />
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
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Quotation Ref</TableHead>
                  <TableHead>Balance Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">No invoices found</TableCell>
                    </TableRow>
                ) : (
                    paginatedInvoices.map((invoice, index) => {
                    const serial = (currentPage - 1) * itemsPerPage + (index + 1)
                    return (
                        <TableRow key={invoice._id}>
                        <TableCell>{serial}</TableCell>
                        <TableCell>{new Date(invoice.date || invoice.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{invoice.salesInvoiceNumber}</TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell>{invoice.quotationNumber || invoice.quotationId || '-'}</TableCell>
                        <TableCell className="font-semibold">₹{(invoice.balanceAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge className={`${getStatusBadgeClass(invoice.status)} capitalize`}>
                              {invoice.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                           <div className="flex space-x-2 items-center justify-center">
                                <Link href={`/dashboard/salesInvoices/${invoice._id}`}>
                                <Button variant="ghost" size="sm"title="View in detail"><Eye className="h-4 w-4" /></Button>
                                </Link>
                                {hasPermission("edit_sales_invoices") && invoice.status === "not collected" && (
                                  <Link href={`/dashboard/salesInvoices/${invoice._id}/edit`}>
                                    <Button variant="ghost" size="sm" title="Edit Details">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                {hasPermission("edit_sales_invoice") && invoice.status === "not collected" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Cancel Invoice"
                                    className="text-red-600 hover:text-red-800 hover:bg-red-100"
                                    onClick={() => handleCancelInvoice(invoice._id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                                {hasPermission("edit_sales_invoice") && invoice.status === "partially collected" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Mark as Bad Debt"
                                    className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                                    onClick={() => handleOpenBadDebtDialog(invoice)}
                                  >
                                    <ShieldOff className="h-4 w-4" />
                                  </Button>
                                )}
                           
                         {/* {hasPermission("edit_sales_invoice") &&( <Switch
                            checked={invoice.isActive !== "deactive"}
                            onCheckedChange={() => handleStatusToggle(invoice._id, invoice.isActive !== "deactive")}
                            title="Change Status(Active/Inactive)"
                          />)} */}
                           </div>
                        </TableCell>
                        </TableRow>
                    )
                    })
                )}
              </TableBody>
            </Table>
          </div>

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

      <Dialog open={isBadDebtDialogOpen} onOpenChange={setIsBadDebtDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Record Bad Debt</DialogTitle>
                <DialogDescription>
                    Write off a portion of the balance for invoice {selectedInvoiceForBadDebt?.salesInvoiceNumber}.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="badDebtAmount">Bad Debt Amount</Label>
                    <Input
                        id="badDebtAmount"
                        type="number"
                        value={badDebtAmount}
                        onChange={(e) => setBadDebtAmount(Number(e.target.value))}
                        max={selectedInvoiceForBadDebt?.balanceAmount || 0}
                    />
                    <p className="text-xs text-gray-500">
                        Current balance: ₹{(selectedInvoiceForBadDebt?.balanceAmount || 0).toLocaleString()}
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="badDebtReason">Reason</Label>
                    <Textarea
                        id="badDebtReason"
                        value={badDebtReason}
                        onChange={(e) => setBadDebtReason(e.target.value)}
                        placeholder="Enter reason for writing off this amount..."
                    />
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p>New Balance after this action will be: 
                        <span className="font-bold"> ₹{((selectedInvoiceForBadDebt?.balanceAmount || 0) - badDebtAmount).toLocaleString()}</span>
                    </p>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBadDebtDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleBadDebtSubmit}>Confirm</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
