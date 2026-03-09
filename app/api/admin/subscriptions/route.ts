import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

/**
 * GET /api/admin/subscriptions
 * List all subscriptions for super admin (from subscriptions collection + users with plans).
 */
export const GET = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()

  const subs = await db.collection(Collections.SUBSCRIPTIONS).find({}).sort({ updatedAt: -1 }).toArray()

  const usersCol = db.collection(Collections.USERS)
  const plansCol = db.collection(Collections.SUBSCRIPTION_PLANS)

  const list = await Promise.all(
    subs.map(async (sub: any) => {
      const user = await usersCol.findOne({ _id: new ObjectId(sub.userId) })
      const plan = sub.planId
        ? await plansCol.findOne({ _id: new ObjectId(sub.planId) })
        : null
      return {
        id: sub._id?.toString(),
        userId: sub.userId,
        userEmail: user?.email ?? "—",
        userName: user?.name ?? "—",
        planId: sub.planId,
        planName: plan?.name ?? plan?.planName ?? "—",
        razorpaySubscriptionId: sub.razorpaySubscriptionId,
        status: sub.status,
        autoDebitEnabled: sub.autoDebitEnabled ?? false,
        nextBillingDate: sub.nextBillingDate,
        lastPaymentDate: sub.razorpayPaymentId ? sub.updatedAt : null,
        currentPeriodEnd: sub.currentPeriodEnd,
      }
    })
  )

  const usersWithPlanNoSub = await usersCol
    .find({
      subscriptionPlanId: { $exists: true, $ne: "", $ne: null },
      role: { $ne: "super-admin" },
    })
    .toArray()

  const existingSubUserIds = new Set(subs.map((s: any) => s.userId))
  for (const u of usersWithPlanNoSub) {
    const uid = u._id?.toString()
    if (existingSubUserIds.has(uid)) continue
    const plan = u.subscriptionPlanId
      ? await plansCol.findOne({ _id: new ObjectId(u.subscriptionPlanId) })
      : null
    list.push({
      id: null,
      userId: uid,
      userEmail: u.email ?? "—",
      userName: u.name ?? "—",
      planId: u.subscriptionPlanId,
      planName: plan?.name ?? plan?.planName ?? "—",
      razorpaySubscriptionId: u.razorpaySubscriptionId ?? null,
      status: u.subscriptionStatus ?? "inactive",
      autoDebitEnabled: !!(u.razorpayCustomerId && u.razorpayTokenId),
      nextBillingDate: u.nextPaymentDate ?? u.subscriptionEndDate,
      lastPaymentDate: u.lastPaymentDate,
      currentPeriodEnd: u.subscriptionEndDate,
    })
  }

  return NextResponse.json({ success: true, subscriptions: list })
})
