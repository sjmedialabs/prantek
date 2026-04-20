"use client"

import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api-client"
import { useState, useEffect } from "react"
import type { WebsiteContent } from "@/lib/models/types"

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
    <section className="py-6 bg-gray-900 relative overflow-hidden" id="industries">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* HEADER */}
        <div className="text-center mb-6">
          {sectionBadge && (
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                {sectionBadge}
              </span>
            </div>
          )}

          {title && (
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-white">
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 gap-6">
          {industries.map((industry, index) => {
            return (
              <Card
                key={industry.id || index}
                className="
                  group relative flex flex-col justify-between items-center bg-yellow-500 gap-5 py-0
                  bg-white/5 backdrop-blur-sm border border-white/10
                  rounded-2xl overflow-hidden
                  transition-all duration-500 ease-out
                  hover:bg-white/10 hover:-translate-y-2
                "
              >
              <CardContent className="flex items-center justify-between w-full gap-5 p-0">
                {/* LEFT IMAGE */}
                <div className="w-full basis-2/3">
                  {industry.icon ? (
                    <img
                      src={industry.icon}
                      alt={industry.title || "industry"}
                      className="
                       w-90 h-40 rounded-r-full object-cover
                        transition-transform duration-500
                        group-hover:scale-110
                      "
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
                      No Img
                    </div>
                  )}
                </div>

                {/* RIGHT CONTENT */}
                <div className="w-full basis-1/3 h-full flex flex-col justify-center text-start p-4">
                  {industry.title?.trim() && (
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors duration-300">
                      {industry.title}
                    </h3>
                  )}

                  {industry.description?.trim() && (
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      {industry.description}
                    </p>
                  )}

                  {/* CTA */}
                  {cardCta && (
                    <div
                      className="
                        mt-2 inline-flex items-center text-blue-400 text-sm font-medium
                        opacity-100 translate-y-2
                        transition-all duration-500
                        group-hover:opacity-100 group-hover:translate-y-0
                      "
                    >
                      {cardCta}
                      <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}