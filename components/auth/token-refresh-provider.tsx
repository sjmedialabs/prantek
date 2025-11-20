"use client"

import type React from "react"

import { useEffect } from "react"
import { setupAutoRefresh } from "@/lib/token-refresh"

/**
 * Provider component that automatically refreshes JWT tokens
 * Add this to your root layout to enable automatic token refresh
 */
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Setup automatic token refresh every 5 minutes
    const cleanup = setupAutoRefresh(5 * 60 * 1000)

    // Cleanup on unmount
    return cleanup
  }, [])

  return <>{children}</>
}
