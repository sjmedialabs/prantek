"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import type { WebsiteContent } from "@/lib/models/types"

export function TrustedBySection() {
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    api.websiteContent
      .getAll()
      .then((data) => (data[0] || null) as WebsiteContent | null)
      .then((websiteContent) => {
        setContent(websiteContent)
      })
  }, [])

  const trustedLogos = content?.trustedByLogos ?? []
  const title = content?.trustedByTitle?.trim() ?? ""
  const hasLogoOrName = trustedLogos.some((l) => l.logo?.trim() || l.name?.trim())

  if (!title && !hasLogoOrName) {
    return null
  }

  return (
    <section className="w-full bg-gradient-to-r from-gray-50 via-white to-gray-50 py-6 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title ? (
          <h2 className="pb-5 text-center text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
            {title}
          </h2>
        ) : null}
        {hasLogoOrName ? (
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll gap-12">
              {[...trustedLogos, ...trustedLogos].map((logo, index) => (
                <div
                  key={index}
                  className="text-3xl font-bold mb-2 text-gray-400 whitespace-nowrap flex-shrink-0 hover:text-gray-600 transition-colors"
                >
                  {logo.logo?.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo.logo}
                      alt={logo.name?.trim() || "Partner"}
                      className="h-20 object-contain border-radius-lg shadow-md"
                    />
                  ) : (
                    logo.name
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
