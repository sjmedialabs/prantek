"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import type { WebsiteContent } from "@/lib/models/types"
import { usePathname } from "next/navigation"

/** CMS may store `#pricing`; Next needs `/#pricing` so we leave /about and hit home + hash */
function normalizeLandingNavHref(href: string): string {
  const t = href.trim()
  if (!t) return t
  if (t.startsWith("/#")) return t
  if (t.startsWith("#")) return `/${t}`
  return t
}

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [content, setContent] = useState<WebsiteContent | null>(null)
  const [activeHash, setActiveHash] = useState("")
  const pathname = usePathname()
  // console.log(pathname)
  useEffect(() => {
    api.websiteContent
      .getAll()
      .then((data) => data[0] as WebsiteContent | undefined)
      .then((websiteContent) => setContent(websiteContent ?? null))
  }, [])
  useEffect(() => {
    const updateHash = () => {
      setActiveHash(window.location.hash)
    }

    updateHash() // initial

    window.addEventListener("hashchange", updateHash)
    return () => window.removeEventListener("hashchange", updateHash)
  }, [])
  const navLinks = content?.landingNavLinks?.filter((l) => l.label?.trim() && l.href?.trim()) ?? []
  const signInLabel = content?.landingHeaderSignInLabel?.trim() ?? ""
  const ctaLabel = content?.landingHeaderCtaLabel?.trim() ?? ""

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                {content?.logo?.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={content.logo}
                    alt={content.companyName?.trim() ? content.companyName : ""}
                    className="h-10 w-auto"
                  />
                ) : content?.companyName?.trim() ? (
                  <span className="text-xl font-bold text-gray-900">{content.companyName}</span>
                ) : null}
              </Link>
            </div>
          </div>

          <nav className="hidden lg:flex space-x-8">
            {navLinks.map((link) => {
              const isHashLink = link.href.startsWith("/#")

              const isActive = isHashLink
                ? activeHash === link.href.replace("/", "")
                : pathname === link.href

              return (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  onClick={() => {
    if (link.href.startsWith("/#")) {
      setActiveHash(link.href.replace("/", ""))
    }
  }}
                  className={`transition-colors font-medium ${isActive
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                    }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex flex-row gap-4">
            <div className="hidden md:flex items-center justify-end space-x-4">
              {signInLabel ? (
                <Link href="/signin">
                  <Button variant="ghost" className="text-gray-600 hover:text-blue-600 border-2 border-b-gray-200 rounded-full">
                    {signInLabel}
                  </Button>
                </Link>
              ) : null}
              {ctaLabel ? (
                <Link href="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">{ctaLabel}</Button>
                </Link>
              ) : null}
            </div>

            <div className="lg:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const normalizedHref = normalizeLandingNavHref(link.href)
                const isHashLink = normalizedHref.startsWith("/#")
                const hashFragment = isHashLink ? normalizedHref.replace(/^\//, "") : ""

                const isActive = isHashLink
                  ? activeHash === hashFragment
                  : pathname === normalizedHref

                return (
                  <Link
                    key={`${normalizedHref}-${link.label}`}
                    href={normalizedHref}
                    onClick={(e) => {
                      setIsMenuOpen(false)
                      if (!isHashLink) return
                      setActiveHash(hashFragment)
                      if (pathname === "/") {
                        e.preventDefault()
                        const el = document.querySelector<HTMLElement>(hashFragment)
                        if (el) {
                          const y = el.getBoundingClientRect().top + window.scrollY - 80
                          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" })
                          window.history.pushState(null, "", normalizedHref)
                        }
                      }
                    }}
                    className={`transition-colors font-medium ${isActive
                        ? "text-blue-600"
                        : "text-gray-600 hover:text-blue-600"
                      }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              </div>
              <div className="px-3 py-2 gap-2 space-y-2 flex md:hidden">
                {signInLabel ? (
                  <Link href="/signin">
                    <Button variant="ghost" className="w-full justify-start text-gray-600 border-2 border-b-gray-200 rounded-full">
                      {signInLabel}
                    </Button>
                  </Link>
                ) : null}
                {ctaLabel ? (
                  <Link href="/signup">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full">{ctaLabel}</Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
