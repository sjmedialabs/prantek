import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { connectDB } from "@/lib/mongodb"
import { COLLECTIONS } from "@/lib/db-config"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get("authorization")
    let token = null
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }
    
    // If no token in header, try cookies
    if (!token) {
      token = request.cookies.get("auth_token")?.value || request.cookies.get("accessToken")?.value || null
    }
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Fetch user from database (check ADMIN_USERS first, then regular users)
    const db = await connectDB()
    let user
    let isAdminUser = false
    
    try {
      // Try admin users first
      user = await db.collection(COLLECTIONS.ADMIN_USERS).findOne({ 
        _id: new ObjectId(payload.userId)
      })
      
      if (user) {
        isAdminUser = true // User is from User Management
      } else {
        // If not found in admin users, try regular users
        user = await db.collection(COLLECTIONS.USERS).findOne({ 
          _id: new ObjectId(payload.userId)
        })
        isAdminUser = false // User is an account owner
      }
    } catch {
      // If conversion fails, try searching by string id
      user = await db.collection(COLLECTIONS.ADMIN_USERS).findOne({ 
        _id: payload.userId as any
      })
      
      if (user) {
        isAdminUser = true
      } else {
        user = await db.collection(COLLECTIONS.USERS).findOne({ 
          _id: payload.userId as any
        })
        isAdminUser = false
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: user.roleId,
        permissions: user.permissions || payload.permissions || [],
        isAdminUser: isAdminUser, // Distinguish admin users from account owners
        clientId: user.clientId,
        companyId: user.companyId,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,
        subscriptionPlanId: user.subscriptionPlanId || payload.subscriptionPlanId,
        subscriptionStatus: user.subscriptionStatus || payload.subscriptionStatus,
        subscriptionStartDate: user.subscriptionStartDate || payload.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate || payload.subscriptionEndDate,
        trialEndsAt: user.trialEndsAt || payload.trialEndsAt,
      },
    })
  } catch (error) {
    console.error("[AUTH-VERIFY] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
