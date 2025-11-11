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

export default function PlansPage() {
  const router = useRouter()
  const { user } = useUser()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const activePlans = await api.subscriptionPlans.getAll().then(plans => plans.filter(p => p.isActive))
        setPlans(activePlans)

        // Only fetch current plan if user has a subscription
        console.log("[PLANS] User subscriptionPlanId:", user?.subscriptionPlanId)
        if (user?.subscriptionPlanId) {
          try {
            const plan = await api.subscriptionPlans.getById(user.subscriptionPlanId)
            console.log("[PLANS] Fetched plan from API:", plan)
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
    return (currentPlan?.id || currentPlan?._id?.toString()) === (plan.id || plan._id?.toString())
    const result = (currentPlan?.id || currentPlan?._id?.toString()) === (plan.id || plan._id?.toString())
    console.log("[PLANS] Comparing:", plan.name, "with current:", currentPlan?.name, "=>", result)
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
          <Link href="/dashboard/profile">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
          </Link>
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
                    <CardDescription>You are currently subscribed to {currentPlan.name}</CardDescription>
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">₹{currentPlan.price.toLocaleString()}</span>
                <span className="text-gray-600">/{currentPlan.billingCycle}</span>
              </div>
              {user?.subscriptionEndDate && (
                <p className="text-sm text-gray-600 mt-2">
                  Renews on {new Date(user.subscriptionEndDate).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan)
            const isUpgrade = isPlanUpgrade(plan)
            const isDowngrade = isPlanDowngrade(plan)

            return (
              <Card
                key={plan.id || plan._id?.toString()}
                className={`relative hover:shadow-xl transition-shadow ${isCurrent ? "border-2 border-blue-500" : ""}`}
              >
                {plan.name === "Premium" && !isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">Most Popular</Badge>
                )}
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600">Current Plan</Badge>
                )}
                {isUpgrade && !isCurrent && (
                  <Badge className="absolute -top-3 right-4 bg-purple-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Upgrade
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                    <span className="text-gray-600">/{plan.billingCycle}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button disabled className="w-full bg-gray-400 text-white" size="lg">
                      Current Plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      onClick={() => handleSelectPlan(plan.id || plan._id?.toString())}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      size="lg"
                    >
                      Downgrade to {plan.name}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(plan.id || plan._id?.toString())}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      {isUpgrade ? `Upgrade to ${plan.name}` : `Select ${plan.name}`}
                    </Button>
                  )}
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
