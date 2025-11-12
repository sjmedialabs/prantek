import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import bcrypt from "bcryptjs"
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt"
import { notifySuperAdminsNewRegistration } from "@/lib/notification-utils"

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
    
    // Notify super admins about new registration
    try {
      await notifySuperAdminsNewRegistration(
        result.insertedId.toString(),
        newUser.name,
        newUser.email
      )
    } catch (notifError) {
      console.error("Failed to send registration notification:", notifError)
      // Don't fail the registration if notification fails
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser
    
    // Generate tokens
    const accessToken = await generateAccessToken({ 
      userId: result.insertedId.toString(), 
      email: newUser.email, 
      role: newUser.role 
    })
    const refreshToken = await generateRefreshToken({ 
      userId: result.insertedId.toString(), 
      email: newUser.email, 
      role: newUser.role 
    })
    
    const response = NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        _id: result.insertedId,
        id: result.insertedId.toString()
      },
      accessToken,
      refreshToken
    })
    
    // Set cookies
    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 60 // 30 minutes to match inactivity timeout
    })
    
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    
    return response
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    )
  }
}
