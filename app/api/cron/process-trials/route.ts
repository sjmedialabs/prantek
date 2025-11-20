import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"

/**
 * Cron job to process expired trials and convert them to active subscriptions
 * This should be called daily to check for expired trials
 */
export async function POST(request: Request) {
  try {
    // Optional: Add authentication/authorization for cron jobs
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET || "your-secret-key"
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await connectDB()
    const now = new Date()
    
    // Find all users with expired trials
    const expiredTrialUsers = await db
      .collection(Collections.USERS)
      .find({
        subscriptionStatus: "trial",
        trialEndsAt: { $lte: now },
        subscriptionPlanId: { $exists: true, $ne: "" }
      })
      .toArray()
    
    console.log(`Found ${expiredTrialUsers.length} expired trial users`)
    
    const results = {
      processed: 0,
      activated: 0,
      errors: 0,
      users: [] as any[]
    }
    
    // Process each expired trial
    for (const user of expiredTrialUsers) {
      try {
        const { ObjectId } = await import("mongodb")
        
        // Get the subscription plan details
        const plan = await db
          .collection(Collections.SUBSCRIPTION_PLANS)
          .findOne({ _id: new ObjectId(user.subscriptionPlanId) })
        
        if (!plan) {
          console.error(`Plan not found for user ${user.email}`)
          results.errors++
          continue
        }
        
        // Calculate next billing date (30 days from now)
        const nextBillingDate = new Date()
        nextBillingDate.setDate(nextBillingDate.getDate() + 30)
        
        // Update user to active subscription
        await db.collection(Collections.USERS).updateOne(
          { _id: user._id },
          {
            $set: {
              subscriptionStatus: "active",
              subscriptionStartDate: now,
              subscriptionEndDate: nextBillingDate,
              lastBillingDate: now,
              nextBillingDate: nextBillingDate,
              updatedAt: now
            },
            $unset: {
              trialEndsAt: ""
            }
          }
        )
        
        // TODO: Integrate with payment gateway to charge the user
        // This is where you would call Stripe/Razorpay/etc to charge the card
        console.log(`Activated subscription for user ${user.email}, plan: ${plan.name}, amount: ${plan.price}`)
        
        results.processed++
        results.activated++
        results.users.push({
          email: user.email,
          plan: plan.name,
          amount: plan.price,
          status: "activated"
        })
        
      } catch (error) {
        console.error(`Error processing trial for user ${user.email}:`, error)
        results.errors++
        results.users.push({
          email: user.email,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} expired trials`,
      results
    })
    
  } catch (error) {
    console.error("Error in trial processing cron:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process trials",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Also expose as GET for manual triggering (with auth)
export async function GET(request: Request) {
  return POST(request)
}
