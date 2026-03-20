import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import { PLAN_FEATURE_KEYS } from "@/lib/models/types"

/**
 * GET /api/user/plan-features
 * Get the current user's plan features
 */
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Super admins have all features
    if (user.role === "super-admin") {
      return NextResponse.json({
        success: true,
        planFeatures: {
          dashboard: true,
          cashBook: true,
          clients: true,
          vendors: true,
          quotations: true,
          receipts: true,
          salesInvoice: true,
          purchaseInvoice: true,
          payments: true,
          reconciliation: true,
          assets: true,
          reports: true,
          settings: true,
          hrSettings: true,
          print: true,
          pdf: true,
          csv: true,
          email: true,
          backup: true
        },
        hasActiveSubscription: true
      })
    }

    // Check if user has active subscription
    const hasActiveSubscription = user.subscriptionPlanId && 
      (user.subscriptionStatus === "active" || user.subscriptionStatus === "trial" ||
       (user.subscriptionStatus === "cancelled" && user.subscriptionEndDate && new Date(user.subscriptionEndDate) >= new Date()))

    // If no active subscription, return only basic features
    if (!hasActiveSubscription || !user.subscriptionPlanId) {
      return NextResponse.json({
        success: true,
        planFeatures: {
          dashboard: true,
          cashBook: true,  // Always available
          clients: false,
          vendors: false,
          quotations: false,
          salesInvoice: false,
          receipts: false,
          purchaseInvoice: false,
          payments: false,
          reconciliation: false,
          assets: false,
          reports: false,
          settings: false,
          hrSettings: false,
          print: false,
          pdf: false,
          csv: false,
          email: false,
          backup: false
        },
        hasActiveSubscription: false
      })
    }

    // Fetch the user's subscription plan
    const db = await connectDB()
    const plan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
      _id: new ObjectId(user.subscriptionPlanId)
    })

    if (!plan) {
      return NextResponse.json({
        success: true,
        planFeatures: {
          dashboard: true,
          cashBook: true,
          clients: false,
          vendors: false,
          quotations: false,
          salesInvoice: false,
          receipts: false,
          purchaseInvoice: false,
          payments: false,
          reconciliation: false,
          assets: false,
          reports: false,
          settings: false,
          hrSettings: false,
          print: false,
          pdf: false,
          csv: false,
          email: false,
          backup: false
        },
        hasActiveSubscription: false
      })
    }

    // When plan has granular planFeatures (set in super-admin), only enabled features show in sidebar.
    // When plan has no planFeatures (legacy), grant full access so new users see all features.
    const hasGranularFeatures =
      plan.planFeatures &&
      typeof plan.planFeatures === "object" &&
      Object.keys(plan.planFeatures).length > 0

    const planFeatures: Record<string, boolean> = {
      dashboard: true, // always show dashboard when user has a plan
    }
    if (hasGranularFeatures) {
      const pf = plan.planFeatures as Record<string, boolean>
      for (const key of PLAN_FEATURE_KEYS) {
        planFeatures[key] = pf[key] === true
      }
    } else {
      // Legacy plan: no planFeatures object — grant full access
      for (const key of PLAN_FEATURE_KEYS) {
        planFeatures[key] = true
      }
    }

    return NextResponse.json({
      success: true,
      planFeatures,
      hasActiveSubscription: true,
      planName: plan.name
    })
  } catch (error) {
    console.error("Error fetching user plan features:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch plan features" },
      { status: 500 }
    )
  }
})
