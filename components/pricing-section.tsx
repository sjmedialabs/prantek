"use client"

import { useTrialPeriod } from "@/lib/hooks/useTrialPeriod"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import type { SubscriptionPlan } from "@/lib/models/types"

export function PricingSection() {
  const { trialDays } = useTrialPeriod()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<any | null>(null)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [yearlyDiscount, setYearlyDiscount] = useState(17)
    
      useEffect(() => {
        const loadData = async () => {
          try {
            const [websiteContent, allPlans, settingsRes] = await Promise.all([
              api.websiteContent.getAll().then((data) => data[0] || {}),
              api.subscriptionPlans.getAll().then((plans) => plans.filter((p: any) => p.isActive)),
              fetch("/api/system-settings").then((res) => res.json()).catch(() => ({ success: false })),
            ])

            setContent(websiteContent)
            setPlans(allPlans)

            if (settingsRes.success && settingsRes.data?.yearlyDiscountPercentage) {
              setYearlyDiscount(settingsRes.data.yearlyDiscountPercentage)
            }
          } catch (error) {
            console.error("Failed to load pricing data", error)
          } finally {
            setLoading(false)
          }
        }
        loadData()
      }, [])

  if (loading) {
    return (
      <section className="py-20 bg-gray-50" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading pricing...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gray-50" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">
            {content?.pricingTitle || "Choose the Perfect Plan to Suit Your Needs"}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            {content?.pricingSubtitle || `Start with our Standard plan and upgrade as your business grows. All plans include core features with {trialDays}-day free trial.`}
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl p-1 w-fit mx-auto mb-10">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all relative ${
              billingCycle === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              Save {yearlyDiscount}%
            </span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, index) => {
            const isPopular = plan.name === "Premium"
            const isEnterprise = plan.name === "Enterprise"
            const monthlyPrice = plan.price
            const yearlyPrice = monthlyPrice * 12
            const discountAmount = Math.round(yearlyPrice * (yearlyDiscount / 100))
            const discountedYearlyPrice = yearlyPrice - discountAmount

            return (
              <Card
                key={plan.id || `plan-${index}`}
                className={`relative overflow-hidden group hover:shadow-2xl transition-all duration-500 ${
                  isPopular 
                    ? "border-2 border-primary bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-xl scale-105" 
                    : "border border-gray-200 bg-white hover:border-primary/30"
                }`}
              >
                {/* Corner Trial Badge */}
                {!isEnterprise && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-semibold px-4 py-1.5 rounded-bl-lg shadow-lg">
                      14-Day Free Trial
                    </div>
                  </div>
                )}

                {/* Popular Ribbon */}
                {isPopular && (
                  <div className="absolute top-4 -left-1">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-6 py-1 shadow-lg">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-8 space-y-4">
                  {/* Plan Name - Highlighted */}
                  <div className="space-y-2">
                    <CardTitle className={`text-3xl font-extrabold tracking-tight ${
                      isPopular ? "text-primary" : "text-gray-900"
                    }`}>
                      {plan.name}
                    </CardTitle>
                  </div>

                  {/* Price - Prominently Displayed */}
                  <div className="py-4 min-h-[140px] flex flex-col justify-center">
                    {isEnterprise ? (
                      <>
                        <div className="flex items-start justify-center gap-1">
                          <span className="text-2xl font-bold text-gray-900 mt-2">₹</span>
                          <span className="text-6xl font-extrabold bg-gradient-to-br bg-clip-text text-transparent from-gray-900 to-gray-700">
                            Custom
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mt-2">Tailored pricing</p>
                      </>
                    ) : (
                      <>
                        {billingCycle === "yearly" && (
                          <span className="text-sm line-through text-gray-400 mb-1">
                            ₹{yearlyPrice.toLocaleString()}
                          </span>
                        )}
                        <div className="flex items-start justify-center gap-1">
                          <span className="text-2xl font-bold text-gray-900 mt-2">₹</span>
                          <span
                            className={`text-6xl font-extrabold bg-gradient-to-br bg-clip-text text-transparent ${
                              isPopular ? "from-blue-600 to-indigo-600" : "from-gray-900 to-gray-700"
                            }`}
                          >
                            {billingCycle === "yearly"
                              ? discountedYearlyPrice.toLocaleString()
                              : monthlyPrice.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mt-2">
                          per {billingCycle === "yearly" ? "year" : "month"}
                        </p>
                      </>
                    )}
                  </div>
                </CardHeader>

                <div className="space-y-6 px-6 pb-8 h-full flex flex-col justify-between gap-4">
                
                  <div>
                  {/* Divider */}
                  <div className="border-t border-gray-200 mb-2" />

                  {/* Features List */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className={`rounded-full p-1 mt-0.5 ${
                          isPopular ? "bg-primary/10" : "bg-gray-100"
                        }`}>
                          <Check className={`h-3.5 w-3.5 ${
                            isPopular ? "text-primary" : "text-emerald-600"
                          }`} />
                        </div>
                        <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  </div>
                  {/* CTA Button */}
                  <div className="pt-4">
                    {isEnterprise ? (
                      <Button
                        className="w-full h-12 bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => {
                          const contactSection = document.getElementById("contact")
                          if (contactSection) {
                            contactSection.scrollIntoView({ behavior: "smooth" })
                          } else {
                            window.location.href = "mailto:sales@prantek.com?subject=Enterprise Plan Inquiry"
                          }
                        }}
                      >
                        Contact Sales
                      </Button>
                    ) : (
                      <Link href="/signin">
                        <Button
                          className={`w-full h-12 font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 ${
                            isPopular
                              ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500 text-white"
                              : "bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                          }`}
                        >
                          Get Started Now
                        </Button>
                      </Link>
                    )}
                  </div>
              
                </div>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            {content?.pricingFooterText || `All plans include {trialDays}-day free trial • Cancel anytime`}
          </p>
        </div>
      </div>
    </section>
  )
}
