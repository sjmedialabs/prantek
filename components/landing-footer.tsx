"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react"
import { api } from "@/lib/api-client"
import type { WebsiteContent } from "@/lib/models/types"
import { CMS_FOOTER_PAGE_SLUGS, footerNavLabel } from "@/lib/cms-public-pages"

export function LandingFooter() {
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    api.websiteContent
      .getAll()
      .then((data) => data[0] as WebsiteContent | undefined)
      .then((websiteContent) => {
        setContent(websiteContent ?? null)
      })
  }, [])

  const cmsNavLinks = CMS_FOOTER_PAGE_SLUGS.map((slug) => ({
    slug,
    title: footerNavLabel(content, slug),
  }))

  return (
    <footer className="bg-gray-900 text-white py-16" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              {content?.footerLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content.footerLogo}
                  alt={content.companyName?.trim() ? content.companyName : ""}
                  className="h-10 w-auto object-contain object-left"
                />
              ) : content?.companyName?.trim() ? (
                <span className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
                  {content.companyName}
                </span>
              ) : null}
            </Link>

            {content?.tagline?.trim() ? (
              <p className="text-gray-400 text-sm leading-relaxed">{content.tagline}</p>
            ) : null}

            {content?.contactEmail?.trim() ? (
              <div className="text-sm text-gray-400">
                <a href={`mailto:${content.contactEmail}`} className="hover:text-white transition-colors">
                  {content.contactEmail}
                </a>
              </div>
            ) : null}

            {content?.contactPhone?.trim() ? (
              <div className="text-sm text-gray-400">
                <a href={`tel:${content.contactPhone}`} className="hover:text-white transition-colors">
                  {content.contactPhone}
                </a>
              </div>
            ) : null}

            {content?.contactAddress?.trim() ? (
              <div className="text-sm text-gray-400 whitespace-pre-line">{content.contactAddress.trim()}</div>
            ) : null}

            {(content?.socialFacebook ||
              content?.socialTwitter ||
              content?.socialLinkedin ||
              content?.socialInstagram) && (
              <div className="flex space-x-4 pt-2">
                {content.socialFacebook?.trim() ? (
                  <a
                    href={content.socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                ) : null}
                {content.socialTwitter?.trim() ? (
                  <a
                    href={content.socialTwitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                ) : null}
                {content.socialLinkedin?.trim() ? (
                  <a
                    href={content.socialLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                ) : null}
                {content.socialInstagram?.trim() ? (
                  <a
                    href={content.socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <ul className="space-y-2 text-sm text-gray-400 md:text-right">
              {cmsNavLinks.map(({ slug, title }) => (
                <li key={slug}>
                  <Link href={`/${slug}`} className="hover:text-white transition-colors">
                    {title}
                  </Link>
                </li>
              ))}
              <li key="help-center">
                <Link href="/help-center" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {content?.footerCopyright?.trim() ? (
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">{content.footerCopyright.trim()}</p>
          </div>
        ) : null}
      </div>
    </footer>
  )
}
