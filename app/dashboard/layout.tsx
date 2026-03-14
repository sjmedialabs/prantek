"use client"

import type React from "react"
import { useEffect } from "react"

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

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  useSessionTimeout({ enabled: true, isSuperAdmin: false })
  const { isSidebarOpen, closeSidebar } = useSidebar()

  useEffect(() => {
    if (isSidebarOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isSidebarOpen])

  return (
    <>
      {/* Custom mobile drawer (no Radix): overlay + sliding panel, controlled only by isSidebarOpen */}
      <div
        className={`lg:hidden fixed inset-0 z-[100] ${isSidebarOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isSidebarOpen}
      >
        {/* Backdrop: tap to close */}
        <button
          type="button"
          onClick={closeSidebar}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 touch-manipulation ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          } ${isSidebarOpen ? "" : "invisible"}`}
          aria-label="Close menu"
          tabIndex={isSidebarOpen ? 0 : -1}
        />
        {/* Slide-in panel */}
        <div
          className={`absolute inset-y-0 left-0 w-[min(100vw-4rem,20rem)] max-w-[20rem] bg-background shadow-xl flex flex-col transition-[transform] duration-300 ease-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex flex-col h-full overflow-hidden">
            <DashboardSidebar isMobile onClose={closeSidebar} />
          </div>
        </div>
      </div>

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
