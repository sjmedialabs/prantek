"use client"

import type React from "react"

import { UserProvider } from "@/components/auth/user-context"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { Toaster } from "@/components/ui/toaster"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { OnboardingProvider } from "@/components/onboarding/onboarding-context"
import { WelcomeModal } from "@/components/onboarding/welcome-modal"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context"
import { Sheet, SheetContent } from "@/components/ui/sheet"

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  useSessionTimeout({ enabled: true, isSuperAdmin: false })
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar()

  const handleOpenChange = (open: boolean) => {
    if (open) openSidebar()
    else closeSidebar()
  }

  const preventCloseOutside = (e: Event) => e.preventDefault()

  return (
    <>
      {/* Mobile drawer: single state isSidebarOpen; hamburger opens, X closes; high z-index so it appears above header */}
      <Sheet open={isSidebarOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          side="left"
          hideCloseButton
          title="Navigation menu"
          className="z-[100] w-[min(100vw-4rem,20rem)] max-w-[20rem] p-0 gap-0 flex flex-col"
          onPointerDownOutside={preventCloseOutside}
          onInteractOutside={preventCloseOutside}
        >
          <div className="flex flex-col h-full overflow-hidden">
            <DashboardSidebar isMobile onClose={closeSidebar} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-row bg-gray-50">
        {/* Desktop sidebar: fixed left, hidden on mobile */}
        <aside className="hidden lg:flex lg:flex-col lg:shrink-0 lg:border-r lg:bg-background lg:sticky lg:top-0 lg:h-screen lg:z-10">
          <DashboardSidebar />
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6 min-h-0 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
      <WelcomeModal />
      <OnboardingWizard />
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <OnboardingProvider>
        <ProtectedRoute>
          <SidebarProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
          </SidebarProvider>
        </ProtectedRoute>
      </OnboardingProvider>
    </UserProvider>
  )
}
