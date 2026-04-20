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
    <section className="py-6 bg-gradient-to-b from-white via-gray-50 to-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
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
  {features.map((feature) => {
    const learnUrl = feature.learnMoreUrl?.trim()
    const learnText = feature.learnMoreText?.trim()

    return (
      <Card
        key={feature.id}
        className="group py-0 overflow-hidden rounded-2xl shadow-md hover:shadow-xl bg-white border-0 
        transform transition-all duration-500 hover:-translate-y-2"
      >
        {/* IMAGE */}
        <div className="h-60 w-full overflow-hidden">
          {feature.icon ? (
            <img
              src={feature.icon}
              alt={feature.title || "feature image"}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* CONTENT */}
        <CardContent className="px-5 py-3 mb-4 flex flex-col justify-between">
          <div>
            {feature.title?.trim() && (
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                {feature.title}
              </h3>
            )}

            {feature.description?.trim() && (
              <p className="text-sm text-gray-600 line-clamp-3">
                {feature.description}
              </p>
            )}
          </div>

          {/* LINK (animated) */}
          {learnUrl && learnText && (
            <Link
              href={learnUrl}
              className="
                mt-2 inline-flex items-center text-blue-600 text-sm font-medium
                opacity-0 translate-y-2
                transition-all duration-500
                group-hover:opacity-100 group-hover:translate-y-0
              "
            >
              {learnText}
              <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          )}
        </CardContent>
      </Card>
    )
  })}
</div>
      </div>
    </section>
  )
}
