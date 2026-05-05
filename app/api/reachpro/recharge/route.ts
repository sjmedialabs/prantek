import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { calculateTaxBreakdown } from "@/lib/reachpro"
import { ensureReachProWallet, getMatchingRange, getReachProConfig, normalizeRanges, validateRanges } from "@/lib/reachpro-wallet"
import { ObjectId } from "mongodb"

export const POST = withAuth(async (request: NextRequest, user) => {
  const db = await connectDB()
  const body = await request.json()
  const amount = Number(body?.amount || 0)
  const paymentReference = String(body?.paymentReference || "")
  
  console.log(`[REACHPRO/RECHARGE] Processing recharge for user ${user.userId}, amount: ${amount}, ref: ${paymentReference}`)

  const plan = await getReachProConfig()
  if (!plan) {
    console.error(`[REACHPRO/RECHARGE] ReachPro configuration not found in subscription_plans collection.`)
    return NextResponse.json({ success: false, error: "ReachPro configuration not found." }, { status: 400 })
  }

  const minTopup = Number(plan?.minTopupAmount || 0)
  if (!amount || amount < minTopup) {
    return NextResponse.json(
      { success: false, error: `Minimum topup amount is ₹${minTopup}.` },
      { status: 400 },
    )
  }

  const ranges = normalizeRanges((plan as any)?.reachProPricingRanges || [])
  const rangeValidation = validateRanges(ranges)
  if (!rangeValidation.valid) {
    return NextResponse.json({ success: false, error: rangeValidation.error }, { status: 400 })
  }
  const matchedRange = getMatchingRange(amount, ranges)
  if (!matchedRange) {
    return NextResponse.json({ success: false, error: "Recharge amount does not match any ReachPro pricing range." }, { status: 400 })
  }
  const tax = calculateTaxBreakdown(amount, Boolean(plan?.taxIncluded))
  const purchasedCredits = Math.floor(tax.baseAmount / matchedRange.costPerMail)
  const wallet = await ensureReachProWallet(user.userId)
  const balanceBefore = Number(wallet.balance || 0)
  const balanceAfter = balanceBefore + tax.baseAmount
  const creditsBefore = Number(wallet.remainingMailCredits || 0)
  const creditsAfter = creditsBefore + purchasedCredits
  const now = new Date()

  console.log(`[REACHPRO/RECHARGE] Wallet found: before=${balanceBefore}, credit=${tax.baseAmount}, after=${balanceAfter}`)

  // 1. Update REACHPRO_WALLETS (same as signup register route)
  await db.collection(Collections.REACHPRO_WALLETS).updateOne(
    { userId: user.userId },
    {
      $set: {
        balance: balanceAfter,
        totalRecharge: Number(wallet.totalRecharge || 0) + tax.baseAmount,
        currentCostPerMail: matchedRange.costPerMail,
        remainingMailCredits: creditsAfter,
        totalPurchasedMailCredits: Number(wallet.totalPurchasedMailCredits || 0) + purchasedCredits,
        activePricingRange: matchedRange,
        lastRechargeAt: now,
        isActive: balanceAfter > 0,
        updatedAt: now,
      },
    },
  )

  // 2. Sync wallet fields on USERS document (matching register route pattern)
  try {
    const userDoc = await db.collection(Collections.USERS).findOne(
      ObjectId.isValid(user.userId) ? { _id: new ObjectId(user.userId) } : { _id: user.userId as any }
    )
    const prevWalletBalance = Number(userDoc?.walletBalance || 0)
    const prevTotalRecharge = Number(userDoc?.totalRechargeAmount || 0)
    
    await db.collection(Collections.USERS).updateOne(
      ObjectId.isValid(user.userId) ? { _id: new ObjectId(user.userId) } : { _id: user.userId as any },
      {
        $set: {
          walletBalance: prevWalletBalance + tax.baseAmount,
          totalRechargeAmount: prevTotalRecharge + tax.baseAmount,
          lastRechargeAt: now,
          updatedAt: now,
        },
      },
    )
    console.log(`[REACHPRO/RECHARGE] User document synced: userId=${user.userId}`)
  } catch (err) {
    console.error(`[REACHPRO/RECHARGE] Failed to sync user document:`, err)
  }

  // 3. Insert transaction record
  await db.collection(Collections.REACHPRO_TRANSACTIONS).insertOne({
    userId: user.userId,
    type: "recharge",
    amount: tax.baseAmount,
    emailsDeducted: 0,
    costPerMail: matchedRange.costPerMail,
    taxAmount: tax.taxAmount,
    balanceBefore,
    balanceAfter,
    creditsBefore,
    creditsAfter,
    referenceId: paymentReference,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({
    success: true,
    data: {
      walletBalance: balanceAfter,
      creditedAmount: tax.baseAmount,
      purchasedCredits,
      costPerMail: matchedRange.costPerMail,
      activePricingRange: matchedRange,
      taxAmount: tax.taxAmount,
      totalPayable: tax.totalPayable,
    },
  })
})

