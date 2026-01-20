import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import bcrypt from "bcryptjs"
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const { signupData, paymentId, razorpayOrderId, razorpaySignature, planAmount, planName } = await request.json()
    
    // Validate required fields
    if (!signupData?.email || !signupData?.password || !signupData?.name) {
      return NextResponse.json({ 
        success: false, 
        error: "Email, password, and name are required" 
      }, { status: 400 })
    }
    
    // Check if user already exists
    const existingUser = await db.collection(Collections.USERS).findOne({ email: signupData.email })
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "An account with this email already exists" 
      }, { status: 409 })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(signupData.password, 10)
    
    // Determine subscription status
    const subscriptionStatus = signupData.freeTrial ? "trial" : "active"
    const trialEndsAt = signupData.freeTrial 
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
      : null
    
    // Create new user
    const newUser = {
      email: signupData.email,
      password: hashedPassword,
      name: signupData.name,
      role: "admin",
      phone: signupData.phone || "",
      address: signupData.address || "",
      subscriptionPlanId: signupData.subscriptionPlanId || "",
      subscriptionStatus: subscriptionStatus,
      trialEndsAt: trialEndsAt,
      paymentId: paymentId || "",
      razorpayOrderId: razorpayOrderId || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await db.collection(Collections.USERS).insertOne(newUser)
    const userId = result.insertedId.toString()
    
    // Get subscription plan details if available
    let planDetails = null
    if (signupData.subscriptionPlanId) {
      planDetails = await db.collection(Collections.SUBSCRIPTION_PLANS).findOne({
        _id: new ObjectId(signupData.subscriptionPlanId)
      })
    }
    
    // Log subscription purchase activity
    try {
      const activityLog = {
        userId: userId,
        userName: newUser.name,
        userEmail: newUser.email,
        action: subscriptionStatus === "trial" ? "Trial Started" : "Subscription Purchased",
        resource: planDetails?.planName || planName || "Subscription Plan",
        planName: planDetails?.planName || planName || "Unknown Plan",
        amount: planAmount || planDetails?.price || 0,
        category: "subscription",
        status: "success",
        details: subscriptionStatus === "trial" 
          ? `14-day trial started for ${planDetails?.planName || "plan"}`
          : `Paid subscription activated for ${planDetails?.planName || "plan"}`,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown",
        timestamp: new Date(),
        createdAt: new Date()
      }
      
      await db.collection(Collections.ACTIVITY_LOGS).insertOne(activityLog)
    } catch (logError) {
      console.error("Failed to log subscription activity:", logError)
      // Don't fail the main operation if logging fails
    }
    
    // Generate JWT tokens
    const tokenPayload = {
      userId: userId,
      email: newUser.email,
      role: newUser.role as "user" | "admin" | "super-admin",
    }
    
    const accessToken = await generateAccessToken(tokenPayload)
    const refreshToken = await generateRefreshToken(tokenPayload)
    
    // Remove password from response
    const { password: _, ...safeUser } = newUser
    
    // Set cookies
    const response = NextResponse.json({ 
      success: true, 
      user: { ...safeUser, _id: result.insertedId, id: userId },
      accessToken,
      refreshToken,
    })
    
    // Set HTTP-only cookies
    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })
    
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30, // 30 minutes to match inactivity timeout
    })
    
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })
    
    
    // ✅ Trigger automatic refund of ₹1 verification payment
    // This happens asynchronously - user account is created immediately
    try {
      const refundResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9080'}/api/payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentId,
          amount: 100, // ₹1 in paise
          reason: 'Verification payment refund - Auto-pay enabled'
        })
      });
      
      const refundData = await refundResponse.json();
      
      if (refundData.success) {
        console.log('✅ Verification payment refunded successfully:', refundData.refund.id);
        
        // Update user record with refund info
        await db.collection(Collections.USERS).updateOne(
          { _id: result.insertedId },
          { 
            $set: { 
              paymentMethodVerified: true,
              verificationPaymentRefunded: true,
              refundId: refundData.refund.id,
              refundedAt: new Date()
            } 
          }
        );
      } else {
        console.error('⚠️ Refund failed:', refundData.error);
        // Continue anyway - account is created, refund can be processed manually
      }
    } catch (refundError) {
      console.error('⚠️ Refund request failed:', refundError);
      // Continue anyway - account is created, refund can be processed manually
    }
    
    return response
  } catch (error) {
    console.error("Error creating account after payment:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create account after payment verification" 
    }, { status: 500 })
  }
}
