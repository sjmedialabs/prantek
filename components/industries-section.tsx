"use client"

import { Card } from "@/components/ui/card"
import { api } from "@/lib/api-client"
import * as Icons from "lucide-react"
import { type LucideIcon, Star } from "lucide-react"
import { useState, useEffect } from "react"
import type { WebsiteContent } from "@/lib/models/types"

// This maps all icons from the library.
// Note: This will increase your client bundle size significantly.
const iconMap: Record<string, LucideIcon> = {
  ...(Icons as any),
  BarChart: Icons.BarChart3, // Maintain your specific alias
}

export function IndustriesSection() {
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    api.websiteContent
      .getAll()
      .then((data) => (data[0] || null) as WebsiteContent | null)
      .then((websiteContent) => {
        setContent(websiteContent)
      })
  }, [])

  const industries = content?.industries ?? []
  const sectionBadge = content?.industriesSectionBadge?.trim() ?? ""
  const title = content?.industriesTitle?.trim() ?? ""
  const subtitle = content?.industriesSubtitle?.trim() ?? ""
  const cardCta = content?.industriesCardCtaText?.trim() ?? ""

  if (industries.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden" id="industries">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          {sectionBadge ? (
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                {sectionBadge}
              </span>
            </div>
          ) : null}
          {title ? <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-white">{title}</h2> : null}
          {subtitle ? (
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">{subtitle}</p>
          ) : null}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry, index) => {
            const IconComponent = iconMap[industry.icon] ?? Star
            const gradient = industry.gradient?.trim() || "from-blue-500 to-cyan-500"
            return (
              <Card
                key={industry.id || index}
                className="group relative border-0 bg-white/5 backdrop-blur-sm overflow-hidden hover:bg-white/10 transition-all duration-500 hover:-translate-y-2"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                ></div>
                <div className="absolute inset-[1px] bg-gray-900 rounded-lg"></div>

                <div className="relative z-10 p-8">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>

                  {industry.title?.trim() ? (
                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">
                      {industry.title}
                    </h3>
                  ) : null}
                  {industry.description?.trim() ? (
                    <p className="text-gray-400 leading-relaxed text-base group-hover:text-gray-300 transition-colors">
                      {industry.description}
                    </p>
                  ) : null}

                  {cardCta ? (
                    <div className="mt-6 flex items-center text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm">{cardCta}</span>
                      <svg
                        className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
