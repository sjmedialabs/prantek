"use client"

import { useState, useEffect } from "react"
import { LandingHeader } from "@/components/landing-header"
import { LandingFooter } from "@/components/landing-footer"
import { ChevronDown, ChevronRight, Play, X, ArrowLeft } from "lucide-react"
import { api } from "@/lib/api-client"
import type { WebsiteContent } from "@/lib/models/types"

type VideoItem = {
  id: string
  title: string
  description: string
  youtubeUrl: string
  tab: string
  duration: string | null
}
type Category = {
  id: string
  name: string
  videos: VideoItem[]
}

function getYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null
  const trimmed = url.trim()
  const m1 = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (m1) return m1[1]
  const m2 = trimmed.match(/^([a-zA-Z0-9_-]{11})$/)
  return m2 ? m2[1] : null
}

function tabsForCategory(cat: Category): string[] {
  const keys = Array.from(new Set((cat.videos || []).map((v) => v.tab || "All")))
  return keys.sort()
}

export default function HelpCenterPage() {
  const [cms, setCms] = useState<WebsiteContent | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const [featuredVideo, setFeaturedVideo] = useState<VideoItem | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [res, wc] = await Promise.all([
          fetch("/api/videos"),
          api.websiteContent.getAll().then((rows) => (rows[0] || null) as WebsiteContent | null),
        ])
        setCms(wc)
        const data = await res.json()
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories)
          const first = data.categories[0]
          if (first && first.videos?.length > 0) {
            setSelectedCategoryId(first.id)
            setExpandedCategoryId(first.id)
            setFeaturedVideo(first.videos[0])
          }
        }
      } catch (e) {
        console.error("Failed to load help center", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const currentFeatured =
    featuredVideo && selectedCategory?.videos?.some((v) => v.id === featuredVideo.id)
      ? featuredVideo
      : selectedCategory?.videos?.[0] ?? null
  const featuredId = getYouTubeVideoId(currentFeatured?.youtubeUrl || "")

  const vSidebar = cms?.videosPageSidebarTitle?.trim() ?? ""
  const vBrowse = cms?.videosPageBrowseMobileLabel?.trim() ?? ""
  const vEmpty = cms?.videosPageEmptySelect?.trim() ?? ""
  const vLoading = cms?.videosPageLoadingLabel?.trim() ?? ""
  const vNoVideos = cms?.videosPageNoVideosLabel?.trim() ?? ""

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 flex relative">
        <aside
          className={`w-72 max-w-[85vw] border-r border-gray-200 bg-white flex-shrink-0 min-h-[calc(100vh-4rem)] ${
            mobileMenuOpen ? "absolute inset-y-0 left-0 z-50 shadow-xl" : "hidden"
          } md:block md:static md:shadow-none`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              {vSidebar ? (
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{vSidebar}</h2>
              ) : (
                <span className="text-sm text-transparent">.</span>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {loading ? (
              vLoading ? (
                <p className="text-sm text-gray-500">{vLoading}</p>
              ) : null
            ) : categories.length === 0 ? (
              vNoVideos ? (
                <p className="text-sm text-gray-500">{vNoVideos}</p>
              ) : null
            ) : (
              <ul className="space-y-0.5">
                {categories.map((cat) => {
                  const isExpanded = expandedCategoryId === cat.id
                  const isSelectedCat = selectedCategoryId === cat.id
                  const tabKeys = tabsForCategory(cat)
                  return (
                    <li key={cat.id}>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 shrink-0 rounded-md hover:bg-gray-50"
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? "Collapse section" : "Expand section"}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(cat.id)
                            setExpandedCategoryId(cat.id)
                            if (cat.videos?.length) {
                              setFeaturedVideo(cat.videos[0])
                            }
                            setMobileMenuOpen(false)
                          }}
                          className={`flex-1 text-left py-2 px-2 rounded-md text-sm font-medium min-w-0 ${
                            isSelectedCat ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {cat.name}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="ml-4 pl-2 border-l border-gray-200 mt-1 pb-2 space-y-2">
                          {tabKeys.map((tab) => {
                            const tabVideos = (cat.videos || []).filter((v) => (v.tab || "All") === tab)
                            return (
                              <div key={`${cat.id}-${tab}`}>
                                {tabKeys.length > 1 ? (
                                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-2 py-1.5">
                                    {tab}
                                  </div>
                                ) : null}
                                <ul className="space-y-0.5">
                                  {tabVideos.map((v) => {
                                    const isVid = featuredVideo?.id === v.id && selectedCategoryId === cat.id
                                    return (
                                      <li key={v.id}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedCategoryId(cat.id)
                                            setFeaturedVideo(v)
                                            setMobileMenuOpen(false)
                                          }}
                                          className={`w-full text-left flex items-start gap-2 py-1.5 px-2 rounded-md text-sm transition-colors min-w-0 ${
                                            isVid
                                              ? "bg-blue-50 text-blue-800 font-medium"
                                              : "text-gray-600 hover:bg-gray-50"
                                          }`}
                                        >
                                          <Play className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
                                          <span className="leading-snug">{v.title}</span>
                                        </button>
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="md:hidden p-4 bg-white border-b sticky top-0 z-10">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-2 text-gray-700 font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              {vBrowse ? <span>{vBrowse}</span> : null}
            </button>
          </div>

          <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{vSidebar}</h1>
            {!selectedCategory ? (
              <div className="py-12 text-center text-gray-500">
                {loading ? vLoading || null : vEmpty || null}
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-gray-500">{selectedCategory.name}</p>
                {currentFeatured ? (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      {currentFeatured.title}
                      {currentFeatured.duration ? (
                        <span className="text-gray-500 font-normal ml-2">({currentFeatured.duration})</span>
                      ) : null}
                    </h2>
                    {featuredId ? (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
                        <iframe
                          title={currentFeatured.title}
                          src={`https://www.youtube.com/embed/${featuredId}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : null}
                    {currentFeatured.description ? (
                      <p className="text-gray-600 text-sm leading-relaxed">{currentFeatured.description}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No video in this topic yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
