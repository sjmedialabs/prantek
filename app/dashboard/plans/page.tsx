"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowLeft, Crown, TrendingUp } from "lucide-react"
import { api } from "@/lib/api-client"
import { useUser } from "@/components/auth/user-context"
import Link from "next/link"
import { json } from "node:stream/consumers"
import { SubscriptionPlan } from "@/lib/models/types"


  // Convert planFeatures to displayable feature list
  const getPlanFeatures = (plan: SubscriptionPlan): string[] => {
    if (!plan.planFeatures) {
      // Fallback to legacy features array if planFeatures not available
      return plan.features || []
    }

    const features: string[] = []
    const pf = plan.planFeatures

    if (pf.cashBook) features.push('Cash Book Management')
    if (pf.clients) features.push('Client Management')
    if (pf.vendors) features.push('Vendor Management')
    if (pf.quotations) features.push('Quotation Management')
    if (pf.receipts) features.push('Receipt Management')
    if (pf.payments) features.push('Payment Management')
    if (pf.reconciliation) features.push('Reconciliation')
    if (pf.assets) features.push('Asset Management')
    if (pf.reports) features.push('Reports & Analytics')
    if (pf.settings) features.push('Settings & Configuration')
    if (pf.hrSettings) features.push('HR Settings')

    // Add usage limits
    if (plan.maxUsers) features.push(`Up to ${plan.maxUsers} Users`)
    if (plan.maxClients) features.push(`Up to ${plan.maxClients} Clients`)
    if (plan.maxReceipts) features.push(`Up to ${plan.maxReceipts} Receipts`)
    if (plan.maxStorage) features.push(`${plan.maxStorage} Storage`)

    return features
  }

export default function PlansPage() {
  const router = useRouter()
  const { user } = useUser()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const loginedUserLocalStorageString = localStorage.getItem("loginedUser");

  const loginedUserLocalStorage = loginedUserLocalStorageString
    ? JSON.parse(loginedUserLocalStorageString)
    : null;




  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await api.subscriptionPlans.getAll()

        const activePlans = plans.filter((p: any) => p.isActive)

        const currentPlan = plans.find((eachItem: any) =>
          eachItem._id.toString() === loginedUserLocalStorage.subscriptionPlanId
        )

        setPlans(activePlans)
        setCurrentPlan(currentPlan) // This is now the single plan object

        // Only fetch current plan if user has a subscription
        console.log("[PLANS] User subscriptionPlanId:", user?.subscriptionPlanId)
        if (user?.subscriptionPlanId) {
          try {
            const plan = await api.subscriptionPlans.getById(user.subscriptionPlanId)
            console.log("[PLANS] Fetched plan from API:", plan)
            console.log("[PLANS] Current plan details:", { id: plan?.id, _id: plan?._id, name: plan?.name, price: plan?.price })
            if (plan && plan.price !== undefined) {
              setCurrentPlan(plan)
            } else {
              console.error("[PLANS] Invalid plan data:", plan)
              const freePlan = activePlans.find(p => p.price === 0)
              setCurrentPlan(freePlan || null)
            }
          } catch (err) {
            console.error("[PLANS] Error fetching plan:", err)
            const freePlan = activePlans.find(p => p.price === 0)
            setCurrentPlan(freePlan || null)
          }
        } else {
          // User has no subscription - find and set the free plan as current
          console.log("[PLANS] No subscriptionPlanId, using free plan")
          const freePlan = activePlans.find(p => p.price === 0)
          if (freePlan) {
            console.log("[PLANS] Current plan set:", freePlan ? `${freePlan.name} (${freePlan._id || freePlan.id})` : "none")
            setCurrentPlan(freePlan)
          }
        }
      } catch (error) {
        console.error("Failed to load plans:", error)
      } finally {
        setLoading(false)
      }
    }
    loadPlans()
  }, [user])

  const handleSelectPlan = (planId: string) => {
    // Store selected plan and redirect to payment
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_plan_id", planId)
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
            {currentPlan ? "Upgrade Your Plan" : "Choose Your Plan"}
          </h1>
          <p className="text-lg text-gray-600">
            {currentPlan
              ? "Select a plan to upgrade your subscription and unlock more features"
              : "Select the perfect plan for your business needs"}
          </p>
        </div>

        {currentPlan && (
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
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">₹{currentPlan.price.toLocaleString()}</span>
                <span className="text-gray-600">/{currentPlan.billingCycle}</span>
              </div>
              {user?.subscriptionStatus === 'trial' && user?.trialEndsAt ? (
                <p className="text-sm text-amber-700 mt-2 font-medium">
                  Trial expires on {new Date(user.trialEndsAt).toLocaleDateString()}
                </p>
              ) : user?.subscriptionEndDate ? (
                <p className="text-sm text-gray-600 mt-2">
                  Renews on {new Date(user.subscriptionEndDate).toLocaleDateString()}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan)
            const isUpgrade = isPlanUpgrade(plan)
            const isDowngrade = isPlanDowngrade(plan)
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
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm">/{plan.billingCycle}</span>
                  </div>
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
                    {isCurrent ? (
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
      </div>
    </div>
  )
}
