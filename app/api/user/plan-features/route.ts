import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"

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
          cashBook: true,
          clients: true,
          vendors: true,
          quotations: true,
          receipts: true,
          payments: true,
          reconciliation: true,
          assets: true,
          reports: true,
          settings: true,
          hrSettings: true
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
          cashBook: true,  // Always available
          clients: false,
          vendors: false,
          quotations: false,
          receipts: false,
          payments: false,
          reconciliation: false,
          assets: false,
          reports: false,
          settings: false,
          hrSettings: false
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
          cashBook: true,
          clients: false,
          vendors: false,
          quotations: false,
          receipts: false,
          payments: false,
          reconciliation: false,
          assets: false,
          reports: false,
          settings: false
        },
        hasActiveSubscription: false
      })
    }

    // Return the plan features
    const planFeatures = plan.planFeatures || {
      cashBook: true,
      clients: false,
      vendors: false,
      quotations: false,
      receipts: false,
      payments: false,
      reconciliation: false,
      assets: false,
      reports: false,
      settings: false,
      hrSettings: false
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
