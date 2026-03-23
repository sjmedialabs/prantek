"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import type { WebsiteContent } from "@/lib/models/types"

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    api.websiteContent
      .getAll()
      .then((data) => data[0] as WebsiteContent | undefined)
      .then((websiteContent) => setContent(websiteContent ?? null))
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
            {navLinks.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-row gap-4">
            <div className="hidden md:flex items-center justify-end space-x-4">
              {signInLabel ? (
                <Link href="/signin">
                  <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
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
              {navLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="block px-3 py-2 text-gray-600 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                  scroll={false}
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-3 py-2 space-y-2 flex md:hidden">
                {signInLabel ? (
                  <Link href="/signin">
                    <Button variant="ghost" className="w-full justify-start text-gray-600">
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
