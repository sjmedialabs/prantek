"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { WebsiteContent } from "@/lib/models/types"
import { normalizePublicContactPage } from "@/lib/cms-public-pages"
import { LandingHeader } from "@/components/landing-header"
import { LandingFooter } from "@/components/landing-footer"
import { CmsBodyText, CmsContentBlocks } from "@/components/cms-page-blocks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function PublicContactPageView() {
  const [page, setPage] = useState(() => normalizePublicContactPage(null))
  const [loaded, setLoaded] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(false)
    setSubmitting(true)
    try {
      const res = await fetch("/api/contact-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setFormError(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.")
        return
      }
      setFormSuccess(true)
      setName("")
      setEmail("")
      setPhone("")
      setMessage("")
    } catch {
      setFormError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

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

        <section className="max-w-xl mx-auto px-4 pb-20">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Send us a message</h2>
          <p className="text-sm text-gray-600 mb-6">Fill in your details and we&apos;ll get back to you.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formSuccess ? (
              <div
                className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-900 text-sm"
                role="status"
              >
                Thank you! Your message has been received. We&apos;ll be in touch soon.
              </div>
            ) : null}
            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm" role="alert">
                {formError}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="contact-form-name">Name</Label>
              <Input
                id="contact-form-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setFormSuccess(false)
                  setName(e.target.value)
                }}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-form-email">Email</Label>
              <Input
                id="contact-form-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setFormSuccess(false)
                  setEmail(e.target.value)
                }}
                required
                maxLength={320}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-form-phone">Phone</Label>
              <Input
                id="contact-form-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setFormSuccess(false)
                  setPhone(e.target.value)
                }}
                required
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-form-message">Message</Label>
              <Textarea
                id="contact-form-message"
                name="message"
                value={message}
                onChange={(e) => {
                  setFormSuccess(false)
                  setMessage(e.target.value)
                }}
                required
                rows={5}
                maxLength={10000}
                className="min-h-[120px] resize-y"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Sending…" : "Submit"}
            </Button>
          </form>
        </section>
      </main>
      <LandingFooter />
    </div>
  )
}
