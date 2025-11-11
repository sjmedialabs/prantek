"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, FileText, Check, Filter, X } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { Switch } from "@/components/ui/switch"

interface Quotation {
  id: string
  quotationNumber: string
  date: string
  clientName: string
  clientEmail: string
  total: number
  validity: string
  status: "pending" | "accepted"
  acceptedDate?: string
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [acceptedDate, setAcceptedDate] = useState(new Date().toISOString().split("T")[0])

  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [minAmountFilter, setMinAmountFilter] = useState("")
  const [maxAmountFilter, setMaxAmountFilter] = useState("")
  const [clientFilter, setClientFilter] = useState<string>("all")

  useEffect(() => {
    loadQuotations()
  }, [])

  const loadQuotations = async () => {
    const data = await api.quotations.getAll()
    console.log("Fetched Quotations are:::",data)
    setQuotations(data)
    setLoading(false)
  }

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.clientName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter

    const matchesDateFrom = !dateFromFilter || new Date(quotation.date) >= new Date(dateFromFilter)
    const matchesDateTo = !dateToFilter || new Date(quotation.date) <= new Date(dateToFilter)

   const matchesMinAmount =
  !minAmountFilter || Number(quotation.grandTotal) >= Number(minAmountFilter)

const matchesMaxAmount =
  !maxAmountFilter || Number(quotation.grandTotal) <= Number(maxAmountFilter)

    const matchesClient = clientFilter === "all" || quotation.clientName === clientFilter

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesMinAmount &&
      matchesMaxAmount &&
      matchesClient
    )
  })

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
    if (selectedQuotation) {
      console.log("selected quation id:::",selectedQuotation)
      try {
        await api.quotations.accept(selectedQuotation._id)
        await loadQuotations()
        setAcceptDialogOpen(false)
        window.location.href = `/dashboard/receipts/new?quotationId=${selectedQuotation._id}`
      } catch (error) {
        console.error("Failed to accept quotation:", error)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      try {
        console.log("Delte Quotation Id :::",id)
        await api.quotations.delete(id)
        await loadQuotations()
      } catch (error) {
        console.error("Failed to delete quotation:", error)
      }
    }
  }
  const handleToggleStatus = async (id, newStatus) => {
  try {
    await api.quotations. updateStatus(id, { isActive: newStatus })
    toast.success(`Quotation ${newStatus ? "enabled" : "disabled"} successfully`)
    loadQuotations() // refresh list
  } catch (err) {
    console.error(err)
    toast.error("Failed to update quotation status")
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600">Manage your quotations and proposals</p>
        </div>
        <Link href="/dashboard/quotations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Quotation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
          <CardDescription>View and manage all your quotations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search quotations by client name..."
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
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
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

          <div className="space-y-4">
            {filteredQuotations.map((quotation) => (
              <div key={quotation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{quotation.quotationNumber}</h3>
                        <p className="text-sm text-gray-600">{quotation.clientName}</p>
                        {quotation.acceptedDate && (
                          <p className="text-xs text-green-600">
                            Accepted on: {new Date(quotation.acceptedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{(quotation.grandTotal || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        Valid till: {new Date(quotation.validity).toLocaleDateString()}
                      </p>
                    </div>

                    <Badge className={getStatusColor(quotation.status)}>
                      {/* {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)} */}
                      {quotation.status}
                    </Badge>

                    <div className="flex items-center space-x-2">
                      <Link href={`/dashboard/quotations/${quotation._id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      {quotation.status !== "accepted" && (
                        <Link href={`/dashboard/quotations/${quotation._id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        </Link>
                      )}
                      {quotation.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 bg-transparent"
                          onClick={() => handleAccept(quotation)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {quotation.status !== "accepted" && (
                      <Switch
                      checked={quotation.isActive === "active"}
                      onCheckedChange={async (checked) => {
                        try {
                          await api.quotations.updateStatus(
                            quotation._id,
                            checked ? "active" : "inactive"
                          )
                          toast.success(`Quotation ${checked ? "Enabled" : "Disabled"}`)
                          await loadQuotations()
                        } catch (err) {
                          console.error(err)
                          toast.error("Failed to update quotation status")
                        }
                      }}
                      />

                    )}

                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
            <DialogDescription>
              Mark this quotation as accepted. This action cannot be undone and the quotation cannot be edited after
              acceptance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Accepted Date</label>
              <Input type="date" value={acceptedDate} onChange={(e) => setAcceptedDate(e.target.value)} />
            </div>
            {selectedQuotation && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quotation Number:</span>
                  <span className="font-medium">{selectedQuotation.quotationNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-medium">{selectedQuotation.clientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">₹{(selectedQuotation.grandTotal || 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAcceptance} className="bg-green-600 hover:bg-green-700">
              Confirm Acceptance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
