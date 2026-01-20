"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, X, Download, Receipt, Plus, CreditCard, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import Link from "next/link";
interface CashEntry {
  id: string
  entryType: "receipt" | "payment"
  date: string
  partyType: "client" | "vendor" | "team"
  partyName: string
  receiptNumber?: string
  paymentNumber?: string
  category: string
  description: string
  amount: number
  referenceNumber?: string
  createdBy: string
}

export default function CashbookPage() {
  const { hasPermission } = useUser()

  const [entries, setEntries] = useState<CashEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const [typeFilter, setTypeFilter] = useState("all")
  const [partyTypeFilter, setPartyTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [minAmountFilter, setMinAmountFilter] = useState("")
  const [maxAmountFilter, setMaxAmountFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1);
  const[totlaRecieptsValue,setTotalRecieptsValue]=useState<any>();
  const[netBalanceValue,setNetBalanceValue]=useState<any>()
  const itemsPerPage = 10; // choose how many entries per page

  useEffect(() => {
    loadCashbookData()
  }, [])

  const loadCashbookData = async () => {
    const receipts = await api.receipts.getAll()
    const payments = await api.payments.getAll()
    console.log("All receipt and pyments", receipts, payments)
    const formattedReceipts = receipts.map((r: any) => ({
      id: r._id,
      entryType: "receipt",
      date: r.createdAt,
      partyType: "client",
      receiptNumber: r.receiptNumber,
      partyName: r.clientName,
      category: r.category || "Client Payment",
      description: r.notes,
      amount: r.amountPaid,
      referenceNumber: r.referenceNumber,
      //   createdBy: r.createdBy
    }))
    console.log("formattedReceipts", formattedReceipts)
    const formattedPayments = payments.map((p: any) => ({
      id: p._id,
      entryType: "payment",
      paymentNumber: p.paymentNumber,
      date: p.createdAt,
      partyType: p.recipientType || "client",
      partyName: p.recipientName || "",
      category: p.category || "",
      description: p.description || "",
      amount: p.amount || 0,
      referenceNumber: p.referenceNumber || "",
      //   createdBy: p.createdBy
    }))
    console.log("formattedPayments", formattedPayments)
    const combined = [...formattedReceipts, ...formattedPayments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    setEntries(combined)
    setLoading(false)
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      (entry.partyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.date || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.receiptNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.paymentNumber || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || entry.entryType === typeFilter
    const matchesPartyType = partyTypeFilter === "all" || entry.partyType === partyTypeFilter
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter

    const matchesDateFrom = !dateFromFilter || new Date(entry.date) >= new Date(dateFromFilter)
    const matchesDateTo = !dateToFilter || new Date(entry.date) <= new Date(dateToFilter)

    const matchesMinAmount = !minAmountFilter || entry.amount >= Number(minAmountFilter)
    const matchesMaxAmount = !maxAmountFilter || entry.amount <= Number(maxAmountFilter)

    return (
      matchesSearch &&
      matchesType &&
      matchesPartyType &&
      matchesCategory &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesMinAmount &&
      matchesMaxAmount
    )
  })
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, partyTypeFilter, categoryFilter, dateFromFilter, dateToFilter, minAmountFilter, maxAmountFilter]);

  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Unique lists
  const uniqueCategories = Array.from(new Set(entries.map((e) => e.category)))
  const partyTypes = ["client", "vendor", "team"]

  // Summary values
 const totalReceipts = filteredEntries
  .filter((e) => e.entryType === "receipt")
  .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

const totalPayments = filteredEntries
  .filter((e) => e.entryType === "payment")
  .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const netBalance = totalReceipts - totalPayments

  console.log("filtered entries :::::::::::::", totalReceipts,netBalance)
  const clearFilters = () => {
    setTypeFilter("all")
    setPartyTypeFilter("all")
    setCategoryFilter("all")
    setDateFromFilter("")
    setDateToFilter("")
    setMinAmountFilter("")
    setMaxAmountFilter("")
    setSearchTerm("")
  }

  const exportCSV = () => {
    if (entries.length === 0) {
      alert("No data available to export.")
      return
    }

    const headers = [
      "Date",
      "Reciept/Payment No",
      "Type",
      "Party Name",
      "Party Type",
      "Category",
      
      "Reference No",
      "Amount"
    ]

    const rows = entries.map((e) => [
      e.date,
      e.receiptNumber,
      e.entryType,
      e.partyName || "",
      e.partyType || "",
      e.category || "",
      
      e.referenceNumber || "",
      e.amount || 0
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((row) => row.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "cashbook_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Cashbook...</p>
        </div>
      </div>
    )
  }

  //   if (!hasPermission("view_cashbo)) {
  //     return (
  //       <div className="text-center py-12">
  //         <h2 className="text-2xl font-bold">Access Denied</h2>
  //         <p className="text-gray-600">You cannot view cashbook records.</p>
  //       </div>
  //     )
  //   }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cashbook</h1>
          <p className="text-gray-600">View all receipts and payments</p>
        </div>

        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Total Receipts</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">₹{totalReceipts.toLocaleString()}</div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Total Payments</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">₹{totalPayments.toLocaleString()}</div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Net Balance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">₹{netBalance.toLocaleString()}</div></CardContent>
        </Card>
      </div>
      {/* Quick Action Cards */}
      <div>
        {
        (hasPermission("add_receipts") || hasPermission("add_payments")) && (
           <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        )
       }
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {
            (hasPermission("add_receipts")) && (
              <Link href="/dashboard/receipts/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Create Receipt
                </CardTitle>
                <Receipt className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    Record incoming payments
                  </p>
                  <div className="bg-green-100 p-2 rounded-full">
                    <Plus className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
            )
          }

          {
            (hasPermission("add_payments")) && (
              <Link href="/dashboard/payments/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-red-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Create Payment
                </CardTitle>
                <CreditCard className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    Record outgoing payments
                  </p>
                  <div className="bg-red-100 p-2 rounded-full">
                    <Plus className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
            )
          }
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cashbook Entries ({filteredEntries.length})</CardTitle>
          <CardDescription>Receipts + Payments</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Search & Filter */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, receipt/payment number, ledger and date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            {(typeFilter !== "all" ||
              partyTypeFilter !== "all" ||
              categoryFilter !== "all" ||
              dateFromFilter ||
              dateToFilter ||
              minAmountFilter ||
              maxAmountFilter) && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium">Entry Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Party Type</label>
                <Select value={partyTypeFilter} onValueChange={setPartyTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {partyTypes.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Ledger</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder="All Ledgers" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={(cat || "no ledger")}>{(cat) || "No Ledger"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                  <label className="text-sm font-medium">Date From</label>
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Date To</label>
                  <Input
                    type="date"
                    value={dateToFilter}
                    min={dateFromFilter || undefined}   // 👈 restrict to only dates >= from date
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
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

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Receipt/Payment No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Party Type</TableHead>
                <TableHead>Ledger</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedEntries.map((entry, index) => {
                const serial = (currentPage - 1) * itemsPerPage + (index + 1)
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{serial}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.entryType === "receipt" ? entry.receiptNumber : entry.paymentNumber}</TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.entryType === "receipt" ? "default" : "destructive"}
                        className="capitalize"
                      >
                        {entry.entryType}
                      </Badge>
                    </TableCell>

                    <TableCell>{entry.partyName}</TableCell>
                    <TableCell className="capitalize">{entry.partyType}</TableCell>

                    <TableCell>
                      <Badge variant="outline">{entry.category}</Badge>
                    </TableCell>

                    <TableCell className="text-right font-semibold">
                      ₹{(entry.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={
                          entry.entryType === "receipt"
                            ? `/dashboard/receipts/${entry.id}`
                            : `/dashboard/payments/${entry.id}`
                        }
                      >
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>

                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
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
