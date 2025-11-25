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

// Super admin authentication (checks both collections)
export async function authenticateSuperAdmin(email: string, password: string): Promise<AuthTokens | null> {
  console.log('[AUTH-SERVER] authenticateSuperAdmin() called for:', email)
  
  const db = await connectDB()
  
  // Check ADMIN_USERS collection first
  let admin = await db.collection(Collections.ADMIN_USERS).findOne({ 
    email,
    role: "super-admin"
  })

  // Fallback to USERS collection for backward compatibility
  if (!admin) {
    admin = await db.collection(Collections.USERS).findOne({ 
      email,
      $or: [{ role: "superadmin" }, { role: "super-admin" }]
    })
  }

  if (!admin) {
    console.log('[AUTH-SERVER] No super admin found with email:', email)
    return null
  }

  console.log('[AUTH-SERVER] Super admin found:', admin.email, 'with role:', admin.role)
  console.log('[AUTH-SERVER] Testing password...')
  
  const isPasswordValid = await bcrypt.compare(password, admin.password)
  console.log('[AUTH-SERVER] Password comparison result:', isPasswordValid)
  
  if (!isPasswordValid) {
    console.log('[AUTH-SERVER] Password invalid')
    return null
  }

  console.log('[AUTH-SERVER] Generating tokens...')
  const tokenPayload: Omit<JWTPayload, "iat" | "exp"> = {
    userId: admin._id.toString(),
    email: admin.email,
    role: "super-admin" as const,
    permissions: admin.permissions || [],
  }

  const accessToken = await generateAccessToken(tokenPayload, "15m")
  const refreshToken = await generateRefreshToken(tokenPayload, "7d")

  console.log('[AUTH-SERVER] Tokens generated successfully')

  return {
    accessToken,
    refreshToken,
    user: {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: "super-admin" as const,
      permissions: admin.permissions || [],
    },
  }
}