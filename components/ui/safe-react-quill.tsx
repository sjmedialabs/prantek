"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, type ComponentProps } from "react"

const ReactQuill = dynamic(
  () => import("react-quill").then((mod) => mod.default),
  { ssr: false }
)

type ReactQuillProps = ComponentProps<typeof ReactQuill>

const editorPlaceholder = () => (
  <div className="min-h-[200px] animate-pulse rounded-md border border-input bg-muted/50 flex items-center justify-center text-muted-foreground text-sm">
    Loading editor…
  </div>
)

export function SafeReactQuill(props: ReactQuillProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    import("react-quill/dist/quill.snow.css").catch(() => {})
  }, [])

  if (!mounted) {
    return editorPlaceholder()
  }

  return (
    <ReactQuill
      {...props}
      value={props.value ?? ""}
      onChange={props.onChange}
    />
  )
}
