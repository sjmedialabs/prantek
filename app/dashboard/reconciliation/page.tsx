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
import { Check, Download, Eye, RefreshCw, Search, X, GitCompare, Wallet, Upload, FileUp } from "lucide-react"
import { useUser } from "@/components/auth/user-context"
import { api } from "@/lib/api-client"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
interface Transaction {
  _id: string
  type: "receipt" | "payment"
  transactionNumber: string
  quotationNumber?: string
  date: string
  clientName?: string
  recipientName?: string
  recipientType?: string
  bankAccount?: any
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
  const [compareData, setCompareData] = useState({
    bank_statement_date: "",
    reference_no: "",
    amount: "",
  })
  const [compareEntryId, setCompareEntryId] = useState<string | null>(null)
  const [compareTransactionType, setCompareTransactionType] = useState<"receipt" | "payment">("receipt")
  const [compareSaving, setCompareSaving] = useState(false)
  const [compareErrors, setCompareErrors] = useState<{ bank_statement_date?: string; amount?: string }>({})
  const [openingBalance, setOpeningBalance] = useState(0)
  const [closingBalance, setClosingBalance] = useState(0)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadBankAccountId, setUploadBankAccountId] = useState("")
  const [uploadSubmitting, setUploadSubmitting] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [bankStatements, setBankStatements] = useState<any[]>([])
  const [loadingBankStatements, setLoadingBankStatements] = useState(false)
  const [matchSubmitting, setMatchSubmitting] = useState<string | null>(null)

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

  const loadBankAccounts = async () => {
    try {
      const list = await api.bankAccounts.getAll()
      setBankAccounts(Array.isArray(list) ? list : [])
    } catch {
      setBankAccounts([])
    }
  }

  const loadBankStatements = async () => {
    try {
      setLoadingBankStatements(true)
      const data = await api.reconciliation.getBankStatements({ status: "pending" })
      setBankStatements(Array.isArray(data) ? data : [])
    } catch {
      setBankStatements([])
    } finally {
      setLoadingBankStatements(false)
    }
  }

  useEffect(() => {
    loadBankAccounts()
  }, [])
  useEffect(() => {
    if (hasPermission("view_reconciliation")) loadBankStatements()
  }, [])

  const handleUploadBankStatement = async () => {
    if (!uploadFile || !uploadBankAccountId) {
      toast.error("Select a file and bank account")
      return
    }
    setUploadSubmitting(true)
    try {
      await api.reconciliation.uploadBankStatement(uploadFile, uploadBankAccountId)
      toast.success("Bank statement uploaded. Review suggested matches below.")
      setUploadModalOpen(false)
      setUploadFile(null)
      setUploadBankAccountId("")
      await loadBankStatements()
      await loadTransactions()
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed")
    } finally {
      setUploadSubmitting(false)
    }
  }

  const handleMatch = async (
    bankStatementId: string,
    transactionIds: { id: string; type: "receipt" | "payment" }[]
  ) => {
    setMatchSubmitting(bankStatementId)
    try {
      await api.reconciliation.matchBankStatement(bankStatementId, transactionIds)
      toast.success("Matched and cleared")
      await loadBankStatements()
      await loadTransactions()
    } catch (e: any) {
      toast.error(e?.message ?? "Match failed")
    } finally {
      setMatchSubmitting(null)
    }
  }

  const handleIgnore = async (bankStatementId: string) => {
    try {
      await api.reconciliation.ignoreBankStatement(bankStatementId)
      toast.success("Ignored")
      await loadBankStatements()
    } catch (e: any) {
      toast.error(e?.message ?? "Ignore failed")
    }
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    // Status filter
    if (statusFilter === "uncleared") {
      filtered = filtered.filter((t) => t.status !== "cleared")
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
          t.paymentMethod?.toLowerCase().includes(search) ||
         (
  t.bankAccount?.bankName?.toLowerCase().includes(search) ||
  t.bankAccount?.accountNumber?.toLowerCase().includes(search) ||
  t.bankAccount?.accountName?.toLowerCase().includes(search)
)
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
    const unclearRecAmount = data.filter((t) => t.type === "receipt" && t.status !== "cleared").reduce((sum, t) => sum + t.amount, 0)
    const unclearRec = data.filter((t) => t.type === "receipt" && t.status !== "cleared").length
    const unclearPayAmount = data.filter((t) => t.type === "payment" && t.status !== "cleared").reduce((sum, t) => sum + t.amount, 0)
    const unclearPay = data.filter((t) => t.type === "payment" && t.status !== "cleared").length
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

  const openCompare = async (transaction: Transaction) => {
    const id = transaction._id
    if (compareRowId === id) {
      setCompareRowId(null)
      setCompareData({ bank_statement_date: "", reference_no: "", amount: "" })
      setCompareEntryId(null)
      setCompareErrors({})
      return
    }
    setCompareRowId(id)
    setCompareTransactionType(transaction.type)
    setCompareData({ bank_statement_date: "", reference_no: "", amount: "" })
    setCompareEntryId(null)
    setCompareErrors({})
    try {
      const entry = await api.reconciliation.getEntry(id)
      if (entry?.bank_statement_date != null || entry?.reference_no != null || entry?.amount != null) {
        setCompareData({
          bank_statement_date:
            typeof entry.bank_statement_date === "string"
              ? entry.bank_statement_date
              : entry.bank_statement_date
                ? new Date(entry.bank_statement_date).toISOString().split("T")[0]
                : "",
          reference_no: entry.reference_no ?? "",
          amount: entry.amount != null ? String(entry.amount) : "",
        })
        if (entry._id) setCompareEntryId(String(entry._id))
      }
    } catch {
      // keep empty form
    }
  }

  const validateCompareForm = (): boolean => {
    const err: { bank_statement_date?: string; amount?: string } = {}
    if (!compareData.bank_statement_date?.trim()) err.bank_statement_date = "Bank statement date is required"
    const amt = Number(compareData.amount)
    if (compareData.amount === "" || compareData.amount == null || isNaN(amt) || amt <= 0) {
      err.amount = "Amount is required and must be greater than 0"
    }
    setCompareErrors(err)
    return Object.keys(err).length === 0
  }

  const handleCompareSave = async () => {
    if (!compareRowId || !validateCompareForm()) return
    setCompareSaving(true)
    setCompareErrors({})
    try {
      const payload = {
        bank_statement_date: compareData.bank_statement_date!.trim(),
        reference_no: compareData.reference_no?.trim() ?? "",
        amount: Number(compareData.amount),
      }
      if (compareEntryId) {
        await api.reconciliation.updateEntry({
          id: compareEntryId,
          ...payload,
        })
      } else {
        await api.reconciliation.saveEntry({
          transaction_id: compareRowId,
          transaction_type: compareTransactionType,
          ...payload,
        })
      }
      toast.success("Reconciliation details saved successfully")
      const entry = await api.reconciliation.getEntry(compareRowId)
      if (entry?._id) setCompareEntryId(String(entry._id))
      if (entry?.bank_statement_date != null || entry?.reference_no != null || entry?.amount != null) {
        setCompareData({
          bank_statement_date:
            typeof entry.bank_statement_date === "string"
              ? entry.bank_statement_date
              : entry.bank_statement_date
                ? new Date(entry.bank_statement_date).toISOString().split("T")[0]
                : "",
          reference_no: entry.reference_no ?? "",
          amount: entry.amount != null ? String(entry.amount) : "",
        })
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to save reconciliation details")
      setCompareErrors({ amount: e?.message })
    } finally {
      setCompareSaving(false)
    }
  }

  const handleCompareCancel = () => {
    setCompareRowId(null)
    setCompareData({ bank_statement_date: "", reference_no: "", amount: "" })
    setCompareEntryId(null)
    setCompareErrors({})
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
      typeof t.bankAccount === 'object' ? t.bankAccount?.bankName : (t.bankAccount || "-"),
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
    const unclearRecAmount = transactions.filter((t) => t.type === "receipt" && t.status !== "cleared").reduce((sum, t) => sum + t.amount, 0)
    const unclearRec = transactions.filter((t) => t.type === "receipt" && t.status !== "cleared").length
    const unclearPayAmount = transactions.filter((t) => t.type === "payment" && t.status !== "cleared").reduce((sum, t) => sum + t.amount, 0)
    const unclearPay = transactions.filter((t) => t.type === "payment" && t.status !== "cleared").length
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clearing</h1>
          <p className="text-muted-foreground">Verify receipts and payments with your bank account</p>
        </div>
        {hasPermission("manage_reconciliation") && (
          <Button variant="outline" onClick={() => setUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Bank Statement
          </Button>
        )}
      </div>

      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Bank Statement</DialogTitle>
            <DialogDescription>
              Upload a CSV with columns: Date, Description, Reference, Debit, Credit, Balance. Rows will be matched with system transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bank Account</Label>
              <Select value={uploadBankAccountId} onValueChange={setUploadBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((b: any) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.accountName ?? b.bankName ?? b._id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CSV File</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                {uploadFile && <p className="text-sm text-muted-foreground mt-2">{uploadFile.name}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)} disabled={uploadSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUploadBankStatement} disabled={uploadSubmitting || !uploadFile || !uploadBankAccountId}>
              {uploadSubmitting ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {bankStatements.filter(
        (r: any) =>
          r.status === "pending" &&
          ((r.suggestedSingle && r.suggestedSingle.length > 0) || (r.suggestedMulti && r.suggestedMulti.length > 0))
      ).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileUp className="h-5 w-5 mr-2" />
              Suggested matches
            </CardTitle>
            <CardDescription>Bank statement rows with possible transaction matches. Match, ignore, or use Manual Compare.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBankStatements ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <div className="space-y-4">
                {bankStatements
                  .filter(
                    (r: any) =>
                      r.status === "pending" &&
                      ((r.suggestedSingle && r.suggestedSingle.length > 0) || (r.suggestedMulti && r.suggestedMulti.length > 0))
                  )
                  .map((row: any) => (
                    <div
                      key={row._id}
                      className="border rounded-lg p-4 space-y-3 bg-muted/30"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Date</span>
                          <p className="font-medium">{row.date}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Description</span>
                          <p className="font-medium truncate max-w-[120px]" title={row.description}>{row.description || "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reference</span>
                          <p className="font-medium">{row.reference || "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Debit</span>
                          <p className="font-medium text-red-600">{(row.debit ?? 0) > 0 ? `₹${Number(row.debit).toLocaleString()}` : "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Credit</span>
                          <p className="font-medium text-green-600">{(row.credit ?? 0) > 0 ? `₹${Number(row.credit).toLocaleString()}` : "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Balance</span>
                          <p className="font-medium">₹{Number(row.balance || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {row.suggestedSingle?.slice(0, 3).map((s: any, i: number) => {
                          const tx = transactions.find((t) => String(t._id) === s.transactionId)
                          const label = tx ? `${tx.transactionNumber} (₹${tx.amount})` : s.transactionId
                          return (
                            <div key={i} className="flex items-center gap-2 rounded border bg-background px-2 py-1 text-sm">
                              <span>{label}</span>
                              <span className="text-muted-foreground">Score {s.score}</span>
                              <Button
                                size="sm"
                                onClick={() => handleMatch(row._id, [{ id: s.transactionId, type: s.type }])}
                                disabled={matchSubmitting === row._id}
                              >
                                Match
                              </Button>
                            </div>
                          )
                        })}
                        {row.suggestedMulti?.slice(0, 2).map((m: any, i: number) => (
                          <div key={`m${i}`} className="flex items-center gap-2 rounded border bg-background px-2 py-1 text-sm">
                            <span>Multiple: {m.transactionIds.map((t: any) => {
                              const tx = transactions.find((x) => String(x._id) === t.id)
                              return tx ? tx.transactionNumber : t.id
                            }).join(" + ")} = ₹{Number(m.totalAmount || 0).toLocaleString()}</span>
                            <span className="text-muted-foreground">Score {m.score}</span>
                            <Button
                              size="sm"
                              onClick={() => handleMatch(row._id, m.transactionIds)}
                              disabled={matchSubmitting === row._id}
                            >
                              Match
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIgnore(row._id)}
                          disabled={matchSubmitting === row._id}
                        >
                          Ignore
                        </Button>
                        {row.suggestedSingle?.[0] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCompare(transactions.find((t) => String(t._id) === row.suggestedSingle[0].transactionId) as Transaction)}
                          >
                            Manual Compare
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
       <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Uncleared Receipt</CardTitle>
             <Wallet className={`h-4 w-4`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{unclearRecAmount}
            </div>
            <p className="text-xs text-gray-600 mt-1">{unclearRec} Receipts</p>
          </CardContent>  
        </Card>
         <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Uncleared Payment</CardTitle>
                     <Wallet className={`h-4 w-4`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
              ₹{unclearPayAmount}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{unclearPay} Payments</p>
                  </CardContent>
                </Card>
</div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative w-full">
                <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger id="status" className="w-full">
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
                <SelectTrigger id="type" className="w-full">
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
                <SelectTrigger id="payment-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
              
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
                                       <SelectItem value="all">
                                     All
                                      </SelectItem>
                                    </SelectContent>
              </Select>
            </div>

            {/* <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div> */}
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
                    const isCleared = transaction.status === "cleared"

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
                          <TableCell>
                            {transaction.bankAccount?.bankName || "-"}
                          </TableCell>
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
                                onClick={() => openCompare(transaction)}
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
                              <div className="p-4 space-y-4">
                                <h4 className="font-semibold text-sm">Compare with Bank Statement</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                  <div className="space-y-2">
                                    <Label htmlFor="compare-date">Bank Statement Date</Label>
                                    <Input
                                      id="compare-date"
                                      type="date"
                                      value={compareData.bank_statement_date}
                                      onChange={(e) =>
                                        setCompareData((prev) => ({ ...prev, bank_statement_date: e.target.value }))
                                      }
                                      className={compareErrors.bank_statement_date ? "border-destructive" : ""}
                                    />
                                    {compareErrors.bank_statement_date && (
                                      <p className="text-sm text-destructive">{compareErrors.bank_statement_date}</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="compare-ref">Reference Number</Label>
                                    <Input
                                      id="compare-ref"
                                      placeholder="Reference Number"
                                      value={compareData.reference_no}
                                      onChange={(e) =>
                                        setCompareData((prev) => ({ ...prev, reference_no: e.target.value }))
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="compare-amount">Amount</Label>
                                    <Input
                                      id="compare-amount"
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      placeholder="Amount"
                                      value={compareData.amount}
                                      onChange={(e) =>
                                        setCompareData((prev) => ({ ...prev, amount: e.target.value }))
                                      }
                                      className={compareErrors.amount ? "border-destructive" : ""}
                                    />
                                    {compareErrors.amount && (
                                      <p className="text-sm text-destructive">{compareErrors.amount}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button onClick={handleCompareSave} disabled={compareSaving}>
                                      {compareSaving ? "Saving…" : "Save"}
                                    </Button>
                                    <Button variant="outline" onClick={handleCompareCancel} disabled={compareSaving}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
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
