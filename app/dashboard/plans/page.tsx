"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Check, ArrowLeft, Crown, TrendingUp, Wallet, Zap, Info } from "lucide-react"
import { api } from "@/lib/api-client"
import { useUser } from "@/components/auth/user-context"
import Link from "next/link"
import { SubscriptionPlan } from "@/lib/models/types"


declare global {
  interface Window {
    Razorpay: any
  }
}

  // Convert planFeatures to displayable feature list — merges BOTH sources
  // const getPlanFeatures = (plan: SubscriptionPlan): string[] => {
  //   const features: string[] = []

  //   // 1. Derive labels from planFeatures boolean flags (if any)
  //   const pf = plan.planFeatures
  //   if (pf) {
  //     if (pf.cashBook) features.push('Cash Book Management')
  //     if (pf.clients) features.push('Client Management')
  //     if (pf.vendors) features.push('Vendor Management')
  //     if (pf.quotations) features.push('Quotation Management')
  //     if (pf.salesInvoice) features.push('Sales Invoice')
  //     if (pf.receipts) features.push('Receipt Management')
  //     if (pf.purchaseInvoice) features.push('Purchase Invoice')
  //     if (pf.payments) features.push('Payment Management')
  //     if (pf.reconciliation) features.push('Reconciliation')
  //     if (pf.assets) features.push('Asset Management')
  //     if (pf.reports) features.push('Reports & Analytics')
  //     if (pf.settings) features.push('Settings & Configuration')
  //     if (pf.hrSettings) features.push('HR Settings')
  //     if (pf.print) features.push('Print')
  //     if (pf.pdf) features.push('PDF Export')
  //     if (pf.csv) features.push('CSV Export')
  //     if (pf.email) features.push('Email')
  //     if (pf.backup) features.push('Backup')
  //     // Communication suite features
  //     if ((pf as any).clientGrouping) features.push('Client Grouping & Segmentation')
  //     if ((pf as any).bulkEmail) features.push('Bulk Email Campaigns')
  //     if ((pf as any).scheduledMessaging) features.push('Scheduled Messaging')
  //     if ((pf as any).messageTemplates) features.push('Message Templates')
  //     if ((pf as any).deliveryTracking) features.push('Delivery Tracking')
  //     if ((pf as any).communicationMetrics) features.push('Communication Metrics')
  //   }

  //   // 2. Merge legacy features[] strings that aren't already covered
  //   if (plan.features?.length) {
  //     const lowerSet = new Set(features.map(f => f.toLowerCase()))
  //     for (const f of plan.features) {
  //       if (f && !lowerSet.has(f.toLowerCase())) {
  //         features.push(f)
  //       }
  //     }
  //   }

  //   // 3. Add usage limits
  //   if (plan.maxUsers) features.push(`Up to ${plan.maxUsers} Users`)
  //   if (plan.maxClients) features.push(`Up to ${plan.maxClients} Clients`)
  //   if (plan.maxReceipts) features.push(`Up to ${plan.maxReceipts} Receipts`)
  //   if (plan.maxStorage) features.push(`${plan.maxStorage} Storage`)

  //   return features
  // }

  const getPlanFeatures = (plan: SubscriptionPlan): string[] => {
  return plan.features || []
}

