import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { getReachProConfig, normalizeRanges } from "@/lib/reachpro-wallet"

export const GET = withAuth(async (request: NextRequest, user) => {
  const db = await connectDB()
  const wallet = await db.collection(Collections.REACHPRO_WALLETS).findOne({ userId: String(user.userId) })
  const plan = await getReachProConfig()
  if (!plan) return NextResponse.json({ success: true, data: [], walletBalance: 0 })

  const txns = await db.collection(Collections.REACHPRO_TRANSACTIONS)
    .find({ userId: String(user.userId) })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()

  return NextResponse.json({
    success: true,
    walletBalance: Number(wallet?.balance || 0),
    remainingMailCredits: Number(wallet?.remainingMailCredits || 0),
    totalPurchasedMailCredits: Number(wallet?.totalPurchasedMailCredits || 0),
    currentCostPerMail: Number(wallet?.currentCostPerMail || 0),
    activePricingRange: wallet?.activePricingRange || null,
    lastRechargeAt: wallet?.lastRechargeAt || null,
    pricing: {
      costPerEmailCampaign: Number(plan?.costPerEmailCampaign || 0),
      costPerBulkMessageCampaign: Number(plan?.costPerBulkMessageCampaign || 0),
      minTopupAmount: Number(plan?.minTopupAmount || 0),
      taxIncluded: Boolean(plan?.taxIncluded),
      reachProPricingRanges: normalizeRanges((plan as any)?.reachProPricingRanges || []),
    },
    data: txns,
  })
})
