"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"

export function PricingSection() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.subscriptionPlans.getAll().then(plans => plans.filter(p => p.isActive)).then((activePlans) => {
    setPlans(activePlans)
    })
    setLoading(false)
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
            Choose the Perfect Plan to Suit Your Needs
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            Start with our Standard plan and upgrade as your business grows. All plans include core features with 14-day
            free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isPopular = plan.name === "Premium"
            const isEnterprise = plan.name === "Enterprise"

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
                  <div className="py-4">
                    <div className="flex items-start justify-center gap-1">
                      <span className="text-2xl font-bold text-gray-900 mt-2">₹</span>
                      <span className={`text-6xl font-extrabold bg-gradient-to-br bg-clip-text text-transparent ${
                        isPopular 
                          ? "from-blue-600 to-indigo-600" 
                          : "from-gray-900 to-gray-700"
                      }`}>
                        {isEnterprise ? "Custom" : plan.price.toLocaleString()}
                      </span>
                    </div>
                    {!isEnterprise && (
                      <p className="text-sm text-gray-500 font-medium mt-2">per {plan.billingCycle}</p>
                    )}
                    {isEnterprise && (
                      <p className="text-sm text-gray-500 font-medium mt-2">Tailored pricing</p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 px-6 pb-8">
                  {/* Divider */}
                  <div className="border-t border-gray-200" />

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
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
