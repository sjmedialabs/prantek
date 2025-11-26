import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    let token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("auth_token")?.value ||
      request.cookies.get("accessToken")?.value ||
      request.cookies.get("super_admin_auth_token")?.value ||
      request.cookies.get("super_admin_accessToken")?.value ||
      null

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    /**************************************
     * HANDLE SUPER-ADMIN (special case)
     **************************************/
    if (payload.userId === "super-admin" || payload.role === "super-admin") {
      return NextResponse.json({
        user: {
          id: "super-admin",
          email: payload.email,
          name: "Super Admin",
          role: "super-admin",
          userType: "super-admin",
          permissions: ["*"],
          isAdminUser: false,
        }
      })
    }

    /**************************************
     * HANDLE REGULAR USERS
     **************************************/
    const db = await connectDB()

    let user = null
    let isAdminUser = false

    // 1️⃣ TRY ADMIN_USERS COLLECTION
    try {
      user = await db.collection(Collections.ADMIN_USERS).findOne({
        _id: new ObjectId(payload.userId)
      })
    } catch {
      user = await db.collection(Collections.ADMIN_USERS).findOne({
        _id: payload.userId as any
      })
    }

    if (user) {
      isAdminUser = true
    }

    // 2️⃣ IF NOT FOUND → TRY USERS COLLECTION
    if (!user) {
      try {
        user = await db.collection(Collections.USERS).findOne({
          _id: new ObjectId(payload.userId)
        })
      } catch {
        user = await db.collection(Collections.USERS).findOne({
          _id: payload.userId as any
        })
      }
      isAdminUser = false
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role || (isAdminUser ? "admin" : "employee"),
        userType: isAdminUser ? "admin-user" : user.userType,
        roleId: user.roleId,
        permissions: user.permissions || payload.permissions || [],
        isAdminUser,
        companyId: user.companyId || payload.companyId,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,

        // Subscription info (from payload or parent account)
        subscriptionPlanId: payload.subscriptionPlanId || user.subscriptionPlanId,
        subscriptionStatus: payload.subscriptionStatus || user.subscriptionStatus,
        subscriptionStartDate: payload.subscriptionStartDate || user.subscriptionStartDate,
        subscriptionEndDate: payload.subscriptionEndDate || user.subscriptionEndDate,
        trialEndsAt: payload.trialEndsAt || user.trialEndsAt,
      }
    })
  } catch (error) {
    console.error("[AUTH-VERIFY] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
