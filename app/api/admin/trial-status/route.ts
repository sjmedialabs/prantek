import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withSuperAdmin } from "@/lib/api-auth"

// Return users with upcoming or recently ended trials and their auto-debit state
export const GET = withSuperAdmin(async (req: NextRequest) => {
  const db = await connectDB()

  const { searchParams } = new URL(req.url)
  const daysParam = searchParams.get("days") || "7"
  const days = Number.parseInt(daysParam, 10) || 7

  const now = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 1) // include yesterday for recently-missed charges
  const end = new Date()
  end.setDate(end.getDate() + days)

  const usersCol = db.collection(Collections.USERS)

  const cursor = usersCol
    .find({
      trialEndDate: { $gte: start, $lte: end },
    })
    .sort({ trialEndDate: 1 })
    .limit(200)

  const users = await cursor.toArray()

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

