"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { WebsiteContent } from "@/lib/models/types"
import { normalizePublicContactPage } from "@/lib/cms-public-pages"
import { LandingHeader } from "@/components/landing-header"
import { LandingFooter } from "@/components/landing-footer"
import { CmsBodyText, CmsContentBlocks } from "@/components/cms-page-blocks"

export function PublicContactPageView() {
  const [page, setPage] = useState(() => normalizePublicContactPage(null))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.websiteContent
      .getAll()
      .then((data) => {
        const row = (data[0] || null) as WebsiteContent | null
        if (!cancelled) {
          setPage(normalizePublicContactPage(row?.publicContactPage))
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
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
          <section className="relative h-[min(45vh,380px)] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.heroImage.trim()}
              alt={page.heroImageAlt?.trim() || ""}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
              {page.pageTitle?.trim() ? <h1 className="text-3xl font-bold md:text-4xl">{page.pageTitle}</h1> : null}
            </div>
          </section>
        ) : (
          <div className="max-w-6xl mx-auto px-4 pt-12">
            {page.pageTitle?.trim() ? <h1 className="text-3xl font-bold text-gray-900">{page.pageTitle}</h1> : null}
          </div>
        )}

        {(page.introHeading?.trim() || page.introBody?.trim()) && (
          <section className="max-w-3xl mx-auto px-4 py-12">
            {page.introHeading?.trim() ? (
              <h2 className="text-2xl font-semibold text-gray-900">{page.introHeading}</h2>
            ) : null}
            <CmsBodyText text={page.introBody} className="mt-4" />
          </section>
        )}

        <CmsContentBlocks blocks={page.blocks} />
      </main>
      <LandingFooter />
    </div>
  )
}
