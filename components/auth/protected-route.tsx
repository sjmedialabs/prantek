"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InactivityTracker } from "./inactivity-tracker"
import { useUser } from "./user-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "super-admin" | "admin" | "employee"
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const isSuperAdmin = pathname?.startsWith("/super-admin")

  useEffect(() => {
    if (loading) return

    // If no user, redirect to appropriate login page
    if (!user) {
      setIsRedirecting(true)
      if (isSuperAdmin) {
        router.push("/super-admin")
      } else {
        router.push("/signin")
      }
      return
    }

    // Check role permissions
    if (requiredRole) {
      const roleHierarchy = { employee: 1, admin: 2, "super-admin": 3 }
      const userLevel = roleHierarchy[user.role]
      const requiredLevel = roleHierarchy[requiredRole]

      if (userLevel < requiredLevel) {
        setIsRedirecting(true)
        router.push("/dashboard/unauthorized")
        return
      }
    }
  }, [user, loading, router, requiredRole, isSuperAdmin, pathname])

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <>
      <InactivityTracker />
      {children}
    </>
  )
}
