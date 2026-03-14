"use client"

import type React from "react"

import { UserProvider } from "@/components/auth/user-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { SuperAdminSidebar } from "@/components/super-admin/super-admin-sidebar"
import SuperAdminHeader from "@/components/super-admin/super-admin-header"
import { Toaster } from "@/components/ui/toaster"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context"
import { Sheet, SheetContent } from "@/components/ui/sheet"

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  useSessionTimeout({ enabled: true, isSuperAdmin: true })
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar()

  const handleOpenChange = (open: boolean) => {
    if (open) openSidebar()
  }

  const preventCloseOutside = (e: Event) => e.preventDefault()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:shrink-0 lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-10">
        <SuperAdminSidebar />
      </aside>

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

      <div className="flex-1 min-w-0 lg:pl-64">
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
        <SidebarProvider>
          <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
        </SidebarProvider>
        <Toaster />
      </ProtectedRoute>
    </UserProvider>
  )
}
