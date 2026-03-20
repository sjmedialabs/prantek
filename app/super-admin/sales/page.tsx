"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useUser } from "@/components/auth/user-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  Building2,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { api } from "@/lib/api-client"
import { subscriberMRRAmount } from "@/lib/subscription-revenue"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface SalesMetric {
  name: string
  value: string | number
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ComponentType<any>
}

interface ClientOnboardingData {
  month: string
  newClients: number
  totalClients: number
  churnRate: number
}

interface RevenueData {
  month: string
  [planName: string]: any
  total: number
}

interface PlanDistribution {
  name: string
  value: number
  revenue: number
  color: string
}

export interface ConversionFunnelStage {
  stage: string
  count: number
  percentage: number | string
}

export default function SalesDashboardPage() {
  const { hasPermission } = useUser()
  const [users, setUsers] = useState<any[]>([])

  // UI state
  const [selectedPeriod, setSelectedPeriod] = useState<
    "weekly" | "6months" | "monthly" | "quarterly" | "half-yearly" | "yearly" | "all"
  >("6months")

  // Raw data (loaded once)
  const [rawAllUsers, setRawAllUsers] = useState<any[]>([])
  const [rawAdminUsers, setRawAdminUsers] = useState<any[]>([])
  const [rawPlans, setRawPlans] = useState<any[]>([])
  const [yearlyDiscount, setYearlyDiscount] = useState(17);

  // Derived (filtered) data that drives charts and metrics
  const [salesMetrics, setSalesMetrics] = useState<SalesMetric[]>([])
  const [clientOnboardingData, setClientOnboardingData] = useState<ClientOnboardingData[]>([])
  const [activeClients, setActiveClients] = useState<number>(0)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([])
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnelStage[]>([])

  // utility: compute start date from selectedPeriod (Option A — filter by user.createdAt)
  const getPeriodStartDate = (period: typeof selectedPeriod) => {
    const now = new Date()
    switch (period) {
      case "weekly": {
        const firstDayOfWeek = new Date(now)
        firstDayOfWeek.setDate(now.getDate() - now.getDay()) // Sunday as first day
        firstDayOfWeek.setHours(0, 0, 0, 0)
        return firstDayOfWeek
      }
      case "monthly":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days
      case "quarterly":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days
      case "half-yearly":
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) // 180 days
      case "yearly": {
        const month = now.getMonth() // 0-11
        const year = now.getFullYear()
        // Financial year starts in April (month 3)
        const fyStartYear = month >= 3 ? year : year - 1
        return new Date(fyStartYear, 3, 1)
      }
      case "all":
        return new Date(0)
      case "6months":
      default:
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) // Last 6 months as default
    }
  }

  // Load raw data once
  useEffect(() => {
    let mounted = true
    const loadRealData = async () => {
      try {
        const allUsers = await api.users.getAll()
        const adminUsers = allUsers.filter((u: any) => u.userType === "subscriber" && u.role !== "super-admin")
        const plans = await api.subscriptionPlans.getAll()

        try {
          const settingsResponse = await fetch('/api/system-settings');
          const settingsData = await settingsResponse.json();
          if (settingsData.success && settingsData.data.yearlyDiscountPercentage) {
            setYearlyDiscount(settingsData.data.yearlyDiscountPercentage);
          }
        } catch (error) {
          console.error("Failed to load system settings:", error);
        }
       
      setUsers(allUsers);

        if (!mounted) return
        setRawAllUsers(allUsers)
        setRawAdminUsers(adminUsers)
        setRawPlans(plans)
      } catch (error) {
        console.error("Failed to load sales data:", error)
      }
    }

    loadRealData()
    return () => {
      mounted = false
    }
  }, [])

  // Recompute all derived state each time raw data or selectedPeriod changes
  useEffect(() => {
    // If raw data not loaded yet, skip
    if (!rawAllUsers.length || !rawAdminUsers.length) {
      // Still we can set empty arrays to keep UI safe
      setSalesMetrics([])
      setClientOnboardingData([])
      setRevenueData([])
      setPlanDistribution([])
      setConversionFunnel([])
      setActiveClients(0)
      return
    }

    const startDate = getPeriodStartDate(selectedPeriod)

    // Filter users by createdAt within selected period
    const filteredAllUsers = rawAllUsers.filter((u) => {
      if (!u.createdAt) return false
      const created = new Date(u.createdAt)
      return created >= startDate
    })

    const filteredAdminUsers = users.filter((user: any) => user.userType === "subscriber" && user.role !== "super-admin");

    // activeClients (based on subscriptionEndDate irrespective of createdAt? 
    // Option A requested filter by createdAt — so we use filteredAdminUsers here)
    const tempActive = filteredAdminUsers.filter(
      (u) => u.subscriptionEndDate && new Date(u.subscriptionEndDate) > new Date()
    ).length
    setActiveClients(tempActive)

    // Basic counts
    const totalClients = filteredAdminUsers.length
    const activeSubscriptions = filteredAdminUsers.filter((u) => u.subscriptionStatus === "active").length
    const trialSubscriptions = filteredAdminUsers.filter((u) => u.subscriptionStatus === "trial").length
    const churnedUsers = filteredAdminUsers.filter((u) => u.subscriptionStatus === "cancelled").length
    const churnRate = totalClients > 0 ? ((churnedUsers / totalClients) * 100).toFixed(1) : "0.0"

  // Only count revenue from subscribers, not admin users
  const subscriberUsers = users.filter((user: any) => user.userType === "subscriber" && user.role !== "super-admin");
    // Calculate total Revenue from active/trial subscriptions from filteredAdminUsers (only users created within period)
    let totalRevenue = 0
    filteredAdminUsers.forEach((user) => {
      const userPlan = rawPlans.find((plan: any) => (plan._id || plan.id) === user.subscriptionPlanId)
      totalRevenue += subscriberMRRAmount(user, userPlan, yearlyDiscount)
    })
    const avgRevenuePerUser = activeSubscriptions > 0 ? Math.round(totalRevenue / activeSubscriptions) : 0

    const metrics: SalesMetric[] = [
      {
        name: "Total Clients Onboarded",
        value: totalClients,
        change: totalClients > 0 ? "+100%" : "0%",
        trend: "up",
        icon: Building2,
      },
      {
        name: "Total Revenue",
        value: `₹${totalRevenue.toLocaleString()}`,
        change: totalRevenue > 0 ? "+100%" : "0%",
        trend: "up",
        icon: DollarSign,
      },
      {
        name: "Active Subscriptions",
        value: activeSubscriptions,
        change: activeSubscriptions > 0 ? "+100%" : "0%",
        trend: "up",
        icon: CreditCard,
      },
      {
        name: "Average Revenue Per User",
        value: `₹${avgRevenuePerUser}`,
        change: "0%",
        trend: "neutral",
        icon: Target,
      },
      {
        name: "Customer Lifetime Value",
        value: `₹${(avgRevenuePerUser * 12).toLocaleString()}`,
        change: "0%",
        trend: "up",
        icon: TrendingUp,
      },
      {
        name: "Churn Rate",
        value: `${churnRate}%`,
        change: "0%",
        trend: churnedUsers > 0 ? "down" : "neutral",
        icon: Users,
      },
    ]
    setSalesMetrics(metrics)

    // Conversion funnel: base numbers on filteredAllUsers & filteredAdminUsers
    const visitors = filteredAllUsers.length
    const signups = filteredAdminUsers.length
    const trials = trialSubscriptions
    const paid = activeSubscriptions

    const conversionFunnelData: ConversionFunnelStage[] = [
      {
        stage: "Visitors",
        count: visitors,
        percentage: visitors > 0 ? 100 : 0,
      },
      {
        stage: "Signups",
        count: signups,
        percentage: visitors > 0 ? ((signups / visitors) * 100).toFixed(2) : 0,
      },
      {
        stage: "Trials",
        count: trials,
        percentage: signups > 0 ? ((trials / signups) * 100).toFixed(2) : 0,
      },
      {
        stage: "Paid",
        count: paid,
        percentage: signups > 0 ? ((paid / signups) * 100).toFixed(2) : 0,
      },
    ]
    setConversionFunnel(conversionFunnelData)

    // Client onboarding data for the last 6 months (labels anchored to current month)
    const monthsCount = 6
    const monthsArray: string[] = []
    const now = new Date()
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = d.toLocaleString("en-US", { month: "short" })
      monthsArray.push(monthLabel)
    }

    const onboarding = monthsArray.map((monthLabel, idx) => {
      // month index relative to now
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1 - idx), 1)
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)
      const usersInMonth = filteredAdminUsers.filter((u) => {
        if (!u.createdAt) return false
        const c = new Date(u.createdAt)
        return c >= monthStart && c < monthEnd
      }).length

      // total clients up to end of that month (from filteredAdminUsers, which are users created within selected period)
      const totalUpToMonth = filteredAdminUsers.filter((u) => {
        if (!u.createdAt) return false
        const c = new Date(u.createdAt)
        return c < monthEnd
      }).length

      return {
        month: monthLabel,
        newClients: usersInMonth,
        totalClients: totalUpToMonth,
        churnRate: parseFloat(churnRate),
      }
    })
    setClientOnboardingData(onboarding)

    // Revenue by plan from filteredAdminUsers
    const revenue = monthsArray.map((monthLabel, idx) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1 - idx), 1)
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)

      const result: any = { month: monthLabel, total: 0 }
      rawPlans.forEach((plan) => {
        const planKey = plan.name.toLowerCase().replace(/\s+/g, "_")
        const usersWithPlanInMonth = filteredAdminUsers.filter((u) => {
          if (!u.subscriptionStartDate) return false
          const s = new Date(u.subscriptionStartDate)
          return s >= monthStart && s < monthEnd && (u.subscriptionPlanId === (plan._id || plan.id))
        })

        const planRevenue = usersWithPlanInMonth.reduce(
          (acc, user) => acc + subscriberMRRAmount(user, plan, yearlyDiscount),
          0
        )

        result[planKey] = planRevenue
        result.total += planRevenue
      })
      return result
    })
    setRevenueData(revenue)

    // Plan distribution (counts & revenue) from filteredAdminUsers
    const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"]
    const distribution = rawPlans.map((plan, index) => {
      const subscribers = filteredAdminUsers.filter(
        (u) => (u.subscriptionPlanId === plan._id || u.subscriptionPlanId === plan.id)
      )

      const revenue = subscribers.reduce(
        (acc, user) => acc + subscriberMRRAmount(user, plan, yearlyDiscount),
        0
      )

      return {
        name: plan.name,
        value: subscribers.length,
        revenue: revenue,
        color: colors[index % colors.length],
      }
    })
    setPlanDistribution(distribution.filter((d) => d.value > 0))
  }, [rawAllUsers, rawAdminUsers, rawPlans, selectedPeriod, yearlyDiscount])

  // Small helpers for UI
  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case "down":
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  // Colors for plan pie
  const pieColors = useMemo(() => planDistribution.map((p) => p.color), [planDistribution])

  // Render
  // Super-admin has access to everything - permission check removed

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600">Track revenue, client onboarding, and subscription metrics</p>
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                {selectedPeriod === "weekly"
                  ? "This Week"
                  : selectedPeriod === "monthly"
                  ? "Monthly"
                  : selectedPeriod === "quarterly"
                  ? "Quarterly"
                  : selectedPeriod === "half-yearly"
                  ? "Half-Yearly"
                  : selectedPeriod === "yearly"
                  ? "This Financial Year"
                  : selectedPeriod === "all"
                  ? "All Time"
                  : "Last 6 Months"}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSelectedPeriod("weekly")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod("monthly")}>Monthly</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod("quarterly")}>Quarterly</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod("half-yearly")}>Half-Yearly</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod("yearly")}>This Financial Year</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod("all")}>All Time</DropdownMenuItem>
              
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {salesMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">{metric.name}</CardTitle>
                <Icon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-row items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                 
                </div>
                <div className={`flex flex-row justify-between items-center text-xs ${getTrendColor(metric.trend)}`}>
                  <div className="flex items-center mt-4">
                    {getTrendIcon(metric.trend)}
                  <span className="ml-1">{metric.change} from last month</span>
                  </div>
                   {/* {metric.name==="Total Clients Onboarded" && (<div>
                  <p className="text-[12px] font-bold">Active: {activeClients}</p>
                  <p className="text-[12px] font-bold">InActive: {parseInt(metric.value)-activeClients}</p>
                </div>)} */}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="clients">Client Onboarding</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan Type</CardTitle>
                <CardDescription>Monthly recurring revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent className="px-0 h-64 lg:h-80 flex justify-center items-center">
                <ChartContainer
                  config={{
                    standard: { label: "Standard", color: "#3b82f6" },
                    premium: { label: "Premium", color: "#8b5cf6" },
                    enterprise: { label: "Enterprise", color: "#f59e0b" },
                  }}
                 className="items-center justify-center h-full w-full relative"
                >
                 <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="total" stroke="#1f2937" strokeWidth={3} />
                    <Line type="monotone" dataKey="standard" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="premium" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="enterprise" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Current subscriber distribution by plan</CardDescription>
              </CardHeader>
              <CardContent className="px-0 h-64 lg:h-80 flex justify-center items-center">
                <ChartContainer
                  config={{
                    value: { label: "Subscribers" },
                  }}
                  className="items-center justify-center h-full w-full relative"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {planDistribution.map((entry, index) => (
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
              <CardTitle>Client Growth Trend</CardTitle>
              <CardDescription>New client acquisitions and total client base growth</CardDescription>
            </CardHeader>
            <CardContent className="px-0 h-64 lg:h-80 flex justify-center items-center">
              <ChartContainer
                config={{
                  newClients: { label: "New Clients", color: "#10b981" },
                  totalClients: { label: "Total Clients", color: "#3b82f6" },
                }}
               className="items-center justify-center h-full w-full relative"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientOnboardingData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="newClients" fill="#10b981" />
                    <Bar dataKey="totalClients" fill="#3b82f6" fillOpacity={0.3} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {planDistribution.map((plan) => (
              <Card key={plan.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name} Plan
                    <Badge style={{ backgroundColor: plan.color, color: "white" }}>{plan.value} subs</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">₹{plan.revenue.toLocaleString()}</div>
                  <p className="text-sm text-gray-600 mt-1">
                    ₹{Math.round(plan.revenue / plan.value)} avg per subscriber
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth Analysis</CardTitle>
              <CardDescription>Detailed revenue breakdown by subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="px-0 h-64 lg:h-80 flex justify-center items-center">
              <ChartContainer
                config={{
                  total: { label: "Total Revenue", color: "#1f2937" },
                }}
                className="items-center justify-center h-full w-full relative"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="total" stroke="#1f2937" strokeWidth={3} />
                    <Line type="monotone" dataKey="standard" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="premium" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="enterprise" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        {/* client on boarding */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Onboarding Metrics</CardTitle>
                <CardDescription>New client acquisitions over time</CardDescription>
              </CardHeader>
              <CardContent className="px-0 h-64 lg:h-80 flex justify-center items-center">
                <ChartContainer
                  config={{
                    newClients: { label: "New Clients", color: "#10b981" },
                  }}
                  className="items-center justify-center h-full w-full relative"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientOnboardingData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="newClients" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Churn Rate Tracking</CardTitle>
                <CardDescription>Monthly customer churn percentage</CardDescription>
              </CardHeader>
              <CardContent className="px-0 h-64 lg:h-80 flex justify-center items-center">
                <ChartContainer
                  config={{
                    churnRate: { label: "Churn Rate (%)", color: "#ef4444" },
                  }}
                  className="items-center justify-center h-full w-full relative"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={clientOnboardingData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="churnRate" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Client Onboarding Summary</CardTitle>
              <CardDescription>Key metrics for client acquisition and retention</CardDescription>
            </CardHeader>

            <CardContent>
              {clientOnboardingData?.length > 0 ? (
                (() => {
                  const latest = clientOnboardingData[clientOnboardingData.length - 1];
                  const prev = clientOnboardingData[clientOnboardingData.length - 2];

                  const newClientsThisMonth = latest?.newClients ?? 0;
                  const churnRate = latest?.churnRate ?? 0;

                  const totalActiveClients = clientOnboardingData.reduce(
                    (acc, item) => acc + (item.newClients ?? 0),
                    0
                  );

                  const growthRate =
                    prev && prev.newClients
                      ? (((latest.newClients - prev.newClients) / prev.newClients) * 100).toFixed(1)
                      : "0";

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {newClientsThisMonth}
                        </div>
                        <div className="text-sm text-gray-600">New Clients This Month</div>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {totalActiveClients}
                        </div>
                        <div className="text-sm text-gray-600">Total Active Clients</div>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {growthRate}%
                        </div>
                        <div className="text-sm text-gray-600">Growth Rate</div>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {churnRate}%
                        </div>
                        <div className="text-sm text-gray-600">Churn Rate</div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p>No client data available</p>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Conversion Funnel</CardTitle>
              <CardDescription>Track visitor journey from awareness to paid subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{stage.stage || "Unknown Stage"}</div>
                          <div className="text-sm text-gray-500">{stage.percentage}% conversion rate</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stage.count.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">
                          {index > 0 && (
                            <span className="text-red-600">
                              -{(conversionFunnel[index - 1].count - stage.count).toLocaleString()} lost
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < conversionFunnel.length - 1 && (
                      <div className="flex justify-center mt-2">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-gray-300"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Optimization</CardTitle>
                <CardDescription>Conversion rates from your sales funnel (real data)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionFunnel.length >= 2 && (
                    <>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Visitor to Signup</div>
                          <div className="text-sm text-gray-500">Signups vs all users in period</div>
                        </div>
                        <Badge variant={Number(conversionFunnel[1]?.percentage) >= 20 ? "default" : "secondary"}>
                          {typeof conversionFunnel[1]?.percentage === "number"
                            ? conversionFunnel[1].percentage.toFixed(1)
                            : conversionFunnel[1]?.percentage ?? 0}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Signup to Trial</div>
                          <div className="text-sm text-gray-500">Trials vs signups</div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {typeof conversionFunnel[2]?.percentage === "number"
                            ? conversionFunnel[2].percentage.toFixed(1)
                            : conversionFunnel[2]?.percentage ?? 0}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Signup to Paid</div>
                          <div className="text-sm text-gray-500">Paid vs signups</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {typeof conversionFunnel[3]?.percentage === "number"
                            ? conversionFunnel[3].percentage.toFixed(1)
                            : conversionFunnel[3]?.percentage ?? 0}%
                        </Badge>
                      </div>
                    </>
                  )}
                  {conversionFunnel.length < 2 && (
                    <p className="text-sm text-gray-500 py-4">No conversion data in selected period.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>Revenue from current period (real data)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-gray-600">Total revenue (selected period)</div>
                    <div className="text-xl font-bold text-green-600">
                      {salesMetrics.find((m) => m.name === "Total Revenue")?.value ?? "0"}
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-gray-600">Active subscriptions</div>
                    <div className="text-xl font-bold text-blue-600">
                      {salesMetrics.find((m) => m.name === "Active Subscriptions")?.value ?? 0}
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-gray-600">Avg revenue per user</div>
                    <div className="text-xl font-bold text-purple-600">
                      {salesMetrics.find((m) => m.name === "Average Revenue Per User")?.value ?? "₹0"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
