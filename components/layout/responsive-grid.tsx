"use client"

import { cn } from "@/lib/utils"

type ResponsiveGridProps = {
  children: React.ReactNode
  className?: string
  /** Columns: 1 on mobile, then sm:2, md:3, lg:4 etc. Default 1-2-3 */
  cols?: 1 | 2 | 3 | 4 | 5 | 6
}

const colClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
}

export function ResponsiveGrid({
  children,
  className,
  cols = 3,
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-6",
        colClasses[cols],
        className
      )}
    >
      {children}
    </div>
  )
}
