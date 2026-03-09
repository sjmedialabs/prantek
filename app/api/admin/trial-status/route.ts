import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"

// Return users with upcoming or recently ended trials and their auto-debit state
export const GET = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()

  const { searchParams } = new URL(req.url)
  const daysParam = searchParams.get("days") || "30"
  const days = Number.parseInt(daysParam, 10) || 30
  const showAll = searchParams.get("showAll") === "true"

  const usersCol = db.collection(Collections.USERS)

  let users: any[]

  if (showAll) {
    // Show all users who have a subscription plan (trial or active) for broader visibility
    users = await usersCol
      .find({
        subscriptionPlanId: { $exists: true, $ne: "", $ne: null },
        role: { $ne: "super-admin" },
      })
      .sort({ trialEndDate: -1, trialEndsAt: -1, subscriptionEndDate: -1, createdAt: -1 })
      .limit(200)
      .toArray()
  } else {
    const start = new Date()
    start.setDate(start.getDate() - 1) // include yesterday
    const end = new Date()
    end.setDate(end.getDate() + days)

    // Include users where trialEndDate OR trialEndsAt is in range (many DBs only have trialEndsAt)
    users = await usersCol
      .find({
        $and: [
          { subscriptionPlanId: { $exists: true, $ne: "", $ne: null } },
          {
            $or: [
              { trialEndDate: { $gte: start, $lte: end } },
              { trialEndsAt: { $gte: start, $lte: end } },
              { subscriptionEndDate: { $gte: start, $lte: end } },
            ],
          },
        ],
      })
      .sort({ trialEndDate: 1, trialEndsAt: 1, subscriptionEndDate: 1 })
      .limit(200)
      .toArray()
  }

  const result = users.map((u: any) => ({
    id: u._id?.toString(),
    email: u.email,
    name: u.name,
    subscriptionPlanId: u.subscriptionPlanId || null,
    subscriptionStatus: u.subscriptionStatus || null,
    trialEndDate: u.trialEndDate || u.trialEndsAt || null,
    trialPaymentProcessed: u.trialPaymentProcessed || false,
    razorpayCustomerId: u.razorpayCustomerId || null,
    razorpayTokenId: u.razorpayTokenId || null,
    lastPaymentDate: u.lastPaymentDate || null,
    nextPaymentDate: u.nextPaymentDate || null,
    paymentFailedAt: u.paymentFailedAt || null,
    paymentFailureReason: u.paymentFailureReason || null,
  }))

  return NextResponse.json({ success: true, users: result })
})

