"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InactivityTracker } from "./inactivity-tracker"
import { tokenStorage } from "@/lib/token-storage"

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
    const verifyAuth = async () => {
      // Get token based on context
      const accessToken = tokenStorage.getAccessToken(isSuperAdmin)

      if (!accessToken) {
        if (isSuperAdmin) {
          router.push("/super-admin")
        } else {
          router.push("/signin")
        }
        setLoading(false)
        return
      }

      try {
        // Verify token with backend
        const response = await fetch("/api/auth/verify", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          tokenStorage.clearTokens(isSuperAdmin)
          if (isSuperAdmin) {
            router.push("/super-admin")
          } else {
            router.push("/signin")
          }
          setLoading(false)
          return
        }

        const userData = await response.json()
        const parsedUser = userData.user as User

        // Check role permissions
        if (requiredRole) {
          const roleHierarchy = { employee: 1, admin: 2, "super-admin": 3 }
          const userLevel = roleHierarchy[parsedUser.role]
          const requiredLevel = roleHierarchy[requiredRole]

          if (userLevel < requiredLevel) {
            router.push("/dashboard/unauthorized")
            setLoading(false)
            return
          }
        }

        setUser(parsedUser)
        setLoading(false)
      } catch (error) {
        console.error("Auth verification error:", error)
        tokenStorage.clearTokens(isSuperAdmin)
        if (isSuperAdmin) {
          router.push("/super-admin")
        } else {
          router.push("/signin")
        }
        setLoading(false)
      }
    }

    verifyAuth()
  }, [router, requiredRole, isSuperAdmin, pathname])

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
