import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import bcrypt from "bcryptjs"
import {createNotification, notifySuperAdminsNewRegistration } from "@/lib/notification-utils"

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
    
    // Handle trial registration - Always give 14-day trial when a plan is selected
    let subscriptionStatus = "inactive"
    let trialEndsAt = null
    let subscriptionStartDate = null
    let subscriptionEndDate = null
    
    if (data.subscriptionPlanId) {
      // User selected a plan - automatically start 14-day trial
      subscriptionStatus = "trial"
      subscriptionStartDate = new Date()
      
      // Set trial end date to 14 days from now
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 14)
      trialEndsAt = trialEndDate
      subscriptionEndDate = trialEndDate
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
      trialEndsAt,
      subscriptionStartDate,
      subscriptionEndDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await db.collection(Collections.USERS).insertOne(newUser)
    const adminUserId=await db.collection(Collections.USERS).findOne({role:"super-admin"});
    console.log("Super admin details for registration notification:",adminUserId);
    // Notify super admins about new registration
    try {
      await createNotification({
        userId: adminUserId?._id.toString() || "",
        type:"new-registration",
        title:"New User Registration",
        message:`A new user has registered with the email: ${newUser.email}`,
        link:"/super-admin/clients"
      })
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
        id: result.insertedId.toString()
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
