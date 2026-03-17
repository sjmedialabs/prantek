"use client"

import { useState, useEffect } from "react"
import { LandingHeader } from "@/components/landing-header"
import { LandingFooter } from "@/components/landing-footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, ChevronRight, Play, Menu, X, ArrowLeft } from "lucide-react"

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

export default function VideosPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const [featuredVideo, setFeaturedVideo] = useState<VideoItem | null>(null)
  const [activeTab, setActiveTab] = useState("All")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/videos")
        const data = await res.json()
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories)
          const first = data.categories[0]
          if (first && first.videos?.length > 0) {
            setSelectedCategoryId(first.id)
            setExpandedCategoryId(first.id)
            setFeaturedVideo(first.videos[0])
            setActiveTab((first.videos[0].tab as string) || "All")
          }
        }
      } catch (e) {
        console.error("Failed to load videos", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const tabs = selectedCategory
    ? Array.from(new Set(selectedCategory.videos.map((v) => v.tab || "All"))).sort()
    : []
  if (tabs.length === 0) tabs.push("All")

  // Featured video: use clicked one if in current tab, else first in current tab
  const tabVideosForFeatured = selectedCategory
    ? (selectedCategory.videos || []).filter((v) => (v.tab || "All") === activeTab)
    : []
  const currentFeatured =
    featuredVideo && (featuredVideo.tab || "All") === activeTab
      ? featuredVideo
      : tabVideosForFeatured[0] ?? null
  const featuredId = getYouTubeVideoId(currentFeatured?.youtubeUrl || "")

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 flex relative">
        {/* Left sidebar - menu categories */}
        <aside className={`w-64 border-r border-gray-200 bg-white flex-shrink-0 min-h-[calc(100vh-4rem)] ${
          mobileMenuOpen ? "absolute inset-y-0 left-0 z-50 shadow-xl" : "hidden"
        } md:block md:static md:shadow-none`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Video library</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-1 text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500">No videos yet.</p>
            ) : (
              <ul className="space-y-0.5">
                {categories.map((cat) => {
                  const isExpanded = expandedCategoryId === cat.id
                  const isSelected = selectedCategoryId === cat.id
                  return (
                    <li key={cat.id}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                          className="p-1 text-gray-500 hover:text-gray-700"
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
                            setActiveTab((cat.videos[0].tab as string) || "All")
                          }
                          setMobileMenuOpen(false)
                          }}
                          className={`flex-1 text-left py-2 px-2 rounded-md text-sm font-medium ${isSelected ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          {cat.name}
                        </button>
                      </div>
                      {isExpanded && (
                        <ul className="ml-6 mt-0.5 space-y-0.5 pb-2">
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategoryId(cat.id)
                                if (cat.videos?.length) {
                                setFeaturedVideo(cat.videos[0])
                                setActiveTab((cat.videos[0].tab as string) || "All")
                              }
                              setMobileMenuOpen(false)
                              }}
                              className={`text-left w-full py-1.5 px-2 rounded text-sm ${isSelected ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
                            >
                              All videos – {cat.name}
                            </button>
                          </li>
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Right content - heading, tabs, featured video + list */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {/* Mobile toggle */}
          <div className="md:hidden p-4 bg-white border-b sticky top-0 z-10">
            <button onClick={() => setMobileMenuOpen(true)} className="flex items-center gap-2 text-gray-700 font-medium">
              <ArrowLeft className="h-5 w-5" />
              <span>Browse Categories</span>
            </button>
          </div>

          <div className="max-w-4xl mx-auto p-6">
            {!selectedCategory ? (
              <div className="py-12 text-center text-gray-500">
                {loading ? "Loading…" : "Select a category from the left."}
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">{selectedCategory.name}</h1>

                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setFeaturedVideo(null); }} className="w-full">
                  <TabsList className="mb-4 overflow-x-auto w-full">
                    {tabs.map((tab) => (
                      <TabsTrigger key={tab} value={tab}>
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {tabs.map((tab) => {
                    const tabVideos = (selectedCategory.videos || []).filter((v) => (v.tab || "All") === tab)
                    const featuredInTab = tab === activeTab ? currentFeatured : tabVideos[0]
                    const featuredIdTab = getYouTubeVideoId(featuredInTab?.youtubeUrl || "")

                    return (
                      <TabsContent key={tab} value={tab} className="space-y-6 mt-0">
                        {/* Featured video */}
                        {featuredInTab && (
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-1">
                              {featuredInTab.title}
                              {featuredInTab.duration && (
                                <span className="text-gray-500 font-normal ml-2">({featuredInTab.duration})</span>
                              )}
                            </h2>
                            {featuredIdTab && (
                              <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
                                <iframe
                                  title={featuredInTab.title}
                                  src={`https://www.youtube.com/embed/${featuredIdTab}`}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                            {featuredInTab.description && (
                              <p className="text-gray-600 text-sm">{featuredInTab.description}</p>
                            )}
                          </div>
                        )}

                        {/* List of other videos in this tab */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">More in this section</h3>
                          <ul className="space-y-2">
                            {tabVideos
                              .filter((v) => v.id !== featuredInTab?.id)
                              .map((v) => (
                                <li key={v.id}>
                                  <button
                                    type="button"
                                    onClick={() => setFeaturedVideo(v)}
                                    className="w-full flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left hover:bg-gray-50 hover:border-blue-200 transition-colors"
                                  >
                                    <span className="flex-shrink-0 w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                      <Play className="h-5 w-5 text-gray-600" />
                                    </span>
                                    <span className="flex-1 font-medium text-gray-900 truncate">{v.title}</span>
                                    {v.duration && <span className="text-sm text-gray-500">{v.duration}</span>}
                                  </button>
                                </li>
                              ))}
                            {tabVideos.length <= 1 && (
                              <p className="text-sm text-gray-500">No other videos in this tab.</p>
                            )}
                          </ul>
                        </div>
                      </TabsContent>
                    )
                  })}
                </Tabs>
              </>
            )}
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
