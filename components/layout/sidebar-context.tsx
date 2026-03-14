"use client"

import React, { createContext, useCallback, useContext, useState } from "react"

type SidebarContextValue = {
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  /** @deprecated Use isSidebarOpen and openSidebar/closeSidebar */
  mobileOpen: boolean
  /** @deprecated Use openSidebar */
  openMobile: () => void
  /** @deprecated Use closeSidebar */
  closeMobile: () => void
  /** @deprecated Use openSidebar/closeSidebar */
  toggleMobile: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const openSidebar = useCallback(() => setIsSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const toggleMobile = useCallback(() => setIsSidebarOpen((v) => !v), [])

  const value: SidebarContextValue = {
    isSidebarOpen,
    openSidebar,
    closeSidebar,
    mobileOpen: isSidebarOpen,
    openMobile: openSidebar,
    closeMobile: closeSidebar,
    toggleMobile,
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) {
    return {
      isSidebarOpen: false,
      openSidebar: () => {},
      closeSidebar: () => {},
      mobileOpen: false,
      openMobile: () => {},
      closeMobile: () => {},
      toggleMobile: () => {},
    }
  }
  return ctx
}
