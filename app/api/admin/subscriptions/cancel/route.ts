import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"
import { cancelRazorpaySubscription } from "@/lib/razorpay"
import { ObjectId } from "mongodb"

/**
 * POST /api/admin/subscriptions/cancel
 * Body: { razorpaySubscriptionId: string } or { userId: string }
 */
export const POST = withSuperAdmin(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}))
  const razorpaySubscriptionId = body.razorpaySubscriptionId
  const userId = body.userId

  const db = await connectDB()

  let subId = razorpaySubscriptionId
  if (!subId && userId) {
    const sub = await db.collection(Collections.SUBSCRIPTIONS).findOne({ userId })
    subId = sub?.razorpaySubscriptionId
  }
  if (!subId) {
    const user = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(userId) })
    subId = user?.razorpaySubscriptionId
  }

  if (!subId) {
    if (userId) {
      await db.collection(Collections.USERS).updateOne(
        { _id: new ObjectId(userId) },
        { $set: { subscriptionStatus: "cancelled", updatedAt: new Date() } }
      )
      return NextResponse.json({ success: true, message: "User subscription status set to cancelled." })
    }
    return NextResponse.json({ success: false, error: "Subscription not found" }, { status: 404 })
  }

  try {
    await cancelRazorpaySubscription(subId, body.cancelAtCycleEnd !== false)
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Razorpay cancel failed" },
      { status: 502 }
    )
  }

  await db.collection(Collections.SUBSCRIPTIONS).updateOne(
    { razorpaySubscriptionId: subId },
    { $set: { status: "cancelled", autoDebitEnabled: false, updatedAt: new Date() } }
  )
  const subDoc = await db.collection(Collections.SUBSCRIPTIONS).findOne({ razorpaySubscriptionId: subId })
  if (subDoc?.userId) {
    await db.collection(Collections.USERS).updateOne(
      { _id: new ObjectId(subDoc.userId) },
      { $set: { subscriptionStatus: "cancelled", updatedAt: new Date() } }
    )
  }

  return NextResponse.json({ success: true, message: "Subscription cancelled." })
})
