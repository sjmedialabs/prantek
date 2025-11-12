import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db-config"

/**
 * Cron job to process payments for users whose trial period has ended
 * This should be scheduled to run daily
 * 
 * Setup in Vercel: Add cron job in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-trial-payments",
 *     "schedule": "0 0 * * *"
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

    console.log(`Found ${usersToCharge.length} users with trial ending today`)

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
          _id: user.subscriptionPlanId
        })

        if (!plan) {
          console.error(`Plan not found for user ${user.email}`)
          results.errors.push({ userId: user._id, error: "Plan not found" })
          results.failed++
          continue
        }

        // In production, you would:
        // 1. Create a Razorpay order for the full plan amount
        // 2. Charge the user's saved payment method
        // 3. Handle success/failure

        // For now, we'll simulate the payment and update the user
        const paymentSuccess = await processPayment(user, plan)

        if (paymentSuccess) {
          // Update user record
          await db.collection("users").updateOne(
            { _id: user._id },
            {
              $set: {
                trialPaymentProcessed: true,
                lastPaymentDate: new Date(),
                nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                subscriptionStatus: "active"
              }
            }
          )

          // Create payment record
          await db.collection("payment_history").insertOne({
            userId: user._id,
            planId: plan._id,
            amount: plan.price,
            currency: "INR",
            status: "success",
            paymentType: "post-trial",
            paymentDate: new Date(),
            createdAt: new Date()
          })

          results.successful++
          console.log(`Successfully charged user ${user.email}`)
        } else {
          results.failed++
          results.errors.push({ userId: user._id, email: user.email, error: "Payment failed" })
          
          // Mark user as payment failed - you might want to send an email notification
          await db.collection("users").updateOne(
            { _id: user._id },
            {
              $set: {
                subscriptionStatus: "payment_failed",
                paymentFailedAt: new Date()
              }
            }
          )
        }
      } catch (error: any) {
        console.error(`Error processing payment for user ${user.email}:`, error)
        results.failed++
        results.errors.push({ 
          userId: user._id, 
          email: user.email, 
          error: error.message 
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} users`,
      results
    })
  } catch (error: any) {
    console.error("Error in trial payment cron job:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Process payment for a user after trial ends
 * In production, integrate with Razorpay to charge the saved payment method
 */
async function processPayment(user: any, plan: any): Promise<boolean> {
  try {
    // TODO: Implement actual Razorpay payment processing
    // 1. Create a Razorpay order with the plan amount
    // 2. Charge the user's saved payment method (if available)
    // 3. Return success/failure
    
    // For now, simulate success
    console.log(`Processing payment for ${user.email}: ₹${plan.price}`)
    
    // Simulate Razorpay API call
    // const razorpayResponse = await chargeCustomer(user.razorpayCustomerId, plan.price)
    
    return true // Simulate successful payment
  } catch (error) {
    console.error("Payment processing error:", error)
    return false
  }
}

// Prevent this route from being cached
export const dynamic = "force-dynamic"
export const revalidate = 0
