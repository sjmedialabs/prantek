"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import { Save, Plus, Trash2 } from "lucide-react"
import { toast } from "@/lib/toast"
import { ImageUpload } from "@/components/ui/image-upload"
import type { WebsiteContent, CmsPublicPageBlock, AboutUsPageContent, PublicContactPageContent } from "@/lib/models/types"
import {
  normalizeAboutUsPage,
  normalizePublicContactPage,
  emptyCmsBlock,
} from "@/lib/cms-public-pages"
import { toMongoIdString } from "@/lib/mongo-entity-id"

export default function CMSPage() {
  const [content, setContent] = useState<WebsiteContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoErrors, setLogoErrors] = useState<Record<number, string>>({})
  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await api.websiteContent.getAll()
        const websiteContent = data && data.length > 0 ? data[0] : null

        // If no content exists, create default content
        // if (!websiteContent) {
        //   const defaultContent = {
        //     heroTitle: "Welcome to Prantek",
        //     heroSubtitle: "Your Business Solution",
        //     heroDescription: "Manage your business efficiently",
        //     ctaButtonText: "Get Started",
        //     ctaButtonLink: "/signup",
        //     trustedByLogos: [],
        //     features: [],
        //     industries: [],
        //     showcaseFeatures: [],
        //     testimonials: [],
        //     faqs: [],
        //     ctaFeatures: [],
        //   }
        //   setContent(defaultContent)
        //   setLoading(false)
        //   return
        // }

        const { cmsPages: _legacyPages, ...wc } = websiteContent as WebsiteContent & { cmsPages?: unknown }
        const stableId = toMongoIdString((wc as { _id?: unknown })._id) ?? toMongoIdString((wc as { id?: unknown }).id)
        const normalizedContent = {
          ...wc,
          ...(stableId ? { _id: stableId as unknown, id: stableId as unknown } : {}),
          trustedByLogos: websiteContent.trustedByLogos || [],
          features: websiteContent.features || [],
          industries: websiteContent.industries || [],
          showcaseFeatures: websiteContent.showcaseFeatures || [],
          showcaseCardStats: websiteContent.showcaseCardStats || [],
          showcaseFinanceRows: websiteContent.showcaseFinanceRows || [],
          showcaseActivityLines: websiteContent.showcaseActivityLines || [],
          landingNavLinks: websiteContent.landingNavLinks || [],
          testimonials: websiteContent.testimonials || [],
          faqs: websiteContent.faqs || [],
          ctaFeatures: websiteContent.ctaFeatures || [],
          aboutUsPage: normalizeAboutUsPage(websiteContent.aboutUsPage),
          publicContactPage: normalizePublicContactPage(websiteContent.publicContactPage),
        }
        setContent(normalizedContent)
        setLoading(false)
      } catch (error) {
        console.error("Failed to load CMS content:", error)
        setLoading(false)
      }
    }
    loadContent()
  }, [])

  const handleSave = async () => {
    if (!content) return
    const errors: Record<number, string> = {}

      ; (content.trustedByLogos || []).forEach((item: any, index: number) => {
        if (!item.logo || item.logo.trim() === "") {
          errors[index] = "Logo is required"
        }
      })

    setLogoErrors(errors)
      if (Object.keys(errors).length > 0) {
    toast.error("Please Add Logo for all Trusted By entries before saving.")
    return
  }
    try {
      const { _id, id, updatedAt, cmsPages: _legacy, ...rest } = content as any
      const contentData = {
        ...rest,
        aboutUsPage: normalizeAboutUsPage(rest.aboutUsPage),
        publicContactPage: normalizePublicContactPage(rest.publicContactPage),
      }

      let saved
      if (_id || id) {
        // ✅ Update
        saved = await api.websiteContent.update(_id || id, contentData)
      } else {
        // ✅ Create
        saved = await api.websiteContent.create(contentData)
      }

      // Ensure we preserve the content with proper normalization
      if (saved) {
        const normalizedContent = {
          ...saved,
          trustedByLogos: saved.trustedByLogos || [],
          features: saved.features || [],
          industries: saved.industries || [],
          showcaseFeatures: saved.showcaseFeatures || [],
          testimonials: saved.testimonials || [],
          faqs: saved.faqs || [],
          ctaFeatures: saved.ctaFeatures || [],
          aboutUsPage: normalizeAboutUsPage(saved.aboutUsPage),
          publicContactPage: normalizePublicContactPage(saved.publicContactPage),
        }
        setContent(normalizedContent)
      }
      toast.success("Website content updated successfully!")
    } catch (error) {
      console.error("Failed to save content:", error)
      const msg = error instanceof Error ? error.message : "Failed to save content"
      toast.error(msg)
    }
  }


  const updateContent = (field: keyof WebsiteContent, value: any) => {
    if (!content) return
    setContent({ ...content, [field]: value })
  }

  const mergeAboutUs = (patch: Partial<AboutUsPageContent>) => {
    if (!content) return
    const prev = normalizeAboutUsPage(content.aboutUsPage)
    setContent({ ...content, aboutUsPage: normalizeAboutUsPage({ ...prev, ...patch }) })
  }

  const updateAboutBlock = (blockId: string, field: keyof CmsPublicPageBlock, value: string) => {
    if (!content) return
    const a = normalizeAboutUsPage(content.aboutUsPage)
    setContent({
      ...content,
      aboutUsPage: {
        ...a,
        blocks: a.blocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b)),
      },
    })
  }

  const addAboutBlock = () => {
    if (!content) return
    const a = normalizeAboutUsPage(content.aboutUsPage)
    setContent({ ...content, aboutUsPage: { ...a, blocks: [...a.blocks, emptyCmsBlock()] } })
  }

  const removeAboutBlock = (blockId: string) => {
    if (!content) return
    const a = normalizeAboutUsPage(content.aboutUsPage)
    setContent({ ...content, aboutUsPage: { ...a, blocks: a.blocks.filter((b) => b.id !== blockId) } })
  }

  const mergePublicContact = (patch: Partial<PublicContactPageContent>) => {
    if (!content) return
    const prev = normalizePublicContactPage(content.publicContactPage)
    setContent({ ...content, publicContactPage: normalizePublicContactPage({ ...prev, ...patch }) })
  }

  const updateContactBlock = (blockId: string, field: keyof CmsPublicPageBlock, value: string) => {
    if (!content) return
    const p = normalizePublicContactPage(content.publicContactPage)
    setContent({
      ...content,
      publicContactPage: {
        ...p,
        blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b)),
      },
    })
  }

  const addContactBlock = () => {
    if (!content) return
    const p = normalizePublicContactPage(content.publicContactPage)
    setContent({ ...content, publicContactPage: { ...p, blocks: [...p.blocks, emptyCmsBlock()] } })
  }

  const removeContactBlock = (blockId: string) => {
    if (!content) return
    const p = normalizePublicContactPage(content.publicContactPage)
    setContent({
      ...content,
      publicContactPage: { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) },
    })
  }

  const addLandingNavLink = () => {
    if (!content) return
    updateContent("landingNavLinks", [...(content.landingNavLinks || []), { label: "", href: "" }])
  }
  const updateLandingNavLink = (index: number, field: "label" | "href", value: string) => {
    if (!content) return
    const links = [...(content.landingNavLinks || [])]
    links[index] = { ...links[index], [field]: value }
    updateContent("landingNavLinks", links)
  }
  const removeLandingNavLink = (index: number) => {
    if (!content) return
    updateContent(
      "landingNavLinks",
      (content.landingNavLinks || []).filter((_, i) => i !== index),
    )
  }

  const addShowcaseStat = () => {
    if (!content) return
    updateContent("showcaseCardStats", [...(content.showcaseCardStats || []), { label: "", value: "" }])
  }
  const updateShowcaseStat = (index: number, field: "label" | "value", value: string) => {
    if (!content) return
    const rows = [...(content.showcaseCardStats || [])]
    rows[index] = { ...rows[index], [field]: value }
    updateContent("showcaseCardStats", rows)
  }
  const removeShowcaseStat = (index: number) => {
    if (!content) return
    updateContent(
      "showcaseCardStats",
      (content.showcaseCardStats || []).filter((_, i) => i !== index),
    )
  }

  const addShowcaseFinanceRow = () => {
    if (!content) return
    updateContent("showcaseFinanceRows", [
      ...(content.showcaseFinanceRows || []),
      { label: "", value: "", trend: "" },
    ])
  }
  const updateShowcaseFinanceRow = (index: number, field: "label" | "value" | "trend", value: string) => {
    if (!content) return
    const rows = [...(content.showcaseFinanceRows || [])]
    rows[index] = { ...rows[index], [field]: value }
    updateContent("showcaseFinanceRows", rows)
  }
  const removeShowcaseFinanceRow = (index: number) => {
    if (!content) return
    updateContent(
      "showcaseFinanceRows",
      (content.showcaseFinanceRows || []).filter((_, i) => i !== index),
    )
  }

  const addShowcaseActivityLine = () => {
    if (!content) return
    updateContent("showcaseActivityLines", [...(content.showcaseActivityLines || []), ""])
  }
  const updateShowcaseActivityLine = (index: number, value: string) => {
    if (!content) return
    const lines = [...(content.showcaseActivityLines || [])]
    lines[index] = value
    updateContent("showcaseActivityLines", lines)
  }
  const removeShowcaseActivityLine = (index: number) => {
    if (!content) return
    updateContent(
      "showcaseActivityLines",
      (content.showcaseActivityLines || []).filter((_, i) => i !== index),
    )
  }

  // Feature management
  const addFeature = () => {
    if (!content) return
    const newFeature = {
      id: Date.now().toString(),
      title: "New Feature",
      description: "Feature description",
      icon: "Star",
      image: "",
      learnMoreText: "Learn More",
      learnMoreUrl: "",
    }
    setContent({
      ...content,
      features: [...(content.features || []), newFeature],
    })
  }

  const updateFeature = (id: string, field: string, value: string) => {
    if (!content) return
    setContent({
      ...content,
      features: (content.features || []).map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    })
  }

  const deleteFeature = (id: string) => {
    if (!content) return
    setContent({
      ...content,
      features: (content.features || []).filter((f) => f.id !== id),
    })
  }

  // Trusted By management
  const addTrustedByLogo = () => {
    if (!content) return
    const newLogo = {
      id: Date.now().toString(),
      name: "New Company",
      logo: "",
    }
    updateContent("trustedByLogos", [...(content.trustedByLogos || []), newLogo])
  }

  const updateTrustedByLogo = (index: number, field: string, value: string) => {
    if (!content) return
    const newLogos = [...(content.trustedByLogos || [])]
    newLogos[index] = { ...newLogos[index], [field]: value }
    updateContent("trustedByLogos", newLogos)
  }

  const deleteTrustedByLogo = (index: number) => {
    if (!content) return
    const newLogos = (content.trustedByLogos || []).filter((_, i) => i !== index)
    updateContent("trustedByLogos", newLogos)
  }

  // Industry management
  const addIndustry = () => {
    if (!content) return
    const newIndustry = {
      id: Date.now().toString(),
      title: "New Industry",
      description: "Industry description",
      icon: "Briefcase",
      gradient: "from-blue-500 via-blue-600 to-blue-700",
    }
    updateContent("industries", [...(content.industries || []), newIndustry])
  }

  const updateIndustry = (id: string, field: string, value: string) => {
    if (!content) return
    updateContent(
      "industries",
      (content.industries || []).map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    )
  }

  const deleteIndustry = (id: string) => {
    if (!content) return
    updateContent(
      "industries",
      (content.industries || []).filter((i) => i.id !== id),
    )
  }

  // Testimonial management
  const addTestimonial = () => {
    if (!content) return
    const newTestimonial = {
      id: Date.now().toString(),
      company: "Company Name",
      logo: "CN",
      author: "Author Name",
      role: "Job Title",
      content: "Testimonial content goes here...",
      rating: 5,
    }
    updateContent("testimonials", [...(content.testimonials || []), newTestimonial])
  }

  const updateTestimonial = (id: string, field: string, value: string | number) => {
    if (!content) return
    updateContent(
      "testimonials",
      (content.testimonials || []).map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    )
  }

  const deleteTestimonial = (id: string) => {
    if (!content) return
    updateContent(
      "testimonials",
      (content.testimonials || []).filter((t) => t.id !== id),
    )
  }

  // FAQ management
  const addFAQ = () => {
    if (!content) return
    const newFAQ = {
      id: Date.now().toString(),
      question: "New Question?",
      answer: "Answer goes here...",
    }
    updateContent("faqs", [...(content.faqs || []), newFAQ])
  }

  const updateFAQ = (id: string, field: string, value: string) => {
    if (!content) return
    updateContent(
      "faqs",
      (content.faqs || []).map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    )
  }

  const deleteFAQ = (id: string) => {
    if (!content) return
    updateContent(
      "faqs",
      (content.faqs || []).filter((f) => f.id !== id),
    )
  }

  // Showcase features management
  const addShowcaseFeature = () => {
    if (!content) return
    updateContent("showcaseFeatures", [...(content.showcaseFeatures || []), "New feature"])
  }

  const updateShowcaseFeature = (index: number, value: string) => {
    if (!content) return
    const newFeatures = [...(content.showcaseFeatures || [])]
    newFeatures[index] = value
    updateContent("showcaseFeatures", newFeatures)
  }

  const deleteShowcaseFeature = (index: number) => {
    if (!content) return
    updateContent(
      "showcaseFeatures",
      (content.showcaseFeatures || []).filter((_, i) => i !== index),
    )
  }

  // CTA features management
  const addCTAFeature = () => {
    if (!content) return
    updateContent("ctaFeatures", [...(content.ctaFeatures || []), "New feature"])
  }

  const updateCTAFeature = (index: number, value: string) => {
    if (!content) return
    const newFeatures = [...(content.ctaFeatures || [])]
    newFeatures[index] = value
    updateContent("ctaFeatures", newFeatures)
  }

  const deleteCTAFeature = (index: number) => {
    if (!content) return
    updateContent(
      "ctaFeatures",
      (content.ctaFeatures || []).filter((_, i) => i !== index),
    )
  }

  if (loading || !content) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="md:p-8 space-y-6">
      <div className="flex md:flex-row flex-col gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Website Content Management</h1>
          <p className="text-muted-foreground">Manage all website content, sections, and settings</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap scroll-smooth h-full">
          <TabsTrigger value="branding" className="flex-shrink-0 ml-190 md:ml-120 xl:ml-8">Branding</TabsTrigger>
          <TabsTrigger value="navigation" className="flex-shrink-0">Navigation</TabsTrigger>
          <TabsTrigger value="hero" className="flex-shrink-0">Hero</TabsTrigger>
          <TabsTrigger value="trusted" className="flex-shrink-0">Trusted By</TabsTrigger>
          <TabsTrigger value="features" className="flex-shrink-0">Features</TabsTrigger>
          <TabsTrigger value="industries" className="flex-shrink-0">Industries</TabsTrigger>
          <TabsTrigger value="showcase" className="flex-shrink-0">Showcase</TabsTrigger>
          <TabsTrigger value="testimonials" className="flex-shrink-0">Testimonials</TabsTrigger>
          <TabsTrigger value="pricing" className="flex-shrink-0">Pricing</TabsTrigger>
          <TabsTrigger value="faq" className="flex-shrink-0">FAQ</TabsTrigger>
          <TabsTrigger value="cta" className="flex-shrink-0">CTA</TabsTrigger>
          <TabsTrigger value="footer" className="flex-shrink-0">Footer</TabsTrigger>
          <TabsTrigger value="about-page" className="flex-shrink-0">About Page</TabsTrigger>
          <TabsTrigger value="contact-page" className="flex-shrink-0">Contact Page</TabsTrigger>
          <TabsTrigger value="contact" className="flex-shrink-0">Contact</TabsTrigger>
          <TabsTrigger value="loader" className="flex-shrink-0">Loader</TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Manage your company branding and identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                <Input
                  id="companyName"
                  value={content.companyName}
                  onChange={(e) => updateContent("companyName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={content.tagline}
                  onChange={(e) => updateContent("tagline", e.target.value)}
                />
              </div>
              <ImageUpload
                label="Company Logo"
                value={content.logo}
                onChange={(value) => updateContent("logo", value)}
                description="Upload your company logo or provide a URL"
                previewClassName="w-32 h-32"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navigation / header labels */}
        <TabsContent value="navigation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Landing header</CardTitle>
              <CardDescription>Top navigation links and button labels (public site only).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hdr-signin">Sign in label</Label>
                  <Input
                    id="hdr-signin"
                    value={content.landingHeaderSignInLabel || ""}
                    onChange={(e) => updateContent("landingHeaderSignInLabel", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hdr-cta">Primary CTA label</Label>
                  <Input
                    id="hdr-cta"
                    value={content.landingHeaderCtaLabel || ""}
                    onChange={(e) => updateContent("landingHeaderCtaLabel", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nav links</Label>
                <p className="text-sm text-muted-foreground">Order matches left-to-right on desktop.</p>
                {(content.landingNavLinks || []).map((link, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-start">
                    <Input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => updateLandingNavLink(index, "label", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Href e.g. /#pricing"
                      value={link.href}
                      onChange={(e) => updateLandingNavLink(index, "href", e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLandingNavLink(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" onClick={addLandingNavLink} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add link
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Help Center (/help-center)</CardTitle>
              <CardDescription>
                Labels on the public Help Center (categories and videos still managed in Video admin).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sidebar heading</Label>
                <Input
                  value={content.videosPageSidebarTitle || ""}
                  onChange={(e) => updateContent("videosPageSidebarTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile “browse” button label</Label>
                <Input
                  value={content.videosPageBrowseMobileLabel || ""}
                  onChange={(e) => updateContent("videosPageBrowseMobileLabel", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>“More videos” section heading</Label>
                <Input
                  value={content.videosPageMoreHeading || ""}
                  onChange={(e) => updateContent("videosPageMoreHeading", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Empty state (no category selected)</Label>
                <Input
                  value={content.videosPageEmptySelect || ""}
                  onChange={(e) => updateContent("videosPageEmptySelect", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>“All videos in category” item template</Label>
                <Input
                  value={content.videosPageAllInCategoryTemplate || ""}
                  onChange={(e) => updateContent("videosPageAllInCategoryTemplate", e.target.value)}
                  placeholder="All videos – {name}"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Loading label</Label>
                  <Input
                    value={content.videosPageLoadingLabel || ""}
                    onChange={(e) => updateContent("videosPageLoadingLabel", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No videos message</Label>
                  <Input
                    value={content.videosPageNoVideosLabel || ""}
                    onChange={(e) => updateContent("videosPageNoVideosLabel", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No other in tab</Label>
                  <Input
                    value={content.videosPageNoOtherInTabLabel || ""}
                    onChange={(e) => updateContent("videosPageNoOtherInTabLabel", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Tab */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Customize your homepage hero section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heroTitle">Hero Title <span className="text-red-500">*</span></Label>
                <Input
                  id="heroTitle"
                  value={content.heroTitle}
                  onChange={(e) => updateContent("heroTitle", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                <Textarea
                  id="heroSubtitle"
                  value={content.heroSubtitle}
                  onChange={(e) => updateContent("heroSubtitle", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="heroCtaText">Primary CTA Text <span className="text-red-500">*</span></Label>
                  <Input
                    id="heroCtaText"
                    value={content.heroCtaText}
                    onChange={(e) => updateContent("heroCtaText", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroCtaLink">Primary CTA Link <span className="text-red-500">*</span></Label>
                  <Input
                    id="heroCtaLink"
                    value={content.heroCtaLink}
                    onChange={(e) => updateContent("heroCtaLink", e.target.value)}
                    required
                  />
                </div>
              </div>
              {/* <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="heroSecondaryCtaText">Secondary CTA Text</Label>
                  <Input
                    id="heroSecondaryCtaText"
                    value={content.heroSecondaryCtaText}
                    onChange={(e) => updateContent("heroSecondaryCtaText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroSecondaryCtaLink">Secondary CTA Link</Label>
                  <Input
                    id="heroSecondaryCtaLink"
                    value={content.heroSecondaryCtaLink}
                    onChange={(e) => updateContent("heroSecondaryCtaLink", e.target.value)}
                  />
                </div>
              </div> */}
              <div className="space-y-2">
                <Label htmlFor="heroDemoVideoUrl">Demo Video URL (YouTube)</Label>
                <Input
                  id="heroDemoVideoUrl"
                  value={content.heroDemoVideoUrl}
                  onChange={(e) => updateContent("heroDemoVideoUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                />
                <p className="text-sm text-muted-foreground">
                  Enter a YouTube video URL. Supports both watch and short URLs.
                </p>
              </div>
              <ImageUpload
                label="Hero Right Side Image"
                value={content.heroRightImage}
                onChange={(value) => updateContent("heroRightImage", value)}
                description="Upload the phone mockup or dashboard image shown on the right side"
                previewClassName="w-full h-64"
              />
              <ImageUpload
                label="Hero Background Image"
                value={content.heroBackgroundImage}
                onChange={(value) => {
                  console.log("[v0] Hero background image changed:", value)
                  updateContent("heroBackgroundImage", value)
                }}
                description="Upload a background image or provide a URL (optional)"
                previewClassName="w-full h-48"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trusted By Tab */}
        <TabsContent value="trusted" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trusted By Section</CardTitle>
              <CardDescription>Manage the trusted by section title and company logos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trustedByTitle">Section Title</Label>
                <Input
                  id="trustedByTitle"
                  value={content.trustedByTitle}
                  onChange={(e) => updateContent("trustedByTitle", e.target.value)}
                  placeholder="e.g., Trusted by 1000+ businesses"
                />
              </div>

              <div className="space-y-4">
                <Label>Company Logos</Label>
                {(content.trustedByLogos || []).length > 0 ? (
                  (content.trustedByLogos || []).map((logo, index) => (
                    <Card key={logo.id} className="gap-1">
                      <CardHeader>
                        <CardDescription className="flex justify-end">  <Button variant="ghost" size="sm" onClick={() => deleteTrustedByLogo(index)} className="ml-2">
                          <Trash2 className="h-4 w-4" />
                        </Button></CardDescription>
                      </CardHeader>
                      <CardContent className="md:pt-6 space-y-4">
                        <div className="space-y-2">
                          <Label>Company Name</Label>
                          <Input
                            value={logo.name}
                            onChange={(e) => updateTrustedByLogo(index, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <ImageUpload
                            label="Company Logo *"
                            value={logo.logo}
                            onChange={(value) => {
                              updateTrustedByLogo(index, "logo", value)

                              // ✅ clear error when user fixes it
                              if (logoErrors[index]) {
                                const newErrors = { ...logoErrors }
                                delete newErrors[index]
                                setLogoErrors(newErrors)
                              }
                            }}
                            description="Upload a logo (required)"
                            previewClassName="w-24 h-24"
                          />

                          {logoErrors[index] && (
                            <p className="text-sm text-red-500 mt-1">
                              {logoErrors[index]}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No company logos added yet. Click the button below to add one.
                  </p>
                )}
                <Button onClick={addTrustedByLogo} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company Logo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Features Section</CardTitle>
              <CardDescription>Showcase your platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-2 md:px-4">
              <div className="space-y-2">
                <Label htmlFor="featuresSectionBadge">Small badge above title</Label>
                <Input
                  id="featuresSectionBadge"
                  value={content.featuresSectionBadge || ""}
                  onChange={(e) => updateContent("featuresSectionBadge", e.target.value)}
                  placeholder="e.g. Features"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="featuresTitle">Section Title</Label>
                <Input
                  id="featuresTitle"
                  value={content.featuresTitle}
                  onChange={(e) => updateContent("featuresTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="featuresSubtitle">Section Subtitle</Label>
                <Textarea
                  id="featuresSubtitle"
                  value={content.featuresSubtitle}
                  onChange={(e) => updateContent("featuresSubtitle", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-4 mt-6">
                <Label>Features</Label>
                {(content.features || []).map((feature) => (
                  <Card key={feature.id}>
                    <CardHeader>
                      <CardDescription className="flex justify-end"> <Button variant="ghost" size="sm" onClick={() => deleteFeature(feature.id)} className="ml-2">
                        <Trash2 className="h-4 w-4" />
                      </Button></CardDescription>
                    </CardHeader>
                    <CardContent className="md:pt-6 md:space-y-4 md:px-4">
                      <div className="space-y-2">
                        <Label>Feature Title</Label>
                        <Input
                          value={feature.title}
                          onChange={(e) => updateFeature(feature.id, "title", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={feature.description}
                          onChange={(e) => updateFeature(feature.id, "description", e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon name (Lucide)</Label>
                        <Input
                          value={feature.icon || ""}
                          onChange={(e) => updateFeature(feature.id, "icon", e.target.value)}
                          placeholder="e.g. Shield, Zap, Star"
                        />
                      </div>
                      {/* <ImageUpload
                            label="Feature Image"
                            value={feature.image || ""}
                            onChange={(value) => updateFeature(feature.id, "image", value)}
                            description="Upload an image or provide a URL"
                            previewClassName="w-24 h-24"
                          /> */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Learn More Text</Label>
                          <Input
                            value={feature.learnMoreText || "Learn More"}
                            onChange={(e) => updateFeature(feature.id, "learnMoreText", e.target.value)}
                            placeholder="e.g., Learn More, Explore, View Details"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Learn More URL</Label>
                          <Input
                            value={feature.learnMoreUrl || ""}
                            onChange={(e) => updateFeature(feature.id, "learnMoreUrl", e.target.value)}
                            placeholder="e.g., /features/financial-management"
                          />
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                ))}
                <Button onClick={addFeature} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Industries Tab */}
        <TabsContent value="industries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Industries Section</CardTitle>
              <CardDescription>Showcase industries you serve</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="industriesTitle">Section Title</Label>
                <Input
                  id="industriesTitle"
                  value={content.industriesTitle}
                  onChange={(e) => updateContent("industriesTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industriesSubtitle">Section Subtitle</Label>
                <Textarea
                  id="industriesSubtitle"
                  value={content.industriesSubtitle}
                  onChange={(e) => updateContent("industriesSubtitle", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-4 mt-6">
                <Label>Industries</Label>
                {(content.industries || []).map((industry) => (
                  <Card key={industry.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Industry Title</Label>
                              <Input
                                value={industry.title}
                                onChange={(e) => updateIndustry(industry.id, "title", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Icon Name</Label>
                              <Input
                                value={industry.icon}
                                onChange={(e) => updateIndustry(industry.id, "icon", e.target.value)}
                                placeholder="e.g., Truck, ShoppingBag, Utensils"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={industry.description}
                              onChange={(e) => updateIndustry(industry.id, "description", e.target.value)}
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Gradient Colors</Label>
                            <Input
                              value={industry.gradient}
                              onChange={(e) => updateIndustry(industry.id, "gradient", e.target.value)}
                              placeholder="e.g., from-blue-500 via-blue-600 to-blue-700"
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteIndustry(industry.id)} className="ml-2">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button onClick={addIndustry} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Industry
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Showcase Tab */}
        <TabsContent value="showcase" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Showcase Section</CardTitle>
              <CardDescription>Highlight your platform capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="showcaseSubtitle">Badge Text</Label>
                <Input
                  id="showcaseSubtitle"
                  value={content.showcaseSubtitle}
                  onChange={(e) => updateContent("showcaseSubtitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="showcaseTitle">Section Title</Label>
                <Input
                  id="showcaseTitle"
                  value={content.showcaseTitle}
                  onChange={(e) => updateContent("showcaseTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="showcaseDescription">Description</Label>
                <Textarea
                  id="showcaseDescription"
                  value={content.showcaseDescription}
                  onChange={(e) => updateContent("showcaseDescription", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-4 mt-6">
                <Label>Features List</Label>
                {(content.showcaseFeatures || []).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={feature} onChange={(e) => updateShowcaseFeature(index, e.target.value)} />
                    <Button variant="ghost" size="sm" onClick={() => deleteShowcaseFeature(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addShowcaseFeature} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="text-base font-semibold">Preview card (right column)</h3>
                <p className="text-sm text-muted-foreground">
                  Optional mock dashboard card beside the main copy.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Card title</Label>
                    <Input
                      value={content.showcaseCardTitle || ""}
                      onChange={(e) => updateContent("showcaseCardTitle", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Card badge</Label>
                    <Input
                      value={content.showcaseCardBadge || ""}
                      onChange={(e) => updateContent("showcaseCardBadge", e.target.value)}
                    />
                  </div>
                </div>
                <Label>Top stats (3 columns)</Label>
                {(content.showcaseCardStats || []).map((row, index) => (
                  <div key={index} className="flex flex-wrap gap-2 items-center">
                    <Input
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) => updateShowcaseStat(index, "label", e.target.value)}
                      className="flex-1 min-w-[120px]"
                    />
                    <Input
                      placeholder="Value"
                      value={row.value}
                      onChange={(e) => updateShowcaseStat(index, "value", e.target.value)}
                      className="flex-1 min-w-[120px]"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeShowcaseStat(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" onClick={addShowcaseStat} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add stat
                </Button>

                <div className="space-y-2">
                  <Label>Financial block title</Label>
                  <Input
                    value={content.showcaseFinanceTitle || ""}
                    onChange={(e) => updateContent("showcaseFinanceTitle", e.target.value)}
                  />
                </div>
                {(content.showcaseFinanceRows || []).map((row, index) => (
                  <div key={index} className="flex flex-wrap gap-2 items-center">
                    <Input
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) => updateShowcaseFinanceRow(index, "label", e.target.value)}
                      className="flex-1 min-w-[100px]"
                    />
                    <Input
                      placeholder="Value"
                      value={row.value}
                      onChange={(e) => updateShowcaseFinanceRow(index, "value", e.target.value)}
                      className="flex-1 min-w-[80px]"
                    />
                    <Input
                      placeholder="Trend e.g. +12%"
                      value={row.trend}
                      onChange={(e) => updateShowcaseFinanceRow(index, "trend", e.target.value)}
                      className="w-24"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeShowcaseFinanceRow(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" onClick={addShowcaseFinanceRow} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add row
                </Button>

                <div className="space-y-2">
                  <Label>Activity block title</Label>
                  <Input
                    value={content.showcaseActivityTitle || ""}
                    onChange={(e) => updateContent("showcaseActivityTitle", e.target.value)}
                  />
                </div>
                {(content.showcaseActivityLines || []).map((line, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={line}
                      onChange={(e) => updateShowcaseActivityLine(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeShowcaseActivityLine(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" onClick={addShowcaseActivityLine} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add activity line
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Testimonials Section</CardTitle>
              <CardDescription>Manage customer testimonials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testimonialsTitle">Section Title</Label>
                <Input
                  id="testimonialsTitle"
                  value={content.testimonialsTitle}
                  onChange={(e) => updateContent("testimonialsTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testimonialsSubtitle">Section Subtitle</Label>
                <Textarea
                  id="testimonialsSubtitle"
                  value={content.testimonialsSubtitle}
                  onChange={(e) => updateContent("testimonialsSubtitle", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-4 mt-6">
                <Label>Testimonials</Label>
                {(content.testimonials || []).map((testimonial) => (
                  <Card key={testimonial.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Company Name</Label>
                              <Input
                                value={testimonial.company}
                                onChange={(e) => updateTestimonial(testimonial.id, "company", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Logo Text</Label>
                              <Input
                                value={testimonial.logo}
                                onChange={(e) => updateTestimonial(testimonial.id, "logo", e.target.value)}
                                placeholder="e.g., YB, FM"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Author Name</Label>
                              <Input
                                value={testimonial.author}
                                onChange={(e) => updateTestimonial(testimonial.id, "author", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Author Role</Label>
                              <Input
                                value={testimonial.role}
                                onChange={(e) => updateTestimonial(testimonial.id, "role", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Testimonial Content</Label>
                            <Textarea
                              value={testimonial.content}
                              onChange={(e) => updateTestimonial(testimonial.id, "content", e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rating (1-5)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              value={testimonial.rating}
                              onChange={(e) =>
                                updateTestimonial(testimonial.id, "rating", Number.parseInt(e.target.value))
                              }
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTestimonial(testimonial.id)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button onClick={addTestimonial} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Testimonial
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Section</CardTitle>
              <CardDescription>Customize pricing section text (plans are managed separately)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pricingTitle">Section Title</Label>
                <Input
                  id="pricingTitle"
                  value={content.pricingTitle}
                  onChange={(e) => updateContent("pricingTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricingSubtitle">Section Subtitle</Label>
                <Textarea
                  id="pricingSubtitle"
                  value={content.pricingSubtitle}
                  onChange={(e) => updateContent("pricingSubtitle", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricingFooterText">Footer Text</Label>
                <Input
                  id="pricingFooterText"
                  value={content.pricingFooterText}
                  onChange={(e) => updateContent("pricingFooterText", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Use {"{trialDays}"} for dynamic trial length.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Monthly tab label</Label>
                  <Input
                    value={content.pricingMonthlyLabel || ""}
                    onChange={(e) => updateContent("pricingMonthlyLabel", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yearly tab label</Label>
                  <Input
                    value={content.pricingYearlyLabel || ""}
                    onChange={(e) => updateContent("pricingYearlyLabel", e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Yearly save badge</Label>
                  <Input
                    value={content.pricingYearlySaveTemplate || ""}
                    onChange={(e) => updateContent("pricingYearlySaveTemplate", e.target.value)}
                    placeholder="Save {yearlyDiscount}%"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Corner trial badge (non-enterprise)</Label>
                  <Input
                    value={content.pricingPlanTrialBadgeTemplate || ""}
                    onChange={(e) => updateContent("pricingPlanTrialBadgeTemplate", e.target.value)}
                    placeholder="{trialDays}-Day Free Trial"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Popular ribbon text</Label>
                  <Input
                    value={content.pricingPopularRibbonText || ""}
                    onChange={(e) => updateContent("pricingPopularRibbonText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Popular plan name (exact match)</Label>
                  <Input
                    value={content.pricingPopularPlanName || ""}
                    onChange={(e) => updateContent("pricingPopularPlanName", e.target.value)}
                    placeholder="Premium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Enterprise plan name (exact match)</Label>
                  <Input
                    value={content.pricingEnterprisePlanName || ""}
                    onChange={(e) => updateContent("pricingEnterprisePlanName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Enterprise price display</Label>
                  <Input
                    value={content.pricingEnterpriseDisplayPrice || ""}
                    onChange={(e) => updateContent("pricingEnterpriseDisplayPrice", e.target.value)}
                    placeholder="Custom"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Enterprise subtext</Label>
                  <Input
                    value={content.pricingEnterpriseDisplaySubtext || ""}
                    onChange={(e) => updateContent("pricingEnterpriseDisplaySubtext", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact sales button</Label>
                  <Input
                    value={content.pricingContactSalesLabel || ""}
                    onChange={(e) => updateContent("pricingContactSalesLabel", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Get started button</Label>
                  <Input
                    value={content.pricingGetStartedLabel || ""}
                    onChange={(e) => updateContent("pricingGetStartedLabel", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per month caption</Label>
                  <Input
                    value={content.pricingPerMonthLabel || ""}
                    onChange={(e) => updateContent("pricingPerMonthLabel", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per year caption</Label>
                  <Input
                    value={content.pricingPerYearLabel || ""}
                    onChange={(e) => updateContent("pricingPerYearLabel", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>FAQ Section</CardTitle>
              <CardDescription>Manage frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="faqSectionBadge">Small badge above title</Label>
                <Input
                  id="faqSectionBadge"
                  value={content.faqSectionBadge || ""}
                  onChange={(e) => updateContent("faqSectionBadge", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faqTitle">Section Title</Label>
                <Input
                  id="faqTitle"
                  value={content.faqTitle}
                  onChange={(e) => updateContent("faqTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faqSubtitle">Section Subtitle</Label>
                <Input
                  id="faqSubtitle"
                  value={content.faqSubtitle}
                  onChange={(e) => updateContent("faqSubtitle", e.target.value)}
                />
              </div>

              <div className="space-y-4 mt-6">
                <Label>FAQs</Label>
                {(content.faqs || []).map((faq) => (
                  <Card key={faq.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <Label>Question</Label>
                            <Input
                              value={faq.question}
                              onChange={(e) => updateFAQ(faq.id, "question", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Answer</Label>
                            <Textarea
                              value={faq.answer}
                              onChange={(e) => updateFAQ(faq.id, "answer", e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteFAQ(faq.id)} className="ml-2">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button onClick={addFAQ} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add FAQ
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA Tab */}
        <TabsContent value="cta" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call-to-Action Section</CardTitle>
              <CardDescription>Customize the final CTA section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ctaTitle">Section Title</Label>
                <Input
                  id="ctaTitle"
                  value={content.ctaTitle}
                  onChange={(e) => updateContent("ctaTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaSubtitle">Section Subtitle</Label>
                <Textarea
                  id="ctaSubtitle"
                  value={content.ctaSubtitle}
                  onChange={(e) => updateContent("ctaSubtitle", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaPrimaryText">Primary Button Text</Label>
                  <Input
                    id="ctaPrimaryText"
                    value={content.ctaPrimaryText}
                    onChange={(e) => updateContent("ctaPrimaryText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaPrimaryLink">Primary Button Link</Label>
                  <Input
                    id="ctaPrimaryLink"
                    value={content.ctaPrimaryLink}
                    onChange={(e) => updateContent("ctaPrimaryLink", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaSecondaryText">Secondary Button Text</Label>
                  <Input
                    id="ctaSecondaryText"
                    value={content.ctaSecondaryText}
                    onChange={(e) => updateContent("ctaSecondaryText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaSecondaryLink">Secondary Button Link</Label>
                  <Input
                    id="ctaSecondaryLink"
                    value={content.ctaSecondaryLink}
                    onChange={(e) => updateContent("ctaSecondaryLink", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <Label>Features List</Label>
                {(content.ctaFeatures || []).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={feature} onChange={(e) => updateCTAFeature(index, e.target.value)} />
                    <Button variant="ghost" size="sm" onClick={() => deleteCTAFeature(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addCTAFeature} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Footer settings</CardTitle>
              <CardDescription>Footer logo shown on the public site footer (separate from header logo).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                label="Footer logo"
                value={content.footerLogo || ""}
                onChange={(value) => updateContent("footerLogo", value)}
                description="Upload footer logo or provide an image URL"
                previewClassName="w-32 h-32"
              />
              <div className="space-y-2">
                <Label htmlFor="footerCopyright">Copyright / bottom text</Label>
                <Input
                  id="footerCopyright"
                  value={content.footerCopyright || ""}
                  onChange={(e) => updateContent("footerCopyright", e.target.value)}
                  placeholder="e.g. © 2025 Company Name. All rights reserved."
                />
                <p className="text-sm text-muted-foreground">
                  Shown centered below the footer columns. Address and contact details come from the{" "}
                  <strong>Contact</strong> tab (address appears in the main footer column).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Us public page (/about-us) */}
        <TabsContent value="about-page" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Us page</CardTitle>
              <CardDescription>Public URL: /about-us — hero, text, images, and content blocks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const about = normalizeAboutUsPage(content.aboutUsPage)
                return (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="about-pageTitle">Page title (browser / SEO)</Label>
                      <Input
                        id="about-pageTitle"
                        value={about.pageTitle}
                        onChange={(e) => mergeAboutUs({ pageTitle: e.target.value })}
                      />
                    </div>
                    <ImageUpload
                      label="Hero image"
                      value={about.heroImage}
                      onChange={(v) => mergeAboutUs({ heroImage: v })}
                      description="Wide banner image for the top of the page"
                      previewClassName="h-40 w-full max-w-xl object-cover rounded-md"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="about-heroAlt">Hero image alt text</Label>
                      <Input
                        id="about-heroAlt"
                        value={about.heroImageAlt}
                        onChange={(e) => mergeAboutUs({ heroImageAlt: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="about-heroHeading">Hero heading</Label>
                      <Input
                        id="about-heroHeading"
                        value={about.heroHeading}
                        onChange={(e) => mergeAboutUs({ heroHeading: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="about-heroSub">Hero subheading</Label>
                      <Textarea
                        id="about-heroSub"
                        value={about.heroSubheading}
                        onChange={(e) => mergeAboutUs({ heroSubheading: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="border-t pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Content blocks</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addAboutBlock}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add block
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Each block can include a heading, body (use blank lines for paragraphs), and an image. Blocks
                        alternate left/right on the live site.
                      </p>
                      {about.blocks.map((block, idx) => (
                        <Card key={block.id} className="bg-muted/30">
                          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm">Block {idx + 1}</CardTitle>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeAboutBlock(block.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label>Heading</Label>
                              <Input
                                value={block.heading}
                                onChange={(e) => updateAboutBlock(block.id, "heading", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Body</Label>
                              <Textarea
                                value={block.body}
                                onChange={(e) => updateAboutBlock(block.id, "body", e.target.value)}
                                rows={5}
                              />
                            </div>
                            <ImageUpload
                              label="Image"
                              value={block.image}
                              onChange={(v) => updateAboutBlock(block.id, "image", v)}
                              previewClassName="h-32 w-full max-w-md object-cover rounded-md"
                            />
                            <div className="space-y-2">
                              <Label>Image alt text</Label>
                              <Input
                                value={block.imageAlt}
                                onChange={(e) => updateAboutBlock(block.id, "imageAlt", e.target.value)}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Public Contact page (/contact) */}
        <TabsContent value="contact-page" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact page</CardTitle>
              <CardDescription>
                Public URL: /contact — separate from site contact details in the Contact tab (email, phone, address for
                footer).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const pub = normalizePublicContactPage(content.publicContactPage)
                return (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="contact-pub-title">Page title</Label>
                      <Input
                        id="contact-pub-title"
                        value={pub.pageTitle}
                        onChange={(e) => mergePublicContact({ pageTitle: e.target.value })}
                      />
                    </div>
                    <ImageUpload
                      label="Hero image"
                      value={pub.heroImage}
                      onChange={(v) => mergePublicContact({ heroImage: v })}
                      description="Banner for the contact page"
                      previewClassName="h-40 w-full max-w-xl object-cover rounded-md"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="contact-heroAlt">Hero image alt text</Label>
                      <Input
                        id="contact-heroAlt"
                        value={pub.heroImageAlt}
                        onChange={(e) => mergePublicContact({ heroImageAlt: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-intro-h">Introduction heading</Label>
                      <Input
                        id="contact-intro-h"
                        value={pub.introHeading}
                        onChange={(e) => mergePublicContact({ introHeading: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-intro-body">Introduction body</Label>
                      <Textarea
                        id="contact-intro-body"
                        value={pub.introBody}
                        onChange={(e) => mergePublicContact({ introBody: e.target.value })}
                        rows={5}
                      />
                    </div>
                    <div className="border-t pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Content blocks</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addContactBlock}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add block
                        </Button>
                      </div>
                      {pub.blocks.map((block, idx) => (
                        <Card key={block.id} className="bg-muted/30">
                          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm">Block {idx + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContactBlock(block.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label>Heading</Label>
                              <Input
                                value={block.heading}
                                onChange={(e) => updateContactBlock(block.id, "heading", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Body</Label>
                              <Textarea
                                value={block.body}
                                onChange={(e) => updateContactBlock(block.id, "body", e.target.value)}
                                rows={5}
                              />
                            </div>
                            <ImageUpload
                              label="Image"
                              value={block.image}
                              onChange={(v) => updateContactBlock(block.id, "image", v)}
                              previewClassName="h-32 w-full max-w-md object-cover rounded-md"
                            />
                            <div className="space-y-2">
                              <Label>Image alt text</Label>
                              <Input
                                value={block.imageAlt}
                                onChange={(e) => updateContactBlock(block.id, "imageAlt", e.target.value)}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Update your contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={content.contactEmail}
                  onChange={(e) => updateContent("contactEmail", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  value={content.contactPhone}
                  onChange={(e) => updateContent("contactPhone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactAddress">Address</Label>
                <Textarea
                  id="contactAddress"
                  value={content.contactAddress}
                  onChange={(e) => updateContent("contactAddress", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Add your social media links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="socialFacebook">Facebook URL</Label>
                <Input
                  id="socialFacebook"
                  value={content.socialFacebook || ""}
                  onChange={(e) => updateContent("socialFacebook", e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="socialTwitter">Twitter URL</Label>
                <Input
                  id="socialTwitter"
                  value={content.socialTwitter || ""}
                  onChange={(e) => updateContent("socialTwitter", e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="socialLinkedin">LinkedIn URL</Label>
                <Input
                  id="socialLinkedin"
                  value={content.socialLinkedin || ""}
                  onChange={(e) => updateContent("socialLinkedin", e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="socialInstagram">Instagram URL</Label>
                <Input
                  id="socialInstagram"
                  value={content.socialInstagram || ""}
                  onChange={(e) => updateContent("socialInstagram", e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loader Tab */}
        <TabsContent value="loader" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Loader</CardTitle>
              <CardDescription>
                Customize the loading animation shown across the application while pages load.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Loader Type</Label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {(
                    [
                      { value: "spinner", label: "Spinner", desc: "Animated circle spinner" },
                      { value: "logo", label: "Logo Pulse", desc: "Your logo with pulse animation" },
                      { value: "custom", label: "Custom GIF/Image", desc: "Upload a custom animated GIF" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateContent("loaderType", opt.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${(content.loaderType || "spinner") === opt.value
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {(content.loaderType === "logo" || content.loaderType === "custom") && (
                <ImageUpload
                  label={content.loaderType === "logo" ? "Logo Image" : "Custom Loader Image / GIF"}
                  value={content.loaderImage || ""}
                  onChange={(value) => updateContent("loaderImage", value)}
                  description={
                    content.loaderType === "logo"
                      ? "Upload your logo (PNG/SVG). It will pulse while loading."
                      : "Upload an animated GIF or image to show as the loader."
                  }
                  previewClassName="w-24 h-24"
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="loaderText">Loading Text</Label>
                <Input
                  id="loaderText"
                  value={content.loaderText || ""}
                  onChange={(e) => updateContent("loaderText", e.target.value)}
                  placeholder="Loading…"
                />
                <p className="text-sm text-muted-foreground">Text shown below the loader animation. Leave empty to hide.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loaderSpinnerColor">Spinner / Accent Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="loaderSpinnerColor"
                      value={content.loaderSpinnerColor || ""}
                      onChange={(e) => updateContent("loaderSpinnerColor", e.target.value)}
                      placeholder="#6366f1"
                    />
                    <input
                      type="color"
                      value={content.loaderSpinnerColor || "#6366f1"}
                      onChange={(e) => updateContent("loaderSpinnerColor", e.target.value)}
                      className="h-10 w-10 rounded cursor-pointer border border-gray-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loaderBgColor">Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="loaderBgColor"
                      value={content.loaderBgColor || ""}
                      onChange={(e) => updateContent("loaderBgColor", e.target.value)}
                      placeholder="transparent"
                    />
                    <input
                      type="color"
                      value={content.loaderBgColor || "#ffffff"}
                      onChange={(e) => updateContent("loaderBgColor", e.target.value)}
                      className="h-10 w-10 rounded cursor-pointer border border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Live preview */}
              <div className="border-t pt-6">
                <Label className="text-base font-semibold">Preview</Label>
                <div
                  className="mt-3 rounded-lg border flex flex-col items-center justify-center gap-3 py-12"
                  style={{
                    backgroundColor: content.loaderBgColor || "#ffffff",
                  }}
                >
                  {(content.loaderType || "spinner") === "spinner" && (
                    <div
                      className="h-10 w-10 rounded-full border-[3px] border-gray-200 animate-spin"
                      style={{ borderTopColor: content.loaderSpinnerColor || "#6366f1" }}
                    />
                  )}
                  {(content.loaderType === "logo" || content.loaderType === "custom") &&
                    content.loaderImage ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={content.loaderImage}
                        alt="Loader preview"
                        className={
                          content.loaderType === "logo"
                            ? "h-16 w-16 object-contain animate-pulse"
                            : "h-20 w-auto object-contain"
                        }
                      />
                      {content.loaderType === "logo" && (
                        <div className="h-1 w-24 rounded-full overflow-hidden bg-gray-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: content.loaderSpinnerColor || "#6366f1",
                              animation: "loaderBar 1.5s ease-in-out infinite",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (content.loaderType === "logo" || content.loaderType === "custom") ? (
                    <p className="text-sm text-muted-foreground italic">Upload an image above to preview</p>
                  ) : null}
                  {(content.loaderText || "Loading…") && (
                    <p className="text-sm text-gray-500">{content.loaderText || "Loading…"}</p>
                  )}
                </div>
              </div>

              <style>{`
                @keyframes loaderBar {
                  0% { width: 0%; margin-left: 0; }
                  50% { width: 60%; margin-left: 20%; }
                  100% { width: 0%; margin-left: 100%; }
                }
              `}</style>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
