"use client"

import { useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Plus, Search, Download, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react"
import AddIncomeDialog from "@/components/financial/add-income-dialog"
import AddExpenseDialog from "@/components/financial/add-expense-dialog"

interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  category: string
  date: string
  status: "completed" | "pending" | "cancelled"
  reference?: string
  clientVendor?: string
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export default function FinancialsPage() {
  const { hasPermission } = useUser()
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "income",
      amount: 2500,
      description: "Client Payment - ABC Corp",
      category: "Client Payments",
      date: "2024-01-15",
      status: "completed",
      reference: "INV-001",
      clientVendor: "ABC Corp",
    },
    {
      id: "2",
      type: "expense",
      amount: 450,
      description: "Office Supplies",
      category: "Office Expenses",
      date: "2024-01-14",
      status: "completed",
      reference: "EXP-001",
      clientVendor: "Office Depot",
    },
    {
      id: "3",
      type: "income",
      amount: 1200,
      description: "Service Revenue",
      category: "Service Revenue",
      date: "2024-01-13",
      status: "completed",
      reference: "INV-002",
      clientVendor: "XYZ Ltd",
    },
    {
      id: "4",
      type: "expense",
      amount: 800,
      description: "Software Subscription",
      category: "Software",
      date: "2024-01-12",
      status: "pending",
      reference: "EXP-002",
      clientVendor: "SaaS Provider",
    },
    {
      id: "5",
      type: "income",
      amount: 3200,
      description: "Consulting Services",
      category: "Consulting",
      date: "2024-01-11",
      status: "completed",
      reference: "INV-003",
      clientVendor: "Tech Startup",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "cancelled">("all")
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false) // Added state for expense dialog

  // Calculate financial metrics
  const totalIncome = transactions
    .filter((t) => t.type === "income" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions
    .filter((t) => t.type === "expense" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)
  const netProfit = totalIncome - totalExpenses
  const pendingAmount = transactions.filter((t) => t.status === "pending").reduce((sum, t) => sum + t.amount, 0)

  // Chart data
  const monthlyData = [
    { month: "Jan", income: 4200, expenses: 2800 },
    { month: "Feb", income: 3800, expenses: 2400 },
    { month: "Mar", income: 5200, expenses: 3200 },
    { month: "Apr", income: 4800, expenses: 2900 },
    { month: "May", income: 6200, expenses: 3800 },
    { month: "Jun", income: 5800, expenses: 3400 },
  ]

  const categoryData = [
    { name: "Client Payments", value: 6900, color: COLORS[0] },
    { name: "Service Revenue", value: 1200, color: COLORS[1] },
    { name: "Consulting", value: 3200, color: COLORS[2] },
    { name: "Office Expenses", value: 450, color: COLORS[3] },
    { name: "Software", value: 800, color: COLORS[4] },
  ]

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.clientVendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleAddIncome = (transaction: any) => {
    setTransactions([transaction, ...transactions])
  }

  const handleAddExpense = (transaction: any) => {
    // Added handler for expense transactions
    setTransactions([transaction, ...transactions])
  }

  if (!hasPermission("view_financials")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view financial data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Track income, expenses, and financial performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddIncomeOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
          <Button onClick={() => setIsAddExpenseOpen(true)} className="bg-red-600 hover:bg-red-700">
            {" "}
            {/* Updated to use new expense dialog */}
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Cash in Hand</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{totalIncome.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Monthly Revenue</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-gray-900 ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₹{netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {netProfit >= 0 ? "+" : ""}
              {((netProfit / totalIncome) * 100).toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {transactions.filter((t) => t.status === "pending").length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>View and manage all financial transactions</CardDescription>
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
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Client/Vendor</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.clientVendor}</TableCell>
                      <TableCell>{transaction.reference}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === "completed"
                              ? "default"
                              : transaction.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${
                            transaction.type === "income" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income vs Expenses</CardTitle>
                <CardDescription>Track your financial performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    income: {
                      label: "Income",
                      color: "#10b981",
                    },
                    expenses: {
                      label: "Expenses",
                      color: "#ef4444",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="income" fill="#10b981" />
                      <Bar dataKey="expenses" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Distribution of transactions by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Amount",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Trend</CardTitle>
              <CardDescription>Net cash flow over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  cashFlow: {
                    label: "Cash Flow",
                    color: "#8b5cf6",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData.map((d) => ({ ...d, cashFlow: d.income - d.expenses }))}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="cashFlow" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Reconciliation</CardTitle>
              <CardDescription>Reconcile transactions with bank statements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm text-gray-600">Book Balance</h4>
                    <p className="text-2xl font-bold">₹{netProfit.toLocaleString()}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm text-gray-600">Bank Balance</h4>
                    <p className="text-2xl font-bold">₹{(netProfit + 150).toLocaleString()}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm text-gray-600">Difference</h4>
                    <p className="text-2xl font-bold text-orange-600">₹150</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Reconciliation Items</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">Outstanding check #1234</span>
                      <span className="text-sm font-medium text-red-600">-₹150</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">Bank service fee</span>
                      <span className="text-sm font-medium text-red-600">-₹25</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">Interest earned</span>
                      <span className="text-sm font-medium text-green-600">+₹25</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full">Mark as Reconciled</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddIncomeDialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen} onAddTransaction={handleAddIncome} />

      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        onAddTransaction={handleAddExpense}
      />
    </div>
  )
}
