import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { canManagePermissions, getUserSubscriptionPlan } from "@/lib/subscription-helper"

/**
 * GET /api/subscription/check-permissions
 * Check if user's plan allows certain features
 */
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Check if user can manage permissions (roles/employees with roles)
    const canManagePerms = await canManagePermissions(user.userId)
    
    // Get user's subscription plan details
    const plan = await getUserSubscriptionPlan(user.userId)

    return NextResponse.json({
      canManagePermissions: canManagePerms,
      plan: plan ? {
        name: plan.name,
        price: plan.price,
        features: plan.features
      } : null
    })
  } catch (error: any) {
    console.error("Error checking subscription permissions:", error)
    return NextResponse.json(
      { error: "Failed to check permissions", message: error.message },
      { status: 500 }
    )
  }
})
