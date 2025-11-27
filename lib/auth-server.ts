import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { generateAccessToken, generateRefreshToken, type JWTPayload } from "@/lib/jwt"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: any
}

/************************************************************
 * STEP 1 — Authenticate ADMIN-USER from ADMIN_USERS
 ************************************************************/
async function authenticateAdminUser(email: string, password: string): Promise<AuthTokens | null> {
  console.log("[AUTH] Trying admin-user login:", email)

  const db = await connectDB()

  const adminUser = await db.collection(Collections.ADMIN_USERS).findOne({
    email: { $regex: new RegExp(`^${email}$`, "i") }
  })

  if (!adminUser) return null

  if (!adminUser.isActive) {
    console.log("[AUTH] Admin-user inactive")
    return null
  }

  const isPasswordValid = await bcrypt.compare(password, adminUser.password)
  if (!isPasswordValid) return null

  // Fetch parent company owner
  const parentAccount = await db.collection(Collections.USERS).findOne({
    _id: new ObjectId(adminUser.companyId)
  })

  const subscriptionData = parentAccount
    ? {
        subscriptionPlanId: parentAccount.subscriptionPlanId,
        subscriptionStatus: parentAccount.subscriptionStatus,
        subscriptionStartDate: parentAccount.subscriptionStartDate,
        subscriptionEndDate: parentAccount.subscriptionEndDate,
        trialEndsAt: parentAccount.trialEndsAt
      }
    : {}

  // Update last login
  await db.collection(Collections.ADMIN_USERS).updateOne(
    { _id: adminUser._id },
    { $set: { lastLogin: new Date() } }
  )

  const payload: Omit<JWTPayload, "exp" | "iat"> = {
    userId: adminUser._id.toString(),
    email: adminUser.email,
    role: "admin-user",
    userType: "admin-user",
    companyId: adminUser.companyId,
    isAdminUser: true, // ✅ CRITICAL: This enables admin-user to access parent's data
    permissions: adminUser.permissions || [],
    roleId: adminUser.roleId || null,
    ...subscriptionData
  }

  return {
    accessToken: await generateAccessToken(payload, "1d"),
    refreshToken: await generateRefreshToken(payload, "7d"),
    user: {
      ...payload,
      id: adminUser._id.toString(),
      name: adminUser.name
    }
  }
}

/************************************************************
 * STEP 2 — Authenticate COMPANY OWNER (subscriber/admin)
 ************************************************************/
async function authenticateCompanyOwner(email: string, password: string): Promise<AuthTokens | null> {
  console.log("[AUTH] Trying company-owner:", email)

  const db = await connectDB()

  const user = await db.collection(Collections.USERS).findOne({
    email: { $regex: new RegExp(`^${email}$`, "i") },
    userType: { $in: ["subscriber", "admin"] }
  })

  if (!user) return null

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) return null

  await db.collection(Collections.USERS).updateOne(
    { _id: user._id },
    { $set: { lastLogin: new Date() } }
  )

  const payload: Omit<JWTPayload, "exp" | "iat"> = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role || "admin",
    userType: user.userType,
    companyId: user._id.toString(), // owner is root
    isAdminUser: false, // ✅ Regular admin, not an admin-user
    permissions: user.permissions || [],
    subscriptionPlanId: user.subscriptionPlanId,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndDate: user.subscriptionEndDate,
    trialEndsAt: user.trialEndsAt
  }

  return {
    accessToken: await generateAccessToken(payload, "1d"),
    refreshToken: await generateRefreshToken(payload, "7d"),
    user: {
      ...payload,
      id: user._id.toString(),
      name: user.name
    }
  }
}

/************************************************************
 * MAIN AUTH ENTRYPOINT
 * Login priority:
 * 1. admin-user → ADMIN_USERS
 * 2. admin/subscriber → USERS
 ************************************************************/
export async function authenticateUser(email: string, password: string) {
  const adminUser = await authenticateAdminUser(email, password)
  if (adminUser) return adminUser

  const companyOwner = await authenticateCompanyOwner(email, password)
  if (companyOwner) return companyOwner

  return null
}

/************************************************************
 * SUPER ADMIN AUTHENTICATION
 * Validates against environment variables for super admin access
 ************************************************************/
export async function authenticateSuperAdmin(email: string, password: string): Promise<AuthTokens | null> {
  console.log("[AUTH] Attempting super-admin login:", email)

  try {
    // First, try to authenticate from database
    const db = await connectDB()
    const superAdmin = await db.collection(Collections.SUPER_ADMINS).findOne({ 
      email: email.toLowerCase() 
    })

    if (superAdmin) {
      console.log("[AUTH] Found super admin in database")
      
      // Verify password (assuming it's hashed in database)
      const isPasswordValid = await bcrypt.compare(password, superAdmin.password)
      
      if (!isPasswordValid) {
        console.log("[AUTH] Super admin password mismatch (DB)")
        return null
      }

      console.log("[AUTH] Super admin authentication successful (DB)")

      // Create JWT payload for super admin
      const payload: JWTPayload = {
        userId: superAdmin._id?.toString() || "super-admin",
        id: superAdmin._id?.toString() || "super-admin",
        email: superAdmin.email,
        role: "super-admin",
        userType: "super-admin",
        companyId: null,
        isAdminUser: false,
        permissions: ["*"], // Full permissions
        isSuperAdmin: true
      }

      return {
        accessToken: await generateAccessToken(payload, "30m"),
        refreshToken: await generateRefreshToken(payload, "7d"),
        user: {
          id: payload.userId,
          email: payload.email,
          name: superAdmin.name || "Super Admin",
          role: "super-admin",
          userType: "super-admin",
          permissions: ["*"],
          isSuperAdmin: true
        }
      }
    }
  } catch (error) {
    console.error("[AUTH] Error checking database for super admin:", error)
  }

  // Fallback to environment variables (for backward compatibility)
  console.log("[AUTH] Checking environment variables for super admin")
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD

  if (!superAdminEmail || !superAdminPassword) {
    console.error("[AUTH] Super admin credentials not configured in environment or database")
    return null
  }

  // Check if email matches (case-insensitive)
  if (email.toLowerCase() !== superAdminEmail.toLowerCase()) {
    console.log("[AUTH] Super admin email mismatch")
    return null
  }

  // Check if password matches (plain text comparison for env fallback)
  if (password !== superAdminPassword) {
    console.log("[AUTH] Super admin password mismatch")
    return null
  }

  console.log("[AUTH] Super admin authentication successful (ENV)")

  // Create JWT payload for super admin
  const payload: JWTPayload = {
    userId: "super-admin",
    id: "super-admin",
    email: superAdminEmail,
    role: "super-admin",
    userType: "super-admin",
    companyId: null,
    isAdminUser: false,
    permissions: ["*"], // Full permissions
    isSuperAdmin: true
  }

  return {
    accessToken: await generateAccessToken(payload, "30m"),
    refreshToken: await generateRefreshToken(payload, "7d"),
    user: {
      id: "super-admin",
      email: superAdminEmail,
      name: "Super Admin",
      role: "super-admin",
      userType: "super-admin",
      permissions: ["*"],
      isSuperAdmin: true
    }
  }
}
