"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Search, Download, Filter, X, Eye, Edit } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/components/auth/user-context"
import { useToast } from "@/hooks/use-toast"

interface PurchaseInvoice {
  _id: string
  purchaseInvoiceNumber: string
  date: string
  recipientName: string
  invoiceTotalAmount: number
  paymentStatus: string
  invoiceStatus: string
  balanceAmount: number
  vendor?: { name: string }
  paidAmount: number
  dueDate?: string
}

export default function PurchaseInvoiceList() {
  const { hasPermission } = useUser()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [minAmountFilter, setMinAmountFilter] = useState("")
  const [maxAmountFilter, setMaxAmountFilter] = useState("")

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/purchaseInvoice")
      const result = await response.json()
      if (result.success) {
        const invoicesData: PurchaseInvoice[] = result.data
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const updates = invoicesData.map(async (inv) => {
          if ((inv.invoiceStatus === 'Open' || inv.invoiceStatus === 'Partial') && inv.dueDate) {
            const due = new Date(inv.dueDate)
            due.setHours(0, 0, 0, 0)
            if (due < today && inv.invoiceStatus !== 'overdue') {
              try {
                await fetch(`/api/purchaseInvoice/${inv._id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ invoiceStatus: 'overdue' })
                })
                return { ...inv, invoiceStatus: 'overdue' }
              } catch (e) {
                console.error("Failed to update invoice status to overdue", e)
                return inv
              }
            }
          }
          return inv
        })

        const updatedInvoices = await Promise.all(updates)
        setInvoices(updatedInvoices)
      }
    } catch (error) {
      console.error("Failed to load invoices", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const handleCancelInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to cancel this invoice? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/purchaseInvoice/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceStatus: "Cancelled", balanceAmount: 0 }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Invoice has been cancelled.",
        })
        loadInvoices()
      } else {
        throw new Error(result.error || "Failed to cancel invoice.")
      }
    } catch (error) {
      console.error("Cancel invoice error:", error)
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    }
  }

  const filtered = invoices.filter((i) => {
    const matchSearch =
      i.purchaseInvoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      i.vendor?.name?.toLowerCase().includes(search.toLowerCase())

    const matchStatus = statusFilter === "all" || i.paymentStatus === statusFilter
    const dateFromMatch = !dateFromFilter || new Date(i.date) >= new Date(dateFromFilter)
    const dateToMatch = !dateToFilter || new Date(i.date) <= new Date(dateToFilter)

    const minMatch = !minAmountFilter || i.invoiceTotalAmount >= Number(minAmountFilter)
    const maxMatch = !maxAmountFilter || i.invoiceTotalAmount <= Number(maxAmountFilter)
    return matchSearch && dateFromMatch &&
      dateToMatch &&
      minMatch &&
      maxMatch && matchStatus
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const totalAmount = filtered.reduce((s, i) => s + (i.invoiceTotalAmount || 0), 0)
  const paidAmount = filtered.filter(i => i?.paymentStatus?.toLocaleLowerCase() === "paid").reduce((s, i) => s + (i.paidAmount || 0), 0)
  const unpaidAmount = filtered.filter(i => i?.paymentStatus?.toLocaleLowerCase() === "unpaid").reduce((s, i) => s + (i.balanceAmount || 0), 0)
  const unpaidInvoice = filtered.filter(i => i?.paymentStatus?.toLocaleLowerCase() === "unpaid" && !["Closed", "Cancelled"].includes(i.invoiceStatus))

  const totalPages = Math.ceil(filtered.length / rowsPerPage)

  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const exportCSV = () => {
    const headers = ["Invoice No", "Date", "Vendor", "Amount", "Payment Status"]
    const rows = filtered.map(i => [
      i.purchaseInvoiceNumber,
      new Date(i.date).toLocaleDateString(),
      i.recipientName || i.vendor?.name || "",
      i.invoiceTotalAmount,
      i.paymentStatus
    ])

    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `purchase_invoices_${Date.now()}.csv`
    a.click()
  }

  const getInvoiceStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "Closed":
        return "bg-green-100 text-green-800"
      case "Open":
        return "bg-blue-100 text-blue-800"
      case "Partial":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-orange-100 text-orange-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }


  if (loading) return <p>Loading...</p>
    if (!hasPermission("view_purchase_invoice")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view purchase invoices.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Invoices</h1>
          <p className="text-gray-500">Manage vendor invoices</p>
        </div>

        <div className="space-x-2">
          {/* <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button> */}

          {hasPermission("add_purchase_invoice")&&(<Link href="/dashboard/purchaseInvoices/new">
            <Button title="Add New Invoice but Please ensure Payment Settings completed">
              <Plus className="h-4 w-4 mr-2" /> New Invoice
            </Button>
          </Link>)}
        </div>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* <Card>
          <CardHeader className="pb-2"><CardDescription>Total Amount</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">₹{totalAmount.toLocaleString()} </div></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardDescription>Paid</CardDescription></CardHeader>
          <CardContent className="text-green-600"><div className="text-2xl font-bold">₹{paidAmount.toLocaleString()}</div></CardContent>
        </Card> */}

        <Card>
          <CardHeader className="pb-2"><CardDescription>Unpaid Invoice</CardDescription></CardHeader>
          <CardContent className="text-red-600"><div className="text-2xl font-bold">{unpaidInvoice.length}</div></CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filtered.length})</CardTitle>
          <CardDescription>All purchase invoices</CardDescription>
        </CardHeader>

        <CardContent>

          {/* Search */}
          <div className="flex space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search invoice / vendor"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" /> Filters
            </Button>

            {statusFilter !== "all" && (
              <Button variant="outline" onClick={() => setStatusFilter("all")}>
                <X className="h-4 w-4 mr-2" /> Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              <div>
              <label htmlFor="statusFilter" title="Select Payment Status" className="text-sm font-medium">Payment Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
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
                <label className="text-sm font-medium" title="Filter by invoice total amount">Min Amount</label>
                <Input type="number" value={minAmountFilter} onChange={(e) => setMinAmountFilter(e.target.value)} placeholder="Enter Min Amount"/>
              </div>

              <div>
                <label className="text-sm font-medium" title="Filter by invoice total amount">Max Amount</label>
                <Input type="number" value={maxAmountFilter} onChange={(e) => setMaxAmountFilter(e.target.value)} placeholder="Enter Max Amount"/>
              </div>
            </div>
          )}

              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>S.NO.</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Invoice Status</TableHead>
                    <TableHead className="text-start">Total Amount</TableHead>
                    <TableHead className="text-start">Balance Amount</TableHead>
                    <TableHead className="text-start">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginated.map((i, idx) => (
                    <TableRow key={i._id} className="capitalize">
                      <TableCell>{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>{i.purchaseInvoiceNumber}</TableCell>
                      <TableCell>{i.date ? new Date(i.date).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{i.recipientName}</TableCell>

                      <TableCell>
                        <Badge variant={i.paymentStatus === "Paid" ? "default" : "secondary"} className="capitalize">
                          {i.paymentStatus}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge className={`${getInvoiceStatusBadgeClass(i.invoiceStatus)} capitalize`}>
                          {i.invoiceStatus || "Open"}
                        </Badge>
                      </TableCell>
                      <TableCell className="">₹{i?.invoiceTotalAmount?.toLocaleString()}</TableCell>
                      <TableCell className="">₹{i?.balanceAmount?.toLocaleString()}</TableCell>

                      <TableCell className="text-start">
                        <div className="flex justify-start gap-2">
                          <Link href={`/dashboard/purchaseInvoices/${i._id}`}>
                            <Button size="icon" variant="ghost" title="View Invoice details"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          {(["Open", "overdue"].includes(i.invoiceStatus) || (i.invoiceStatus === "Partial" && i.paymentStatus === "Partial")) && hasPermission("edit_purchase_invoice") && (
                            <Link href={`/dashboard/purchaseInvoices/${i._id}/edit`}>
                              <Button size="icon" variant="ghost" title="Edit Invoice"><Edit className="h-4 w-4" /></Button>
                            </Link>
                          )}
                          {(i.invoiceStatus === "Open" || i.invoiceStatus === "overdue") && i.paymentStatus === "Unpaid" && hasPermission("edit_purchase_invoice") && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Cancel Invoice"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={() => handleCancelInvoice(i._id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between mt-4">
                <Button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                <span>Page {currentPage} of {totalPages}</span>
                <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
              </div>

            </CardContent>
      </Card>
    </div>
  )
}
