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
  Tooltip,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Activity, Download, AlertCircle, Search, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { downloadCSV, downloadJSON, formatCurrencyForExport } from "@/lib/export-utils"
import { generatePDF } from "@/lib/pdf-utils"
import { api } from "@/lib/api-client"
import { generateEnhancedPDF } from "@/lib/enhanced-pdf-utils"
import type { Receipt, Quotation, Payment, Client, Item } from "@/lib/models/types"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { OwnSearchableSelect } from "@/components/searchableSelect"
export default function ReportsPage() {
  const { toast } = useToast()
  const { user, hasPermission } = useUser()
  const [dateRange, setDateRange] = useState("this_month")
  const [reportType, setReportType] = useState("overview")
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [salesInvoices, setSalesInvoices] = useState<any[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [hasTaxSettings, setHasTaxSettings] = useState(false)
  const [hasBankDetails, setHasBankDetails] = useState(false)
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"]
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null)
const [customEndDate, setCustomEndDate] = useState<Date | null>(null)
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<{ id: string; name: string } | null>(null)
  useEffect(() => {
    const loadData = async () => {
      if (hasPermission("view_reports")) {
        const loadedReceipts = await api.receipts.getAll()
        const loadedQuotations = await api.quotations.getAll()
        const loadedPayments = await api.payments.getAll()
        const loadedSalesInvoicesResponse = await fetch("/api/salesInvoice")
        const loadedSalesInvoicesData = await loadedSalesInvoicesResponse.json()
        if (loadedSalesInvoicesData.success) {
          setSalesInvoices(loadedSalesInvoicesData.data)
        }
        const loadedClients = await api.clients.getAll()
        const loadedItems = await api.items.getAll()
        const loadedTaxSettings = await api.taxRates.getAll()
        const loadedBankAccounts = await api.bankAccounts.getAll()
        const receipt = loadedReceipts.filter((r: any) => r.status === "cleared")
        setReceipts(receipt)
        setQuotations(loadedQuotations) 
        const payments = loadedPayments.filter((p: any) => p.status === "cleared")
        setPayments(payments)
        const clients = loadedClients.filter((c: any) => c.status === "active")
        setClients(clients)
        setItems(loadedItems)
        setHasTaxSettings(!!loadedTaxSettings)
        setHasBankDetails(Array.isArray(loadedBankAccounts) && loadedBankAccounts.length > 0)
      }
    }
    loadData()
  }, [hasPermission])

  const clientOptions = useMemo(() => {
    return clients.map((c) => ({
      value: c._id,
      label: c.name,
      email: c.email,
      phone: c.phone,
      address: `${c.address}, ${c.city}, ${c.state} ${c.pincode}`,
    }))
  }, [clients])

  const handleClientSelect = (clientId: string) => {
    if (clientId) {
      const client = clients.find((c) => c._id === clientId)
      if (client) {
        setSelectedClientForDetails({
          id: client._id,
          name: client.name,
        })
      }
    } else {
      setSelectedClientForDetails(null)
    }
  }

  const dateFilterRange = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const year = now.getFullYear()
    const month = now.getMonth()

    // Financial year start
    const fyStart = month >= 3 ? new Date(year, 3, 1) : new Date(year - 1, 3, 1)
    const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31, 23, 59, 59, 999)

    switch (dateRange) {
      case "today":
        return { from: todayStart, to: todayEnd }

      case "this_week": {
        const firstDayOfWeek = new Date(todayStart)
        firstDayOfWeek.setDate(todayStart.getDate() - todayStart.getDay())
        const lastDayOfWeek = new Date(firstDayOfWeek)
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6)
        lastDayOfWeek.setHours(23, 59, 59, 999)
        return { from: firstDayOfWeek, to: lastDayOfWeek }
      }

      case "this_month": {
        const from = new Date(year, month, 1)
        const to = new Date(year, month + 1, 0, 23, 59, 59, 999)
        return { from, to }
      }

      case "this_year":
        return { from: fyStart, to: fyEnd }

      case "this_quarter": {
        const quarter = Math.floor(month / 3);
        const from = new Date(year, quarter * 3, 1);
        const to = new Date(year, quarter * 3 + 3, 0, 23, 59, 59, 999);
        return { from, to };
      }

      case "last_6_months": {
        const from = new Date(year, month - 6, 1)
        return { from, to: todayEnd }
      }

      case "all_time":
        return { from: new Date(0), to: todayEnd }

      case "custom_range": {
        if (!customStartDate || !customEndDate) {
          return { from: new Date(0), to: new Date(0) } // Return empty range if not set
        }
        const from = customStartDate
        const to = new Date(customEndDate)
        to.setHours(23, 59, 59, 999)
        return { from, to }
      }

      default: {
        const from = new Date(year, month, 1)
        const to = new Date(year, month + 1, 0, 23, 59, 59, 999)
        return { from, to }
      }
    }
  }, [dateRange, customStartDate, customEndDate])

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const date = new Date(r.date)
      return date >= dateFilterRange.from && date <= dateFilterRange.to
    })
  }, [receipts, dateFilterRange])

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const date = new Date(q.date)
      return date >= dateFilterRange.from && date <= dateFilterRange.to
    })
  }, [quotations, dateFilterRange])

  const filteredSalesInvoices = useMemo(() => {
    return salesInvoices.filter((inv) => {
      const date = new Date(inv.date)
      return date >= dateFilterRange.from && date <= dateFilterRange.to
    })
  }, [salesInvoices, dateFilterRange])

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const date = new Date(p.date)
      return date >= dateFilterRange.from && date <= dateFilterRange.to
    })
  }, [payments, dateFilterRange])

  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
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
  }, [clients, items, hasTaxSettings, hasBankDetails])

  const financialData = useMemo(() => {
    const monthlyData: Record<string, { income: number; expenses: number }> = {}

    // Group receipts by month
    filteredReceipts.forEach((receipt) => {
      const date = new Date(receipt.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}` // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 }
      }
      monthlyData[monthKey].income += receipt.ReceiptAmount || 0
    })

    // Group payments by month
    filteredPayments.forEach((payment) => {
      const date = new Date(payment.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}` // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 }
      }
      monthlyData[monthKey].expenses += payment.amount || 0
    })

    const sortedKeys = Object.keys(monthlyData).sort()

    return sortedKeys.map((key) => {
      const [year, monthNum] = key.split("-")
      const monthName = new Date(parseInt(year), parseInt(monthNum)).toLocaleDateString("en-US", { month: "short" })
      const data = monthlyData[key]
      return {
        month: `${monthName} '${year.slice(2)}`,
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses,
      }
    })
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
    const totalIncome = filteredReceipts.reduce((sum, r) => sum + (r.ReceiptAmount || 0), 0);
    const totalExpenses = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0;

    // Calculate trends (compare with previous period)
    const currentPeriodStart = dateFilterRange.from;
    let previousPeriodStart: Date | null = null;

    if (dateRange === 'today') {
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(currentPeriodStart.getDate() - 1);
    } else if (dateRange === 'this_week') {
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(currentPeriodStart.getDate() - 7);
    } else if (dateRange === 'this_month') {
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
    } else if (dateRange === 'last_6_months') {
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setMonth(currentPeriodStart.getMonth() - 6);
    } else if (dateRange === 'this_year') {
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setFullYear(currentPeriodStart.getFullYear() - 1);
    }

    let previousIncome = 0;
    let previousExpenses = 0;
    let previousProfit = 0;

    if (previousPeriodStart) {
      const previousReceipts = receipts.filter(r => {
        const date = new Date(r.date);
        return date >= previousPeriodStart! && date < currentPeriodStart;
      });
      previousIncome = previousReceipts.reduce((sum, r) => sum + (r.ReceiptAmount || 0), 0);

      const previousPayments = payments.filter(p => {
        const date = new Date(p.date);
        return date >= previousPeriodStart! && date < currentPeriodStart;
      });
      previousExpenses = previousPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      previousProfit = previousIncome - previousExpenses;
    }

    const calculateChange = (current: number, previous: number) => {
      if (previous > 0) return ((current - previous) / previous) * 100;
      if (current > 0) return 100;
      return 0;
    };

    const incomeChange = calculateChange(totalIncome, previousIncome);
    const expenseChange = calculateChange(totalExpenses, previousExpenses);

    const previousProfitMargin = previousIncome > 0 ? (previousProfit / previousIncome) * 100 : 0;
    const profitMarginChange = profitMargin - previousProfitMargin;

    return [
      {
        title: "Total Income",
        value: `₹${totalIncome.toLocaleString()}`,
        change: dateRange !== 'all_time' ? `${incomeChange >= 0 ? "+" : ""}${incomeChange.toFixed(1)}%` : 'N/A',
        trend: incomeChange >= 0 ? "up" : "down",
        icon: DollarSign,
      },
      {
        title: "Active Clients",
        value: clients.length.toString(),
        change: "All time",
        trend: "up",
        icon: Users,
      },
      {
        title: "Total Expenses",
        value: `₹${totalExpenses.toLocaleString()}`,
        change: dateRange !== 'all_time' ? `${expenseChange >= 0 ? "+" : ""}${expenseChange.toFixed(1)}%` : 'N/A',
        trend: expenseChange >= 0 ? "up" : "down",
        icon: Package,
      },
      {
        title: "Profit Margin",
        value: `${profitMargin.toFixed(1)}%`,
        change: dateRange !== 'all_time' ? `${profitMarginChange >= 0 ? "+" : ""}${profitMarginChange.toFixed(1)}pp` : 'N/A', // pp for percentage points
        trend: profitMarginChange >= 0 ? "up" : "down",
        icon: Activity,
      },
    ]
  }, [filteredReceipts, filteredPayments, clients, receipts, payments, dateFilterRange, dateRange])

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
      clientStats[receipt.clientId].revenue += receipt.ReceiptAmount || 0
      clientStats[receipt.clientId].transactions += 1
    })

    return Object.values(clientStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [filteredReceipts])

  const inventoryAnalytics = useMemo(() => {
    const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {}

    filteredReceipts.forEach((quotation) => {
      (quotation.items || []).forEach((item) => {
        // Ensure we have an itemId to work with
        if (item.itemId) {
          if (!itemStats[item.itemId]) {
            // Find the full item details from the `items` state to get the correct name
            const fullItem = items.find((i) => i._id === item.itemId)
            itemStats[item.itemId] = {
              name: fullItem?.name || item.itemName || "Unknown Item",
              quantity: 0,
              revenue: 0,
            }
          }
          itemStats[item.itemId].quantity += item.quantity || 0
          itemStats[item.itemId].revenue += item.total || 0
        }
      })
    })

    const result = Object.values(itemStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return result
  }, [filteredReceipts, items])

  const detailedCustomerStats = useMemo(() => {
    const stats: Record<string, {
      name: string;
      cleared: number;
      uncleared: number;
      cancelled: number;
      badDebt: number;
    }> = {}

    // This logic uses filteredReceipts, so it respects the global date filter
    filteredReceipts.forEach((r) => {
      const clientId = r.clientId || "unknown"
      if (!stats[clientId]) {
        stats[clientId] = {
          name: r.clientName || "Unknown Client",
          cleared: 0,
          uncleared: 0,
          cancelled: 0,
          badDebt: 0
        }
      }
      const amount = r.ReceiptAmount || 0
      const status = (r.status || "").toLowerCase()

      if (status === 'cleared') stats[clientId].cleared += amount
      else if (status === 'received' || status === 'pending') stats[clientId].uncleared += amount
      else if (status === 'cancelled') stats[clientId].cancelled += amount

      if (r.badDeptAmount) stats[clientId].badDebt += (r.badDeptAmount || 0)
    })

    const result = Object.entries(stats).map(([clientId, data]) => ({
      id: clientId,
      ...data,
    }))

    return result.sort((a, b) => b.cleared - a.cleared)
  }, [filteredReceipts])

  const selectedClientTransactions = useMemo(() => {
    if (!selectedClientForDetails) return { receipts: [], quotations: [], payments: [], salesInvoices: [] };

    const receipts = filteredReceipts.filter(r => r.clientId === selectedClientForDetails.id);
    const quotations = filteredQuotations.filter(q => q.clientId === selectedClientForDetails.id);
    // Assuming payments to clients have recipientType 'client'
    const payments = filteredPayments.filter(p => p.recipientId === selectedClientForDetails.id && p.recipientType === 'client');
    const clientSalesInvoices = filteredSalesInvoices.filter(inv => inv.clientId === selectedClientForDetails.id);

    return { receipts, quotations, payments, salesInvoices: clientSalesInvoices };
  }, [selectedClientForDetails, filteredReceipts, filteredQuotations, filteredPayments, filteredSalesInvoices]);
// const selectedClientTransactions = useMemo(() => {
//   if (!selectedClientForDetails) 
//     return { receipts: [], quotations: [], payments: [] }

//   const receipts = filteredReceipts.filter(
//     r => r.clientId === selectedClientForDetails.id
//   )

//   const quotations = filteredQuotations.filter(
//     q => q.clientId === selectedClientForDetails.id
//   )

//   const payments = filteredPayments.filter(
//     p => p.recipientId === selectedClientForDetails.id &&
//          p.recipientType === "client"
//   )

//   return { receipts, quotations, payments }

// }, [selectedClientForDetails, filteredReceipts, filteredQuotations, filteredPayments])

  const clientBalance = useMemo(() => {
    if (!selectedClientForDetails) return 0

    // Total amount from all non-cancelled sales invoices for the client in the selected period
    const totalBilled = selectedClientTransactions.salesInvoices
      .filter((inv) => inv.status.toLowerCase() !== "cancelled")
      .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)

    // Total amount from all non-cancelled, cleared receipts for the client in the selected period
    // Note: `filteredReceipts` is already pre-filtered for 'cleared' status.
    const totalReceived = selectedClientTransactions.receipts
      .filter((r) => r.status.toLowerCase() !== "cancelled")
      .reduce((sum, r) => sum + (r.ReceiptAmount || 0), 0)

    return totalBilled - totalReceived
  }, [selectedClientTransactions])

  const handlePDFExport = async () => {
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
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    value
  }: any) => {
    // hide labels for very small slices (<3%)
    if (percent < 0.03) return null

    const RADIAN = Math.PI / 180
    const radius = outerRadius + 20
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        ₹{value.toLocaleString()}
      </text>
    )
  }
  const totalRevenue = inventoryAnalytics.reduce(
    (sum, item) => sum + item.revenue,
    0
  )

  const getStatusBadge = (type: 'quotation' | 'sales_invoice' | 'receipt' | 'payment', status?: string) => {
    const s = (status || '').toLowerCase();

    switch (type) {
        case 'quotation':
            switch (s) {
                case 'pending':
                case 'created':
                    return <Badge className="bg-yellow-100 text-yellow-800 capitalize">{status}</Badge>;
                case 'accepted':
                    return <Badge className="bg-blue-100 text-blue-800 capitalize">{status}</Badge>;
                case 'confirmed': // invoice created
                    return <Badge className="bg-green-100 text-green-800 capitalize">{status}</Badge>;
                case 'expired':
                    return <Badge variant="secondary" className="capitalize">{status}</Badge>;
                case 'cancelled':
                    return <Badge variant="destructive" className="capitalize">{status}</Badge>;
                default:
                    return <Badge variant="secondary" className="capitalize">{status}</Badge>;
            }
        case 'sales_invoice':
            switch (s) {
                case 'cleared':
                case 'collected':
                    return <Badge className="bg-green-100 text-green-800 capitalize">{status}</Badge>;
                case 'not cleared':
                case 'not collected':
                case 'pending':
                    return <Badge className="bg-blue-100 text-blue-800 capitalize">{status}</Badge>;
                case 'partial':
                case 'partially collected':
                    return <Badge className="bg-yellow-100 text-yellow-800 capitalize">{status}</Badge>;
                case 'overdue':
                    return <Badge className="bg-orange-100 text-orange-800 capitalize">{status}</Badge>;
                case 'cancelled':
                    return <Badge variant="destructive" className="capitalize">{status}</Badge>;
                default:
                    return <Badge variant="secondary" className="capitalize">{status}</Badge>;
            }
        case 'receipt':
            switch (s) {
                case 'received':
                case 'pending':
                    return <Badge className="bg-yellow-100 text-yellow-800 capitalize">{status}</Badge>;
                case 'cleared':
                    return <Badge className="bg-green-100 text-green-800 capitalize">{status}</Badge>;
                case 'cancelled':
                    return <Badge variant="destructive" className="capitalize">{status}</Badge>;
                default:
                    return <Badge variant="secondary" className="capitalize">{status}</Badge>;
            }
        case 'payment':
            // Payments are always 'completed' in this report context, but adding more for robustness
            if (s === 'completed' || s === 'paid' || s === 'cleared') {
              return <Badge className="bg-green-100 text-green-800 capitalize">{status}</Badge>;
            }
            return <Badge variant="destructive" className="capitalize">{status}</Badge>;
        default:
            return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
};

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
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="this_year">This Financial Year</SelectItem>
              <SelectItem value="custom_range">Custom Range</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
          {dateRange === "custom_range" && (
  <div className="flex gap-3">

    {/* Start Date */}
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-start text-left">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {customStartDate ? format(customStartDate, "PPP") : "Start Date"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={customStartDate || undefined}
          onSelect={(date) => {
            setCustomStartDate(date || null)

            // reset end date if invalid
            if (customEndDate && date && customEndDate < date) {
              setCustomEndDate(null)
            }
          }}
        />
      </PopoverContent>
    </Popover>

    {/* End Date */}
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-start text-left">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {customEndDate ? format(customEndDate, "PPP") : "End Date"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={customEndDate || undefined}
          disabled={(date) =>
            customStartDate ? date < customStartDate : false
          }
          onSelect={(date) => setCustomEndDate(date || null)}
        />
      </PopoverContent>
    </Popover>

  </div>
)}
          <Select
            onValueChange={(value) => {
              const dateSuffix = `${dateRange}-${new Date().toISOString().split("T")[0]}`
              switch (value) {
                case "financial":
                  downloadCSV(`financial-report-${dateSuffix}.csv`, financialData, [
                    { key: "month", label: "Month" },
                    { key: "income", label: "Income", format: (v) => formatCurrencyForExport(v, "₹") },
                    { key: "expenses", label: "Expenses", format: (v) => formatCurrencyForExport(v, "₹") },
                    { key: "profit", label: "Profit", format: (v) => formatCurrencyForExport(v, "₹") },
                  ])
                  break
                case "customer":
                  downloadCSV(`customer-analytics-${dateSuffix}.csv`, customerAnalytics, [
                    { key: "name", label: "Customer Name" },
                    { key: "revenue", label: "Total Revenue", format: (v) => formatCurrencyForExport(v, "₹") },
                    { key: "transactions", label: "Transactions" },
                  ])
                  break
                case "inventory":
                  downloadCSV(`inventory-analytics-${dateSuffix}.csv`, inventoryAnalytics, [
                    { key: "name", label: "Item Name" },
                    { key: "quantity", label: "Quantity Sold" },
                    { key: "revenue", label: "Revenue", format: (v) => formatCurrencyForExport(v, "₹") },
                  ])
                  break
                case "kpi":
                  const kpiExportData = kpiData.map((kpi) => ({
                    metric: kpi.title,
                    value: kpi.value,
                    change: kpi.change,
                    trend: kpi.trend,
                  }))
                  downloadCSV(`kpi-report-${dateSuffix}.csv`, kpiExportData, [
                    { key: "metric", label: "Metric" },
                    { key: "value", label: "Value" },
                    { key: "change", label: "Change" },
                    { key: "trend", label: "Trend" },
                  ])
                  break
                case "all":
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
                  downloadJSON(`complete-report-${dateSuffix}.json`, allData)
                  break
                case "pdf":
                  handlePDFExport()
                  break
              }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
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
          <div className="overflow-x-auto whitespace-nowrap">
            <TabsList className="flex gap-2 min-w-max md:grid md:w-full md:grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
              <TabsTrigger value="financial" className="flex-shrink-0">Financial</TabsTrigger>
              <TabsTrigger value="customers" className="flex-shrink-0">Customers</TabsTrigger>
              <TabsTrigger value="inventory" className="flex-shrink-0">Inventory</TabsTrigger>
              <TabsTrigger value="compliance" className="flex-shrink-0">Compliance</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly income vs expenses over time</CardDescription>
                </CardHeader>
                <CardContent className="px-0 h-64 lg:h-80 flex justify-center items-center">
                  <ChartContainer
                    config={{
                      income: { label: "Income", color: "#8b5cf6" },
                      expenses: { label: "Expenses", color: "#06b6d4" },
                    }}
                    className="items-center justify-center h-full w-full relative"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financialData}>
                        <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month"  />
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
                <CardContent className="px-0 h-64 lg:h-80 flex justify-center items-center">
                  {expenseBreakdown.length > 0 ? (
                    <ChartContainer config={{}} className="items-center justify-center h-full w-full relative">
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
                  <CardDescription>Monthly income, expense, and profit trends</CardDescription>
                </CardHeader>
                <CardContent className="px-0 h-64 lg:h-80 flex justify-center items-center">
                  <ChartContainer
                    config={{
                      income: { label: "Income", color: "#8b5cf6" },
                      expenses: { label: "Expenses", color: "#ef4444" },
                      profit: { label: "Profit", color: "#10b981" },
                    }}
                    className="items-center justify-center h-full w-full relative"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={financialData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="income" stroke="#8b5cf6" strokeWidth={2} />
                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
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
                        ₹{filteredReceipts.reduce((sum, r) => sum + (r.ReceiptAmount || 0), 0).toLocaleString()}
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
                          filteredReceipts.reduce((sum, r) => sum + (r.ReceiptAmount || 0), 0) -
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
                <CardContent className="px-0 h-64 lg:h-80 flex justify-center items-center">
                  {customerAnalytics.length > 0 ? (
                    <ChartContainer
                      config={{
                        revenue: { label: "Revenue", color: "#8b5cf6" },
                      }}
                     className="items-center justify-center h-full w-full relative"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={customerAnalytics} layout="vertical">
                          <CartesianGrid strokeDasharray="1 1" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category"  width={100}/>
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
            <div className="hidden md:block">
            <Card>
  <CardHeader>
    <CardTitle>Client Transaction Details(This Data Is in under Process)</CardTitle>
    <CardDescription>
      View all quotations, invoices/receipts and payments for a specific client
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-4">

    <OwnSearchableSelect
      options={clientOptions}
      value={selectedClientForDetails?.id || ""}
      onValueChange={handleClientSelect}
      placeholder="Search and select a client by name, email, phone, or address..."
      emptyText="No clients found."
    />
    {selectedClientForDetails && (
  <div className="bg-yellow-50 border rounded-md p-3 flex justify-between">
    <span className="font-medium">
      Outstanding Balance
    </span>

    <span className="font-bold text-red-600">
      ₹{clientBalance.toLocaleString()}
    </span>
  </div>
)}
{selectedClientForDetails && (
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Number</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>

  <TableBody>

    {/* Quotations */}
    {selectedClientTransactions.quotations.map((q) => (
      <TableRow key={q._id}>
        <TableCell>{format(new Date(q.date), "dd MMM yyyy")}</TableCell>
        <TableCell>Quotation</TableCell>
        <TableCell>{q?.quotationNumber}</TableCell>
        <TableCell>
          {getStatusBadge('quotation', q.status)}
        </TableCell>
        <TableCell className="text-right">
          ₹{(q.grandTotal || 0).toLocaleString()}
        </TableCell>
      </TableRow>
    ))}

    {/* Sales Invoices */}
    {selectedClientTransactions.salesInvoices.map((inv) => (
      <TableRow key={inv._id}>
        <TableCell>{format(new Date(inv.date), "dd MMM yyyy")}</TableCell>
        <TableCell>Sales Invoice</TableCell>
        <TableCell>{inv.salesInvoiceNumber}</TableCell>
        <TableCell>
          {getStatusBadge('sales_invoice', inv.status)}
        </TableCell>
        <TableCell className="text-right">
          ₹{(inv.grandTotal || 0).toLocaleString()}
        </TableCell>
      </TableRow>
    ))}

    {/* Receipts / Invoices */}
    {selectedClientTransactions.receipts.map((r) => (
      <TableRow key={r._id}>
        <TableCell>{format(new Date(r.date), "dd MMM yyyy")}</TableCell>
        <TableCell>Receipt</TableCell>
        <TableCell>{r.receiptNumber}</TableCell>
        <TableCell>
          {getStatusBadge('receipt', r.status)}
        </TableCell>
        <TableCell className="text-right">
          ₹{(r.ReceiptAmount || 0).toLocaleString()}
        </TableCell>
      </TableRow>
    ))}

    {/* Payments */}
    {selectedClientTransactions.payments.map((p) => (
      <TableRow key={p._id}>
        <TableCell>{format(new Date(p.date), "dd MMM yyyy")}</TableCell>
        <TableCell>Payment</TableCell>
        <TableCell>{p?.paymentNumber}</TableCell>
        <TableCell>
          {getStatusBadge('payment', p.status)}
        </TableCell>
        <TableCell className="text-right">
          ₹{(p.amount || 0).toLocaleString()}
        </TableCell>
      </TableRow>
    ))}

  </TableBody>
</Table>
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
                <CardContent className="px-0 h-auto">
                  {inventoryAnalytics.length > 0 ? (
                    <ChartContainer
                      config={{
                        revenue: { label: "Revenue", color: "#10b981" },
                      }}
                      className="items-center justify-center h-full w-full relative"
                    >
                      <div className="">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={inventoryAnalytics.slice(0, 6)}
                              dataKey="revenue"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={3}
                              >
                              {inventoryAnalytics.slice(0, 6).map((entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>

                            <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} allowEscapeViewBox={{ x: true, y: true }} wrapperStyle={{ zIndex: 1000 }} offset={20}/>
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-lg font-bold text-gray-900">
                            ₹{totalRevenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 max-w-[80px] text-center">Total Revenue by item</p>
                        </div>
                      </div>
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
                    {inventoryAnalytics.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg ">
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