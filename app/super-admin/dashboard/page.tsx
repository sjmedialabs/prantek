"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import {
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  Building2,
  AlertTriangle,
  CheckCircle,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { dataStore } from "@/lib/data-store"
import type { User as UserType, SubscriptionPlan } from "@/lib/data-store"

interface QuickStat {
  name: string
  value: string | number
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ComponentType<any>
  href: string
}

interface RecentActivity {
  id: string
  type: "client_signup" | "subscription_change" | "payment_failed" | "account_suspended"
  message: string
  timestamp: string
  severity: "info" | "warning" | "error" | "success"
}

export default function SuperAdminDashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeClients: 0,
    subscriptions: 0,
    systemHealth: "99.9%",
  })
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [planDistribution, setPlanDistribution] = useState<any[]>([])

  useEffect(() => {
    const loadRealData = async () => {
      // Get all users with admin role (clients)
      const allUsers = await dataStore.getAll<UserType>("users")
      const adminUsers = allUsers.filter((u) => u.role === "admin")
      const activeClients = adminUsers.filter((u) => u.subscriptionStatus === "active").length

      // Get all subscription plans
      const plans = await dataStore.getAll<SubscriptionPlan>("subscription_plans")
      const totalSubscriptions = plans.reduce((sum, plan) => sum + plan.subscriberCount, 0)

      // Calculate total revenue from subscription plans
      const totalRevenue = plans.reduce((sum, plan) => sum + plan.revenue, 0)

      setStats({
        totalRevenue,
        activeClients,
        subscriptions: totalSubscriptions,
        systemHealth: "99.9%",
      })

      // Generate revenue data for last 6 months
      const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const revenueByMonth = months.map((month, index) => ({
        month,
        revenue: Math.round(totalRevenue * (0.5 + index * 0.1)), // Progressive growth
      }))
      setRevenueData(revenueByMonth)

      // Plan distribution from real data
      const distribution = plans.map((plan) => ({
        name: plan.name,
        value: plan.subscriberCount,
        color: plan.name === "Standard" ? "#3b82f6" : plan.name === "Premium" ? "#8b5cf6" : "#f59e0b",
      }))
      setPlanDistribution(distribution)
    }

    loadRealData()
  }, [])

  const quickStats: QuickStat[] = [
    {
      name: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      change: "+18.2%",
      trend: "up",
      icon: DollarSign,
      href: "/super-admin/sales",
    },
    {
      name: "Active Clients",
      value: stats.activeClients,
      change: "+12.5%",
      trend: "up",
      icon: Building2,
      href: "/super-admin/clients",
    },
    {
      name: "Subscriptions",
      value: stats.subscriptions,
      change: "+8.1%",
      trend: "up",
      icon: CreditCard,
      href: "/super-admin/subscriptions",
    },
    {
      name: "System Health",
      value: stats.systemHealth,
      change: "+0.1%",
      trend: "up",
      icon: Activity,
      href: "/super-admin/dashboard",
    },
  ]

  const recentActivity: RecentActivity[] = [
    {
      id: "1",
      type: "client_signup",
      message: "New client 'Tech Solutions Inc' signed up for Premium plan",
      timestamp: "2 minutes ago",
      severity: "success",
    },
    {
      id: "2",
      type: "payment_failed",
      message: "Payment failed for 'Small Business Co' - ₹99.00",
      timestamp: "15 minutes ago",
      severity: "error",
    },
    {
      id: "3",
      type: "subscription_change",
      message: "Acme Corporation upgraded from Standard to Premium",
      timestamp: "1 hour ago",
      severity: "info",
    },
    {
      id: "4",
      type: "account_suspended",
      message: "Account suspended for 'Creative Agency' due to payment failure",
      timestamp: "2 hours ago",
      severity: "warning",
    },
    {
      id: "5",
      type: "client_signup",
      message: "New trial started for 'Global Enterprises' - Enterprise plan",
      timestamp: "3 hours ago",
      severity: "success",
    },
  ]

  const systemAlerts = [
    {
      id: "1",
      message: "API response time increased to 120ms",
      severity: "warning" as const,
      timestamp: "5 minutes ago",
    },
    {
      id: "2",
      message: "Storage usage at 78% capacity",
      severity: "warning" as const,
      timestamp: "1 hour ago",
    },
    {
      id: "3",
      message: "Database backup completed successfully",
      severity: "success" as const,
      timestamp: "2 hours ago",
    },
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "client_signup":
        return <Users className="h-4 w-4 text-green-600" />
      case "subscription_change":
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case "payment_failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "account_suspended":
        return <Shield className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      default:
        return "text-blue-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            <span>Super Admin Dashboard</span>
          </h1>
          <p className="text-gray-600">Welcome back, {user?.name}. Here's your platform overview.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">Platform Administrator</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">{stat.name}</CardTitle>
                  <Icon className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className={`flex items-center text-xs mt-1 ${getTrendColor(stat.trend)}`}>
                    {getTrendIcon(stat.trend)}
                    <span className="ml-1">{stat.change} from last month</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Monthly recurring revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "#10b981" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Current plan distribution</CardDescription>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${getSeverityColor(activity.severity)}`}>{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Platform health and monitoring alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {alert.severity === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${getSeverityColor(alert.severity)}`}>{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                View System Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/super-admin/subscriptions">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription Plans
              </Button>
            </Link>
            <Link href="/super-admin/clients">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Building2 className="h-4 w-4 mr-2" />
                View Client Accounts
              </Button>
            </Link>
            <Link href="/super-admin/sales">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <TrendingUp className="h-4 w-4 mr-2" />
                Sales Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
