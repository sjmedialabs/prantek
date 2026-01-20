"use client"

import { useState, useEffect, useMemo } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Activity, Download, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { downloadCSV, downloadJSON, formatCurrencyForExport } from "@/lib/export-utils"
import { generatePDF } from "@/lib/pdf-utils"
import { api } from "@/lib/api-client"
import { generateEnhancedPDF } from "@/lib/enhanced-pdf-utils"
import type { Receipt, Quotation, Payment, Client, Item } from "@/lib/data-store"

export default function ReportsPage() {
  const { toast } = useToast()
  const { user, hasPermission } = useUser()
  const [dateRange, setDateRange] = useState("6months")
  const [reportType, setReportType] = useState("overview")
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const loadData = async () => {
      if (hasPermission("view_reports")) {
        const loadedReceipts = await api.receipts.getAll()
        const loadedQuotations = await api.quotations.getAll()
        const loadedPayments = await api.payments.getAll()
        const loadedClients = await api.clients.getAll()
        const loadedItems = await api.items.getAll()

        setReceipts(loadedReceipts)
        setQuotations(loadedQuotations)
        setPayments(loadedPayments)
        setClients(loadedClients)
        setItems(loadedItems)
        console.log("Items data loaded:", loadedItems)
      }
    }
    loadData()
  }, [hasPermission])

  const getDateRangeFilter = useMemo(() => {
    const now = new Date()
    const ranges: Record<string, Date> = {
      "1month": new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      "3months": new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
      "6months": new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
      "1year": new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
    }
    return ranges[dateRange] || ranges["6months"]
  }, [dateRange])

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => new Date(r.date) >= getDateRangeFilter)
  }, [receipts, getDateRangeFilter])

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => new Date(q.date) >= getDateRangeFilter)
  }, [quotations, getDateRangeFilter])

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => new Date(p.date) >= getDateRangeFilter)
  }, [payments, getDateRangeFilter])

  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
    // Check if tax settings exist (simplified - you may need to add API call)
    const hasTaxSettings = true // TODO: Check actual tax settings
    const hasBankDetails = true // TODO: Check actual bank details
    
    // Calculate client data completeness
    const clientsWithCompleteData = clients.filter(c => 
      c.name && c.email && c.phone && c.address
    ).length
    const clientDataScore = clients.length > 0 
      ? Math.round((clientsWithCompleteData / clients.length) * 100) 
      : 0
    
    // Calculate items with tax configuration
    const itemsWithTax = items.filter(i => i.applyTax && i.applyTax > 0).length
    const itemTaxScore = items.length > 0 
      ? Math.round((itemsWithTax / items.length) * 100) 
      : 0
    
    // Calculate individual scores
    const taxSettingsScore = hasTaxSettings ? 100 : 0
    const bankDetailsScore = hasBankDetails ? 100 : 0
    
    // Calculate overall score
    const overallScore = Math.round(
      (taxSettingsScore + bankDetailsScore + clientDataScore + itemTaxScore) / 4
    )
    
    return {
      hasTaxSettings,
      hasBankDetails,
      clientDataScore,
      itemTaxScore,
      taxSettingsScore,
      bankDetailsScore,
      overallScore,
    }
  }, [clients, items])

  const financialData = useMemo(() => {
    const monthlyData: Record<string, { income: number; expenses: number; profit: number }> = {}

    // Group receipts by month
    filteredReceipts.forEach((receipt) => {
      const month = new Date(receipt.date).toLocaleDateString("en-US", { month: "short" })
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, profit: 0 }
      }
      monthlyData[month].income += receipt.amountPaid || 0
    })

    // Group payments by month
    filteredPayments.forEach((payment) => {
      const month = new Date(payment.date).toLocaleDateString("en-US", { month: "short" })
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, profit: 0 }
      }
      monthlyData[month].expenses += payment.amount || 0
    })

    // Calculate profit
    Object.keys(monthlyData).forEach((month) => {
      monthlyData[month].profit = monthlyData[month].income - monthlyData[month].expenses
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }))
  }, [filteredReceipts, filteredPayments])

  const expenseBreakdown = useMemo(() => {
    const categoryTotals: Record<string, number> = {}
    let total = 0

    filteredPayments.forEach((payment) => {
      const category = payment.category || "Other"
      categoryTotals[category] = (categoryTotals[category] || 0) + payment.amount
      total += payment.amount
    })

    const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"]

    return Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value: total > 0 ? Math.round((value / total) * 100) : 0,
      amount: value,
      color: colors[index % colors.length],
    }))
  }, [filteredPayments])

  const kpiData = useMemo(() => {
    const totalIncome = filteredReceipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0)
    const totalExpenses = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalProfit = totalIncome - totalExpenses
    const profitMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0

    // Calculate trends (compare with previous period)
    const previousPeriodStart = new Date(getDateRangeFilter)
    previousPeriodStart.setMonth(
      previousPeriodStart.getMonth() -
        (dateRange === "1month" ? 1 : dateRange === "3months" ? 3 : dateRange === "6months" ? 6 : 12),
    )

    const previousReceipts = receipts.filter((r) => {
      const date = new Date(r.date)
      return date >= previousPeriodStart && date < getDateRangeFilter
    })

    const previousIncome = previousReceipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0)
    const incomeChange = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0

    return [
      {
        title: "Total Revenue",
        value: `₹${totalIncome.toLocaleString()}`,
        change: `${incomeChange >= 0 ? "+" : ""}${incomeChange.toFixed(1)}%`,
        trend: incomeChange >= 0 ? "up" : "down",
        icon: DollarSign,
      },
      {
        title: "Active Clients",
        value: clients.length.toString(),
        change: "+0%",
        trend: "up",
        icon: Users,
      },
      {
        title: "Total Expenses",
        value: `₹${totalExpenses.toLocaleString()}`,
        change: "+0%",
        trend: "up",
        icon: Package,
      },
      {
        title: "Profit Margin",
        value: `${profitMargin.toFixed(1)}%`,
        change: "+0%",
        trend: profitMargin > 0 ? "up" : "down",
        icon: Activity,
      },
    ]
  }, [filteredReceipts, filteredPayments, clients, receipts, getDateRangeFilter, dateRange])

  const customerAnalytics = useMemo(() => {
    const clientStats: Record<string, { name: string; revenue: number; transactions: number }> = {}

    filteredReceipts.forEach((receipt) => {
      if (!clientStats[receipt.clientId]) {
        clientStats[receipt.clientId] = {
          name: receipt.clientName,
          revenue: 0,
          transactions: 0,
        }
      }
      clientStats[receipt.clientId].revenue += receipt.amountPaid || 0
      clientStats[receipt.clientId].transactions += 1
    })

    return Object.values(clientStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [filteredReceipts])

  const inventoryAnalytics = useMemo(() => {
    const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {}

    filteredQuotations.forEach((quotation) => {
      ;(quotation.items || []).forEach((item) => {
        if (!itemStats[item.itemId]) {
          itemStats[item.itemId] = {
            name: item.itemName,
            quantity: 0,
            revenue: 0,
          }
        }
        itemStats[item.itemId].quantity += item.quantity || 0
        itemStats[item.itemId].revenue += item.amount || 0
      })
    })

    return Object.values(itemStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [filteredQuotations])


  const handleExportFinancialData = () => {
    downloadCSV(`financial-report-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`, financialData, [
      { key: "month", label: "Month" },
      { key: "income", label: "Income", format: (v) => formatCurrencyForExport(v, "₹") },
      { key: "expenses", label: "Expenses", format: (v) => formatCurrencyForExport(v, "₹") },
      { key: "profit", label: "Profit", format: (v) => formatCurrencyForExport(v, "₹") },
    ])
  }

  const handleExportCustomerData = () => {
    downloadCSV(`customer-analytics-${new Date().toISOString().split("T")[0]}.csv`, customerAnalytics, [
      { key: "name", label: "Customer Name" },
      { key: "revenue", label: "Total Revenue", format: (v) => formatCurrencyForExport(v, "₹") },
      { key: "transactions", label: "Transactions" },
    ])
  }

  const handleExportInventoryData = () => {
    downloadCSV(`inventory-analytics-${new Date().toISOString().split("T")[0]}.csv`, inventoryAnalytics, [
      { key: "name", label: "Item Name" },
      { key: "quantity", label: "Quantity Sold" },
      { key: "revenue", label: "Revenue", format: (v) => formatCurrencyForExport(v, "₹") },
    ])
  }

  const handleExportKPIData = () => {
    const kpiExportData = kpiData.map((kpi) => ({
      metric: kpi.title,
      value: kpi.value,
      change: kpi.change,
      trend: kpi.trend,
    }))

    downloadCSV(`kpi-report-${new Date().toISOString().split("T")[0]}.csv`, kpiExportData, [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value" },
      { key: "change", label: "Change" },
      { key: "trend", label: "Trend" },
    ])
  }

  const handleExportAllData = () => {
    const allData = {
      dateRange,
      reportType,
      generatedAt: new Date().toISOString(),
      kpis: kpiData.map((kpi) => ({
        title: kpi.title,
        value: kpi.value,
        change: kpi.change,
        trend: kpi.trend,
      })),
      financialData,
      expenseBreakdown,
      customerAnalytics,
      inventoryAnalytics,
    }

    downloadJSON(`complete-report-${new Date().toISOString().split("T")[0]}.json`, allData)
  }

  const handleExportPDF = async () => {
    try {
      const companyResponse = await fetch("/api/company")
      const companyData = await companyResponse.json()
      const company = companyData?.company

      await generateEnhancedPDF({
        title: `Financial Report - ${dateRange}`,
        companyInfo: company ? {
          name: company.companyName,
          email: company.email,
          phone: company.phone,
          address: company.address,
          logo: company.logo,
          website: company.website,
        } : undefined,
        data: financialData,
        columns: [
          { header: "Month", dataKey: "month" },
          { header: "Income", dataKey: "income" },
          { header: "Expenses", dataKey: "expenses" },
          { header: "Profit", dataKey: "profit" },
        ],
        filename: `financial-report-${dateRange}-${new Date().toISOString().split("T")[0]}.pdf`,
      })

      toast({ title: "Success", description: "PDF exported successfully" })
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" })
    }
  }

  if (!hasPermission("view_reports")) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => {
              if (value === "financial") handleExportFinancialData()
              else if (value === "customer") handleExportCustomerData()
              else if (value === "inventory") handleExportInventoryData()
              else if (value === "kpi") handleExportKPIData()
              else if (value === "all") handleExportAllData()
              else if (value === "pdf") handleExportPDF()
            }}
          >
            {
              (hasPermission("export_reports")) && (
                   <SelectTrigger className="w-full sm:w-40">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
              )
            }
            
            <SelectContent>
              <SelectItem value="financial">Financial Data (CSV)</SelectItem>
              <SelectItem value="customer">Customer Analytics (CSV)</SelectItem>
              <SelectItem value="inventory">Inventory Data (CSV)</SelectItem>
              <SelectItem value="kpi">KPI Summary (CSV)</SelectItem>
              <SelectItem value="all">Complete Report (JSON)</SelectItem>
              <SelectItem value="pdf">Export as PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main content wrapper for PDF export */}
      <div id="reports-content">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                // onClick={() => setSelectedMetric(selectedMetric === kpi.title ? null : kpi.title)}
              >
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 truncate">{kpi.title}</p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1 truncate">{kpi.value}</p>
                      <div className="flex items-center mt-2">
                        {kpi.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm font-medium ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}
                        >
                          {kpi.change}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-2">
                      <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                    </div>
                  </div>
                  {/* {selectedMetric === kpi.title && (
                    <div className="mt-4 pt-4 border-t text-sm text-gray-600">Click to view detailed breakdown</div>
                  )} */}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Reports */}
        <Tabs value={reportType} onValueChange={setReportType} className="space-y-6 mt-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly income vs expenses over time</CardDescription>
                </CardHeader>
                <CardContent className="px-0 ">
                  <ChartContainer
                    config={{
                      income: { label: "Income", color: "#8b5cf6" },
                      expenses: { label: "Expenses", color: "#06b6d4" },
                    }}
                    className="h-64 lg:h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financialData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="income"
                          stackId="1"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.6}
                        />
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          stackId="2"
                          stroke="#06b6d4"
                          fill="#06b6d4"
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Expense Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                  <CardDescription>Distribution of expenses by category</CardDescription>
                </CardHeader>
                <CardContent className="px-0 ">
                  {expenseBreakdown.length > 0 ? (
                    <ChartContainer config={{}} className="h-64 lg:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseBreakdown}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {expenseBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-64 lg:h-80 flex items-center justify-center text-gray-500">
                      No expense data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profit Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Profit Analysis</CardTitle>
                  <CardDescription>Monthly profit trends and projections</CardDescription>
                </CardHeader>
                <CardContent className="px-0 ">
                  <ChartContainer
                    config={{
                      profit: { label: "Profit", color: "#10b981" },
                    }}
                    className="h-64 lg:h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={financialData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                  <CardDescription>Key financial metrics for the period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-green-600">Total Income</p>
                      <p className="text-xl lg:text-2xl font-bold text-green-700">
                        ₹{filteredReceipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm text-red-600">Total Expenses</p>
                      <p className="text-xl lg:text-2xl font-bold text-red-700">
                        ₹{filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <TrendingDown className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-purple-600">Net Profit</p>
                      <p className="text-xl lg:text-2xl font-bold text-purple-700">
                        ₹
                        {(
                          filteredReceipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0) -
                          filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
                        ).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Customers by Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Customers by Revenue</CardTitle>
                  <CardDescription>Highest revenue generating customers</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  {customerAnalytics.length > 0 ? (
                    <ChartContainer
                      config={{
                        revenue: { label: "Revenue", color: "#8b5cf6" },
                      }}
                      className="h-64 lg:h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={customerAnalytics} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-64 lg:h-80 flex items-center justify-center text-gray-500">
                      No customer data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Statistics</CardTitle>
                  <CardDescription>Detailed customer metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {customerAnalytics.slice(0, 5).map((customer, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.transactions} transactions</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-purple-600">₹{customer.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {customerAnalytics.length === 0 && (
                    <div className="text-center text-gray-500 py-8">No customer data available</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                  <CardDescription>Best performing products/services</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  {inventoryAnalytics.length > 0 ? (
                    <ChartContainer
                      config={{
                        revenue: { label: "Revenue", color: "#10b981" },
                      }}
                      className="h-64 lg:h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={inventoryAnalytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-64 lg:h-80 flex items-center justify-center text-gray-500">
                      No inventory data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Item Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Item Performance</CardTitle>
                  <CardDescription>Quantity sold and revenue generated</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {inventoryAnalytics.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.quantity} units sold</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-green-600">₹{item.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {inventoryAnalytics.length === 0 && (
                    <div className="text-center text-gray-500 py-8">No inventory data available</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Audit Trail Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration Status</CardTitle>
                  <CardDescription>Current setup and compliance status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg ${complianceMetrics.hasTaxSettings ? "bg-green-50" : "bg-yellow-50"}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${complianceMetrics.hasTaxSettings ? "bg-green-500" : "bg-yellow-500"}`}
                      ></div>
                      <span className="text-sm font-medium">Tax Settings Configured</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        complianceMetrics.hasTaxSettings
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {complianceMetrics.hasTaxSettings ? "Complete" : "Setup Required"}
                    </Badge>
                  </div>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg ${complianceMetrics.hasBankDetails ? "bg-green-50" : "bg-yellow-50"}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${complianceMetrics.hasBankDetails ? "bg-green-500" : "bg-yellow-500"}`}
                      ></div>
                      <span className="text-sm font-medium">Bank Details Added</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        complianceMetrics.hasBankDetails
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {complianceMetrics.hasBankDetails ? "Complete" : "Setup Required"}
                    </Badge>
                  </div>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg ${complianceMetrics.clientDataScore >= 80 ? "bg-green-50" : complianceMetrics.clientDataScore >= 50 ? "bg-yellow-50" : "bg-red-50"}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${complianceMetrics.clientDataScore >= 80 ? "bg-green-500" : complianceMetrics.clientDataScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                      ></div>
                      <span className="text-sm font-medium">Client Data Completeness</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        complianceMetrics.clientDataScore >= 80
                          ? "bg-green-100 text-green-700"
                          : complianceMetrics.clientDataScore >= 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }
                    >
                      {complianceMetrics.clientDataScore}%
                    </Badge>
                  </div>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg ${complianceMetrics.itemTaxScore >= 80 ? "bg-green-50" : complianceMetrics.itemTaxScore >= 50 ? "bg-yellow-50" : "bg-red-50"}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${complianceMetrics.itemTaxScore >= 80 ? "bg-green-500" : complianceMetrics.itemTaxScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                      ></div>
                      <span className="text-sm font-medium">Items with Tax Configuration</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        complianceMetrics.itemTaxScore >= 80
                          ? "bg-green-100 text-green-700"
                          : complianceMetrics.itemTaxScore >= 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }
                    >
                      {complianceMetrics.itemTaxScore}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Completeness Score</CardTitle>
                  <CardDescription>Overall system configuration and data quality</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <div
                      className={`text-3xl lg:text-4xl font-bold mb-2 ${complianceMetrics.overallScore >= 80 ? "text-green-600" : complianceMetrics.overallScore >= 50 ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {complianceMetrics.overallScore}%
                    </div>
                    <p className="text-gray-600">Overall Completeness</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Tax Configuration</span>
                      <span className="font-medium">{complianceMetrics.taxSettingsScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Banking Setup</span>
                      <span className="font-medium">{complianceMetrics.bankDetailsScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Client Data Quality</span>
                      <span className="font-medium">{complianceMetrics.clientDataScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Item Tax Setup</span>
                      <span className="font-medium">{complianceMetrics.itemTaxScore}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
