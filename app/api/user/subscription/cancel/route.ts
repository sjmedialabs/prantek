import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { cancelRazorpaySubscription } from "@/lib/razorpay"
import { ObjectId } from "mongodb"

/**
 * POST /api/user/subscription/cancel
 * Cancel current user's Razorpay subscription (at cycle end by default).
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  const db = await connectDB()
  const userId = user.userId

  const subscriptionDoc = await db.collection(Collections.SUBSCRIPTIONS).findOne({
    userId,
    status: { $in: ["active", "created", "pending"] },
  })

  if (!subscriptionDoc?.razorpaySubscriptionId) {
    const userDoc = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(userId) })
    if (userDoc?.subscriptionPlanId && !userDoc?.razorpaySubscriptionId) {
      await db.collection(Collections.USERS).updateOne(
        { _id: new ObjectId(userId) },
        { $set: { subscriptionStatus: "cancelled", updatedAt: new Date() } }
      )
      return NextResponse.json({ success: true, message: "Subscription cancelled. Access until end date." })
    }
    return NextResponse.json({ success: false, error: "No active subscription found" }, { status: 404 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const cancelAtCycleEnd = body.cancelAtCycleEnd !== false

    await cancelRazorpaySubscription(subscriptionDoc.razorpaySubscriptionId, cancelAtCycleEnd)
  } catch (err: any) {
    console.error("[Cancel subscription]", err)
    return NextResponse.json(
      { success: false, error: err?.message ?? "Failed to cancel with Razorpay" },
      { status: 502 }
    )
  }

  await db.collection(Collections.SUBSCRIPTIONS).updateOne(
    { razorpaySubscriptionId: subscriptionDoc.razorpaySubscriptionId },
    { $set: { status: "cancelled", autoDebitEnabled: false, updatedAt: new Date() } }
  )
  await db.collection(Collections.USERS).updateOne(
    { _id: new ObjectId(userId) },
    { $set: { subscriptionStatus: "cancelled", updatedAt: new Date() } }
  )

  return NextResponse.json({
    success: true,
    message: "Subscription cancelled. You retain access until the end of the current billing period.",
  })
})
