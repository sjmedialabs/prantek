"use client"

import type React from "react"
import { useEffect } from "react"

import { UserProvider } from "@/components/auth/user-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { SuperAdminSidebar } from "@/components/super-admin/super-admin-sidebar"
import SuperAdminHeader from "@/components/super-admin/super-admin-header"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  SuperAdminSidebarCollapsedProvider,
  useSuperAdminSidebarCollapsed,
} from "@/components/super-admin/super-admin-sidebar-collapsed-context"

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  useSessionTimeout({ enabled: true, isSuperAdmin: true })
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar()
  const { collapsed } = useSuperAdminSidebarCollapsed()

  const handleOpenChange = (open: boolean) => {
    if (open) openSidebar()
    else closeSidebar()
  }

  const preventCloseOutside = (e: Event) => e.preventDefault()

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const onChange = () => {
      if (mq.matches) closeSidebar()
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [closeSidebar])

  /** Desktop sidebar is `fixed` (w-64 / w-20); only offset main by that width — no separate flex aside (avoids double gutter). */
  const mainOffsetClass = collapsed ? "lg:pl-20" : "lg:pl-64"

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop: fixed rail; mobile: not rendered here — drawer below */}
      <SuperAdminSidebar />

      {/* Mobile drawer: opens on hamburger, closes only via X or nav link */}
      <Sheet open={isSidebarOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          side="left"
          hideCloseButton
          title="Admin navigation"
          className="w-[min(100vw-4rem,20rem)] max-w-[20rem] p-0 gap-0"
          onPointerDownOutside={preventCloseOutside}
          onInteractOutside={preventCloseOutside}
        >
          <SuperAdminSidebar isMobile onClose={closeSidebar} />
        </SheetContent>
      </Sheet>

      <div
        className={`min-w-0 transition-[padding] duration-300 ease-in-out ${mainOffsetClass}`}
      >
        <SuperAdminHeader />
        <main className="p-4 sm:p-6 lg:p-8 min-h-0">{children}</main>
      </div>
    </div>
  )
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <ProtectedRoute requiredRole="super-admin">
        <SuperAdminSidebarCollapsedProvider>
          <SidebarProvider>
            <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
          </SidebarProvider>
        </SuperAdminSidebarCollapsedProvider>
        <Toaster />
        <SonnerToaster richColors position="top-center" />
      </ProtectedRoute>
    </UserProvider>
  )
}
