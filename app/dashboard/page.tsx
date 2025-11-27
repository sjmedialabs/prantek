"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingProgressCards } from "@/components/onboarding/onboarding-progress-cards";
import { useOnboarding } from "@/components/onboarding/onboarding-context";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Users,
  Package,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  AlertCircle,
  Plus,
  Receipt,
  CreditCard,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency-utils";
import DateFilter, {
  type DateFilterType,
  type DateRange,
} from "@/components/dashboard/date-filter";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useUser();
  const { getCompletionPercentage, isOnboardingComplete, progress, updateProgress } = useOnboarding();

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
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterType>("monthly");
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    return { from: startOfMonth, to: endOfMonth };
  });

  useEffect(() => {
    // console.log('[DASHBOARD] User data:', user)
    // console.log('[DASHBOARD] subscriptionPlanId:', user?.subscriptionPlanId)
    if (user) {
      loadDashboardData();
      validateOnboardingProgress();
    }
  }, [user, dateRange]);

  // Validate onboarding progress against real data
  const validateOnboardingProgress = async () => {
    try {
      const [company, clients, categories, taxRates, paymentMethods, items] = await Promise.all([
        api.company.get().catch(() => null),
        api.clients.getAll().catch(() => []),
        api.paymentCategories.getAll().catch(() => []),
        api.taxRates.getAll().catch(() => []),
        api.paymentMethods.getAll().catch(() => []),
        api.items.getAll().catch(() => []),
      ]);

      // Update progress based on real data
      updateProgress("companyInfo", !!company?.companyName);
      // updateProgress("clients", (clients?.length || 0) > 0);
      updateProgress("basicSettings", 
        (categories?.length || 0) > 0 || (taxRates?.length || 0) > 0 || (paymentMethods?.length || 0) > 0
      );
      updateProgress("products", (items?.length || 0) > 0);
    } catch (err) {
      console.error("Failed to validate onboarding progress:", err);
    }
  };

  /** ✅ Rewritten — fetches real DB data using API */
  const loadDashboardData = async () => {
    // console.log('[DASHBOARD] Loading data with date range:', { from: dateRange.from, to: dateRange.to })
    try {
      const [quotations, receipts, payments, employees, assets, plans] =
        await Promise.all([
          api.quotations.getAll(),
          api.receipts.getAll(),
          api.payments.getAll(),
          api.employees.getAll(),
          api.assets.getAll(user?.id),
          api.subscriptionPlans.getAll(),
        ]);

      // Fetch current plan details
      if (user?.subscriptionPlanId) {
        try {
          const plan = await api.subscriptionPlans.getById(
            user.subscriptionPlanId
          );
          setCurrentPlan(plan);
        } catch (err) {
          console.error("Failed to fetch plan:", err);
        }
      }

      // ✅ cash in hand
      const totalReceipts = (receipts || []).reduce(
        (sum: number, r: any) => sum + (r.amountPaid || 0),
        0
      );
      const totalPayments = (
        Array.isArray(payments) ? payments : payments?.data || []
      ).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const cashInHand = totalReceipts - totalPayments;
      // ✅ receivables = pending quotations (filtered by date range)
      const pendingQuotations = (quotations || []).filter((q: any) => {
        const qDate = new Date(q.date);
        return (
          (q.status === "pending" || q.status === "sent") &&
          qDate >= dateRange.from &&
          qDate <= dateRange.to
        );
      });
      const receivables = pendingQuotations.reduce(
        (sum: number, q: any) => sum + (q.grandTotal || 0),
        0
      );
      // ✅ payables (filtered by date range)
      const recentPayments = (
        Array.isArray(payments) ? payments : payments?.data || []
      ).filter((p: any) => {
        const d = new Date(p.date);
        return d >= dateRange.from && d <= dateRange.to;
      });
      const payables = recentPayments.reduce(
        (sum: number, p: any) => sum + (p.amount || 0),
        0
      );
      // ✅ revenue for selected date range
      const filteredReceipts = (receipts || []).filter((r: any) => {
        const date = new Date(r.date);
        return date >= dateRange.from && date <= dateRange.to;
      });
      console.log("[DASHBOARD] Filtered data counts:", {
        receipts: filteredReceipts.length,
        payments: recentPayments.length,
        quotations: pendingQuotations.length,
      });
      const monthlyRevenue = filteredReceipts.reduce(
        (sum: number, r: any) => sum + (r.amountPaid || 0),
        0
      );
      console.log("[DASHBOARD] Period revenue:", monthlyRevenue);

      // ✅ Calculate last month revenue
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const lastMonthReceipts = (receipts || []).filter((r: any) => {
        const date = new Date(r.date);
        return (
          date.getMonth() === lastMonth.getMonth() &&
          date.getFullYear() === lastMonth.getFullYear()
        );
      });

      const lastMonthRevenue = lastMonthReceipts.reduce(
        (sum: number, r: any) => sum + (r.amountPaid || 0),
        0
      );

      // ✅ Growth Rate (MoM %)
      let growthRate = 0;
      if (lastMonthRevenue > 0) {
        growthRate =
          ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      }

      setStats({
        cashInHand,
        receivables,
        payables,
        activeUsers: employees.length,
        monthlyRevenue,
        assetsManaged: assets.length,
        growthRate: Number(growthRate.toFixed(2)),
        quotations: quotations.length,
        pendingQuotations: pendingQuotations.length,
        pendingInvoices: pendingQuotations.length,
        billsDue: recentPayments.length,
      });

      // ✅ Recent Transactions (filtered by date range)
      const allTransactions = [
        ...filteredReceipts.map((r: any) => ({
          type: "Income",
          amount: r.amountPaid || 0,
          description: `Receipt #${r.receiptNumber} - ${r.clientName}`,
          time: new Date(r.date).toLocaleDateString(),
          date: new Date(r.date),
        })),
        ...recentPayments.map((p: any) => ({
          type: "Expense",
          category: "Salary",
          amount: p.amount || 0,
          description: `${p.description || p.category}`,
          time: new Date(p.date).toLocaleDateString(),
          date: new Date(p.date),
        })),
      ]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 3);

      console.log("All transactions:", allTransactions);
      setRecentTransactions(allTransactions);
      console.log("Recent transactions:", recentTransactions);
      // ✅ Update UI stats
      console.log("Actiive users lenght", stats.activeUsers);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setLoading(false);
    }
  };

  const handleDateFilterChange = (type: DateFilterType, range: DateRange) => {
    console.log("[DASHBOARD] Date filter changed:", {
      type,
      from: range.from,
      to: range.to,
    });
    setDateFilter(type);
    setDateRange(range);
  };
  const statCards = [
    {
      title: "Cash in Hand",
      value: formatCurrency(stats.cashInHand),
      change: `${stats.cashInHand >= 0 ? "+" : ""}${(
        (stats.cashInHand / 1000) *
        10
      ).toFixed(1)}% from last month`, // TEMP placeholder
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
  ];

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
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  // Debug logging for trial data
  console.log("[DASHBOARD] User trial data:", {
    subscriptionStatus: user?.subscriptionStatus,
    trialEndsAt: user?.trialEndsAt,
    rawTrialEndsAt: user?.trialEndsAt,
    typeOfTrialEndsAt: typeof user?.trialEndsAt,
  });

  return (
    <div className="space-y-3">
      {/* Trial Expiry Alert */}
      {user?.subscriptionStatus === "trial" && user?.trialEndsAt ? (
        <div className="relative">
          <Card className="border-amber-100 pr-28">
            {/* added right padding so content doesn't overlap with button */}
            <CardContent>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">
                    Trial Period Expiring Soon
                  </h3>
                  <p className="text-sm text-amber-800">
                    Your trial expires on{" "}
                    <strong>
                      {new Date(user.trialEndsAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </strong>{" "}
                    (
                    {Math.ceil(
                      (new Date(user.trialEndsAt).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days remaining).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Middle Floating Button */}
          <Link
            href="/dashboard/plans"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-md text-sm font-medium shadow-md transition"
          >
            Upgrade Now
          </Link>
        </div>
      ) : null}

      {/* Welcome Section */}
      <div className="relative rounded-lg overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
        </div>

        {/* Content */}
        <div className="relative p-6 text-gray-900">
          <div className="flex items-start justify-between gap-6">
            {/* Left Side - Welcome Text */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-700 mb-4">Here's what's happening today.</p>
              <div className="flex items-center space-x-4">
                <Badge
                  variant="secondary"
                  className="bg-gray-900/10 text-gray-900 font-medium capitalize"
                >
                  {user?.role.replace("-", " ")}
                </Badge>
                {/* Only show subscription badge for account owners */}
                {!user?.isAdminUser && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-900 font-medium"
                  >
                    {currentPlan
                      ? `${currentPlan.name}${
                          user?.subscriptionStatus === "trial" ? " (Trial)" : ""
                        }`
                      : user?.subscriptionStatus === "trial"
                      ? "Trial Plan"
                      : "No Active Plan"}
                  </Badge>
                )}
              </div>
            </div>

            {/* Right Side - Setup Progress (Compact) */}
            {!user?.isAdminUser && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200 min-w-[280px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Setup Progress</h3>
                <span className="text-2xl font-bold text-amber-600">{getCompletionPercentage()}%</span>
              </div>
              <Progress value={getCompletionPercentage()} className="h-2 mb-2" />
              <p className="text-xs text-gray-600">
                {Object.values(progress).filter((v) => v).length} of 3 steps completed
              </p>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Progress Cards - Below Welcome - Only for account owners */}
      {/* {!user?.isAdminUser && <OnboardingProgressCards />} */}

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/quotations/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Create Quotation
                </CardTitle>
                <FileText className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    Generate new quotation for clients
                  </p>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/receipts/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Create Receipt
                </CardTitle>
                <Receipt className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    Record incoming payments
                  </p>
                  <div className="bg-green-100 p-2 rounded-full">
                    <Plus className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/payments/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-red-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Create Payment
                </CardTitle>
                <CreditCard className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    Record outgoing payments
                  </p>
                  <div className="bg-red-100 p-2 rounded-full">
                    <Plus className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Financial Overview
        </h2>
        <DateFilter
          onFilterChange={handleDateFilterChange}
          selectedFilter={dateFilter}
        />
      </div>

      {/* Primary Financial Metrics */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Secondary Business Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Business Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financialOverview.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Transactions</CardTitle>
            <CardDescription className="text-gray-600">
              Latest financial activities in your account
            </CardDescription>
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
                      <p className="font-medium text-sm text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.time}
                      </p>
                    </div>
                    <div
                      className={`font-semibold ${
                        transaction.type === "Income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "Income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent transactions
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Business Health</CardTitle>
            <CardDescription className="text-gray-600">
              Key business indicators and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Cash Flow Status</span>
                <Badge
                  variant="secondary"
                  className={
                    stats.cashInHand > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {stats.cashInHand > 0 ? "Positive" : "Negative"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Overdue Invoices</span>
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800"
                >
                  {stats.pendingInvoices} pending
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Monthly Target</span>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  78% achieved
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Active Quotations</span>
                <Badge variant="secondary">
                  {stats.pendingQuotations} awaiting response
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
