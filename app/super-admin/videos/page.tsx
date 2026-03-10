"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Plus, Trash2, ChevronDown, ChevronRight, Video, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type VideoCategory = { _id: string; name: string; order: number }
type VideoItem = {
  _id: string
  title: string
  description: string
  youtubeUrl: string
  categoryId: string | null
  tab: string
  order: number
  duration?: string | null
}

const fetchOptions = { credentials: "include" as const }

export default function SuperAdminVideosPage() {
  const [categories, setCategories] = useState<VideoCategory[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<VideoCategory | null>(null)
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: "" })
  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    tab: "All",
    duration: "",
  })
  const [saving, setSaving] = useState(false)

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/super-admin/video-categories", fetchOptions)
      const data = await res.json()
      if (data.success) setCategories(data.data || [])
    } catch (e) {
      console.error(e)
      toast.error("Failed to load categories")
    }
  }

  const loadVideos = async () => {
    try {
      const url = selectedCategoryId
        ? `/api/super-admin/videos?categoryId=${encodeURIComponent(selectedCategoryId)}`
        : "/api/super-admin/videos"
      const res = await fetch(url, fetchOptions)
      const data = await res.json()
      if (data.success) setVideos(data.data || [])
    } catch (e) {
      console.error(e)
      toast.error("Failed to load videos")
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await loadCategories()
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    loadVideos()
  }, [selectedCategoryId])

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    try {
      if (editingCategory) {
        const res = await fetch(`/api/super-admin/video-categories/${editingCategory._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: categoryForm.name.trim() }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || "Update failed")
        toast.success("Category updated")
      } else {
        const res = await fetch("/api/super-admin/video-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: categoryForm.name.trim() }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || "Create failed")
        toast.success("Category created")
      }
      setCategoryDialogOpen(false)
      setEditingCategory(null)
      setCategoryForm({ name: "" })
      await loadCategories()
    } catch (e: any) {
      toast.error(e.message || "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Videos in it will be unassigned.")) return
    try {
      const res = await fetch(`/api/super-admin/video-categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success("Category deleted")
      if (selectedCategoryId === id) setSelectedCategoryId(null)
      await loadCategories()
      await loadVideos()
    } catch (e: any) {
      toast.error(e.message || "Delete failed")
    }
  }

  const handleSaveVideo = async () => {
    if (!videoForm.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!videoForm.youtubeUrl.trim()) {
      toast.error("YouTube URL is required")
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: videoForm.title.trim(),
        description: videoForm.description.trim(),
        youtubeUrl: videoForm.youtubeUrl.trim(),
        categoryId: selectedCategoryId || null,
        tab: videoForm.tab.trim() || "All",
        duration: videoForm.duration.trim() || null,
      }
      if (editingVideo) {
        const res = await fetch(`/api/super-admin/videos/${editingVideo._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || "Update failed")
        toast.success("Video updated")
      } else {
        const res = await fetch("/api/super-admin/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || "Create failed")
        toast.success("Video created")
      }
      setVideoDialogOpen(false)
      setEditingVideo(null)
      setVideoForm({ title: "", description: "", youtubeUrl: "", tab: "All", duration: "" })
      await loadVideos()
    } catch (e: any) {
      toast.error(e.message || "Failed to save video")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Delete this video?")) return
    try {
      const res = await fetch(`/api/super-admin/videos/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success("Video deleted")
      await loadVideos()
    } catch (e: any) {
      toast.error(e.message || "Delete failed")
    }
  }

  const openEditCategory = (cat: VideoCategory) => {
    setEditingCategory(cat)
    setCategoryForm({ name: cat.name })
    setCategoryDialogOpen(true)
  }

  const openEditVideo = (v: VideoItem) => {
    setEditingVideo(v)
    setVideoForm({
      title: v.title,
      description: v.description || "",
      youtubeUrl: v.youtubeUrl || "",
      tab: v.tab || "All",
      duration: v.duration || "",
    })
    setVideoDialogOpen(true)
  }

  const tabs = Array.from(new Set(videos.map((v) => v.tab || "All"))).sort()
  if (tabs.length === 0) tabs.push("All")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Video Library</h1>
        <p className="text-gray-600">Manage left menu categories and videos (title, description, YouTube URL). Shown on the public /videos page.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Categories (menu items) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Menu categories</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryForm({ name: "" })
                  setCategoryDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <CardDescription>Left sidebar items on /videos page</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500">No categories. Add one to get started.</p>
            ) : (
              <ul className="space-y-1">
                {categories.map((cat) => {
                  const isExpanded = expandedCategoryId === cat._id
                  const isSelected = selectedCategoryId === cat._id
                  return (
                    <li key={cat._id}>
                      <div
                        className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-sm ${isSelected ? "bg-purple-100 text-purple-800" : "hover:bg-gray-100"}`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedCategoryId(isExpanded ? null : cat._id)}
                          className="p-0.5"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          className="flex-1 text-left font-medium"
                          onClick={() => setSelectedCategoryId(cat._id)}
                        >
                          {cat.name}
                        </button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditCategory(cat)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => handleDeleteCategory(cat._id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Right: Videos (with tabs) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Videos</CardTitle>
              <Button
                size="sm"
                disabled={!selectedCategoryId}
                onClick={() => {
                  setEditingVideo(null)
                  setVideoForm({ title: "", description: "", youtubeUrl: "", tab: "All", duration: "" })
                  setVideoDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add video
              </Button>
            </div>
            <CardDescription>
              {selectedCategoryId ? "Videos in this category (grouped by tab)" : "Select a category to add or edit videos."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedCategoryId ? (
              <p className="text-sm text-gray-500">Select a category from the left to manage its videos.</p>
            ) : (
              <Tabs defaultValue={tabs[0]} className="w-full">
                <TabsList>
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab} value={tab}>
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {tabs.map((tab) => (
                  <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                    {videos
                      .filter((v) => (v.tab || "All") === tab)
                      .map((v) => (
                        <div
                          key={v._id}
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Video className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{v.title}</p>
                              {v.duration && <p className="text-xs text-gray-500">{v.duration}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => openEditVideo(v)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteVideo(v._id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    {videos.filter((v) => (v.tab || "All") === tab).length === 0 && (
                      <p className="text-sm text-gray-500">No videos in this tab. Add a video and set its tab to &quot;{tab}&quot;.</p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>This appears as a left menu item on the /videos page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ name: e.target.value })}
                placeholder="e.g. Getting Started"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={saving}>{editingCategory ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Edit video" : "Add video"}</DialogTitle>
            <DialogDescription>Title, description and YouTube URL. Tab groups videos on the right.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={videoForm.title}
                onChange={(e) => setVideoForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Zoho Books in a Nutshell"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={videoForm.description}
                onChange={(e) => setVideoForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description of the video"
                rows={3}
              />
            </div>
            <div>
              <Label>YouTube URL *</Label>
              <Input
                value={videoForm.youtubeUrl}
                onChange={(e) => setVideoForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tab</Label>
                <Input
                  value={videoForm.tab}
                  onChange={(e) => setVideoForm((f) => ({ ...f, tab: e.target.value }))}
                  placeholder="All"
                />
              </div>
              <div>
                <Label>Duration (e.g. 1:10)</Label>
                <Input
                  value={videoForm.duration}
                  onChange={(e) => setVideoForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="1:10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveVideo} disabled={saving}>{editingVideo ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
