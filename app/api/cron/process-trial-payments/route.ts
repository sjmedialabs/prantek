import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { chargeCustomerToken, getPaymentDetails } from "@/lib/razorpay"
import { ObjectId } from "mongodb"

/**
 * Cron job to process payments for users whose trial period has ended
 * This should be scheduled to run daily
 * 
 * Setup in Vercel: Add cron job in vercel.json:
 * {
 *   "crons": [{\n *     "path": "/api/cron/process-trial-payments",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await connectDB()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all users whose trial ends today and haven't been charged yet
    const usersToCharge = await db.collection("users").find({
      trialEndDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      trialPaymentProcessed: { $ne: true },
      isActive: true
    }).toArray()

    console.log(`[Cron] Found ${usersToCharge.length} users with trial ending today`)

    const results = {
      total: usersToCharge.length,
      successful: 0,
      failed: 0,
      errors: [] as any[]
    }

    for (const user of usersToCharge) {
      try {
        // Get user's subscription plan details
        const plan = await db.collection("subscription_plans").findOne({
          _id: new ObjectId(user.subscriptionPlanId)
        })

        if (!plan) {
          console.error(`[Cron] Plan not found for user ${user.email}`)
          results.errors.push({ userId: user._id, error: "Plan not found" })
          results.failed++
          continue
        }

        // Check if user has a Razorpay customer ID
        if (!user.razorpayCustomerId) {
          console.error(`[Cron] No Razorpay customer ID for user ${user.email}`)
          results.errors.push({ 
            userId: user._id, 
            email: user.email, 
            error: "No saved payment method" 
          })
          results.failed++
          
          // Mark user as payment failed
          await db.collection("users").updateOne(
            { _id: user._id },
            {
              $set: {
                subscriptionStatus: "payment_failed",
                paymentFailedAt: new Date()
              }
            }
          )
          continue
        }

        // Attempt to charge the customer using their saved token
        const paymentResult = await processPayment(user, plan)

        if (paymentResult.success) {
          // Update user record with successful payment
          const nextPaymentDate = new Date()
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 30)

          await db.collection("users").updateOne(
            { _id: user._id },
            {
              $set: {
                trialPaymentProcessed: true,
                lastPaymentDate: new Date(),
                nextPaymentDate: nextPaymentDate,
                subscriptionStatus: "active",
                subscriptionEndDate: nextPaymentDate,
                subscriptionStartDate: new Date()
              }
            }
          )

          // Create payment history record
          await db.collection("payment_history").insertOne({
            userId: user._id,
            planId: plan._id,
            amount: plan.price,
            currency: "INR",
            status: "success",
            paymentType: "post-trial",
            razorpayPaymentId: paymentResult.paymentId,
            razorpayOrderId: paymentResult.orderId || null,
            paymentDate: new Date(),
            createdAt: new Date()
          })

          results.successful++
          console.log(`[Cron] Successfully charged user ${user.email} - Amount: ₹${plan.price}`)
        } else {
          results.failed++
          results.errors.push({ 
            userId: user._id, 
            email: user.email, 
            error: paymentResult.error || "Payment failed" 
          })
          
          // Mark user as payment failed and record reason
          await db.collection("users").updateOne(
            { _id: user._id },
            {
              $set: {
                subscriptionStatus: "payment_failed",
                paymentFailedAt: new Date(),
                paymentFailureReason: paymentResult.error || "Unknown error"
              }
            }
          )

          // Create failed payment record
          await db.collection("payment_history").insertOne({
            userId: user._id,
            planId: plan._id,
            amount: plan.price,
            currency: "INR",
            status: "failed",
            paymentType: "post-trial",
            failureReason: paymentResult.error,
            paymentDate: new Date(),
            createdAt: new Date()
          })

          console.log(`[Cron] Failed to charge user ${user.email} - Reason: ${paymentResult.error}`)
        }
      } catch (error: any) {
        console.error(`[Cron] Error processing payment for user ${user.email}:`, error)
        results.failed++
        results.errors.push({ 
          userId: user._id, 
          email: user.email, 
          error: error.message 
        })

        // Mark user as payment failed
        await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: {
              subscriptionStatus: "payment_failed",
              paymentFailedAt: new Date(),
              paymentFailureReason: error.message
            }
          }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} users`,
      results
    })
  } catch (error: any) {
    console.error("[Cron] Error in trial payment cron job:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Process payment for a user after trial ends using Razorpay API
 * Attempts to charge the customer's saved payment method
 */
async function processPayment(user: any, plan: any): Promise<{
  success: boolean
  paymentId?: string
  orderId?: string
  error?: string
}> {
  try {
    // Get list of saved tokens for the customer
    const db = await connectDB()
    
    console.log(`[Payment] Processing payment for ${user.email}: ₹${plan.price}`)
    console.log(`[Payment] Razorpay Customer ID: ${user.razorpayCustomerId}`)

    // Try to charge using the customer's saved token
    // In a real scenario, you would have stored a token ID for the customer
    // For now, we'll attempt to create a recurring payment with customer ID
    
    const payment = await chargeCustomerToken(
      user.razorpayCustomerId,
      user.razorpayTokenId || "", // Token ID should be stored during initial payment
      plan.price,
      "INR",
      `Subscription renewal for ${user.email}`
    )

    if (payment && payment.id) {
      console.log(`[Payment] Razorpay payment created: ${payment.id}`)
      console.log(`[Payment] Payment status: ${payment.status}`)

      return {
        success: payment.status === "captured" || payment.status === "authorized",
        paymentId: payment.id,
        orderId: payment.order_id,
        error: payment.status !== "captured" && payment.status !== "authorized" 
          ? `Payment status: ${payment.status}` 
          : undefined
      }
    }

    return {
      success: false,
      error: "Payment API returned no response"
    }
  } catch (error: any) {
    console.error("[Payment] Payment processing error:", error)
    
    // Check if error is due to missing token
    if (error.message?.includes("token") || error.message?.includes("Token")) {
      return {
        success: false,
        error: "No valid payment method on file. Please add a payment method."
      }
    }

    // Check for insufficient funds
    if (error.message?.includes("insufficient") || error.description?.includes("insufficient")) {
      return {
        success: false,
        error: "Insufficient funds in the account"
      }
    }

    // Check for declined card
    if (error.message?.includes("declined") || error.description?.includes("declined")) {
      return {
        success: false,
        error: "Payment method declined by bank"
      }
    }

    return {
      success: false,
      error: error.message || "Payment processing failed"
    }
  }
}

// Prevent this route from being cached
export const dynamic = "force-dynamic"
export const revalidate = 0
