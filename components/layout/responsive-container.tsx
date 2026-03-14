"use client"

import { cn } from "@/lib/utils"

type ResponsiveContainerProps = {
  children: React.ReactNode
  className?: string
  /** Max width: default none; use "prose" for readable text width */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "prose" | "full"
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  prose: "max-w-4xl",
  full: "",
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = "full",
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8",
        maxWidth !== "full" && maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  )
}
