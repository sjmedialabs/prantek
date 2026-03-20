"use client"

/**
 * Compatibility layer: some dev caches or legacy imports still resolve this path
 * after CMS refactors. Prefer `@/components/about-us-page-view` and
 * `@/components/public-contact-page-view` in new code.
 */
import { AboutUsPageView } from "@/components/about-us-page-view"
import { PublicContactPageView } from "@/components/public-contact-page-view"

export function CmsStaticPageView({ slug }: { slug: string }) {
  if (slug === "about-us") return <AboutUsPageView />
  if (slug === "contact") return <PublicContactPageView />
  return (
    <div className="mx-auto max-w-2xl p-8 text-center text-muted-foreground">This page is not available.</div>
  )
}

export default CmsStaticPageView
