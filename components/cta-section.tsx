"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useTrialPeriod } from "@/lib/hooks/useTrialPeriod"
import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import type { WebsiteContent } from "@/lib/models/types"
import { formatLandingText } from "@/lib/landing-placeholders"

export function CTASection() {
  const { trialDays } = useTrialPeriod()
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

  const title = content.ctaTitle?.trim() ?? ""
  const subtitleRaw = content.ctaSubtitle?.trim() ?? ""
  const subtitle = formatLandingText(subtitleRaw, { trialDays })
  const primaryText = content.ctaPrimaryText?.trim() ?? ""
  const primaryLink = content.ctaPrimaryLink?.trim() ?? "/signin"
  const bullets = content.ctaFeatures ?? []

  if (!title && !subtitle && !primaryText && bullets.length === 0) {
    return null
  }

  return (
    <section className="py-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {title ? (
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-balance">{title}</h2>
        ) : null}
        {subtitle ? (
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto text-pretty">{subtitle}</p>
        ) : null}

        {primaryText ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href={primaryLink}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12">
                {primaryText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        ) : null}

        {bullets.length > 0 ? (
          <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-gray-300">
            {bullets.map((line, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span>{formatLandingText(line, { trialDays })}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
