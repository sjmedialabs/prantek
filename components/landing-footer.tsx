"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react"
import { api } from "@/lib/api-client"

export function LandingFooter() {
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    api.websiteContent.getAll().then(data => data[0] || {}).then((websiteContent) => {
    setContent(websiteContent)
    })
  }, [])

  return (
    <footer className="bg-gray-900 text-white py-16" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
              {content?.companyName || "SaaS Platform"}
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              {content?.tagline || "Streamline Your Business Operations"}
            </p>
            {content?.contactEmail && (
              <div className="text-sm text-gray-400">
                <a href={`mailto:${content.contactEmail}`} className="hover:text-white transition-colors">
                  {content.contactEmail}
                </a>
              </div>
            )}
            {content?.contactPhone && (
              <div className="text-sm text-gray-400">
                <a href={`tel:${content.contactPhone}`} className="hover:text-white transition-colors">
                  {content.contactPhone}
                </a>
              </div>
            )}
            {(content?.socialFacebook ||
              content?.socialTwitter ||
              content?.socialLinkedin ||
              content?.socialInstagram) && (
              <div className="flex space-x-4 pt-2">
                {content.socialFacebook && (
                  <a
                    href={content.socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {content.socialTwitter && (
                  <a
                    href={content.socialTwitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {content.socialLinkedin && (
                  <a
                    href={content.socialLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {content.socialInstagram && (
                  <a
                    href={content.socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
            <div className="text-sm text-gray-400">{content?.footerText || "© 2025 All rights reserved."}</div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/security" className="hover:text-white transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="hover:text-white transition-colors">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${content?.contactEmail || "contact@prantek.com"}`}
                  className="hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="hover:text-white transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-white transition-colors">
                  Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400 text-sm">Built with security and compliance in mind. SOC 2 Type II certified.</p>
        </div>
      </div>
    </footer>
  )
}
