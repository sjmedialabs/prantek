import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import bcrypt from "bcryptjs"
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const { signupData, paymentId, razorpayOrderId, razorpaySignature } = await request.json()
    
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
      maxAge: 60 * 60 * 24 * 7,
    })
    
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
    })
    
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })
    
    return response
  } catch (error) {
    console.error("Error creating account after payment:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create account after payment verification" 
    }, { status: 500 })
  }
}
