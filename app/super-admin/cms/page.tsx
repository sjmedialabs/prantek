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
import { WebsiteContent } from "@/lib/models/types"

export default function CMSPage() {
  const [content, setContent] = useState<WebsiteContent | null>(null)
  const [loading, setLoading] = useState(true)

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
        
        const normalizedContent = {
          ...websiteContent,
          trustedByLogos: websiteContent.trustedByLogos || [],
          features: websiteContent.features || [],
          industries: websiteContent.industries || [],
          showcaseFeatures: websiteContent.showcaseFeatures || [],
          testimonials: websiteContent.testimonials || [],
          faqs: websiteContent.faqs || [],
          ctaFeatures: websiteContent.ctaFeatures || [],
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

  try {
    const { _id, id, updatedAt, ...contentData } = content as any

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
      }
      setContent(normalizedContent)
    }
    toast.success("Website content updated successfully!")
  } catch (error) {
    console.error("Failed to save content:", error)
    toast.error("Failed to save content")
  }
}


  const updateContent = (field: keyof WebsiteContent, value: any) => {
    if (!content) return
    setContent({ ...content, [field]: value })
  }

  // Feature management
  const addFeature = () => {
    if (!content) return
    const newFeature = {
      id: Date.now().toString(),
      title: "New Feature",
      description: "Feature description",
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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="trusted">Trusted By</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="industries">Industries</TabsTrigger>
          <TabsTrigger value="showcase">Showcase</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Input
                  id="footerText"
                  value={content.footerText}
                  onChange={(e) => updateContent("footerText", e.target.value)}
                />
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
              <div className="grid grid-cols-2 gap-4">
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
              </div>
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
                    <Card key={logo.id}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <Label>Company Name</Label>
                              <Input
                                value={logo.name}
                                onChange={(e) => updateTrustedByLogo(index, "name", e.target.value)}
                              />
                            </div>
                            <ImageUpload
                              label="Company Logo"
                              value={logo.logo}
                              onChange={(value) => updateTrustedByLogo(index, "logo", value)}
                              description="Upload a logo or provide a URL (leave empty to show text only)"
                              previewClassName="w-24 h-24"
                            />
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteTrustedByLogo(index)} className="ml-2">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
            <CardContent className="space-y-4">
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
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
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
                          <ImageUpload
                            label="Feature Image"
                            value={feature.image || feature.icon || ""}
                            onChange={(value) => updateFeature(feature.id, "image", value)}
                            description="Upload an image or provide a URL"
                            previewClassName="w-24 h-24"
                          />
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
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteFeature(feature.id)} className="ml-2">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      </Tabs>
    </div>
  )
}
