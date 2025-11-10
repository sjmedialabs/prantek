"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CreditCard, Pencil, Download } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { downloadCSV, formatCurrencyForExport, formatDateForExport } from "@/lib/export-utils"

interface Transaction {
  id: string
  type: "quotation" | "receipt" | "payment"
  number: string
  date: string
  items: string[]
  amount: number
  paidAmount: number
  balanceAmount: number
  status: "completed" | "pending" | "partial"
}

interface Client {
  id: string
  clientNumber: string
  clientName: string
  email: string
  phone: string
  address: string
  bankAccount?: string
  upiId?: string
  startDate?: string
  status: string
}

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const [client, setClient] = useState<Client | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const loadClientData = async () => {
      if (params.id) {
        try {
          const loadedClient = await api.clients.getById( params.id as string)

          setClient(loadedClient)

          const allQuotations = await api.quotations.getAll()
          console.log("all loaded Quotations::",allQuotations);
          const clientQuotations = allQuotations
            .filter((q) => q.clientId === params.id || q.clientName === loadedClient?.clientName)
            .map((q) => ({
              id: q._id,
              type: "quotation" as const,
              number: q.quotationNumber,
              date: q.date,
              items: q.items?.map((item: any) => item.itemName) || [],
              amount: q.grandTotal || 0,
              paidAmount: q.amountPaid || 0,
              balanceAmount: q.balanceAmount || 0,
              status: q.status === "accepted" ? "completed" : q.amountPaid > 0 ? "partial" : "pending",
            }))

          setTransactions(clientQuotations)
        } catch (error) {
          console.error("Failed to load client data:", error)
        }
      }
    }
    loadClientData()
  }, [params.id])

  if (!client) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading client details...</p>
      </div>
    )
  }

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalPaid = transactions.reduce((sum, t) => sum + t.paidAmount, 0)
  const totalBalance = transactions.reduce((sum, t) => sum + t.balanceAmount, 0)

  const handleContinuePayment = (transaction: Transaction) => {
    // Navigate to receipts page with pre-filled data
    router.push(`/dashboard/receipts/new?quotationId=${transaction.id}&balance=${transaction.balanceAmount}`)
  }

  const handleExportTransactions = () => {
    const exportData = transactions.map((t) => ({
      transactionNumber: t.number,
      type: t.type,
      date: t.date,
      items: t.items.join("; "),
      amount: t.amount,
      paidAmount: t.paidAmount,
      balanceAmount: t.balanceAmount,
      status: t.status,
    }))

    downloadCSV(
      `client-${client.clientNumber}-transactions-${new Date().toISOString().split("T")[0]}.csv`,
      exportData,
      [
        { key: "transactionNumber", label: "Transaction #" },
        { key: "type", label: "Type" },
        { key: "date", label: "Date", format: formatDateForExport },
        { key: "items", label: "Items" },
        { key: "amount", label: "Amount", format: (v) => formatCurrencyForExport(v) },
        { key: "paidAmount", label: "Paid", format: (v) => formatCurrencyForExport(v) },
        { key: "balanceAmount", label: "Balance", format: (v) => formatCurrencyForExport(v) },
        { key: "status", label: "Status" },
      ],
    )
  }

  console.log("transactions are nothing but quotations",transactions)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/clients">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleExportTransactions}>
            <Download className="h-4 w-4 mr-2" />
            Export Transactions
          </Button>
          <Link href={`/dashboard/clients/${params.id}/edit`}>
            <Button size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Client Number</p>
              <p className="font-medium">{client.clientNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Client Name</p>
              <p className="font-medium">{client.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{client.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{client.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{client.address}</p>
            </div>
            {client.bankAccount && (
              <div>
                <p className="text-sm text-gray-600">Bank Account</p>
                <p className="font-medium">{client.bankAccount}</p>
              </div>
            )}
            {client.upiId && (
              <div>
                <p className="text-sm text-gray-600">UPI ID</p>
                <p className="font-medium">{client.upiId}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={client.status === "active" ? "default" : "secondary"}>{client.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-red-600">₹{totalBalance.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All transactions for this client</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                              No transactions found for this client
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">{transaction.number}</TableCell>
                              <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {transaction.items.slice(0, 2).join(", ")}
                                  {transaction.items.length > 2 && ` +${transaction.items.length - 2} more`}
                                </div>
                              </TableCell>
                              <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-green-600">
                                ₹{transaction.paidAmount.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-red-600">
                                ₹{transaction.balanceAmount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    transaction.status === "completed"
                                      ? "default"
                                      : transaction.status === "partial"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {transaction.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {transaction.status !== "completed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleContinuePayment(transaction)}
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="pending" className="mt-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter((t) => t.status === "pending" || t.status === "partial").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                              No pending transactions
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions
                            .filter((t) => t.status === "pending" || t.status === "partial")
                            .map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="font-medium">{transaction.number}</TableCell>
                                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {transaction.items.slice(0, 2).join(", ")}
                                    {transaction.items.length > 2 && ` +${transaction.items.length - 2} more`}
                                  </div>
                                </TableCell>
                                <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-red-600">
                                  ₹{transaction.balanceAmount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={transaction.status === "partial" ? "secondary" : "destructive"}>
                                    {transaction.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleContinuePayment(transaction.id)}
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter((t) => t.status === "completed").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                              No completed transactions
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions
                            .filter((t) => t.status === "completed")
                            .map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="font-medium">{transaction.number}</TableCell>
                                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {transaction.items.slice(0, 2).join(", ")}
                                    {transaction.items.length > 2 && ` +${transaction.items.length - 2} more`}
                                  </div>
                                </TableCell>
                                <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge variant="default">completed</Badge>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
