"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { dataStore } from '@/lib/data-store'
import { tokenStorage } from "@/lib/token-storage"
import Link from "next/link";
import { generatePDF } from "@/lib/pdf-utils"
import { Download, Eye, FileText, Filter, Search, X } from "lucide-react"
interface CashEntry {
  id: string
  entryType: "receipt" | "payment"
  date: string
  partyType: "client" | "vendor" | "team"
  partyName: string
    paymentMethod: string
  receiptNumber?: string
  paymentNumber?: string
  category: string
  description: string
  amount: number
  referenceNumber?: string
  createdBy: string
  balance?: number
  accountDetails?: any
}

export default function CashbookPage() {
  const { hasPermission } = useUser()
  const[companyDetails,setCompanyDetails]=useState<any>();

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
  const[paymentMethods,setPaymentMethods] = useState<any>([])
  const [bankAccounts, setBankAccounts] = useState<any>([])
  const[selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>("all")
  const [maxAmountFilter, setMaxAmountFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1);
  const[totlaRecieptsValue,setTotalRecieptsValue]=useState<any>();
  const[netBalanceValue,setNetBalanceValue]=useState<any>()
  const itemsPerPage = 10; // choose how many entries per page
const [selectedBankAccount, setSelectedBankAccount] = useState("all")
  const [planFeatures, setPlanFeatures] = useState<any>(null)

  useEffect(() => {
    loadCashbookData()
    const loadData = async () => {
    
      const activepaymentMethods = await api.paymentMethods.getAll();
      setPaymentMethods(activepaymentMethods);
    }

    const loadCompanyDetails = async () => {
        setCompanyDetails(await api.company.get())
      setBankAccounts(await api.bankAccounts.getAll())
    }

    const fetchPlanFeatures = async () => {
      try {
        const token = tokenStorage.getAccessToken()
        const response = await fetch("/api/user/plan-features", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (data.success) setPlanFeatures(data.planFeatures)
      } catch (error) {
        console.error("Failed to fetch plan features", error)
      }
    }
     loadData();loadCompanyDetails();fetchPlanFeatures()
  }, [])

  const loadCashbookData = async () => {
    const receipts = await api.receipts.getAll()
    const payments = await api.payments.getAll()
    console.log("All receipt and pyments", receipts, payments)
    const formattedReceipts = receipts
      .filter((r: any) => r.status?.toLowerCase() === "cleared")
      .map((r: any) => ({
      id: r._id,
      entryType: "receipt",
      date: r.createdAt,
      partyType: "client",
      receiptNumber: r.receiptNumber,
      partyName: r.clientName,
      category: r.category || "Client Payment",
      description: r.notes,
      amount: r.ReceiptAmount,
      referenceNumber: r.referenceNumber,
      paymentMethod: r.paymentMethod || "",
      accountDetails:  r?.bankAccount || r?.bankDetails || "",
      //   createdBy: r.createdBy
    }))
    console.log("formattedReceipts", formattedReceipts)
    const formattedPayments = payments
      .filter((p: any) => p.status?.toLowerCase() === "cleared")
      .map((p: any) => ({
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
      paymentMethod: p.paymentMethod || "",
      accountDetails: p?.bankAccount || ""
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
      (entry.paymentNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof entry.accountDetails === "string" ? entry.accountDetails : (entry.accountDetails?.bankName + entry.accountDetails?.accountNumber + entry.accountDetails?.accountName || "")).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || entry.entryType === typeFilter
    const matchesPartyType = partyTypeFilter === "all" || entry.partyType === partyTypeFilter
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter

    const matchesDateFrom = !dateFromFilter || new Date(entry.date) >= new Date(dateFromFilter)
    const matchesDateTo = !dateToFilter || new Date(entry.date) <= new Date(dateToFilter)

    
    const matchesBankAccount =
      selectedBankAccount === "all" ||
      (typeof entry.accountDetails === "object"
        ? entry.accountDetails?._id === selectedBankAccount
        : entry.accountDetails ===
          bankAccounts.find((b: any) => b._id === selectedBankAccount)?.bankName || entry.accountDetails === selectedBankAccount)

const matchesPaymentMethods =
  selectedPaymentMethod === "all" || entry.paymentMethod === selectedPaymentMethod
    const matchesMinAmount = !minAmountFilter || entry.amount >= Number(minAmountFilter)
    const matchesMaxAmount = !maxAmountFilter || entry.amount <= Number(maxAmountFilter)

    return (
      matchesSearch &&
      matchesType &&
      matchesPartyType &&
      matchesCategory &&
      matchesDateFrom &&
      matchesDateTo &&
       matchesBankAccount &&
          matchesPaymentMethods &&
          matchesMinAmount &&
      matchesMaxAmount
    )
  })

  // Calculate Opening Balance based on Date Filter
  let openingBalance = 0
  if (dateFromFilter) {
    const fromDate = new Date(dateFromFilter)
    // Reset time to midnight to ensure strict comparison against dates with times
    fromDate.setHours(0, 0, 0, 0)

    openingBalance = entries.reduce((acc, entry) => {
      const entryDate = new Date(entry.date)
      if (entryDate < fromDate) {
        if (entry.entryType === "receipt") return acc + (Number(entry.amount) || 0)
        if (entry.entryType === "payment") return acc - (Number(entry.amount) || 0)
      }
      return acc
    }, 0)
    console.log("Opening Balance", openingBalance)
  }
 console.log("Opening Balance", openingBalance)
  // Calculate Running Balance for Filtered Entries
  // 1. Sort Ascending (Oldest First) to calculate running balance
  const sortedAsc = [...filteredEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let currentRunningBalance = openingBalance
  const entriesWithBalanceAsc = sortedAsc.map((entry) => {
    if (entry.entryType === "receipt") currentRunningBalance += Number(entry.amount) || 0
    else currentRunningBalance -= Number(entry.amount) || 0
    return { ...entry, balance: currentRunningBalance }
  })
console.log("entriesWithBalanceAsc",entriesWithBalanceAsc, currentRunningBalance)
  // 2. Reverse back to Descending (Newest First) for display
  const entriesWithBalance = entriesWithBalanceAsc

  const totalPages = Math.ceil(entriesWithBalance.length / itemsPerPage)
useEffect(() => {
  setCurrentPage(1);
}, [
  searchTerm,
  typeFilter,
  partyTypeFilter,
  categoryFilter,
  dateFromFilter,
  dateToFilter,
  minAmountFilter,
  maxAmountFilter,
  selectedBankAccount,
  selectedPaymentMethod
])
  const paginatedEntries = entriesWithBalance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Unique lists
  const uniqueCategories = Array.from(new Set(entries.map((e) => e.category)))
  const partyTypes = ["client", "vendor", "team"]

  // Summary values
 const totalReceipts = filteredEntries
  .filter((e) => e.entryType === "receipt")
  .reduce((s, e) => s + (parseFloat(e?.amount) || 0), 0);

const totalPayments = filteredEntries
  .filter((e) => e.entryType === "payment")
  .reduce((s, e) => s + (parseFloat(e?.amount) || 0), 0);
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
    setSelectedBankAccount("all")
setSelectedPaymentMethod("all")
  }

  const exportCSV = () => {
    if (entriesWithBalance.length === 0) {
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
      "Payment Method",
      "Bank Name",
      "Reference No",
      "Receipt Amount",
      "Payment Amount",
      "Balance",
    ]

    const rows = entriesWithBalance.map((e) => [
      e.date,
     e.entryType === "receipt" ? e.receiptNumber : e.paymentNumber,
      e.entryType,
      e.partyName || "",
      e.partyType || "",
      e.category || "",
      e.paymentMethod || "",
      typeof e.accountDetails === "object" ? e.accountDetails?.bankName : (e.accountDetails || ""),
      e.referenceNumber || "",
      e.entryType === "receipt" ? e.amount : 0,
      e.entryType === "payment" ? e.amount : 0,
      e.balance || 0,
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

  const handleExportPDF = async () => {
    await generatePDF("cashbook-print-content", "Cashbook.pdf")
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

    if (!hasPermission("view_cash_book")) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-gray-600">You cannot view cashbook records.</p>
        </div>
      )
    }

  return (
    <div className="space-y-6">

      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Cashbook</h1>
          <p className="text-gray-600">View all receipts and payments</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {planFeatures?.csv && (
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          {planFeatures?.pdf && (
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Total Receipts</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">₹{totalReceipts?.toLocaleString()}</div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Total Payments</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">₹{totalPayments?.toLocaleString()}</div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Net Balance</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{netBalance?.toLocaleString()}</div>
            {dateFromFilter && (
              <p className="text-xs text-gray-500 mt-1">Opening Balance: ₹{openingBalance?.toLocaleString()}</p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Quick Action Cards */}
      {/*<div>
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
*/}
      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cashbook Entries ({entriesWithBalance.length})</CardTitle>
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
  <label className="text-sm font-medium">Bank Account</label>

  <Select
    value={selectedBankAccount}
    onValueChange={setSelectedBankAccount}
  >
    <SelectTrigger>
      <SelectValue placeholder="All Accounts" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="all">All</SelectItem>

      {bankAccounts.map((acc: any) => (
        <SelectItem key={acc._id} value={acc._id}>
          {acc.accountName} ({acc.accountNumber})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
<div>
  <label className="text-sm font-medium">Payment Method</label>

  <Select
    value={selectedPaymentMethod}
    onValueChange={setSelectedPaymentMethod}
  >
    <SelectTrigger>
      <SelectValue placeholder="All Methods" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="all">All</SelectItem>

       <SelectItem value="cash">
                          Cash
                        </SelectItem>
                        <SelectItem value="upi">
                          UPI
                        </SelectItem>
                        <SelectItem value="card">
                          Card
                        </SelectItem>
                        <SelectItem value="cheque">
                          Cheque
                        </SelectItem>
                        <SelectItem value="bankTransfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="other">
                          Other
                        </SelectItem>
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
                <TableHead className="text-right">Receipt Amount</TableHead>
                <TableHead className="text-right">Payment Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentPage === 1 && (
                <TableRow className="bg-gray-50 font-medium">
                  <TableCell></TableCell>
                  <TableCell>{new Date(dateFromFilter).toLocaleDateString()}</TableCell>
                  <TableCell colSpan={5}>Opening Balance</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-bold">
                    ₹{(openingBalance || 0).toLocaleString()}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
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

                    <TableCell className="text-right font-semibold text-green-600">
                      {entry.entryType === "receipt" ? `₹${(entry.amount || 0).toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {entry.entryType === "payment" ? `₹${(entry.amount || 0).toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{(entry.balance || 0).toLocaleString()}
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

      {/* Hidden Print Content */}
      <div id="cashbook-print-content" className="hidden">
        <div className="p-8">
          <div className="flex items-start space-x-4">
          {companyDetails?.logo && (
            <img
              src={companyDetails.logo || "/placeholder.svg"}
              alt="Company Logo"
              className="w-20 h-20 object-contain"
            />
          )}
          <div className="flex flex-col gap-2 py-0">
            <h1 className="text-2xl font-bold text-gray-900">{companyDetails?.companyName || "Company Name"}</h1>
            <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600 py-0">{companyDetails?.address}</p>
            <p className="text-sm text-gray-600 py-0">
              Phone: {companyDetails?.phone} | Email: {companyDetails?.email}
            </p>
            </div>
            {companyDetails?.website && <p className="text-sm text-gray-600 py-0 mb-1">Website: {companyDetails.website}</p>}
          </div>
        </div>
          <h1 className="text-2xl font-bold mb-4 text-center">Cashbook Report</h1>
          <table className="w-full text-sm border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Date</th>
                <th className="border p-2">No.</th>
                <th className="border p-2">Party</th>
                <th className="border p-2">Category</th>
                <th className="border p-2 text-right">Receipt (₹)</th>
                <th className="border p-2 text-right">Payment (₹)</th>
                <th className="border p-2 text-right">Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {entriesWithBalance.map((entry, i) => (
                <tr key={i}>
                  <td className="border p-2">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="border p-2">{entry.entryType === "receipt" ? entry.receiptNumber : entry.paymentNumber}</td>
                  <td className="border p-2">{entry.partyName}</td>
                  <td className="border p-2">{entry.category}</td>
                  <td className="border p-2 text-right text-green-600">
                    {entry.entryType === "receipt" ? entry.amount?.toLocaleString() : "-"}
                  </td>
                  <td className="border p-2 text-right text-red-600">
                    {entry.entryType === "payment" ? entry.amount?.toLocaleString() : "-"}
                  </td>
                  <td className="border p-2 text-right font-bold">
                    {entry.balance?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
