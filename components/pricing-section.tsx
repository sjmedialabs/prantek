"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import Link from "next/link"
import { dataStore, type SubscriptionPlan } from "@/lib/data-store"

export function PricingSection() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const activePlans = dataStore.getActiveSubscriptionPlans()
    setPlans(activePlans)
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
                key={plan.id}
                className={`relative ${isPopular ? "border-primary shadow-lg scale-105" : "border-gray-200"}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {isEnterprise ? "Custom" : `₹${plan.price.toLocaleString()}`}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {isEnterprise ? "contact us" : `per ${plan.billingCycle}`}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isEnterprise ? (
                    <Button
                      className="w-full bg-white border border-primary text-primary hover:bg-primary/5"
                      size="lg"
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
                        className={`w-full ${
                          isPopular
                            ? "bg-primary hover:bg-primary/90 text-white"
                            : "bg-white border border-primary text-primary hover:bg-primary/5"
                        }`}
                        size="lg"
                      >
                        Start Free Trial
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include 14-day free trial • No credit card required • Cancel anytime
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>✓ 99.9% Uptime SLA</span>
            <span>✓ SOC 2 Compliant</span>
            <span>✓ GDPR Ready</span>
          </div>
        </div>
      </div>
    </section>
  )
}
