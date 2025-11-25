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
