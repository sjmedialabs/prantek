"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Users, Package, TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react"
import { api } from "@/lib/api-client"
import { formatCurrency } from "@/lib/currency-utils"

export default function DashboardPage() {
  const { user } = useUser()

  const [stats, setStats] = useState({
    cashInHand: 0,
    receivables: 0,
    payables: 0,
    activeUsers: 0,
    monthlyRevenue: 0,
    assetsManaged: 0,
    growthRate: 0,
    quotations: 0,
    pendingQuotations: 0,
    pendingInvoices: 0,
    billsDue: 0,
  })

  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  /** ✅ Rewritten — fetches real DB data using API */
  const loadDashboardData = async () => {
    try {
      const [
        quotations,
        receipts,
        payments,
        users,
        items
      ] = await Promise.all([
        api.quotations.getAll(),
        api.receipts.getAll(),
        api.payments.getAll(),
        api.users.getAll(),
        api.items.getAll(),
      ])

      // ✅ cash in hand
      const totalReceipts = receipts.reduce(
        (sum: number, r: any) => sum + (r.amountPaid || 0),
        0
      )
      const totalPayments = payments.data.reduce(
        (sum: number, p: any) => sum + (p.amount || 0),
        0
      )
      const cashInHand = totalReceipts - totalPayments
      // ✅ receivables = pending quotations
      const pendingQuotations = quotations.filter(
        (q: any) => q.status === "pending" || q.status === "sent")
      const receivables = pendingQuotations.reduce(
        (sum: number, q: any) => sum + (q.grandTotal || 0),
        0
      )
      // ✅ payables (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentPayments = payments.data.filter((p: any) => {
        const d = new Date(p.date)
        return d >= weekAgo
      })
      const payables = recentPayments.reduce(
        (sum: number, p: any) => sum + (p.amount || 0),
        0
      )
      // ✅ monthly revenue
      const now = new Date()
      const monthlyReceipts = receipts.filter((r: any) => {
        const date = new Date(r.date)
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        )
      })
      console.log("Monthly receipts:", monthlyReceipts)
      const monthlyRevenue = monthlyReceipts.reduce(
        (sum: number, r: any) => sum + (r.amountPaid || 0),
        0
      )
      console.log("Monthly revenue:", monthlyRevenue)

      // ✅ Calculate last month revenue
const lastMonth = new Date()
lastMonth.setMonth(lastMonth.getMonth() - 1)

const lastMonthReceipts = receipts.filter((r: any) => {
  const date = new Date(r.date)
  return (
    date.getMonth() === lastMonth.getMonth() &&
    date.getFullYear() === lastMonth.getFullYear()
  )
})

const lastMonthRevenue = lastMonthReceipts.reduce(
  (sum: number, r: any) => sum + (r.amountPaid || 0),
  0
)

// ✅ Growth Rate (MoM %)
let growthRate = 0
if (lastMonthRevenue > 0) {
  growthRate = ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
}

            setStats({
        cashInHand,
        receivables,
        payables,
        activeUsers: users.length,
        monthlyRevenue,
        assetsManaged: items.length,
         growthRate: Number(growthRate.toFixed(2)), 
        quotations: quotations.length,
        pendingQuotations: pendingQuotations.length,
        pendingInvoices: pendingQuotations.length,
        billsDue: recentPayments.length,
      })

      // ✅ Recent Transactions
      const allTransactions = [
        ...receipts.map((r: any) => ({
          type: "Income",
          amount: r.amountPaid || 0,
          description: `Receipt #${r.receiptNumber} - ${r.clientName}`,
          time: new Date(r.date).toLocaleDateString(),
          date: new Date(r.date),
        })),
        ...payments.map((p: any) => ({
          type: "Expense",
          category: "Salary",
          amount: p.amount || 0,
          description: `${p.description || p.category}`,
          time: new Date(p.date).toLocaleDateString(),
          date: new Date(p.date),
        })),
      ]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 3)

      console.log("All transactions:", allTransactions)
      setRecentTransactions(allTransactions)
      console.log("Recent transactions:", recentTransactions)
      // ✅ Update UI stats
      console.log("Actiive users lenght", stats.activeUsers)

      setLoading(false)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      setLoading(false)
    }
  }
  const statCards = [
  {
    title: "Cash in Hand",
    value: formatCurrency(stats.cashInHand),
    change: `${stats.cashInHand >= 0 ? "+" : ""}${((stats.cashInHand / 1000) * 10).toFixed(
      1
    )}% from last month`, // TEMP placeholder
    icon: Wallet,
    color: "text-green-600",
  },
  {
    title: "Receivables",
    value: formatCurrency(stats.receivables),
    change: `${stats.pendingInvoices} pending invoices`,
    icon: ArrowUpRight,
    color: "text-blue-600",
  },
  {
    title: "Payables",
    value: formatCurrency(stats.payables),
    change: `${stats.billsDue} bills due this week`,
    icon: ArrowDownLeft,
    color: "text-red-600",
  },
  {
    title: "Active Users",
    value: stats.activeUsers?.toString(),
    change: `+${stats.activeUsers > 1 ? "2" : "1"} this month`, // TEMP
    icon: Users,
    color: "text-purple-600",
  },
]

const financialOverview = [
  {
    title: "Monthly Revenue",
    value: formatCurrency(stats.monthlyRevenue),
    change:
      stats.growthRate > 0
        ? `+${stats.growthRate}% from last month`
        : `${stats.growthRate}% from last month`,
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    title: "Assets Managed",
    value: stats.assetsManaged?.toString(),
    change: `+${Math.max(0, stats.assetsManaged - 1)} this week`, // placeholder
    icon: Package,
    color: "text-indigo-600",
  },
  {
    title: "Growth Rate",
    value: `${stats.growthRate}%`,
    change:
      stats.growthRate > 0
        ? `+${stats.growthRate}% vs last month`
        : `${stats.growthRate}% vs last month`,
    icon: TrendingUp,
    color: "text-orange-600",
  },
  {
    title: "Quotations",
    value: stats.quotations?.toString(),
    change: `${stats.pendingQuotations} pending approval`,
    icon: FileText,
    color: "text-cyan-600",
  },
]


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-purple-100 mb-4">Here's what's happening today.</p>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-white/20 text-white capitalize">
            {user?.role.replace("-", " ")}
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {user?.subscriptionPlanId} Plan
          </Badge>
        </div>
      </div>

      {/* Primary Financial Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-600 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Secondary Business Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financialOverview.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-600 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Transactions</CardTitle>
            <CardDescription className="text-gray-600">Latest financial activities in your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.time}</p>
                    </div>
                    <div
                      className={`font-semibold ${transaction.type === "Income" ? "text-green-600" : "text-red-600"}`}
                    >
                      {transaction.type === "Income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Business Health</CardTitle>
            <CardDescription className="text-gray-600">Key business indicators and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Cash Flow Status</span>
                <Badge
                  variant="secondary"
                  className={stats.cashInHand > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                >
                  {stats.cashInHand > 0 ? "Positive" : "Negative"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Overdue Invoices</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {stats.pendingInvoices} pending
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Monthly Target</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  78% achieved
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Active Quotations</span>
                <Badge variant="secondary">{stats.pendingQuotations} awaiting response</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
