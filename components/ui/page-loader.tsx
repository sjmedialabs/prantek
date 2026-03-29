"use client"

import { useEffect, useState } from "react"

interface LoaderConfig {
  loaderType?: "spinner" | "logo" | "custom"
  loaderImage?: string
  loaderText?: string
  loaderBgColor?: string
  loaderSpinnerColor?: string
}

let cachedConfig: LoaderConfig | null = null

async function fetchLoaderConfig(): Promise<LoaderConfig> {
  if (cachedConfig) return cachedConfig
  try {
    const res = await fetch("/api/website-content", { next: { revalidate: 300 } })
    if (!res.ok) return {}
    const json = await res.json()
    const wc = json.data?.[0] || json.content?.[0] || json[0] || {}
    cachedConfig = {
      loaderType: wc.loaderType || "spinner",
      loaderImage: wc.loaderImage || "",
      loaderText: wc.loaderText || "",
      loaderBgColor: wc.loaderBgColor || "",
      loaderSpinnerColor: wc.loaderSpinnerColor || "",
    }
    return cachedConfig
  } catch {
    return {}
  }
}

/** Invalidate cache (call after CMS save) */
export function invalidateLoaderCache() {
  cachedConfig = null
}

interface PageLoaderProps {
  /** Override text shown below the loader */
  text?: string
  /** If true, uses min-h-screen. Otherwise uses min-h-[40vh] */
  fullScreen?: boolean
}

export function PageLoader({ text, fullScreen = false }: PageLoaderProps) {
  const [config, setConfig] = useState<LoaderConfig>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchLoaderConfig().then(setConfig)
  }, [])

  const bgColor = config.loaderBgColor || "transparent"
  const spinnerColor = config.loaderSpinnerColor || "#6366f1"
  const displayText = text || config.loaderText || "Loading…"
  const heightClass = fullScreen ? "min-h-screen" : "min-h-[40vh]"

  // Server-side or before config loads: show a minimal spinner
  if (!mounted) {
    return (
      <div className={`${heightClass} flex flex-col items-center justify-center gap-3 px-4`}>
        <div
          className="h-10 w-10 rounded-full border-[3px] border-gray-200 border-t-indigo-500 animate-spin"
          aria-hidden
        />
        <p className="text-sm text-gray-500">{displayText}</p>
      </div>
    )
  }

  const loaderType = config.loaderType || "spinner"

  return (
    <div
      className={`${heightClass} flex flex-col items-center justify-center gap-3 px-4 transition-colors`}
      style={{ backgroundColor: bgColor !== "transparent" ? bgColor : undefined }}
    >
      {loaderType === "spinner" && (
        <div
          className="h-10 w-10 rounded-full border-[3px] border-gray-200 animate-spin"
          style={{ borderTopColor: spinnerColor }}
          aria-hidden
        />
      )}

      {(loaderType === "logo" || loaderType === "custom") && config.loaderImage ? (
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.loaderImage}
            alt="Loading"
            className={
              loaderType === "logo"
                ? "h-16 w-16 object-contain animate-pulse"
                : "h-20 w-auto object-contain"
            }
          />
          {loaderType === "logo" && (
            <div
              className="h-1 w-24 rounded-full overflow-hidden bg-gray-200"
            >
              <div
                className="h-full rounded-full animate-loader-bar"
                style={{ backgroundColor: spinnerColor }}
              />
            </div>
          )}
        </div>
      ) : loaderType !== "spinner" ? (
        /* Fallback if image missing */
        <div
          className="h-10 w-10 rounded-full border-[3px] border-gray-200 animate-spin"
          style={{ borderTopColor: spinnerColor }}
          aria-hidden
        />
      ) : null}

      {displayText && (
        <p className="text-sm text-gray-500">{displayText}</p>
      )}

      <style jsx>{`
        @keyframes loaderBar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-loader-bar {
          animation: loaderBar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
