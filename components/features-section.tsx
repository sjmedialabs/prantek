"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import * as Icons from "lucide-react"
import { type LucideIcon, Star } from "lucide-react"
import { api } from "@/lib/api-client"
import Link from "next/link"
import type { WebsiteContent } from "@/lib/models/types"

// This maps all icons from the library. 
// Note: This will increase your client bundle size significantly.
const iconMap: Record<string, LucideIcon> = { 
  ...(Icons as any), 
  BarChart: Icons.BarChart3 
}

export function FeaturesSection() {
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    api.websiteContent
      .getAll()
      .then((data) => (data[0] || null) as WebsiteContent | null)
      .then((websiteContent) => {
        setContent(websiteContent)
      })
  }, [])

  const features = content?.features ?? []
  const sectionBadge = content?.featuresSectionBadge?.trim() ?? ""
  const title = content?.featuresTitle?.trim() ?? ""
  const subtitle = content?.featuresSubtitle?.trim() ?? ""

  if (features.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          {sectionBadge ? (
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-4 py-2 rounded-full">
                {sectionBadge}
              </span>
            </div>
          ) : null}
          {title ? (
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{subtitle}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] ?? Star
            const colors = [
              "from-blue-500 to-cyan-500",
              "from-purple-500 to-pink-500",
              "from-orange-500 to-red-500",
              "from-green-500 to-emerald-500",
              "from-indigo-500 to-blue-500",
              "from-yellow-500 to-orange-500",
              "from-red-500 to-pink-500",
              "from-teal-500 to-green-500",
              "from-pink-500 to-rose-500",
            ]
            const gradient = colors[index % colors.length]
            const learnUrl = feature.learnMoreUrl?.trim()
            const learnText = feature.learnMoreText?.trim()

            const linkInner = (
              <div className="mt-6 flex items-center text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm">{learnText}</span>
                <svg
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )

            return (
              <Card
                key={feature.id}
                className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                ></div>

                <CardContent className="p-8 relative z-10">
                  <div className="relative mb-6">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 rounded-2xl blur-xl group-hover:blur-2xl transition-all`}
                    ></div>
                    <div
                      className={`relative w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {feature.title?.trim() ? (
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                  ) : null}
                  {feature.description?.trim() ? (
                    <p className="text-base text-gray-600 leading-relaxed">{feature.description}</p>
                  ) : null}

                  {learnUrl && learnText ? <Link href={learnUrl}>{linkInner}</Link> : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
