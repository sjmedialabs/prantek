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
}

export default function PurchaseInvoiceList() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    fetch("/api/purchaseInvoice")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setInvoices(res.data)
        setLoading(false)
      })
  }, [])

  const filtered = invoices.filter((i) => {
    const matchSearch =
      i.purchaseInvoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      i.vendor?.name?.toLowerCase().includes(search.toLowerCase())

    const matchStatus = statusFilter === "all" || i.paymentStatus === statusFilter

    return matchSearch && matchStatus
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const totalAmount = filtered.reduce((s, i) => s + (i.balanceAmount || 0), 0)
  const paidAmount = filtered.filter(i => i.paymentStatus === "paid").reduce((s, i) => s + (i.paidAmount || 0), 0)
  const unpaidAmount = filtered.filter(i => i.paymentStatus === "Unpaid").reduce((s, i) => s + (i.balanceAmount || 0), 0)

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

  if (loading) return <p>Loading...</p>

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Invoices</h1>
          <p className="text-gray-500">Manage vendor invoices</p>
        </div>

        <div className="space-x-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>

          <Link href="/dashboard/purchaseInvoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Total</CardTitle></CardHeader>
          <CardContent>₹{totalAmount.toLocaleString()}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle>Paid</CardTitle></CardHeader>
          <CardContent className="text-green-600">₹{paidAmount.toLocaleString()}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle>Unpaid</CardTitle></CardHeader>
          <CardContent className="text-red-600">₹{unpaidAmount.toLocaleString()}</CardContent>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Invoice Status</TableHead>
                <TableHead className="text-right">Payable Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map((i, idx) => (
                <TableRow key={i._id}>
                  <TableCell>{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>{i.purchaseInvoiceNumber}</TableCell>
                  <TableCell>{i.date ? new Date(i.date).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{i.recipientName}</TableCell>

                  <TableCell>
                    <Badge variant={i.paymentStatus === "Paid" ? "default" : "secondary"}>
                      {i.paymentStatus}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant={i.invoiceStatus === "Closed" ? "default" : "outline"}>
                      {i.invoiceStatus || "Open"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">₹{i?.balanceAmount?.toLocaleString()}</TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/purchaseInvoices/${i._id}`}>
                        <Button size="icon" variant="ghost" title="View Invoice details"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      {!(i.paymentStatus === "Paid" && i.invoiceStatus === "Closed" && (!i.balanceAmount || i.balanceAmount === 0)) && (
                        <Link href={`/dashboard/purchaseInvoices/${i._id}/edit`}>
                          <Button size="icon" variant="ghost" title="Edit Invoice"><Edit className="h-4 w-4" /></Button>
                        </Link>
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
