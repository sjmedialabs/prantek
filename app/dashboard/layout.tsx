"use client"

import type React from "react"

import { UserProvider } from "@/components/auth/user-context"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { Toaster } from "@/components/ui/toaster"
import { useSessionTimeout } from "@/hooks/use-session-timeout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Enable 30-minute idle session timeout
  useSessionTimeout({ enabled: true, isSuperAdmin: false })

  return (
    <UserProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <DashboardSidebar />
          <div className="lg:pl-64">
            <DashboardHeader />
            <main className="p-6">{children}</main>
          </div>
        </div>
        <Toaster />
      </ProtectedRoute>
    </UserProvider>
  )
}
