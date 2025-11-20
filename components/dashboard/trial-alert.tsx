"use client"

import { useUser } from "@/components/auth/user-context"
import { AlertCircle } from "lucide-react"

export default function TrialAlert() {
  const { user } = useUser()

  // Debug logging
  console.log('[TRIAL-ALERT] User data:', {
    subscriptionStatus: user?.subscriptionStatus,
    trialEndsAt: user?.trialEndsAt,
    fullUser: user
  })

  // Only show for trial users
  if (user?.subscriptionStatus !== "trial" || !user?.trialEndsAt) {
    return null
  }

  const trialEndDate = new Date(user.trialEndsAt)
  const now = new Date()
  const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  // Format the date
  const formattedDate = trialEndDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="px-6 py-3">
        <div className="flex items-center justify-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-amber-900">
            <strong>Trial Period:</strong> Your trial expires on <strong>{formattedDate}</strong> ({daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining). 
            <a href="/dashboard/plans" className="ml-1 underline font-medium hover:text-amber-700">
              Upgrade now
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}
