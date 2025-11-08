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
    
    // Check if user already exists
    const existingUser = await db.collection(Collections.USERS).findOne({ email: data.email })
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "An account with this email already exists" 
      }, { status: 409 })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    // Create new user
    const newUser = {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role || "admin",
      phone: data.phone || "",
      address: data.address || "",
      subscriptionPlanId: data.subscriptionPlanId || "",
      subscriptionStatus: data.subscriptionStatus || "inactive",
      trialEndsAt: data.trialEndsAt || null,
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
    
    // Generate JWT tokens
    const tokenPayload = {
      userId: result.insertedId.toString(),
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
      user: { ...safeUser, _id: result.insertedId, id: result.insertedId.toString() },
      accessToken,
      refreshToken,
    })
    
    // Set HTTP-only cookies
    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes
    })
    
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    return response
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create account" 
    }, { status: 500 })
  }
}
