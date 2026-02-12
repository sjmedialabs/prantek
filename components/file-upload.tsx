"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { UploadCloud, X } from "lucide-react"

interface FileUploadProps {
  value?: string
  onChange: (url: string) => void
  accept?: string
  placeholder?: string
  multiple?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
  aspectRatio?: "1/1" | "4/3" | "4/5" | "16/9" | "auto"
  width?: number
  height?: number
}
const ASPECT_RATIO_MAP: Record<string, number> = {
  "1/1": 1,
  "4/3": 4 / 3,
  "4/5": 4 / 5,
  "16/9": 16 / 9,
};

const FILE_TYPE_LABELS: Record<string, string[]> = {
  "image/*": ["JPEG", "JPG", "PNG", "WEBP", "SVG"],
  "video/*": ["MP4"],
  "application/pdf": ["PDF"],
}
const getSupportedTypes = (accept?: string) => {
  if (!accept) return [];

  return accept
    .split(",")
    .map((type) => type.trim())
    .flatMap((type) => {
      if (FILE_TYPE_LABELS[type]) return FILE_TYPE_LABELS[type];
      if (type.includes("image")) return FILE_TYPE_LABELS["image/*"];
      if (type.includes("video")) return FILE_TYPE_LABELS["video/*"];
      if (type.includes("pdf")) return FILE_TYPE_LABELS["application/pdf"];
      return [];
    });
};
export default function FileUpload({
  value,
  onChange,
  accept = "image/*",
  placeholder = "Choose file or drag and drop",
  multiple = false,
  className = "",
  size = "md",
  aspectRatio = "auto",
  width,
  height,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ---------------- SIZING CONFIG ---------------- */
  const sizeConfig = {
    sm: "p-0 text-xs min-h-[35px]",
    md: "p-1 text-sm min-h-[120px]",
    lg: "p-1 text-base min-h-[180px]",
  }

const aspectClass =
  aspectRatio === "1/1"
    ? "aspect-square"
    : aspectRatio === "4/3"
      ? "aspect-[4/3]"
      : aspectRatio === "4/5"
        ? "aspect-[4/5]"
        : aspectRatio === "16/9"
          ? "aspect-[16/9]"
          : "";



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
  const isFileTypeAllowed = (file: File, accept?: string) => {
    if (!accept) return true

    const acceptedTypes = accept
      .split(",")
      .map((t) => t.trim())

    return acceptedTypes.some((type) => {
      // image/*
      if (type === "image/*") {
        return file.type.startsWith("image/")
      }

      // video/*
      if (type === "video/*") {
        return file.type.startsWith("video/")
      }

      // application/pdf
      if (type === "application/pdf") {
        return file.type === "application/pdf"
      }

      // exact mime match fallback
      return file.type === type
    })
  }
const validateAspectRatio = (
  file: File,
  aspectRatio?: string
): Promise<void> => {
  if (!aspectRatio || aspectRatio === "auto") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.src = url;
    img.onload = () => {
      URL.revokeObjectURL(url);

      const expected = ASPECT_RATIO_MAP[aspectRatio];
      if (!expected) return resolve();

      const actual = img.width / img.height;

      // allow small margin
      const tolerance = 0.03;

      /**
       * RULE:
       * actual <= expected (+ tolerance)
       * ❌ block images wider than expected ratio
       */
      if (actual > expected + tolerance) {
        reject(
          new Error(
            `Image must be ${aspectRatio} or taller (not wider)`
          )
        );
      } else {
        resolve();
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image file"));
    };
  });
};



  const validateImageDimensions = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.src = objectUrl
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)

        const maxWidth = width || 1920
        const maxHeight = height || 1920

        if (img.width > maxWidth || img.height > maxHeight) {
          reject(
            new Error(`Please upload image less than ${maxHeight} x ${maxWidth} px`)
          )
        } else {
          resolve()
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error("Invalid image file"))
      }
    })
  }
const MAX_FILE_SIZE_MB = {
  image: 2,
  video: 5,
  pdf: 5,
};

