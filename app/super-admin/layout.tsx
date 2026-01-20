"use client"

import type React from "react"

import { UserProvider } from "@/components/auth/user-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { SuperAdminSidebar } from "@/components/super-admin/super-admin-sidebar"
import SuperAdminHeader from "@/components/super-admin/super-admin-header"
import { Toaster } from "@/components/ui/toaster"
import { useSessionTimeout } from "@/hooks/use-session-timeout"

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  // Enable 30-minute idle session timeout for super-admin
  useSessionTimeout({ enabled: true, isSuperAdmin: true })

  return (
    <div className="min-h-screen bg-slate-50">
      <SuperAdminSidebar />
      <div className="lg:pl-64">
        <SuperAdminHeader />
        <main className="p-6">{children}</main>
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
        <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
        <Toaster />
      </ProtectedRoute>
    </UserProvider>
  )
}
