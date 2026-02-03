"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, Filter, X } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SalesInvoice {
  _id: string
salesInvoiceNumber: string
  date: string
  dueDate?: string
  clientName: string
  quotationNumber?: string
  total: number
  status: string 
  balanceAmount?: number
  createdAt: string
  isActive?: boolean
}

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
          if (inv.status === 'pending' && inv.dueDate) {
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

    return matchesSearch && matchesStatus
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

  if (!hasPermission("view_sales_invoices")) {
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
        {hasPermission("create_sales_invoices") && (
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
              ₹{invoices.reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-3">
            <CardDescription>Pending Payment</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-orange-600">
              {invoices.filter(i => i.status === 'pending').length}
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <TableHead>Total Amount</TableHead>
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
                        <TableCell>{invoice.quotationNumber || "-"}</TableCell>
                        <TableCell className="font-semibold">₹{(invoice.balanceAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge variant={invoice.status === "paid" ? "default" : invoice.status === "pending" ? "secondary" : "outline"}>
                            {invoice.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={invoice.isActive !== false}
                            onCheckedChange={() => handleStatusToggle(invoice._id, invoice.isActive !== false)}
                          />
                        </TableCell>
                        <TableCell>
                            <div className="flex space-x-2">
                                <Link href={`/dashboard/salesInvoices/${invoice._id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                                </Link>
                                {hasPermission("edit_sales_invoices") && (
                                  <Link href={`/dashboard/salesInvoices/new?id=${invoice._id}`}>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
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
    </div>
  )
}
