"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { WebsiteContent } from "@/lib/models/types"
import { normalizeAboutUsPage } from "@/lib/cms-public-pages"
import { LandingHeader } from "@/components/landing-header"
import { LandingFooter } from "@/components/landing-footer"
import { CmsBodyText, CmsContentBlocks } from "@/components/cms-page-blocks"

export function AboutUsPageView() {
  const [page, setPage] = useState(() => normalizeAboutUsPage(null))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.websiteContent
      .getAll()
      .then((data) => {
        const row = (data[0] || null) as WebsiteContent | null
        if (!cancelled) {
          setPage(normalizeAboutUsPage(row?.aboutUsPage))
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" aria-hidden />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <main>
        {page.heroImage?.trim() ? (
          <section className="relative h-[min(50vh,420px)] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.heroImage.trim()}
              alt={page.heroImageAlt?.trim() || ""}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
              {page.heroHeading?.trim() || page.pageTitle?.trim() ? (
                <h1 className="text-3xl font-bold md:text-4xl">
                  {page.heroHeading?.trim() || page.pageTitle?.trim()}
                </h1>
              ) : null}
              {page.heroSubheading?.trim() ? (
                <p className="mt-4 max-w-2xl text-lg text-white/90">{page.heroSubheading}</p>
              ) : null}
            </div>
          </section>
        ) : (
          <div className="max-w-6xl mx-auto px-4 pt-12">
            {page.heroHeading?.trim() || page.pageTitle?.trim() ? (
              <h1 className="text-3xl font-bold text-gray-900">
                {page.heroHeading?.trim() || page.pageTitle?.trim()}
              </h1>
            ) : null}
            {page.heroSubheading?.trim() ? (
              <p className="mt-4 text-lg text-gray-600">{page.heroSubheading}</p>
            ) : null}
          </div>
        )}

        <CmsContentBlocks blocks={page.blocks} />
      </main>
      <LandingFooter />
    </div>
  )
}
