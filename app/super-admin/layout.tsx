"use client"

import type React from "react"
import { useRef } from "react"

import { UserProvider } from "@/components/auth/user-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { SuperAdminSidebar } from "@/components/super-admin/super-admin-sidebar"
import SuperAdminHeader from "@/components/super-admin/super-admin-header"
import { Toaster } from "@/components/ui/toaster"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context"
import { Sheet, SheetContent } from "@/components/ui/sheet"

const OPEN_DEBOUNCE_MS = 400

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  useSessionTimeout({ enabled: true, isSuperAdmin: true })
  const { mobileOpen, closeMobile, openMobile } = useSidebar()
  const openedAtRef = useRef<number>(0)

  const handleOpenChange = (open: boolean) => {
    if (open) {
      openedAtRef.current = Date.now()
      openMobile()
    } else {
      if (Date.now() - openedAtRef.current < OPEN_DEBOUNCE_MS) return
      closeMobile()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:shrink-0 lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-10">
        <SuperAdminSidebar />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="left" hideCloseButton title="Admin navigation" className="w-[min(100vw-4rem,20rem)] max-w-[20rem] p-0 gap-0">
          <SuperAdminSidebar isMobile onClose={closeMobile} />
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
