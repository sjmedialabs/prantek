import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"
import { ObjectId } from "mongodb"
import { isPlanFreeForRevenue } from "@/lib/subscription-revenue"

function getClientUserIdFromPath(req: NextRequest): string | null {
  const segments = req.nextUrl.pathname.split("/").filter(Boolean)
  const i = segments.indexOf("clients")
  if (i >= 0 && segments[i + 1]) return segments[i + 1]
  return null
}

export const POST = withSuperAdmin(async (req: NextRequest) => {
  try {
    const userId = getClientUserIdFromPath(req)
    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user id" }, { status: 400 })
    }

    const body = await req.json()
    const { subscriptionPlanId, subscriptionStartDate, subscriptionEndDate, subscriptionRevenueExcluded } = body

    if (!subscriptionPlanId || typeof subscriptionPlanId !== "string") {
      return NextResponse.json({ success: false, error: "subscriptionPlanId is required" }, { status: 400 })
    }
    if (!subscriptionStartDate || !subscriptionEndDate) {
      return NextResponse.json({ success: false, error: "Start and end dates are required" }, { status: 400 })
    }

    const start = new Date(subscriptionStartDate)
    const end = new Date(subscriptionEndDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid dates" }, { status: 400 })
    }
    if (end <= start) {
      return NextResponse.json({ success: false, error: "End date must be after start date" }, { status: 400 })
    }

    const db = await connectDB()
    const plan = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({ _id: new ObjectId(subscriptionPlanId) })
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
    }

    const user = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const planFree = isPlanFreeForRevenue(plan as { price?: number; isFreePlan?: boolean })
    const revenueExcluded = Boolean(subscriptionRevenueExcluded) || planFree

    const planName = (plan as { name?: string }).name || "Plan"
    const billingCycle = (plan as { billingCycle?: string }).billingCycle === "yearly" ? "yearly" : "monthly"
    const displayAmount = revenueExcluded ? 0 : Number((plan as { price?: number }).price || 0)

    const historyEntry = {
      planId: subscriptionPlanId,
      planName,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      status: "active",
      amount: displayAmount,
      assignedAt: new Date().toISOString(),
      source: "admin" as const,
    }

    await db.collection(Collections.USERS).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          subscriptionPlanId: subscriptionPlanId,
          subscriptionStartDate: start,
          subscriptionEndDate: end,
          subscriptionStatus: "active",
          billingCycle,
          subscriptionRevenueExcluded: revenueExcluded,
          updatedAt: new Date(),
          trialEndsAt: null,
          trialEndDate: null,
        },
        $push: {
          subscriptionHistory: {
            $each: [historyEntry],
            $position: 0,
          },
        },
      },
    )

    return NextResponse.json({ success: true, message: "Subscription updated" })
  } catch (e) {
    console.error("[assign-subscription]", e)
    return NextResponse.json({ success: false, error: "Failed to assign subscription" }, { status: 500 })
  }
})
