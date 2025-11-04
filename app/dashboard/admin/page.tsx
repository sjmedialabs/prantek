"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Users, DollarSign, FileText, Activity } from "lucide-react"
import { dataStore } from "@/lib/data-store"
import type { User as UserType, Quotation, Receipt, Payment } from "@/lib/data-store"

export default function AdminPage() {
  const { hasPermission, tenant } = useUser()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuotations: 0,
    totalReceipts: 0,
    totalRevenue: 0,
  })
  const [revenueData, setRevenueData] = useState<any[]>([])

  useEffect(() => {
    const loadTenantData = async () => {
      const users = await dataStore.getAll<UserType>("users")
      const quotations = await dataStore.getAll<Quotation>("quotations")
      const receipts = await dataStore.getAll<Receipt>("receipts")
      const payments = await dataStore.getAll<Payment>("payments")

      const totalRevenue = receipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0)

      setStats({
        totalUsers: users.length,
        totalQuotations: quotations.length,
        totalReceipts: receipts.length,
        totalRevenue,
      })

      // Generate revenue data for last 6 months
      const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const revenueByMonth = months.map((month, index) => ({
        month,
        revenue: Math.round(totalRevenue * (0.5 + index * 0.1)),
      }))
      setRevenueData(revenueByMonth)
    }

    loadTenantData()
  }, [tenant])

  if (!hasPermission("manage_roles")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Organization management and overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">From all receipts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <p className="text-xs text-gray-600 mt-1">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Quotations</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalQuotations}</div>
            <p className="text-xs text-gray-600 mt-1">Total quotations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Receipts</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalReceipts}</div>
            <p className="text-xs text-gray-600 mt-1">Total receipts</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: { label: "Revenue", color: "#10b981" },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <a href="/dashboard/users">Manage Users</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <a href="/dashboard/reports">View Reports</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <a href="/dashboard/settings">Configure Settings</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
