"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, LinkIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "@/lib/toast"

interface ImageUploadProps {
  label: string
  value?: string
  onChange: (value: string) => void
  accept?: string
  className?: string
  previewClassName?: string
  description?: string
}

export function ImageUpload({
  label,
  value,
  onChange,
  accept = "image/*",
  className = "",
  previewClassName = "w-32 h-32",
  description = "Upload an image or provide a URL",
}: ImageUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<"upload" | "url">("upload")
  const [urlInput, setUrlInput] = useState(value || "")
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log("[v0] No file selected")
      return
    }

    console.log("[v0] File selected:", file.name, file.size, file.type)

    try {
      setUploading(true)

      // Upload to Vercel Blob
      const formData = new FormData()
      formData.append("file", file)

      console.log("[v0] Uploading to /api/upload...")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Upload response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Upload failed:", errorText)
        throw new Error(`Upload failed: ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Upload successful:", data)

      onChange(data.url)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("[v0] Upload error:", error)
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploading(false)
    }
  }

  const handleUrlChange = (url: string) => {
    console.log("[v0] URL changed:", url)
    setUrlInput(url)
    onChange(url)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>

      {/* Preview */}
      {value && (
        <div className="flex items-center gap-4">
          <div className={`relative ${previewClassName} rounded-lg border overflow-hidden bg-gray-50`}>
            <Image src={value || "/placeholder.svg"} alt={`${label} preview`} fill className="object-contain" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("[v0] Removing image")
              onChange("")
              setUrlInput("")
            }}
          >
            Remove
          </Button>
        </div>
      )}

      {/* Upload/URL Toggle */}
      <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "upload" | "url")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="h-4 w-4 mr-2" />
            Image URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-2">
          <div className="flex items-center gap-2">
            <Input type="file" accept={accept} onChange={handleFileUpload} className="max-w-md" disabled={uploading} />
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </TabsContent>

        <TabsContent value="url" className="space-y-2">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="max-w-md"
          />
          <p className="text-sm text-muted-foreground">Enter a direct URL to an image</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
