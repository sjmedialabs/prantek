"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  TrendingUp,
  Building2,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"

export default function SuperAdminDashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeClients: 0,
    subscriptions: 0,
    systemHealth: "99.9%",
  })
  const [loading, setLoading] = useState(true)
   const [users,setUsers]=useState<any>([]);
   const [plans, setPlans] = useState<any[]>([])
    const [yearlyDiscount, setYearlyDiscount] = useState(17);
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Fetch all users and filter for admins
      const allUsers = await api.users.getAll()
      setUsers(allUsers);
      const subscriberUsers = allUsers.filter((u: any) => u.userType === "subscriber" && u.role !== "super-admin")
      const activeClients = allUsers.filter((u: any) => u.userType === "subscriber" && u.role !== "super-admin").length
           let currentDiscount = 17; 
      try {
      const settingsResponse = await fetch('/api/system-settings');
      const settingsData = await settingsResponse.json();
      if (settingsData.success && settingsData.data.yearlyDiscountPercentage) {
        currentDiscount = settingsData.data.yearlyDiscountPercentage;
        setYearlyDiscount(currentDiscount);
      }
    } catch (error) {
      console.error("Failed to load system settings:", error);
    }
      // Fetch subscription plans to calculate revenue and subscriptions
      const loadedplans = await api.subscriptionPlans.getAll()
      setPlans(loadedplans)

      const subscribersWithPlan = subscriberUsers.filter(
        (u: any) => u.subscriptionPlanId && u.subscriptionPlanId !== ""
      ).length

      setStats({
        totalRevenue: 0,
        activeClients,
        subscriptions: subscribersWithPlan,
        systemHealth: "99.9%",
      })
      setLoading(false)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      setLoading(false)
    }
  }
  // const calculateTotalRevenue = () => {
  //     if (!plans.length || !users.length) return 0;

  //     // Only count revenue from subscribers, not admin users
  //     const subscriberUsers = users.filter((user: any) => user.userType === "subscriber" && user.role !== "super-admin");

  //     let total = 0;

  //     subscriberUsers.forEach((user: any) => {
  //       const userPlan = plans.find((plan: any) => plan._id === user.subscriptionPlanId);
  //       if (userPlan && userPlan.price) {
  //         total += Number(userPlan.price);
  //       }
  //     });

  // return total;
  // };

    const calculateTotalRevenue = () => {
  if (!plans.length || !users.length) return 0;

  // Only count revenue from subscribers, not admin users
  const subscriberUsers = users.filter((user: any) => user.userType === "subscriber" && user.role !== "super-admin");

  let total = 0;

  subscriberUsers.forEach((user: any) => {
    const userPlan = plans.find((plan: any) => (plan._id || plan.id) === user.subscriptionPlanId);
    if (userPlan && userPlan.price) {
      if (user.billingCycle === 'yearly') {
          const yearlyPrice = Number(userPlan.price) * 12;
          const discountAmount = Math.round(yearlyPrice * (yearlyDiscount / 100));
          total += (yearlyPrice - discountAmount);
      } else {
          total += Number(userPlan.price);
      }
    }
  });

  return total;
};

  const totalRevenueGenerated=calculateTotalRevenue();
   const totalSubscribers = users.filter((user: any) => user.userType === "subscriber" && user.role !== "super-admin" && user.subscriptionPlanId).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
        <p className="text-slate-600 mt-1">Here's what's happening with your platform today.</p>
        <Badge variant="outline" className="mt-2">
          <Shield className="h-3 w-3 mr-1" />
          Platform Administrator
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/super-admin/sales">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">₹{totalRevenueGenerated.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Across all subscriptions</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/super-admin/clients">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Clients</CardTitle>
              <Building2 className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.activeClients}</div>
              <p className="text-xs text-slate-500 mt-1">Subscriber accounts</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/super-admin/subscriptions">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Subscriptions</CardTitle>
              <CreditCard className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalSubscribers}</div>
              <p className="text-xs text-slate-500 mt-1">Subscribers with a plan</p>
            </CardContent>
          </Card>
        </Link>

        {/* <Link href="/super-admin/dashboard">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">System Health</CardTitle>
              <Activity className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.systemHealth}</div>
              <p className="text-xs text-slate-500 mt-1">Uptime</p>
            </CardContent>
          </Card>
        </Link> */}
      </div>
    </div>
  )
}
