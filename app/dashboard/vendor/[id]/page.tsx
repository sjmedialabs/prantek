"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import type { Vendor } from "@/lib/models/types"
import { ArrowLeft, Download, Edit, Store } from "lucide-react"
import { toast } from "@/lib/toast"
import { Input } from "@/components/ui/input"
import { useUser } from "@/components/auth/user-context"
import Link from "next/link"

interface Transaction {
  id: string
  type: "purchaseInvoice" | "payment"
  number: string
  date: string
  amount: number
  paidAmount: number
  balanceAmount: number
  status: string
}

export default function VendorDetailsPage() {
  const {user} = useUser()
  const params = useParams()
  const vendorId = params.id as string
  const router = useRouter()
  const { hasPermission } = useUser()

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionQuery, setTransactionQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (vendorId) loadVendor()
  }, [vendorId])

  const loadVendor = async () => {
    try {
      const [data, allPurchaseInvoices, allPayments] = await Promise.all([
        api.vendors.getById(vendorId),
        api.purchaseInvoice.getAll(),
        api.payments.getAll(),
      ])
      setVendor(data)

      if (data) {
        const vendorPurchaseInvoices = (allPurchaseInvoices || [])
          .filter((pi: any) => pi.recipientId === vendorId)
          .map((pi: any) => {
            const total = Number(pi.invoiceTotalAmount || 0)
            const balance = Number(pi.balanceAmount ?? 0)
            const expenseAdj = Number(pi.expenseAdjustmentAmount || pi.expenseAdjustment || 0)
            const paid = total - balance - expenseAdj

            return {
              id: pi._id,
              type: "purchaseInvoice" as const,
              number: pi.purchaseInvoiceNumber,
              date: pi.date,
              amount: total,
              paidAmount: paid < 0 ? 0 : paid,
              balanceAmount: balance,
              status: pi.paymentStatus,
            }
          })
            console.log("vendor PI", vendorPurchaseInvoices, allPurchaseInvoices)
        const vendorPayments = (allPayments || [])
          .filter((p: any) => p.recipientId === vendorId && p.recipientType === "vendor")
          .map((p: any) => ({
            id: p._id,
            type: "payment" as const,
            number: p.paymentNumber,
            date: p.date,
            amount: p.amount || 0,
            paidAmount: p.amount || 0,
            balanceAmount: 0,
            status: p.status,
          }))

        const combinedTransactions = [...vendorPurchaseInvoices, ...vendorPayments].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setTransactions(combinedTransactions)
      }
    } catch (err) {
      console.error("Failed to load vendor data:", err)
      toast.error("Error", "Failed to load vendor details and transactions")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Vendor not found</p>
      </div>
    )
  }

  const totalBilled = transactions
    .filter((t) => t.type === "purchaseInvoice")
    .reduce((sum, t) => sum + t.amount, 0)

  const balanceDue = transactions
    .filter((t) => t.type === "purchaseInvoice")
    .reduce((sum, t) => sum + t.balanceAmount, 0)

  const totalPaid = totalBilled - balanceDue

  const filteredTransactions = transactions.filter((t) => {
    const q = transactionQuery.trim().toLowerCase()
    if (!q) return true

    const numberMatch = (t.number || "").toLowerCase().includes(q)
    const statusMatch = (t.status || "").toLowerCase().includes(q)
    const dateStr = new Date(t.date).toLocaleDateString().toLowerCase()
    const dateMatch = dateStr.includes(q)

    return numberMatch || statusMatch || dateMatch
  })

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800"
    const s = status.toLowerCase()
    if (s.includes("paid") || s.includes("completed") || s.includes("cleared") || s.includes("closed")) {
      return "bg-green-100 text-green-800"
    }
    if (s.includes("partial")) {
      return "bg-yellow-100 text-yellow-800"
    }
    if (s.includes("unpaid") || s.includes("open") || s.includes("pending")) {
      return "bg-red-100 text-red-800"
    }
    return "bg-blue-100 text-blue-800"
  }

  const handleExport = () => {
    let dataToExport: Transaction[]
    let fileName = `vendor-${vendor?.name?.replace(/\s+/g, "_") || vendorId}-transactions`

    const currentData = filteredTransactions

    if (activeTab === "purchaseInvoice") {
      dataToExport = currentData.filter((t) => t.type === "purchaseInvoice")
      fileName += "-purchase-invoices.csv"
    } else if (activeTab === "payment") {
      dataToExport = currentData.filter((t) => t.type === "payment")
      fileName += "-payments.csv"
    } else {
      dataToExport = currentData
      fileName += "-all.csv"
    }

    if (dataToExport.length === 0) {
      toast.info("Info", "No transactions to export for the current filter.")
      return
    }

    // Convert to CSV
    const headers = ["Number", "Date", "Type", "Amount", "Paid Amount", "Balance Amount", "Status"]
    const csvRows = [
      headers.join(","), // header row
      ...dataToExport.map((t) =>
        [`"${t.number}"`, `"${new Date(t.date).toLocaleDateString()}"`, `"${t.type === "purchaseInvoice" ? "Purchase Invoice" : "Payment"}"`, t.amount, t.paidAmount, t.balanceAmount, `"${t.status}"`].join(",")
      ),
    ]

    const csvString = csvRows.join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderTransactionTable = (data: Transaction[]) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                No transactions found for this vendor.
              </TableCell>
            </TableRow>
          ) : (
            data.map((transaction) => {
              let viewLink = ""
              switch (transaction.type) {
                case "purchaseInvoice":
                  viewLink = `/dashboard/purchase-invoices/${transaction.id}`
                  break
                case "payment":
                  viewLink = `/dashboard/payments/${transaction.id}`
                  break
              }

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.number}</TableCell>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{transaction.type === "purchaseInvoice" ? "Purchase Invoice" : "Payment"}</TableCell>
                  <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">₹{transaction.paidAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-red-600">₹{transaction.balanceAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusBadgeClass(transaction.status)} capitalize`}>{transaction.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {viewLink && (
                      <Link href={viewLink}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 text-purple-600" />
            Vendor Details
          </h1>
        </div>
        <div>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Transactions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Vendor Info Card */}
        <Card className="lg:col-span-1">
          {(() => {
            const infoItems: Array<{ label: string; value: string | JSX.Element }> = []
            const pushIf = (label: string, value?: string | null) => {
              if (value && value.toString().trim()) {
                infoItems.push({ label, value: value.toString().trim() })
              }
            }

            pushIf("Email", vendor.email)
            pushIf("Phone", vendor.phone)

            const addressParts = [vendor.address, vendor.city, vendor.state, vendor.pincode]
              .filter(Boolean)
              .join(", ")
            if (addressParts.trim()) {
              infoItems.push({ label: "Address", value: addressParts })
            }

            pushIf("GSTIN", vendor.gstin)
            pushIf("PAN", vendor.pan)
            pushIf("Notes", vendor.notes)
            if (vendor.createdAt) {
              infoItems.push({
                label: "Created On",
                value: new Date(vendor.createdAt).toLocaleDateString(),
              })
            }

            return (
              <>
                {infoItems.length > 0 && (
                  <CardHeader>
                    <CardTitle className="text-xl">{vendor.name}</CardTitle>
                    <CardDescription>Vendor / Supplier Information</CardDescription>
                  </CardHeader>
                )}
                <CardContent className="grid grid-cols-1 gap-4">
                  {infoItems.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-6">
                      No vendor information available.
                    </div>
                  ) : (
                    infoItems.map((item) => (
                      <div key={item.label} className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">{item.label}</p>
                        <div className="font-semibold whitespace-pre-line">{item.value}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </>
            )
          })()}
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Billed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{totalBilled.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Balance Due</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">₹{balanceDue.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All purchase invoices and payments for this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search by transaction number, date, or status..."
                  value={transactionQuery}
                  onChange={(e) => setTransactionQuery(e.target.value)}
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="purchaseInvoice">Purchase Invoice</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  {renderTransactionTable(filteredTransactions)}
                </TabsContent>
                <TabsContent value="purchaseInvoice" className="mt-4">
                  {renderTransactionTable(filteredTransactions.filter((t) => t.type === "purchaseInvoice"))}
                </TabsContent>
                <TabsContent value="payment" className="mt-4">
                  {renderTransactionTable(filteredTransactions.filter((t) => t.type === "payment"))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
