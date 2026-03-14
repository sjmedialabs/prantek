"use client"

import { cn } from "@/lib/utils"

type ResponsiveLayoutProps = {
  children: React.ReactNode
  className?: string
  /** Apply responsive container padding (px-4 sm:px-6 lg:px-8) */
  container?: boolean
}

export function ResponsiveLayout({
  children,
  className,
  container = true,
}: ResponsiveLayoutProps) {
  return (
    <div
      className={cn(
        container && "px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6",
        "min-h-0 flex flex-col",
        className
      )}
    >
      {children}
    </div>
  )
}
