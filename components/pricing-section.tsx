"use client"

import { useTrialPeriod } from "@/lib/hooks/useTrialPeriod"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import type { SubscriptionPlan, WebsiteContent } from "@/lib/models/types"
import { formatLandingText } from "@/lib/landing-placeholders"

export function PricingSection() {
  const { trialDays } = useTrialPeriod()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<WebsiteContent | null>(null)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [yearlyDiscount, setYearlyDiscount] = useState(17)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [websiteContent, allPlans, settingsRes] = await Promise.all([
          api.websiteContent.getAll().then((data) => (data[0] || null) as WebsiteContent | null),
          api.subscriptionPlans.getAll().then((plans) =>
            plans.filter((p: SubscriptionPlan) => (p as SubscriptionPlan & { isActive?: boolean }).isActive !== false),
          ),
          fetch("/api/system-settings")
            .then((res) => res.json())
            .catch(() => ({ success: false })),
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

  if (loading || !content) {
    return (
      <section className="py-20 bg-gray-50" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading pricing...</div>
        </div>
      </section>
    )
  }

  const title = content.pricingTitle?.trim() ?? ""
  const subtitleRaw = content.pricingSubtitle?.trim() ?? ""
  const subtitle = formatLandingText(subtitleRaw, { trialDays })
  const footerRaw = content.pricingFooterText?.trim() ?? ""
  const footer = formatLandingText(footerRaw, { trialDays })

  const monthlyLabel = content.pricingMonthlyLabel?.trim() ?? ""
  const yearlyLabel = content.pricingYearlyLabel?.trim() ?? ""
  const saveLabel = formatLandingText(content.pricingYearlySaveTemplate, { yearlyDiscount })
  const trialBadgeTpl = content.pricingPlanTrialBadgeTemplate?.trim() ?? ""
  const trialBadge = formatLandingText(trialBadgeTpl, { trialDays })
  const popularRibbon = content.pricingPopularRibbonText?.trim() ?? ""
  const popularName = content.pricingPopularPlanName?.trim() ?? ""
  const enterpriseName = content.pricingEnterprisePlanName?.trim() ?? ""
  const enterprisePrice = content.pricingEnterpriseDisplayPrice?.trim() ?? ""
  const enterpriseSub = content.pricingEnterpriseDisplaySubtext?.trim() ?? ""
  const contactSales = content.pricingContactSalesLabel?.trim() ?? ""
  const getStarted = content.pricingGetStartedLabel?.trim() ?? ""
  const perMonth = content.pricingPerMonthLabel?.trim() ?? ""
  const perYear = content.pricingPerYearLabel?.trim() ?? ""

  const salesEmail = content.contactEmail?.trim() || ""

  if (plans.length === 0 && !title && !subtitle) {
    return null
  }

  return (
    <section className="py-20 bg-gray-50" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-16">
            {title ? (
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">{title}</h2>
            ) : null}
            {subtitle ? <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">{subtitle}</p> : null}
          </div>
        )}

        {(monthlyLabel || yearlyLabel) && (
          <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl p-1 w-fit mx-auto mb-10">
            {monthlyLabel ? (
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {monthlyLabel}
              </button>
            ) : null}
            {yearlyLabel ? (
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all relative ${
                  billingCycle === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {yearlyLabel}
                {saveLabel ? (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {saveLabel}
                  </span>
                ) : null}
              </button>
            ) : null}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, index) => {
            const isPopular = popularName && plan.name === popularName
            const isEnterprise = enterpriseName && plan.name === enterpriseName
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
                {!isEnterprise && trialBadge ? (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-semibold px-4 py-1.5 rounded-bl-lg shadow-lg whitespace-nowrap">
                      {trialBadge}
                    </div>
                  </div>
                ) : null}

                {isPopular && popularRibbon ? (
                  <div className="absolute top-4 -left-1">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-6 py-1 shadow-lg">
                      {popularRibbon}
                    </div>
                  </div>
                ) : null}

                <CardHeader className="text-center pb-6 pt-8 space-y-4">
                  <div className="space-y-2">
                    <CardTitle
                      className={`text-3xl font-extrabold tracking-tight ${
                        isPopular ? "text-primary" : "text-gray-900"
                      }`}
                    >
                      {plan.name}
                    </CardTitle>
                  </div>

                  <div className="py-4 min-h-[140px] flex flex-col justify-center">
                    {isEnterprise ? (
                      <>
                        {enterprisePrice ? (
                          <div className="flex items-start justify-center gap-1">
                            <span className="text-2xl font-bold text-gray-900 mt-2">₹</span>
                            <span className="text-6xl font-extrabold bg-gradient-to-br bg-clip-text text-transparent from-gray-900 to-gray-700">
                              {enterprisePrice}
                            </span>
                          </div>
                        ) : null}
                        {enterpriseSub ? (
                          <p className="text-sm text-gray-500 font-medium mt-2">{enterpriseSub}</p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        {billingCycle === "yearly" ? (
                          <span className="text-sm line-through text-gray-400 mb-1">
                            ₹{yearlyPrice.toLocaleString()}
                          </span>
                        ) : null}
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
                        {perMonth || perYear ? (
                          <p className="text-sm text-gray-500 font-medium mt-2">
                            {billingCycle === "yearly" ? perYear : perMonth}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                </CardHeader>

                <div className="space-y-6 px-6 pb-8 h-full flex flex-col justify-between gap-4">
                  <div>
                    <div className="border-t border-gray-200 mb-2" />

                    <ul className="space-y-3">
                      {(plan.features || []).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div
                            className={`rounded-full p-1 mt-0.5 ${
                              isPopular ? "bg-primary/10" : "bg-gray-100"
                            }`}
                          >
                            <Check
                              className={`h-3.5 w-3.5 ${
                                isPopular ? "text-primary" : "text-emerald-600"
                              }`}
                            />
                          </div>
                          <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4">
                    {isEnterprise ? (
                      contactSales ? (
                        <Button
                          className="w-full h-12 bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={() => {
                            const contactSection = document.getElementById("contact")
                            if (contactSection) {
                              contactSection.scrollIntoView({ behavior: "smooth" })
                            } else if (salesEmail) {
                              window.location.href = `mailto:${salesEmail}?subject=Enterprise Plan Inquiry`
                            }
                          }}
                        >
                          {contactSales}
                        </Button>
                      ) : null
                    ) : getStarted ? (
                      <Link href="/signin">
                        <Button
                          className={`w-full h-12 font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 ${
                            isPopular
                              ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500 text-white"
                              : "bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                          }`}
                        >
                          {getStarted}
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {footer ? (
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">{footer}</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
