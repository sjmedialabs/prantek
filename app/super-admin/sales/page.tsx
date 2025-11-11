"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  standard: number
  premium: number
  enterprise: number
  total: number
}

interface PlanDistribution {
  name: string
  value: number
  revenue: number
  color: string
}

export default function SalesDashboardPage() {
  const { hasPermission } = useUser()
  const [selectedPeriod, setSelectedPeriod] = useState("6months")

  const [salesMetrics, setSalesMetrics] = useState<SalesMetric[]>([])
  const [clientOnboardingData, setClientOnboardingData] = useState<ClientOnboardingData[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([])

  useEffect(() => {
    const loadRealData = async () => {
      try {
        // Get all users and plans
        const allUsers = await api.users.getAll()
        const adminUsers = allUsers.filter((u) => u.role === "admin")
        const plans = await api.subscriptionPlans.getAll()

        // Calculate metrics from real data
        const totalClients = adminUsers.length
        const activeSubscriptions = adminUsers.filter((u) => u.subscriptionStatus === "active").length
        const trialSubscriptions = adminUsers.filter((u) => u.subscriptionStatus === "trial").length

        // Calculate total MRR from active subscriptions
        let totalMRR = 0
        adminUsers.forEach(user => {
          if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trial") {
            const plan = plans.find(p => (p._id || p.id) === user.subscriptionPlanId)
            if (plan) {
              totalMRR += plan.price || 0
            }
          }
        })

        const avgRevenuePerUser = activeSubscriptions > 0 ? Math.round(totalMRR / activeSubscriptions) : 0
        const churnedUsers = adminUsers.filter((u) => u.subscriptionStatus === "cancelled").length
        const churnRate = totalClients > 0 ? ((churnedUsers / totalClients) * 100).toFixed(1) : "0.0"

        const metrics: SalesMetric[] = [
          {
            name: "Total Clients Onboarded",
            value: totalClients,
            change: totalClients > 0 ? "+100%" : "0%",
            trend: "up",
            icon: Building2,
          },
          {
            name: "Monthly Recurring Revenue",
            value: `₹${totalMRR.toLocaleString()}`,
            change: totalMRR > 0 ? "+100%" : "0%",
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

        // Generate onboarding data from real user creation dates
        const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const currentMonth = new Date().getMonth()
        const onboarding = months.map((month, index) => {
          const monthIndex = currentMonth - (5 - index)
          const usersInMonth = adminUsers.filter(u => {
            if (!u.createdAt) return false
            const userMonth = new Date(u.createdAt).getMonth()
            return userMonth === monthIndex
          }).length

          return {
            month,
            newClients: usersInMonth,
            totalClients: adminUsers.filter(u => {
              if (!u.createdAt) return false
              return new Date(u.createdAt) <= new Date(2024, monthIndex, 1)
            }).length,
            churnRate: parseFloat(churnRate),
          }
        })
        setClientOnboardingData(onboarding)

        // Calculate revenue by plan from real subscriptions
        const revenue = months.map((month, index) => {
          const result: any = { month, total: 0 }

          plans.forEach(plan => {
            const planName = plan.name.toLowerCase()
            console.log("Plan name is ", planName)
            const usersWithPlan = adminUsers.filter(
              (u) => u.subscriptionPlanId === (plan._id || plan.id)
            ).length

            console.log("Users with plan is ", usersWithPlan)
            result[planName] = usersWithPlan * (plan.price || 0)
            result.total += result[planName]
          })
          console.log("Revenue is :", result)
          return result
        })
        setRevenueData(revenue)

        // Plan distribution from real subscription counts
        const distribution = plans.map((plan, index) => {
          const subscriberCount = adminUsers.filter(u =>
            (u.subscriptionPlanId === plan._id || u.subscriptionPlanId === plan.id)
          ).length

          const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"]

          return {
            name: plan.name,
            value: subscriberCount,
            revenue: subscriberCount * (plan.price || 0),
            color: colors[index % colors.length],
          }
        })
        setPlanDistribution(distribution.filter(d => d.value > 0))
      } catch (error) {
        console.error("Failed to load sales data:", error)
      }
    }

    loadRealData()
  }, [])

  const conversionFunnelData = [
    { stage: "Visitors", count: 12500, percentage: 100 },
    { stage: "Signups", count: 1875, percentage: 15 },
    { stage: "Trials", count: 750, percentage: 6 },
    { stage: "Paid", count: 127, percentage: 1.02 },
  ]

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

  // Super-admin has access to everything - permission check removed

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600">Track revenue, client onboarding, and subscription metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 6 Months
          </Button>
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
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <div className={`flex items-center text-xs mt-1 ${getTrendColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                  <span className="ml-1">{metric.change} from last month</span>
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
              <CardContent>
                <ChartContainer
                  config={{
                    standard: { label: "Standard", color: "#3b82f6" },
                    premium: { label: "Premium", color: "#8b5cf6" },
                    enterprise: { label: "Enterprise", color: "#f59e0b" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="standard"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="premium"
                        stackId="1"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="enterprise"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Current subscriber distribution by plan</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Subscribers" },
                  }}
                  className="h-[300px]"
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
            <CardContent>
              <ChartContainer
                config={{
                  newClients: { label: "New Clients", color: "#10b981" },
                  totalClients: { label: "Total Clients", color: "#3b82f6" },
                }}
                className="h-[300px]"
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
            <CardContent>
              <ChartContainer
                config={{
                  total: { label: "Total Revenue", color: "#1f2937" },
                }}
                className="h-[400px]"
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
              <CardContent>
                <ChartContainer
                  config={{
                    newClients: { label: "New Clients", color: "#10b981" },
                  }}
                  className="h-[300px]"
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
              <CardContent>
                <ChartContainer
                  config={{
                    churnRate: { label: "Churn Rate (%)", color: "#ef4444" },
                  }}
                  className="h-[300px]"
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
                {conversionFunnelData.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{stage.stage}</div>
                          <div className="text-sm text-gray-500">{stage.percentage}% conversion rate</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stage.count.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">
                          {index > 0 && (
                            <span className="text-red-600">
                              -{(conversionFunnelData[index - 1].count - stage.count).toLocaleString()} lost
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < conversionFunnelData.length - 1 && (
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
                <CardDescription>Areas for improvement in the sales funnel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Visitor to Signup</div>
                      <div className="text-sm text-gray-500">Landing page optimization needed</div>
                    </div>
                    <Badge variant="destructive">15%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Trial to Paid</div>
                      <div className="text-sm text-gray-500">Onboarding experience</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">17%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Overall Conversion</div>
                      <div className="text-sm text-gray-500">End-to-end funnel</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">1.02%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Impact</CardTitle>
                <CardDescription>Potential revenue from funnel improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-gray-600">If signup rate improved to 20%:</div>
                    <div className="text-xl font-bold text-green-600">+₹8,200 monthly</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-gray-600">If trial conversion improved to 25%:</div>
                    <div className="text-xl font-bold text-green-600">+₹12,400 monthly</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-gray-600">Combined optimization potential:</div>
                    <div className="text-xl font-bold text-purple-600">+₹20,600 monthly</div>
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
