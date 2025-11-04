"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InactivityTracker } from "./inactivity-tracker"

interface User {
  id: string
  email: string
  name: string
  role: "super-admin" | "admin" | "employee"
  phone?: string
  address?: string
}

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "super-admin" | "admin" | "employee"
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isSuperAdmin = pathname?.startsWith("/super-admin")

  useEffect(() => {
    const userType = isSuperAdmin ? "super-admin" : "admin"
    const userData = localStorage.getItem(`saas_${userType === "super-admin" ? "current_super_admin" : "current_user"}`)

    if (!userData) {
      if (isSuperAdmin) {
        router.push("/super-admin")
      } else {
        router.push("/signin")
      }
      return
    }

    const parsedUser = JSON.parse(userData) as User

    // Check role permissions
    if (requiredRole) {
      const roleHierarchy = { employee: 1, admin: 2, "super-admin": 3 }
      const userLevel = roleHierarchy[parsedUser.role]
      const requiredLevel = roleHierarchy[requiredRole]

      if (userLevel < requiredLevel) {
        router.push("/dashboard/unauthorized")
        return
      }
    }

    setUser(parsedUser)
    setLoading(false)
  }, [router, requiredRole, isSuperAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <InactivityTracker />
      {children}
    </>
  )
}
