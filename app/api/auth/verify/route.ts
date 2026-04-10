import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { coercePermissionStrings } from "@/lib/permission-utils"
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
     * DB super-admins have a real ObjectId in the token; only env-based fallback uses "super-admin".
     **************************************/
    if (payload.userId === "super-admin" || payload.role === "super-admin") {
      const idFromToken = (() => {
        const uid = payload.userId && String(payload.userId)
        if (uid && ObjectId.isValid(uid)) return uid
        const alias = payload.id && String(payload.id)
        if (alias && ObjectId.isValid(alias)) return alias
        return "super-admin"
      })()

      let displayName = "Prakash Reddy"
      if (idFromToken !== "super-admin" && ObjectId.isValid(idFromToken)) {
        try {
          const db = await connectDB()
          const doc = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(idFromToken) })
          if (doc && typeof doc.name === "string" && doc.name.trim()) displayName = doc.name
        } catch {
          // ignore
        }
      }

      return NextResponse.json({
        user: {
          id: idFromToken,
          email: payload.email,
          name: displayName,
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
      const safePerms = coercePermissionStrings(user.permissions)
      console.log("[AUTH-VERIFY] Admin user found:", {
        email: user.email,
        permissions: safePerms,
        hasPermissions: safePerms.length > 0,
        permissionCount: safePerms.length,
      })
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

    const permsFromDb = coercePermissionStrings(user.permissions)
    const resolvedPermissions =
      permsFromDb.length > 0 ? permsFromDb : coercePermissionStrings(payload.permissions)

    const userResponse = {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role || (isAdminUser ? "admin" : "employee"),
        userType: isAdminUser ? "admin-user" : user.userType,
        roleId: user.roleId,
        permissions: resolvedPermissions,
        isAdminUser,
        companyId: user.companyId || payload.companyId,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,
        avatar: user.avatar,

        // Subscription info (from payload or parent account)
        subscriptionPlanId: payload.subscriptionPlanId || user.subscriptionPlanId,
        subscriptionStatus: payload.subscriptionStatus || user.subscriptionStatus,
        subscriptionStartDate: payload.subscriptionStartDate || user.subscriptionStartDate,
        subscriptionEndDate: payload.subscriptionEndDate || user.subscriptionEndDate,
        trialEndsAt: payload.trialEndsAt || user.trialEndsAt,
      }
    }

    console.log("[AUTH-VERIFY] Returning user:", {
      email: userResponse.user.email,
      isAdminUser: userResponse.user.isAdminUser,
      permissions: userResponse.user.permissions,
      permissionCount: userResponse.user.permissions.length,
    })

    return NextResponse.json(userResponse)
  } catch (error) {
    console.error("[AUTH-VERIFY] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