const isFileSizeValid = (file: File) => {
  const sizeMB = file.size / (1024 * 1024);

  if (file.type.startsWith("image/")) {
    return sizeMB <= MAX_FILE_SIZE_MB.image;
  }

  if (file.type.startsWith("video/")) {
    return sizeMB <= MAX_FILE_SIZE_MB.video;
  }

  if (file.type === "application/pdf") {
    return sizeMB <= MAX_FILE_SIZE_MB.pdf;
  }

  return false;
};

  /* ---------------- FILE HANDLING ---------------- */
const handleFileSelect = async (files: FileList | null) => {
  if (!files || files.length === 0) return;

  const file = files[0];

  // ❌ Type validation
  if (!isFileTypeAllowed(file, accept)) {
    alert(`Unsupported file type. Allowed: ${getSupportedTypes(accept).join(", ")}`);
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }

  // ❌ File size validation
  if (!isFileSizeValid(file)) {
    alert(
      file.type.startsWith("image/")
        ? "Image size must be less than 2 MB"
        : file.type.startsWith("video/")
          ? "Video size must be less than 5 MB"
          : "File size must be less than 5 MB"
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }

  // ✅ Aspect ratio validation (images only)
  if (file.type.startsWith("image/")) {
    try {
      await validateAspectRatio(file, aspectRatio);
    } catch (err: any) {
      alert(err.message);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
  }

  // ✅ Preview + upload
  setPreview(URL.createObjectURL(file));
  setFileName(file.name);
  setFileSize(formatFileSize(file.size));
  setUploading(true);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.url) throw new Error("Upload failed");

    onChange(data.url);
  } catch (err) {
    console.error(err);
    alert("Upload failed");
    setPreview(null);
  } finally {
    setUploading(false);
  }
};



  /* ---------------- EVENTS ---------------- */
  const handleClick = () => fileInputRef.current?.click()

  const handleRemove = () => {
    setPreview(null)
    onChange("")
    setFileName(null)
    setFileSize(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const displayUrl = value || preview
  const isPdf =
    displayUrl?.toLowerCase().endsWith(".pdf") ||
    fileName?.toLowerCase().endsWith(".pdf");

  return (
    <div className={` ${className} `}>
      <div
        onClick={handleClick}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFileSelect(e.dataTransfer.files)
        }}
        className={`
          relative border-2 border-dashed rounded-lg
          flex items-center justify-center text-center cursor-pointer
          transition-colors overflow-hidden
          ${sizeConfig[size]}
          ${aspectClass}
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploading}
        />

        {displayUrl ? (
          <div className=" flex flex-col items-center justify-center relative group border rounded">

            {/* IMAGE PREVIEW */}
            {!isPdf && (
              <img
                src={displayUrl}
                alt="Preview"
                className="max-h-full max-w-full object-contain rounded"
              />
            )}

            {/* PDF PREVIEW */}
            {isPdf && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="bg-red-100 text-red-600 rounded-full w-12 h-12 flex items-center justify-center">
                  PDF
                </div>

                <p className="text-sm font-medium truncate w-full">
                  {fileName || "Uploaded PDF"}
                </p>

                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View PDF
                </a>
              </div>
            )}

            {/* FILE INFO (IMAGE ONLY) */}
            {!isPdf && (fileName || fileSize) && size !== "sm" && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white p-1 text-xs truncate w-full">
                {fileName && <div className="truncate px-2">{fileName}</div>}
                {fileSize && (
                  <div className="text-[10px] opacity-80">{fileSize}</div>
                )}
              </div>
            )}

            {/* REMOVE BUTTON */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
          : (
            <div className="flex flex-col items-center justify-center gap-1 px-1">
              <div className={`text-gray-400 ${size === "sm" ? "w-5 h-5" : "w-8 h-8"}`}>
                <UploadCloud className="w-full h-full" />
              </div>
              {size !== "sm" && (
                <>
                  <p className="text-gray-600 text-sm font-medium">Upload</p>
                  <p className="text-gray-400 text-xs">
                    Supported: {getSupportedTypes(accept).join(", ")}
                  </p>
                  <p className="text-gray-400 text-xs">Max 5MB, {width || 1920}x{height || 800} px</p>
                </>
              )}
            </div>
          )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="text-sm text-gray-600">Uploading…</span>
          </div>
        )}
      </div>
    </div>
  )
}