export default function PlansPage() {
  const router = useRouter()
const [currentUser, setCurrentUser] = useState<any>(null);
const { user } = useUser();

// useEffect(() => {
//   if (user) {
   
//   }
// }, [user]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [reachProPlan, setReachProPlan] = useState<SubscriptionPlan | null>(null)
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [yearlyDiscount, setYearlyDiscount] = useState(17);
  const [reachProAmount, setReachProAmount] = useState(0)
  const [reachProMeta, setReachProMeta] = useState<any>(null)
  const [reachProTransactions, setReachProTransactions] = useState<any[]>([])

  const loginedUserLocalStorageString = localStorage.getItem("loginedUser");
 
  const loginedUserLocalStorage = loginedUserLocalStorageString
    ? JSON.parse(loginedUserLocalStorageString)
    : null;
  useEffect(() => {
    const loadData = async () => {
      try {
        const plans = await api.subscriptionPlans.getAll()
        const activeUser = await api.users.getById(loginedUserLocalStorage.id);
        setCurrentUser(activeUser);
        const activePlans = plans.filter((p: any) => p.isActive)

        // Separate ReachPro plan from regular plans
        const rpPlan = activePlans.find((p: any) =>
          String(p.name || "").toLowerCase() === "reachpro" || p.isPayAsYouGo
        ) || null
        setReachProPlan(rpPlan)
        const regularPlans = activePlans.filter((p: any) =>
          String(p.name || "").toLowerCase() !== "reachpro" && !p.isPayAsYouGo
        )
        setPlans(regularPlans)

        // Always fetch ReachPro wallet meta (needed for topup section regardless of current plan)
        const txRes = await fetch("/api/reachpro/transactions", { credentials: "include" })
        const txData = await txRes.json()
        if (txData?.success) {
          setReachProMeta(txData)
          setReachProTransactions(txData.data || [])
          setReachProAmount(Number(txData.pricing?.minTopupAmount || 0))
        }

        const currentPlan = plans.find((eachItem: any) =>
          eachItem._id.toString() === loginedUserLocalStorage.subscriptionPlanId
        )
        setCurrentPlan(currentPlan)
        // // Set user's billing cycle for the toggle if it exists
        // if (user?.billingCycle) {
        //   setBillingCycle(user.billingCycle as "monthly" | "yearly");
        // }

        // Determine and set the current plan
        console.log("[PLANS] User subscriptionPlanId:", user?.subscriptionPlanId)
        if (user?.subscriptionPlanId) {
          try {
            // First, try to find the plan in the list of active plans
            let plan = activePlans.find(p => (p.id || p._id?.toString()) === user.subscriptionPlanId);
            
            // If not found (e.g., user is on an inactive plan), fetch it directly
            if (!plan) {
              console.log("[PLANS] Current plan not in active list, fetching by ID:", user.subscriptionPlanId);
              plan = await api.subscriptionPlans.getById(user.subscriptionPlanId);
            }

            if (plan && plan.price !== undefined) {
              setCurrentPlan(plan);
              console.log("[PLANS] Current plan set:", plan.name);
            } else {
              console.error("[PLANS] Invalid plan data for ID:", user.subscriptionPlanId, plan);
              // Fallback to free plan if current plan is invalid
              const freePlan = activePlans.find(p => p.price === 0);
              setCurrentPlan(freePlan || null);
            }
          } catch (err) {
            console.error("[PLANS] Error fetching current plan:", err);
            const freePlan = activePlans.find(p => p.price === 0);
            setCurrentPlan(freePlan || null);
          }
        } else {
          // User has no subscription - find and set the free plan as current
          const freePlan = activePlans.find(p => p.price === 0);
          setCurrentPlan(freePlan || null);
          console.log("[PLANS] No subscription, using free plan.");
        }

        // Fetch system settings for discount
        const settingsResponse = await fetch('/api/system-settings');
        const settingsData = await settingsResponse.json();
        if (settingsData.success && settingsData.data.yearlyDiscountPercentage) {
          setYearlyDiscount(settingsData.data.yearlyDiscountPercentage);
        }

      } catch (error) {
        console.error("Failed to load plans:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])


  const handleSelectPlan = (planId: string) => {
    // Store selected plan and redirect to payment
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_plan_id", planId)
      localStorage.setItem("selected_billing_cycle", billingCycle)
      router.push("/dashboard/checkout")
    }
  }

  const isPlanUpgrade = (plan: SubscriptionPlan): boolean => {
    if (!currentPlan) return true
    return plan.price > currentPlan.price
  }

  const isPlanDowngrade = (plan: SubscriptionPlan): boolean => {
    if (!currentPlan) return false
    return plan.price < currentPlan.price
  }

  const isCurrentPlan = (plan: SubscriptionPlan): boolean => {
    if (!currentPlan) return false

    const currentPlanId = (currentPlan.id || currentPlan._id?.toString() || "").toLowerCase()
    const planId = (plan.id || plan._id?.toString() || "").toLowerCase()

    const result = currentPlanId === planId && currentPlanId !== ""
    console.log("[PLANS] Comparing:", plan.name, "(" + planId + ")", "with current:", currentPlan.name, "(" + currentPlanId + ")", "=>", result)
    return result
  }
  const isReachProCurrentPlan = Boolean(
    currentPlan && (String(currentPlan.name || "").toLowerCase() === "reachpro" || (currentPlan as any).isPayAsYouGo)
  )
  // Pricing config — read directly from the plan DB record (primary), fallback to wallet API
  const taxIncluded = Boolean(reachProPlan?.taxIncluded ?? reachProMeta?.pricing?.taxIncluded)
  const minTopup = Number(reachProPlan?.minTopupAmount ?? reachProMeta?.pricing?.minTopupAmount ?? 0)
  const costPerEmail = Number(reachProPlan?.costPerEmailCampaign ?? reachProMeta?.pricing?.costPerEmailCampaign ?? 0)
  const costPerBulk = Number(reachProPlan?.costPerBulkMessageCampaign ?? reachProMeta?.pricing?.costPerBulkMessageCampaign ?? 0)
  const pricingRanges = Array.isArray(reachProMeta?.pricing?.reachProPricingRanges) ? reachProMeta.pricing.reachProPricingRanges : []
  const taxAmount = taxIncluded ? Math.round(reachProAmount * 0.18) : 0
  const totalPayable = reachProAmount + taxAmount
  const walletBalance = Number(reachProMeta?.walletBalance || currentUser?.walletBalance || 0)
  const remainingMailCredits = Number(reachProMeta?.remainingMailCredits || 0)
  const currentCostPerMail = Number(reachProMeta?.currentCostPerMail || 0)
  const selectedRange = pricingRanges.find((r: any) => reachProAmount >= Number(r.minAmount || 0) && reachProAmount <= Number(r.maxAmount || 0))
  const selectedRate = Number(selectedRange?.costPerMail || currentCostPerMail || 0)
  const estimatedCredits = selectedRate > 0 ? Math.floor(reachProAmount / selectedRate) : 0
  const handleReachProRecharge = () => {
    if (!reachProAmount || reachProAmount < minTopup) return
    const planId = reachProPlan?.id || reachProPlan?._id?.toString() || ""
    localStorage.setItem("selected_plan_id", planId)
    localStorage.setItem("reachpro_topup_amount", String(reachProAmount))
    localStorage.setItem("reachpro_topup_tax", String(taxAmount))
    localStorage.setItem("reachpro_topup_total", String(totalPayable))
    localStorage.setItem("reachpro_topup_tax_included", String(taxIncluded))
    router.push("/dashboard/checkout")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/dashboard/profile')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isReachProCurrentPlan ? "ReachPro Add-on" : currentPlan ? "Upgrade Your Plan" : "Choose Your Plan"}
          </h1>
          <p className="text-lg text-gray-600">
            {isReachProCurrentPlan
              ? "You have ReachPro active. Top-up your wallet below or select a base plan."
              : currentPlan
              ? "Select a plan to upgrade your subscription and unlock more features"
              : "Select the perfect plan for your business needs"}
          </p>
        </div>

        {currentPlan && !isReachProCurrentPlan && (
          <Card className="mb-8 border-2 border-blue-500 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-xl">Your Current Plan</CardTitle>
                    <CardDescription>
                      You are currently subscribed to {currentPlan.name} plan
                      {user?.subscriptionStatus === "trial" && " (Trial Period)"}
                      {user?.subscriptionStatus === "cancelled" && " (Cancelled – plan ended)"}
                      {user?.subscriptionStatus === "active" && " (Active)"}
                    </CardDescription>
                  </div>
                </div>
                {user?.subscriptionStatus === "trial" && (
                  <Badge className="bg-emerald-600 text-white">Trial</Badge>
                )}
                {user?.subscriptionStatus === "active" && (
                  <Badge className="bg-blue-600 text-white">Active</Badge>
                )}
                {user?.subscriptionStatus === "cancelled" && (
                  <Badge className="bg-red-600 text-white">Cancelled</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const userCycle = currentUser?.billingCycle || "monthly";
                const isYearly = userCycle === "yearly";
                const price = user?.subscriptionPrice ?? (isYearly ? currentPlan.price * 12 : currentPlan.price);
                const paid = user?.paidAmount ?? (isYearly ? Math.round(price * (1 - yearlyDiscount / 100)) : price);
                const discount = user?.discountPercentage ?? (isYearly ? yearlyDiscount : 0);
                return (
                  <div>
                    {isYearly ? (
                      <div>
                        <div className="mb-1">
                          <span className="text-sm line-through text-gray-400">₹{price.toLocaleString()}</span>
                          {discount > 0 && <span className="ml-2 text-xs text-green-600">({discount}% off)</span>}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-gray-900">₹{paid.toLocaleString()}</span>
                          <span className="text-gray-600">/yearly</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">₹{paid.toLocaleString()}</span>
                        <span className="text-gray-600">/monthly</span>
                      </div>
                    )}
                    {user?.subscriptionStatus === 'trial' && user?.trialEndsAt ? (
                      <p className="text-sm text-amber-700 mt-2 font-medium">
                        Trial expires on {new Date(user.trialEndsAt).toLocaleDateString()}
                      </p>
                    ) : user?.subscriptionEndDate ? (
                      <p className="text-sm text-gray-600 mt-2">
                        Renews on {new Date(user.subscriptionEndDate).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl p-1 w-fit mx-auto mb-8">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${billingCycle === "monthly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all relative ${billingCycle === "yearly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              Save {yearlyDiscount}%
            </span>
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan)
            const isUpgrade = isPlanUpgrade(plan)
            const isDowngrade = isPlanDowngrade(plan)
            const isSamePlanDifferentCycle = isCurrent && user?.billingCycle !== billingCycle;

            const monthlyPrice = plan.price;
            const yearlyPrice = monthlyPrice * 12;
            const discountAmount = Math.round(yearlyPrice * (yearlyDiscount / 100));
            const discountedYearlyPrice = yearlyPrice - discountAmount;

            console.log("[PLANS] Plan card:", plan.name, "- isCurrent:", isCurrent, "- isUpgrade:", isUpgrade, "- isDowngrade:", isDowngrade)

            return (
              <Card
                key={plan.id || plan._id?.toString()}
                className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 ${isCurrent ? "border-2 border-blue-500 shadow-lg" : "border-gray-200"}`}
              >
                <div className="flex gap-2 absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
                  {plan.name === "Premium" && !isCurrent && (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-xs px-3 py-1">Most Popular</Badge>
                  )}
                  {isCurrent && user?.subscriptionStatus === 'trial' && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-xs px-3 py-1">Trial Plan</Badge>
                  )}
                  {isCurrent && user?.subscriptionStatus !== 'trial' && (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-md text-xs px-3 py-1">Current Plan</Badge>
                  )}
                  {isUpgrade && !isCurrent && (
                    <Badge className="bg-purple-600 hover:bg-purple-700 text-white shadow-md text-xs px-3 py-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Upgrade
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-3 pt-6">
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  {billingCycle === 'yearly' ? (
                    <div className="mt-3">
                      <div className="mb-1">
                        <span className="text-sm line-through text-gray-400">
                          ₹{yearlyPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">₹{discountedYearlyPrice.toLocaleString()}</span>
                        <span className="text-gray-500 text-sm">/yearly</span>
                      </div>
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        ₹{Math.round(discountedYearlyPrice / 12)}/month equivalent
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-gray-900">₹{monthlyPrice.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm">/monthly</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <ul className="space-y-2">
                    {getPlanFeatures(plan).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-xs leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    {isCurrent && !isSamePlanDifferentCycle ? (
                      <Button disabled className="w-full bg-gray-400 text-white" size="default">
                        Current Plan
                      </Button>
                    ) : isDowngrade ? (
                      <Button
                        onClick={() => handleSelectPlan(plan.id || plan._id?.toString())}
                        variant="outline"
                        className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        size="default"
                      >
                        Downgrade to {plan.name}
                      </Button>
                    ) : isSamePlanDifferentCycle ? (
                      <Button
                        onClick={() => handleSelectPlan(plan.id || plan._id?.toString())}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
                        size="default"
                      >
                        Switch to {billingCycle}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSelectPlan(plan.id || plan._id?.toString())}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
                        size="default"
                      >
                        {isUpgrade ? `Upgrade to ${plan.name}` : `Select ${plan.name}`}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {currentPlan && (
          <div className="mt-12 bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Need help choosing?</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Upgrade anytime to access more features and higher limits</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Your current plan benefits continue until the end of your billing cycle</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Pro-rated billing applies when you upgrade mid-cycle</span>
              </li>
            </ul>
          </div>
        )}
        {/* ReachPro Add-on Section — always shown */}
        {reachProPlan && (
          <Card className="mt-10 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-purple-900">ReachPro — Communication Add-on</CardTitle>
                    <CardDescription className="text-purple-700 mt-0.5">
                      Pay-as-you-go wallet for email &amp; bulk messaging campaigns
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isReachProCurrentPlan && (
                    <Badge className="bg-purple-600 text-white">Active Add-on</Badge>
                  )}
                  {!isReachProCurrentPlan && (
                    <Badge variant="outline" className="border-purple-400 text-purple-700">Available Add-on</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
                  <Wallet className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Wallet Balance</p>
                  <p className="text-lg font-bold text-gray-900">₹{walletBalance.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
                  <p className="text-xs text-gray-500">Mail Credits</p>
                  <p className="text-lg font-bold text-gray-900">{remainingMailCredits.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
                  <p className="text-xs text-gray-500">Min Top-up</p>
                  <p className="text-lg font-bold text-gray-900">₹{minTopup.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
                  <p className="text-xs text-gray-500">Current Rate</p>
                  <p className="text-lg font-bold text-gray-900">₹{currentCostPerMail.toLocaleString()}/mail</p>
                </div>
              </div>
              {remainingMailCredits > 0 && remainingMailCredits < 200 && (
                <p className="text-xs text-amber-600 font-medium">Low ReachPro Balance: Only {remainingMailCredits} emails remaining</p>
              )}

              {/* Features list */}
              {getPlanFeatures(reachProPlan).length > 0 && (
                <ul className="grid sm:grid-cols-2 gap-1.5">
                  {getPlanFeatures(reachProPlan).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-purple-800">
                      <Check className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              {/* Recharge / top-up form */}
              <div className="bg-white rounded-xl border border-purple-100 p-4 space-y-3">
                <p className="font-semibold text-gray-800 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-purple-600" />
                  {isReachProCurrentPlan ? "Top-up Wallet" : "Buy ReachPro Top-up"}
                </p>
                {!isReachProCurrentPlan && (
                  <p className="text-xs text-gray-500 flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-indigo-400" />
                    ReachPro works as an add-on with or without a base plan. Your wallet balance is credited after payment.
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={minTopup}
                    value={reachProAmount || ""}
                    onChange={(e) => setReachProAmount(Number(e.target.value || 0))}
                    placeholder={`Enter amount (min ₹${minTopup})`}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleReachProRecharge}
                    disabled={!reachProAmount || reachProAmount < minTopup}
                    className="bg-purple-600 hover:bg-purple-700 text-white min-w-[110px]"
                  >
                    Pay &amp; Recharge
                  </Button>
                </div>
                {/* Tax breakdown */}
                {reachProAmount > 0 && (
                  <div className="text-xs text-gray-500 space-y-0.5 border-t pt-2">
                    {pricingRanges.length > 0 && (
                      <div className="rounded-md border p-2 mb-2 text-[11px] space-y-1">
                        {pricingRanges.map((r: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>₹{Number(r.minAmount || 0)} - ₹{Number(r.maxAmount || 0)}</span>
                            <span>₹{Number(r.costPerMail || 0)}/mail</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Base amount</span>
                      <span>₹{reachProAmount.toLocaleString()}</span>
                    </div>
                    {taxIncluded && (
                      <div className="flex justify-between text-amber-700">
                        <span>GST (18%)</span>
                        <span>+ ₹{taxAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-gray-800 border-t pt-1">
                      <span>Total payable</span>
                      <span>₹{totalPayable.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-indigo-700">
                      <span>Estimated mail credits</span>
                      <span>{estimatedCredits.toLocaleString()}</span>
                    </div>
                    {taxIncluded && (
                      <p className="text-[10px] text-gray-400">
                        Wallet will be credited ₹{reachProAmount.toLocaleString()} (excl. GST)
                      </p>
                    )}
                  </div>
                )}

                {reachProAmount > 0 && reachProAmount < minTopup && (
                  <p className="text-xs text-red-500">Minimum top-up amount is ₹{minTopup}</p>
                )}
              </div>

              {/* Recent transactions */}
              {reachProTransactions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent Transactions</p>
                  <div className="space-y-1.5">
                    {reachProTransactions.slice(0, 5).map((txn) => (
                      <div key={txn._id} className="flex justify-between items-center text-sm bg-white rounded-lg px-3 py-2 border border-purple-50">
                        <div>
                          <span className="capitalize text-gray-700">{String(txn.type).replace(/_/g, " ")}</span>
                          {txn.createdAt && (
                            <span className="ml-2 text-xs text-gray-400">
                              {new Date(txn.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <span className={`font-medium ${txn.type === "recharge" ? "text-green-600" : "text-red-500"}`}>
                          {txn.type === "recharge" ? "+" : "-"}₹{Number(txn.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
