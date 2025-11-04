"use client"

import { useState, useEffect } from "react"
import { dataStore, type WebsiteContent } from "@/lib/data-store"

export function TrustedBySection() {
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    const websiteContent = dataStore.getWebsiteContent()
    setContent(websiteContent)
  }, [])

  const trustedLogos = content?.trustedByLogos || []
  const title = content?.trustedByTitle || "Trusted by 1000+ businesses"

  return (
    <section className="w-full bg-gradient-to-r from-gray-50 via-white to-gray-50 py-12 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">{title}</p>
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll gap-12">
            {[...trustedLogos, ...trustedLogos].map((logo, index) => (
              <div
                key={index}
                className="text-3xl font-bold text-gray-400 whitespace-nowrap flex-shrink-0 hover:text-gray-600 transition-colors"
              >
                {logo.logo ? (
                  <img src={logo.logo || "/placeholder.svg"} alt={logo.name} className="h-8 object-contain" />
                ) : (
                  logo.name
                )}
              </div>
            ))}
          </div>
        </div>
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
