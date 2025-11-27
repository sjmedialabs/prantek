"use client"

import { useUser } from "@/components/auth/user-context"
import { SubscriptionPrompt } from "./subscription-prompt"
import { useEffect, useState } from "react"

// Helper function to check if user has an active subscription
function hasActiveSubscription(user: any): boolean {
  // Super admins always have access
  if (user?.role === "super-admin") {
    return true
  }

  // No subscription plan
  if (!user?.subscriptionPlanId) {
    return false
  }

  const status = user.subscriptionStatus

  // If cancelled, check if still within validity period
  if (status === "cancelled") {
    if (!user.subscriptionEndDate) {
      return false
    }
    const endDate = new Date(user.subscriptionEndDate)
    const now = new Date()
    return now <= endDate
  }

  // If expired or inactive, no access
  if (status === "expired" || status === "inactive") {
    return false
  }

  // Active or trial status
  return status === "active" || status === "trial"
}

interface RequireSubscriptionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Higher-order component to protect pages that require an active subscription
 * Usage: Wrap your page content with this component
 */
export function RequireSubscription({ 
  children, 
  fallback 
}: RequireSubscriptionProps) {
  const { user, loading } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state
  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Check if user has active subscription
  if (!hasActiveSubscription(user)) {
    return fallback || <SubscriptionPrompt />
  }

  return <>{children}</>
}
