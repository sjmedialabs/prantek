"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { api } from "@/lib/api-client"
import type { Receipt } from "@/lib/data-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, CheckCircle } from "lucide-react"
import { toast } from "react-toastify"

interface Transaction {
  id: string
  type: "Receipt" | "Payment"
  transactionNumber: string
  quotationNumber?: string
  date: string
  clientName: string
  bankAccount?: string
  paymentMethod: string
  referenceNumber?: string
  amount: number
  status: "Received" | "Paid" | "Cleared"
}

export default function ReconciliationPage() {
  const { hasPermission } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "Receipt" | "Payment">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "received" | "cleared">("all")

  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReceipts()
  }, [])

  const loadReceipts = async () => {
    try {
      const allReceipts = await dataStore.getAll<Receipt>("receipts")
      setReceipts(allReceipts)
    } catch (error) {
      console.error("[v0] Error loading receipts:", error)
      toast.error("Failed to load receipts")
    } finally {
      setLoading(false)
    }
  }

  const transactions = receipts.map((receipt) => ({
    id: receipt.id,
    type: "Receipt" as const,
    transactionNumber: receipt.receiptNumber,
    quotationNumber: receipt.quotationNumber,
    date: receipt.date,
    clientName: receipt.clientName,
    bankAccount: receipt.bankAccount,
    paymentMethod: receipt.paymentMethod,
    referenceNumber: receipt.referenceNumber,
    amount: receipt.amountPaid || 0, // Default to 0 if undefined
    status: receipt.status === "cleared" ? "Cleared" : "Received",
  }))

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesStatus = filterStatus === "all" || transaction.status.toLowerCase() === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleToggleCleared = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === "Cleared") {
        // Mark as received (uncleared)
        const receipt = receipts.find((r) => r.id === id)
        if (receipt) {
          await dataStore.update("receipts", id, { status: "received" })
          toast.success(`Receipt ${receipt.receiptNumber} marked as received`)
          await loadReceipts()
        }
      } else {
        // Mark as cleared
        const clearedReceipt = await dataStore.clearReceipt(id)
        if (clearedReceipt) {
          toast.success(`Receipt ${clearedReceipt.receiptNumber} marked as cleared`)
          await loadReceipts()
        }
      }
    } catch (error) {
      console.error("Error toggling receipt status:", error)
      toast.error("Failed to update receipt status")
    }
  }

  const pendingReconciliation = transactions.filter((t) => t.status !== "Cleared")
  const totalPending = pendingReconciliation.reduce((sum, t) => sum + (t.amount || 0), 0) // Add null check
  const clearedTransactions = transactions.filter((t) => t.status === "Cleared")
  const totalCleared = clearedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) // Add null check

  if (!hasPermission("view_reconciliation")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view reconciliation.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reconciliation</h1>
          <p className="text-gray-600">Reconcile receipts and payments with bank statements</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{totalPending.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">{pendingReconciliation.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Cleared</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalCleared.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">{clearedTransactions.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{(totalPending + totalCleared).toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">{transactions.length} transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Reconciliation</CardTitle>
              <CardDescription>Review and clear pending transactions</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Receipt">Receipt</SelectItem>
                  <SelectItem value="Payment">Payment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Transaction No.</TableHead>
                <TableHead>Quotation No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Bank Account</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Reference No.</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                {hasPermission("manage_reconciliation") && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Badge variant="default">{transaction.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.transactionNumber}</TableCell>
                  <TableCell className="font-medium text-purple-600">{transaction.quotationNumber}</TableCell>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.clientName}</TableCell>
                  <TableCell>{transaction.bankAccount || "-"}</TableCell>
                  <TableCell className="capitalize">{transaction.paymentMethod.replace("-", " ")}</TableCell>
                  <TableCell>{transaction.referenceNumber || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className="text-green-600">+₹{(transaction.amount || 0).toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === "Cleared" ? "default" : "secondary"}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  {hasPermission("manage_reconciliation") && (
                    <TableCell className="text-right">
                      <Button
                        variant={transaction.status === "Cleared" ? "outline" : "ghost"}
                        size="sm"
                        onClick={() => handleToggleCleared(transaction.id, transaction.status)}
                        className={
                          transaction.status === "Cleared"
                            ? "text-orange-600 hover:text-orange-700"
                            : "text-green-600 hover:text-green-700"
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {transaction.status === "Cleared" ? "Unmark" : "Clear"}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
