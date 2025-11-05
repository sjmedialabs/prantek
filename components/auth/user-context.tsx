"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { verifyUser } from "@/lib/auth"
import { tokenStorage } from "@/lib/token-storage"

interface User {
  id: string
  email: string
  name: string
  role: "super-admin" | "admin" | "employee"
  phone?: string
  address?: string
  profilePicture?: string
  subscriptionPlanId?: string
  subscriptionStatus?: "active" | "inactive" | "trial" | "cancelled"
  subscriptionStartDate?: string
  subscriptionEndDate?: string
  trialEndsAt?: string
}

interface UserContextType {
  user: User | null
  loading: boolean
  logout: () => void
  hasPermission: (permission: string) => boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const isSuperAdmin = pathname?.startsWith("/super-admin")

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true)
      try {
        const accessToken = tokenStorage.getAccessToken(isSuperAdmin)

        if (accessToken) {
          const userData = await verifyUser(accessToken)
          if (userData) {
            setUser(userData as User)
          } else {
            // Token is invalid, clear it
            tokenStorage.clearTokens()
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        tokenStorage.clearTokens()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const refreshUser = async () => {
    try {
      const accessToken = tokenStorage.getAccessToken(isSuperAdmin)

      if (accessToken) {
        const userData = await verifyUser(accessToken)
        if (userData) {
          setUser(userData as User)
        }
      }
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }
  }

  const logout = async () => {
    const isSuperAdminContext = pathname?.startsWith("/super-admin") || user?.role === "super-admin"
    
    try {
      // Call logout API to clear cookies
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuperAdmin: isSuperAdminContext }),
      })
    } catch (error) {
      console.error("Logout API error:", error)
    }
    
    // Clear localStorage tokens
    tokenStorage.clearTokens(isSuperAdminContext)
    setUser(null)

    if (typeof window !== "undefined") {
      if (isSuperAdminContext) {
        window.location.href = "/super-admin"
      } else {
        window.location.href = "/signin"
      }
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    
    // Super-admin has ALL permissions
    if (user.role === "super-admin") return true

    const permissions = {
      "super-admin": [
        "platform_management",
        "manage_subscriptions",
        "view_sales_dashboard",
        "manage_client_accounts",
        "suspend_accounts",
        "manage_users",
        "manage_roles",
        "view_financials",
        "manage_financials",
        "view_quotations",
        "manage_quotations",
        "view_clients",
        "manage_clients",
        "view_receipts",
        "manage_receipts",
        "view_payments",
        "manage_payments",
        "view_reconciliation",
        "manage_reconciliation",
        "manage_assets",
        "view_reports",
        "audit_access",
        "tenant_settings",
      ],
      admin: [
        "manage_users",
        "manage_roles",
        "view_financials",
        "manage_financials",
        "view_quotations",
        "manage_quotations",
        "view_clients",
        "manage_clients",
        "view_receipts",
        "manage_receipts",
        "view_payments",
        "manage_payments",
        "view_reconciliation",
        "manage_reconciliation",
        "manage_assets",
        "view_reports",
        "audit_access",
        "tenant_settings",
      ],
      employee: [
        "view_financials",
        "manage_financials",
        "view_quotations",
        "manage_quotations",
        "view_clients",
        "view_receipts",
        "manage_receipts",
        "view_payments",
        "manage_payments",
        "view_reconciliation",
        "manage_assets",
        "view_reports",
      ],
    }

    return permissions[user.role]?.includes(permission) || false
  }

  return (
    <UserContext.Provider value={{ user, loading, logout, hasPermission, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
