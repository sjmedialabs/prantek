"use client"

import { Fragment, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format, startOfDay } from "date-fns"
import { Check, Download, Eye, RefreshCw, Search, X, GitCompare } from "lucide-react"
import { useUser } from "@/components/auth/user-context"
import { api } from "@/lib/api-client"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link";
interface Transaction {
  _id: string
  type: "receipt" | "payment"
  transactionNumber: string
  quotationNumber?: string
  date: string
  clientName?: string
  recipientName?: string
  recipientType?: string
  bankAccount?: string
  paymentMethod: string
  referenceNumber?: string
  amount: number
  status: "pending" | "cleared" | "completed" | "cancelled"
  createdAt?: string
  updatedAt?: string
}

// Helper function to safely format dates
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"
    return format(date, "dd/MM/yyyy")
  } catch {
    return "-"
  }
}

export default function ReconciliationPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "receipt" | "payment">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "cleared" | "uncleared">("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [statsView, setStatsView] = useState<"all" | "receipts" | "payments">("all")
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set())
  const { hasPermission, user } = useUser()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // Show 10 rows per page
  const [paymentMethod, setpaymentMethod] = useState<any[]>([])
  const [compareRowId, setCompareRowId] = useState<string | null>(null)
  const [compareData, setCompareData] = useState({ ref: "", date: "", amount: "" })
  const [openingBalance, setOpeningBalance] = useState(0)
  const [closingBalance, setClosingBalance] = useState(0)

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, typeFilter, statusFilter, paymentMethodFilter, currentPage])

  useEffect(() => {
    if (transactions.length === 0) {
      setOpeningBalance(0)
      setClosingBalance(0)
      return
    }

    // Determine the start date for the opening balance calculation
    const dates = filteredTransactions.map((t) => new Date(t.date).getTime()).filter((t) => !isNaN(t))
    const minDate = dates.length > 0 ? startOfDay(new Date(Math.min(...dates))) : null

    // 1. Calculate Opening Balance
    const opening = transactions
      .filter(
        (t) =>
          (t.status === "cleared" || t.status === "completed") &&
          minDate &&
          startOfDay(new Date(t.date)) < minDate,
      )
      .reduce((acc, t) => {
        if (t.type === "receipt") return acc + t.amount
        if (t.type === "payment") return acc - t.amount
        return acc
      }, 0)
    setOpeningBalance(opening)

    // 2. Calculate Closing Balance
    const filteredClearedSum = filteredTransactions
      .filter((t) => t.status === "cleared" || t.status === "completed")
      .reduce((acc, t) => {
        if (t.type === "receipt") return acc + t.amount
        if (t.type === "payment") return acc - t.amount
        return acc
      }, 0)

    setClosingBalance(opening + filteredClearedSum)
  }, [filteredTransactions, transactions])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const data = await api.reconciliation.getAll()
      const activeTransactions = data.filter((t: Transaction) => t.status !== "cancelled")
      setTransactions(activeTransactions)
      const paymentMethods = await api.paymentMethods.getAll()
      setpaymentMethod(paymentMethods)
    } catch (error) {
      console.error("Failed to load reconciliation data:", error)
      toast.error("Failed to load reconciliation data")
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    // Status filter
    if (statusFilter === "uncleared") {
      filtered = filtered.filter((t) => t.status === "pending")
    } else if (statusFilter === "cleared") {
      filtered = filtered.filter((t) => t.status === "cleared")
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter)
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((t) => t.paymentMethod === paymentMethodFilter)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.transactionNumber?.toLowerCase().includes(search) ||
          t.quotationNumber?.toLowerCase().includes(search) ||
          t.clientName?.toLowerCase().includes(search) ||
          t.recipientName?.toLowerCase().includes(search) ||
          t.referenceNumber?.toLowerCase().includes(search) ||
          t.bankAccount?.toLowerCase().includes(search)
      )
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })

    setFilteredTransactions(filtered)
  }
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter, statusFilter, paymentMethodFilter])

  const handleClearTransaction = async (transaction: Transaction) => {
    if (!hasPermission("manage_reconciliation")) {
      toast.error("You don't have permission to clear transactions")
      return
    }

    try {
      const isCurrentlyCleared = transaction.status === "cleared"

      // Add to animating set
      setAnimatingIds((prev) => new Set(prev).add(transaction._id))

      // Optimistically update the UI
      setTransactions((prevTransactions) =>
        prevTransactions.map((t) =>
          t._id === transaction._id
            ? { ...t, status: isCurrentlyCleared ? "pending" : t.type === "receipt" ? "cleared" : "cleared" }
            : t,
        ),
      )

      // Call API to update status
      await api.reconciliation.updateStatus(
        transaction._id,
        transaction.type,
        !isCurrentlyCleared
      )

      // Wait for animation to complete before removing from view
      setTimeout(() => {
        setAnimatingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(transaction._id)
          return newSet
        })

        // Reload to sync with server
        loadTransactions()
      }, 500) // 500ms for fade out animation

      toast.success(
        isCurrentlyCleared
          ? `${transaction.type === "receipt" ? "Receipt" : "Payment"} marked as uncleared`
          : `${transaction.type === "receipt" ? "Receipt" : "Payment"} marked as cleared`
      )
    } catch (error) {
      // Remove from animating set on error
      setAnimatingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(transaction._id)
        return newSet
      })

      // Revert optimistic update
      await loadTransactions()

      console.error("Failed to update transaction:", error)
      toast.error("Failed to update transaction")
    }
  }

  const calculateStats = (filter: "all" | "receipts" | "payments") => {
    let data = transactions

    if (filter === "receipts") {
      data = transactions.filter((t) => t.type === "receipt")
    } else if (filter === "payments") {
      data = transactions.filter((t) => t.type === "payment")
    }

    const pending = data.filter((t) => t.status === "pending")
    const cleared = data.filter((t) => t.status === "cleared")
    const unclearRecAmount = data.filter((t)=> t.type === "receipt" && t.status === "pending").reduce((sum, t) => sum + t.amount, 0)
    const unclearRec = data.filter((t)=> t.type === "receipt" && t.status === "pending").length
    const unclearPayAmount = data.filter((t)=> t.type === "payment" && t.status === "pending").reduce((sum, t) => sum + t.amount, 0)
    const unclearPay = data.filter((t)=> t.type === "payment" && t.status === "pending").length
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, t) => sum + t.amount, 0),
      clearedCount: cleared.length,
      clearedAmount: cleared.reduce((sum, t) => sum + t.amount, 0),
      totalCount: data.length,
      totalAmount: data.reduce((sum, t) => sum + t.amount, 0),
      unclearRecAmount,
      unclearRec,
      unclearPayAmount,
      unclearPay
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Type",
      "Transaction Number",
      "Date",
      "Name",
      "Payment Method",
      "Bank Account",
      "Reference",
      "Amount In",
      "Amount Out",
      "Status",
    ]

    const rows = filteredTransactions.map((t) => [
      t.type === "receipt" ? "Receipt" : "Payment",
      t.transactionNumber,
      formatDate(t.date),
      t.type === "receipt" ? t.clientName : t.recipientName,
      t.paymentMethod,
      t.bankAccount || "-",
      t.referenceNumber || "-",
      t.type === "receipt" ? t.amount.toFixed(2) : "0.00",
      t.type === "payment" ? t.amount.toFixed(2) : "0.00",
      t.status === "pending" ? "Pending" : "cleared",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reconciliation-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = calculateStats(statsView)
  const paymentMethods = Array.from(new Set(transactions.map((t) => t.paymentMethod).filter(m => m && m.trim() !== ""))).sort()

  if (!hasPermission("view_reconciliation")) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view reconciliation</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clearing</h1>
          <p className="text-muted-foreground">Verify receipts and payments with your bank account</p>
        </div>
        {/* <Button onClick={loadTransactions} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button> */}
      </div>

      {/* Statistics */}
      {/* <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Statistics</CardTitle>
            <Tabs value={statsView} onValueChange={(v) => setStatsView(v as any)} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="receipts">Receipts</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">₹{stats.pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">{stats.pendingCount} transactions</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Cleared</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.clearedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">{stats.clearedCount} transactions</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">{stats.totalCount} transactions</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Opening Balance</p>
              <p className="text-2xl font-bold">₹{openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Based on cleared transactions before filter</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Closing Balance</p>
              <p className="text-2xl font-bold">₹{closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Based on cleared transactions in filter</p>
            </div>
          </div>
        </CardContent>
      </Card> */}
      <div className="grid grid-cols-2 gap-4">
       {/* <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cancelled Receipt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {calculateStats.unclearRecAmount}
            </div>
          </CardContent>
        </Card>
         <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Cancelled Receipt</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {calculateStats.unclearPayAmount}
                    </div>
                  </CardContent>
                </Card> */}
</div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="all">All</SelectItem>
                   <SelectItem value="cleared">Cleared Only</SelectItem>
                  <SelectItem value="uncleared">Uncleared Only</SelectItem>
                 
                  
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="receipt">Receipts</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {paymentMethod.map((method) => (
                    <SelectItem key={method._id} value={method.name}>
                      {method.name.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions found</p>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount In (₹)</TableHead>
                    <TableHead className="text-right">Amount Out (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((transaction, index) => {
                    const serial = (currentPage - 1) * itemsPerPage + (index + 1)
                    const isCleared = transaction.status === "cleared" || transaction.status === "completed"

                    return (
                      <Fragment key={transaction._id}>
                        <TableRow
                          // key={transaction._id}
                          className={`transition-all duration-500 ${
                            animatingIds.has(transaction._id)
                              ? "opacity-0 scale-95 bg-green-50 dark:bg-green-950"
                              : "opacity-100 scale-100"
                          }`}
                        >
                          <TableCell>{serial}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === "receipt" ? "default" : "secondary"}>
                              {transaction.type === "receipt" ? "Receipt" : "Payment"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{transaction.transactionNumber}</TableCell>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>
                            {transaction.type === "receipt" ? transaction.clientName : transaction.recipientName}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">{transaction.paymentMethod}</span>
                          </TableCell>
                          <TableCell>{transaction.bankAccount || "-"}</TableCell>
                          <TableCell>{transaction.referenceNumber || "-"}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {transaction.type === "receipt"
                              ? `₹${transaction.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {transaction.type === "payment"
                              ? `₹${transaction.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isCleared ? "default" : "secondary"} className="transition-all duration-300">
                              {isCleared ? "Cleared" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Compare"
                                onClick={() =>
                                  setCompareRowId(compareRowId === transaction._id ? null : transaction._id)
                                }
                              >
                                <GitCompare className="h-4 w-4" />
                              </Button>
                              <Link
                                href={
                                  transaction.type === "receipt"
                                    ? `/dashboard/receipts/${transaction._id}`
                                    : `/dashboard/payments/${transaction._id}`
                                }
                              >
                                <Button variant="ghost" size="icon" title="View Details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {hasPermission("manage_reconciliation") && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title={isCleared ? "Mark as Uncleared" : "Mark as Cleared"}
                                  onClick={() => handleClearTransaction(transaction)}
                                  disabled={animatingIds.has(transaction._id)}
                                  className="transition-all duration-200"
                                >
                                  {isCleared ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {compareRowId === transaction._id && (
                          <TableRow className="bg-gray-50 dark:bg-gray-800">
                            <TableCell colSpan={12}>
                              <div className="p-2 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <h4 className="font-semibold text-sm md:col-span-1">Compare with Bank Statement:</h4>
                                <Input placeholder="Reference No." onChange={(e) => setCompareData({...compareData, ref: e.target.value})} />
                                <Input type="date" onChange={(e) => setCompareData({...compareData, date: e.target.value})} />
                                <Input type="number" placeholder="Amount" onChange={(e) => setCompareData({...compareData, amount: e.target.value})} />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
              {filteredTransactions.length > itemsPerPage && (
                <div className="flex items-center justify-between py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    Previous
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
