"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, LinkIcon, Loader2 } from "lucide-react"
import { toast } from "@/lib/toast"

interface ImageUploadProps {
  label?: string
  value?: string
  onChange: (value: string) => void
  accept?: string
  className?: string
  previewClassName?: string
  description?: string

  /** ✅ NEW */
  maxSizeMB?: number
  allowedTypes?: string[]
}

export function ImageUpload({
  label,
  value,
  onChange,
  className = "",
  previewClassName = "w-32 h-32",
  description = "Upload an image or provide a URL",

  /** ✅ new default props */
  maxSizeMB = 5,
  allowedTypes = ["image/*", "application/pdf"],
}: ImageUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<"upload" | "url">("upload")
  const [urlInput, setUrlInput] = useState(value || "")
  const [uploading, setUploading] = useState(false)

  const isImage = (file: string | undefined) => {
    if (!file) return false
    return file.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log("[ImageUpload] No file selected")
      return
    }

    console.log("[ImageUpload] File selected:", { name: file.name, size: file.size, type: file.type })

    // ✅ Validate size
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      console.error("[ImageUpload] File too large:", file.size, ">", maxBytes)
      toast.error("File Too Large", `File must be under ${maxSizeMB}MB`)
      return
    }

    // ✅ Validate type
    const fileTypeValid = allowedTypes.some((type) =>
      type.includes("*") ? file.type.startsWith(type.split("/")[0]) : file.type === type
    )

    if (!fileTypeValid) {
      console.error("[ImageUpload] Invalid file type:", file.type)
      toast.error("Invalid File Type", "This type is not allowed")
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      console.log("[ImageUpload] Uploading to /api/upload...")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      console.log("[ImageUpload] Upload response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[ImageUpload] Upload failed:", errorData)
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await response.json()
      console.log("[ImageUpload] Upload successful:", data)
      
      onChange(data.url)
      console.log("[ImageUpload] onChange called with URL:", data.url)
      
      toast.success("File uploaded successfully")
    } catch (error) {
      console.error("[ImageUpload] Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleUrlChange = (url: string) => {
    setUrlInput(url)
    onChange(url)
  }

  const isImageType = value ? isImage(value) : false

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label>{label}</Label>}

      {/* ✅ Preview + remove */}
      {value && (
        <div className="flex items-center gap-4">
          {isImageType ? (
            <div className={`${previewClassName} rounded-lg border overflow-hidden bg-gray-50`}>
              <img
                src={value}
                alt={`${label} preview`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Image load error:", value)
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
            </div>
          ) : (
            <div className="text-sm text-gray-600 truncate max-w-xs">{value}</div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onChange("")
              setUrlInput("")
            }}
          >
            Remove
          </Button>
        </div>
      )}

      {/* Upload / URL Switch */}
      <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "upload" | "url")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="h-4 w-4 mr-2" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept={allowedTypes.join(", ")}
              onChange={handleFileUpload}
              className="max-w-md"
              disabled={uploading}
            />
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <p className="text-sm text-muted-foreground">
            Max size: {maxSizeMB}MB
          </p>
        </TabsContent>

        <TabsContent value="url" className="space-y-2">
          <Input
            type="url"
            placeholder="https://example.com/file"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="max-w-md"
          />
          <p className="text-sm text-muted-foreground">Enter direct URL</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
