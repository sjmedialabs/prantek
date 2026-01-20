import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import bcrypt from "bcryptjs"
import { notifySuperAdminsNewRegistration } from "@/lib/notification-utils"
import { calculateTrialEndDate } from "@/lib/trial-helper"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const data = await request.json()
    
    // Validate required fields
    if (!data.email || !data.password || !data.name) {
      return NextResponse.json({ 
        success: false, 
        error: "Email, password, and name are required" 
      }, { status: 400 })
    }
    
    // Normalize email to lowercase
    const normalizedEmail = data.email.toLowerCase()
    
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
    // let trialEndsAt = null
    let subscriptionStartDate = null
    // let subscriptionEndDate = null
    
    if (data.subscriptionPlanId) {
      // User selected a plan - automatically start trial with configured period
      subscriptionStatus = "trial"
      subscriptionStartDate = new Date()
      
      // Set trial end date based on system configuration
      // const trialEndDate = await calculateTrialEndDate()
      // trialEndsAt = trialEndDate
      // subscriptionEndDate = trialEndDate
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
      subscriptionStatus,
      trialEndsAt:data.trialEndDate || null,
      subscriptionStartDate,
      subscriptionEndDate: data.subscriptionEndDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await db.collection(Collections.USERS).insertOne(newUser)
    const userId = result.insertedId.toString()
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
