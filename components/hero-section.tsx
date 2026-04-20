"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { VideoModal } from "@/components/video-modal"
import { useTrialPeriod } from "@/lib/hooks/useTrialPeriod"
import type { WebsiteContent } from "@/lib/models/types"
import { formatLandingText } from "@/lib/landing-placeholders"

export function HeroSection() {
  const { trialDays } = useTrialPeriod()
  const [content, setContent] = useState<WebsiteContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  useEffect(() => {
    api.websiteContent
      .getAll()
      .then((data) => (data[0] || null) as WebsiteContent | null)
      .then((websiteContent) => {
        setContent(websiteContent)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !content) {
    return (
      <section className="relative bg-white py-8 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse space-y-4 w-full max-w-2xl">
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const heroTitle = content.heroTitle?.trim() ?? ""
  const heroSubtitle = content.heroSubtitle?.trim() ?? ""
  const heroCtaText = content.heroCtaText?.trim() ?? ""
  const heroCtaLink = content.heroCtaLink?.trim() ?? "/signin"
  const heroRightImage = content.heroRightImage?.trim() ?? ""
  const heroBackgroundImage = content.heroBackgroundImage?.trim() ?? ""
  const heroDemoVideoUrl = content.heroDemoVideoUrl?.trim() ?? ""
  const heroWatchDemoLabel = content.heroWatchDemoLabel?.trim() ?? ""
  const bullet1 = formatLandingText(content.heroTrialBullet1, { trialDays })
  const bullet2 = content.heroTrialBullet2?.trim() ?? ""
  const secureBadge = content.heroSecureBadgeText?.trim() ?? ""
  const trimmedHeroAlt = content.heroRightImageAlt?.trim() ?? ""
  const heroImageAlt = trimmedHeroAlt.length > 0 ? trimmedHeroAlt : heroTitle
  const canWatchDemo = Boolean(heroWatchDemoLabel && heroDemoVideoUrl)

  return (
    <>
      <section
        className="relative bg-white py-6 lg:py-0 lg:min-h-screen lg:flex lg:items-center overflow-hidden"
        style={
          heroBackgroundImage
            ? {
                backgroundImage: `url(${heroBackgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }
            : undefined
        }
      >
        {heroBackgroundImage ? (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
        ) : null}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                {heroTitle ? (
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight text-balance lg:text-4xl xl:text-5xl">
                    {heroTitle}
                  </h1>
                ) : null}
                {heroSubtitle ? (
                  <p className="text-xl text-gray-600 leading-relaxed text-pretty">{heroSubtitle}</p>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {heroCtaText ? (
                  <Link href={heroCtaLink}>
                    <Button
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full h-12"
                    >
                      {heroCtaText}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : null}
                {canWatchDemo ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full h-12 bg-transparent"
                    onClick={() => setIsVideoModalOpen(true)}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {heroWatchDemoLabel}
                  </Button>
                ) : null}
              </div>

              {(bullet1 || bullet2) && (
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                  {bullet1 ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>{bullet1}</span>
                    </div>
                  ) : null}
                  {bullet2 ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>{bullet2}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="relative lg:pl-12 lg:pr-[50px] lg:h-[calc(100vh-8rem)] lg:flex lg:items-center ">
              {heroRightImage ? (
                <div className="relative w-full h-auto lg:flex lg:items-center rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroRightImage}
                    alt={heroImageAlt}
                    className="w-full h-auto lg:h-full lg:w-auto lg:max-w-full lg:object-contain rounded-2xl shadow-2xl"
                  />
                  {secureBadge ? (
                    <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      {secureBadge}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {heroDemoVideoUrl ? (
        <VideoModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          videoUrl={heroDemoVideoUrl}
        />
      ) : null}
    </>
  )
}
