"use client"

import { useEffect, useCallback } from "react"
import { usePathname, useSearchParams } from "next/navigation"

/** Sticky landing header is h-16 (64px); extra padding for comfort */
const HEADER_OFFSET_PX = 80

function scrollToHashIfPresent(): boolean {
  const hash = typeof window !== "undefined" ? window.location.hash : ""
  if (!hash) return false
  const el = document.querySelector<HTMLElement>(hash)
  if (!el) return false
  const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" })
  return true
}

/**
 * After navigating to `/#section` (e.g. from /about-us), App Router mounts `/`
 * but does not scroll to the hash. Also handles `hashchange` when already on `/`.
 * Only runs on the marketing home route (`/`).
 */
export function ScrollToHash() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const runWithRetries = useCallback(() => {
    if (pathname !== "/") return () => {}
    let attempts = 0
    const id = window.setInterval(() => {
      const done = scrollToHashIfPresent()
      attempts += 1
      if (done || attempts > 30) window.clearInterval(id)
    }, 100)
    return () => window.clearInterval(id)
  }, [pathname])

  useEffect(() => {
    if (pathname !== "/") return
    const cancel = runWithRetries()
    return cancel
  }, [pathname, searchParams, runWithRetries])

  useEffect(() => {
    if (pathname !== "/") return
    const onHashChange = () => {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => scrollToHashIfPresent(), 0)
      })
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [pathname])

  return null
}
