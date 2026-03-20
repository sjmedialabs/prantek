import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import bcrypt from "bcryptjs"
import { notifySuperAdminsNewRegistration } from "@/lib/notification-utils"
import { calculateTrialEndDate } from "@/lib/trial-helper"
import { ObjectId } from "mongodb"
import { getPaymentDetails } from "@/lib/razorpay"
import { verifyEmailVerificationToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const data = await request.json()
    console.log("[API/REGISTER] Received registration data:", data);
    
    // Validate required fields
    if (!data.email || !data.password || !data.name) {
      return NextResponse.json({ 
        success: false, 
        error: "Email, password, and name are required." 
      }, { status: 400 })
    }
    
    // Normalize email to lowercase
    const normalizedEmail = data.email.toLowerCase()

    // If OTP verification token is provided, validate it (JWT from verify-email-otp or legacy token)
    const verificationToken = data.verificationToken
    if (verificationToken) {
      const jwtPayload = await verifyEmailVerificationToken(verificationToken)
      if (jwtPayload && jwtPayload.email.toLowerCase() === normalizedEmail) {
        // Valid JWT from verify-email-otp; allow registration
      } else {
        const otpCol = db.collection(Collections.OTP_VERIFICATIONS)
        const otpDoc = await otpCol.findOne({
          verificationToken,
          email: normalizedEmail,
          tokenExpiresAt: { $gt: new Date() },
        })
        if (!otpDoc) {
          return NextResponse.json(
            { success: false, error: "Invalid or expired verification. Please verify your email again." },
            { status: 400 }
          )
        }
        await otpCol.updateOne(
          { _id: otpDoc._id },
          { $unset: { verificationToken: "", tokenExpiresAt: "" } }
        )
      }
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await db.collection(Collections.USERS).findOne({ 
      email: { $regex: new RegExp(`^${data.email}$`, 'i') }
    })
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "An account with this email already exists" 
      }, { status: 409 })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    // Handle trial registration - Give trial based on system configuration when a plan is selected
    let subscriptionStatus = "inactive"
    let subscriptionStartDate: Date | null = null
    let subscriptionEndDate: Date | null = data.subscriptionEndDate ? new Date(data.subscriptionEndDate) : null
    let trialEndsAt: Date | null = data.trialEndDate ? new Date(data.trialEndDate) : null
    let trialEndDate: Date | null = trialEndsAt

    if (data.subscriptionPlanId) {
      // User selected a plan - automatically start trial with configured period
      subscriptionStatus = "trial"
      subscriptionStartDate = new Date()
      // Super-admin "Create client" and other flows often omit dates; use system trial days from settings
      if (!subscriptionEndDate || Number.isNaN(subscriptionEndDate.getTime())) {
        subscriptionEndDate = await calculateTrialEndDate()
      }
      if (!trialEndsAt || Number.isNaN(trialEndsAt.getTime())) {
        trialEndsAt = subscriptionEndDate
        trialEndDate = subscriptionEndDate
      } else if (!subscriptionEndDate || Number.isNaN(subscriptionEndDate.getTime())) {
        subscriptionEndDate = trialEndsAt
      }
    }

    /** Initial history row so super-admin "subscription history" and APIs see the trial period. */
    let subscriptionHistory: object[] | undefined
    if (
      data.subscriptionPlanId &&
      subscriptionStartDate &&
      subscriptionEndDate &&
      !Number.isNaN(subscriptionStartDate.getTime()) &&
      !Number.isNaN(subscriptionEndDate.getTime())
    ) {
      let planName = "Plan"
      try {
        if (ObjectId.isValid(String(data.subscriptionPlanId))) {
          const planDoc = await db
            .collection(Collections.SUBSCRIPTION_PLANS)
            .findOne({ _id: new ObjectId(String(data.subscriptionPlanId)) })
          if (planDoc && typeof (planDoc as { name?: string }).name === "string") {
            planName = (planDoc as { name: string }).name
          }
        }
      } catch {
        // ignore plan name lookup failures
      }
      subscriptionHistory = [
        {
          planId: String(data.subscriptionPlanId),
          planName,
          startDate: subscriptionStartDate.toISOString(),
          endDate: subscriptionEndDate.toISOString(),
          status: subscriptionStatus === "trial" ? "trial" : "active",
          amount: 0,
          assignedAt: new Date().toISOString(),
          source: "signup" as const,
        },
      ]
    }

    // If this registration was triggered after a Razorpay payment,
    // attempt to fetch customer and token IDs so cron-based auto-debit can work.
    let razorpayCustomerId = ""
    let razorpayTokenId = ""
    const paymentId: string | undefined = data.paymentId

    if (paymentId) {
      try {
        const paymentDetails = await getPaymentDetails(paymentId)
        // @ts-expect-error: Razorpay SDK typing may not include these fields explicitly
        razorpayCustomerId = (paymentDetails as any).customer_id || ""
        // @ts-expect-error: Razorpay SDK typing may not include this field explicitly
        razorpayTokenId = (paymentDetails as any).token_id || ""
        console.log(
          `[Register] Stored Razorpay customer ${razorpayCustomerId} and token ${razorpayTokenId} for ${normalizedEmail}`,
        )
      } catch (error) {
        console.error("[Register] Error fetching Razorpay payment details:", error)
      }
    }
    
    // Create new user with normalized email
    const newUser = {
      email: normalizedEmail,
      password: hashedPassword,
      name: data.name,
      role: data.role || "admin",
      userType: "subscriber",
      phone: data.phone || "",
      address: data.address || "",
      subscriptionPlanId: data.subscriptionPlanId || "",
      billingCycle: data.billingCycle || "monthly",
      subscriptionPrice: data.subscriptionPrice || 0,
      paidAmount: data.paidAmount || 0,
      discountPercentage: data.discountPercentage || 0,
      subscriptionStatus,
      trialEndsAt,
      trialEndDate,
      trialPaymentProcessed: false,
      subscriptionStartDate,
      subscriptionEndDate,
      razorpayCustomerId,
      razorpayTokenId,
      razorpaySubscriptionId: data.razorpaySubscriptionId || undefined,
      lastPaymentDate: paymentId ? new Date() : undefined,
      nextPaymentDate: null,
      paymentFailedAt: undefined,
      paymentFailureReason: undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(subscriptionHistory ? { subscriptionHistory } : {}),
    }
    
    const result = await db.collection(Collections.USERS).insertOne(newUser)
    const userId = result.insertedId.toString()

    if (data.razorpaySubscriptionId && data.subscriptionPlanId && razorpayCustomerId) {
      try {
        await db.collection(Collections.SUBSCRIPTIONS).insertOne({
          userId,
          planId: data.subscriptionPlanId,
          razorpayCustomerId,
          razorpaySubscriptionId: data.razorpaySubscriptionId,
          status: "created",
          autoDebitEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      } catch (subErr) {
        console.error("[Register] Failed to create subscription record:", subErr)
      }
    }

    const notificationSettings = await db.collection(Collections.NOTIFICATIONSETTINGS).insertOne({
      userId: userId,
      quotationNotifications: true,
      receiptNotifications: true,
      paymentNotifications: true,
    })
    
    // Log subscription activity if trial started
    if (subscriptionStatus === "trial" && data.subscriptionPlanId) {
      try {
        // Get subscription plan details
        const planDetails = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
          _id: new ObjectId(data.subscriptionPlanId)
        })
        
        const activityLog = {
          userId: userId,
          userName: newUser.name,
          userEmail: newUser.email,
          action: "Trial Started",
          resource: planDetails?.name || "Subscription Plan",
          planName: planDetails?.name || "Unknown Plan",
          amount: 0, // Trial is free
          category: "subscription",
          status: "success",
          details: `Free trial started for ${planDetails?.planName || "subscription plan"}`,
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown",
          timestamp: new Date(),
          createdAt: new Date()
        }
        
        await db.collection(Collections.ACTIVITY_LOGS).insertOne(activityLog)
      } catch (logError) {
        console.error("Failed to log trial activity:", logError)
        // Don't fail the main operation if logging fails
      }
    }
    
    // Notify super admins about new registration
    try {
      await notifySuperAdminsNewRegistration(
        userId,
        newUser.name,
        newUser.email
      )
    } catch (notifError) {
      console.error("Failed to send registration notification:", notifError)
      // Don't fail the registration if notification fails
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser
    
    // Return success without auto-login
    // User needs to sign in manually after registration
    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please sign in to continue.",
      user: {
        ...userWithoutPassword,
        _id: result.insertedId,
        id: userId
      }
    })
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    )
  }
}
