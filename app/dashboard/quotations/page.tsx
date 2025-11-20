"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, FileText, Filter, X } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { Switch } from "@/components/ui/switch"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Quotation {
  _id: string
  quotationNumber: string
  date: string
  clientName: string
  clientEmail: string
  grandTotal: number
  validity: string
  status: "pending" | "accepted"
  paidAmount?: number
  balanceAmount?: number
  isActive: "active" | "inactive"
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Accept dialog
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [acceptedDate, setAcceptedDate] = useState(new Date().toISOString().split("T")[0])

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [minAmountFilter, setMinAmountFilter] = useState("")
  const [maxAmountFilter, setMaxAmountFilter] = useState("")
  const [clientFilter, setClientFilter] = useState("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadQuotations()
  }, [])

  const loadQuotations = async () => {
    const data = await api.quotations.getAll()
    setQuotations(data)
    setLoading(false)
  }

  // ---------------- FILTERING LOGIC ----------------
  const filteredQuotations = quotations.filter((q) => {
    const searchMatch =
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase())

    const statusMatch = statusFilter === "all" || q.status === statusFilter

    const dateFromMatch = !dateFromFilter || new Date(q.date) >= new Date(dateFromFilter)
    const dateToMatch = !dateToFilter || new Date(q.date) <= new Date(dateToFilter)

    const minMatch = !minAmountFilter || q.grandTotal >= Number(minAmountFilter)
    const maxMatch = !maxAmountFilter || q.grandTotal <= Number(maxAmountFilter)

    const clientMatch = clientFilter === "all" || q.clientName === clientFilter

    return (
      searchMatch &&
      statusMatch &&
      dateFromMatch &&
      dateToMatch &&
      minMatch &&
      maxMatch &&
      clientMatch
    )
  })

  // ---------------- PAGINATION ----------------
  const totalPages = Math.ceil(filteredQuotations.length / pageSize)
  const paginatedData = filteredQuotations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAccept = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setAcceptDialogOpen(true)
  }

  const confirmAcceptance = async () => {
    if (!selectedQuotation) return
    try {
      await api.quotations.accept(selectedQuotation._id)
      await loadQuotations()
      setAcceptDialogOpen(false)
      window.location.href = `/dashboard/receipts/new?quotationId=${selectedQuotation._id}`
    } catch (error) {
      console.error(error)
    }
  }

  const handleStatusToggle = async (id: string, isActive: string) => {
    try {
      await api.quotations.updateStatus(id, isActive === "active" ? "inactive" : "active")
      toast.success(`Quotation ${isActive === "active" ? "Disabled" : "Enabled"}`)
      loadQuotations()
    } catch (err) {
      toast.error("Failed to update")
    }
  }

  const uniqueClients = Array.from(new Set(quotations.map((q) => q.clientName)))

  const clearFilters = () => {
    setStatusFilter("all")
    setDateFromFilter("")
    setDateToFilter("")
    setMinAmountFilter("")
    setMaxAmountFilter("")
    setClientFilter("all")
    setSearchTerm("")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">Loading...</div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotations / Agreements</h1>
          <p className="text-gray-600">Manage your quotations & proposals</p>
        </div>

        <Link href="/dashboard/quotations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Quotation/Agreement
          </Button>
        </Link>
      </div>

      {/* ---------------- FILTERS ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotations/Agreement ({filteredQuotations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search + filter buttons */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by quotation no or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" /> Filters
            </Button>

            {(statusFilter !== "all" ||
              dateFromFilter ||
              dateToFilter ||
              minAmountFilter ||
              maxAmountFilter ||
              clientFilter !== "all") && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" /> Clear
              </Button>
            )}
          </div>

          {/* Filter dropdown section */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Client</label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueClients.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} />
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

          {/* ---------------- TABLE VIEW ---------------- */}
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Quotation/Agreement No</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.map((q, index) => (
                  <TableRow key={q._id}>
                    <TableCell>
                      {(currentPage - 1) * pageSize + (index + 1)}
                    </TableCell>

                    <TableCell className="font-medium">{q.quotationNumber}</TableCell>
                    <TableCell>{q.clientName}</TableCell>
                    <TableCell>{new Date(q.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(q.validity).toLocaleDateString()}</TableCell>

                    <TableCell>₹{(q.balanceAmount || 0).toLocaleString()}</TableCell>

                    <TableCell>
                      <Badge className={getStatusColor(q.status)}>{q.status}</Badge>
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      <Link href={`/dashboard/quotations/${q._id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>

                      <Link href={`/dashboard/quotations/${q._id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Switch
                        checked={q.isActive === "active"}
                        onCheckedChange={(e) => handleStatusToggle(q._id, q.isActive)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ---------------- PAGINATION ---------------- */}
          <div className="flex justify-end items-center gap-3 mt-4">
            <Button
              variant="outline"
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
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- ACCEPT DIALOG ---------------- */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
            <DialogDescription>
              Confirm acceptance to convert this quotation into a receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <label className="text-sm font-medium">Accepted Date</label>
            <Input type="date" value={acceptedDate} onChange={(e) => setAcceptedDate(e.target.value)} />

            {selectedQuotation && (
              <div className="p-4 bg-gray-100 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Quotation:</span>
                  <span className="font-medium">{selectedQuotation.quotationNumber}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Client:</span>
                  <span className="font-medium">{selectedQuotation.clientName}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Amount:</span>
                  <span className="font-medium">
                    ₹{(selectedQuotation.grandTotal || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>Cancel</Button>
            <Button className="bg-green-600" onClick={confirmAcceptance}>
              Confirm Acceptance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
