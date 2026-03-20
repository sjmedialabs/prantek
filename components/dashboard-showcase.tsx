"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-client"
import { useState, useEffect } from "react"
import type { WebsiteContent } from "@/lib/models/types"

export function DashboardShowcase() {
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    api.websiteContent
      .getAll()
      .then((data) => (data[0] || null) as WebsiteContent | null)
      .then((websiteContent) => {
        setContent(websiteContent)
      })
  }, [])

  if (!content) {
    return null
  }

  const badgeText = content.showcaseSubtitle?.trim() ?? ""
  const heading = content.showcaseTitle?.trim() ?? ""
  const body = content.showcaseDescription?.trim() ?? ""
  const bullets = content.showcaseFeatures ?? []

  const cardTitle = content.showcaseCardTitle?.trim() ?? ""
  const cardBadge = content.showcaseCardBadge?.trim() ?? ""
  const stats = content.showcaseCardStats ?? []
  const financeTitle = content.showcaseFinanceTitle?.trim() ?? ""
  const financeRows = content.showcaseFinanceRows ?? []
  const activityTitle = content.showcaseActivityTitle?.trim() ?? ""
  const activityLines = content.showcaseActivityLines ?? []

  const hasLeft = Boolean(badgeText || heading || body || bullets.length)
  const hasRight = Boolean(
    cardTitle || cardBadge || stats.length || financeTitle || financeRows.length || activityTitle || activityLines.length,
  )

  if (!hasLeft && !hasRight) {
    return null
  }

  const gridClass =
    hasLeft && hasRight ? "grid lg:grid-cols-2 gap-12 items-center" : "grid gap-12 items-center max-w-3xl mx-auto"

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={gridClass}>
          {hasLeft ? (
            <div className="space-y-6">
              <div>
                {badgeText ? (
                  <Badge variant="secondary" className="mb-4">
                    {badgeText}
                  </Badge>
                ) : null}
                {heading ? (
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">{heading}</h2>
                ) : null}
                {body ? <p className="text-lg text-gray-600 leading-relaxed text-pretty">{body}</p> : null}
              </div>

              {bullets.length > 0 ? (
                <div className="space-y-4">
                  {bullets.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {hasRight ? (
            <div className="relative">
              <Card className="shadow-2xl border-0">
                <CardContent className="p-0">
                  {cardTitle || cardBadge || stats.length > 0 ? (
                    <div className="bg-gradient-to-r from-primary to-purple-600 p-6 text-white">
                      {cardTitle || cardBadge ? (
                        <div className="flex justify-between items-center mb-4">
                          {cardTitle ? <h3 className="text-lg font-semibold">{cardTitle}</h3> : <span />}
                          {cardBadge ? (
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                              {cardBadge}
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}

                      {stats.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {stats.map((s, i) => (
                            <div key={i}>
                              <div className="text-purple-200">{s.label}</div>
                              <div className="text-xl font-bold">{s.value}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="p-6 space-y-6">
                    {financeTitle && financeRows.length > 0 ? (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">{financeTitle}</h4>
                        <div className="space-y-3">
                          {financeRows.map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{item.label}</span>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                                <div
                                  className={`text-xs ${item.trend.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                                >
                                  {item.trend}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {activityTitle && activityLines.length > 0 ? (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">{activityTitle}</h4>
                        <div className="space-y-2">
                          {activityLines.map((activity, index) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              <span>{activity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
