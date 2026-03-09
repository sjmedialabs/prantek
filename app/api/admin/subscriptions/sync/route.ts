import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"
import { fetchSubscription } from "@/lib/razorpay"
import { ObjectId } from "mongodb"

/**
 * POST /api/admin/subscriptions/sync
 * Super admin only. Syncs all subscriptions from DB with Razorpay.
 */
export const POST = withSuperAdmin(async () => {
  const db = await connectDB()
  const subs = await db.collection(Collections.SUBSCRIPTIONS).find({}).toArray()
  let updated = 0
  let failed = 0

  for (const sub of subs) {
    const rpId = sub.razorpaySubscriptionId
    if (!rpId) continue
    try {
      const rp = await fetchSubscription(rpId)
      const status = (rp as any).status
      const currentEnd = (rp as any).current_end
      const currentStart = (rp as any).current_start

      await db.collection(Collections.SUBSCRIPTIONS).updateOne(
        { razorpaySubscriptionId: rpId },
        {
          $set: {
            status: status === "active" ? "active" : status === "cancelled" ? "cancelled" : status === "completed" ? "expired" : status,
            currentPeriodEnd: currentEnd ? new Date(currentEnd * 1000) : undefined,
            currentPeriodStart: currentStart ? new Date(currentStart * 1000) : undefined,
            nextBillingDate: currentEnd ? new Date(currentEnd * 1000) : undefined,
            updatedAt: new Date(),
          },
        }
      )
      updated++

      const userUpdate: Record<string, unknown> = {
        subscriptionStatus: status === "active" ? "active" : status === "cancelled" ? "cancelled" : status === "completed" ? "expired" : status,
        updatedAt: new Date(),
      }
      if (currentEnd) {
        userUpdate.subscriptionEndDate = new Date(currentEnd * 1000)
        userUpdate.nextPaymentDate = new Date(currentEnd * 1000)
      }
      await db.collection(Collections.USERS).updateOne(
        { _id: new ObjectId(sub.userId) },
        { $set: userUpdate }
      )
    } catch (err) {
      console.error(`[Sync] Failed for ${rpId}:`, err)
      failed++
    }
  }

  return NextResponse.json({
    success: true,
    message: `Synced: ${updated} updated, ${failed} failed`,
    updated,
    failed,
  })
})
