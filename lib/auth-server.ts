import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { generateAccessToken, generateRefreshToken, verifyToken, type JWTPayload } from "@/lib/jwt"
import { coercePermissionStrings } from "@/lib/permission-utils"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: any
}

function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase()
}

async function findByNormalizedEmail(db: any, collectionName: string, email: string, extraFilter: Record<string, any> = {}) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return null

  // Fast path for normalized values stored without whitespace.
  const directMatch = await db.collection(collectionName).findOne({
    email: normalizedEmail,
    ...extraFilter,
  })
  if (directMatch) return directMatch

  // Fallback for legacy rows with inconsistent casing/whitespace.
  return await db.collection(collectionName).findOne({
    ...extraFilter,
    $expr: {
      $eq: [{ $toLower: { $trim: { input: "$email" } } }, normalizedEmail],
    },
  })
}

function safeCompanyObjectId(companyId: unknown): ObjectId | null {
  if (companyId == null || companyId === "") return null
  try {
    const s = typeof companyId === "string" ? companyId : String(companyId)
    if (!ObjectId.isValid(s)) return null
    return new ObjectId(s)
  } catch {
    return null
  }
}

/** Authentication only — not authorization. Block inactive accounts if explicitly marked. */
function isLoginBlocked(doc: any): boolean {
  if (doc?.isActive === false) return true
  const st = doc?.status
  if (st != null && String(st).trim() !== "" && String(st).toUpperCase() !== "ACTIVE") return true
  return false
}

/**
 * JWT carries identity + routing fields only. Permissions are loaded from DB on /api/auth/verify and verifyApiRequest.
 * This keeps cookies under size limits when many RBAC permissions are assigned.
 */
function leanAdminUserJwtPayload(
  adminUser: any,
  subscriptionData: Record<string, any>
): Omit<JWTPayload, "exp" | "iat"> {
  return {
    userId: adminUser._id.toString(),
    email: adminUser.email,
    role: "admin-user",
    userType: "admin-user",
    companyId: adminUser.companyId != null ? String(adminUser.companyId) : undefined,
    isAdminUser: true,
    permissions: [],
    roleId: adminUser.roleId != null ? String(adminUser.roleId) : null,
    ...subscriptionData,
  }
}

function leanCompanyOwnerJwtPayload(user: any): Omit<JWTPayload, "exp" | "iat"> {
  return {
    userId: user._id.toString(),
    email: user.email,
    role: user.role || "admin",
    userType: user.userType,
    companyId: user._id.toString(),
    isAdminUser: false,
    permissions: [],
    subscriptionPlanId: user.subscriptionPlanId,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndDate: user.subscriptionEndDate,
    trialEndsAt: user.trialEndsAt,
  }
}

/************************************************************
 * STEP 1 — Authenticate ADMIN-USER from ADMIN_USERS
 ************************************************************/
async function authenticateAdminUser(email: string, password: string): Promise<AuthTokens | null> {
  const normalizedEmail = normalizeEmail(email)
  console.log("[AUTH] Trying admin-user login:", normalizedEmail)

  const db = await connectDB()

  const adminUser = await findByNormalizedEmail(db, Collections.ADMIN_USERS, normalizedEmail)

  if (!adminUser) return null

  if (isLoginBlocked(adminUser)) {
    console.log("[AUTH] Admin-user inactive or non-ACTIVE status")
    return null
  }

  const isPasswordValid = await bcrypt.compare(password, adminUser.password)
  if (!isPasswordValid) return null

  // Fetch parent company owner (never throw — missing/invalid companyId must not break login)
  let parentAccount: any = null
  const companyOid = safeCompanyObjectId(adminUser.companyId)
  if (companyOid) {
    try {
      parentAccount = await db.collection(Collections.USERS).findOne({ _id: companyOid })
    } catch (e) {
      console.error("[AUTH] Parent account lookup failed (non-fatal):", e)
    }
  }

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

  const resolvedPermissions = coercePermissionStrings(adminUser.permissions)
  console.log("[AUTH-LOGIN] User:", adminUser.email)
  console.log("[AUTH-LOGIN] Admin-user roleId:", adminUser.roleId ?? null)
  console.log("[AUTH-LOGIN] Permissions (from DB, not embedded in JWT):", resolvedPermissions)

  const payload = leanAdminUserJwtPayload(adminUser, subscriptionData)

  const userForClient = {
    ...payload,
    id: adminUser._id.toString(),
    name: adminUser.name,
    permissions: resolvedPermissions,
  }

  return {
    accessToken: await generateAccessToken(payload, "1d"),
    refreshToken: await generateRefreshToken(payload, "7d"),
    user: userForClient,
  }
}

/************************************************************
 * STEP 2 — Authenticate COMPANY OWNER (subscriber/admin)
 ************************************************************/
async function authenticateCompanyOwner(email: string, password: string): Promise<AuthTokens | null> {
  const normalizedEmail = normalizeEmail(email)
  console.log("[AUTH] Trying company-owner:", normalizedEmail)

  const db = await connectDB()

  const user = await findByNormalizedEmail(db, Collections.USERS, normalizedEmail, {
    userType: { $in: ["subscriber", "admin"] },
  })

  if (!user) return null

  if (isLoginBlocked(user)) {
    console.log("[AUTH] Company owner inactive or non-ACTIVE status")
    return null
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) return null

  await db.collection(Collections.USERS).updateOne(
    { _id: user._id },
    { $set: { lastLogin: new Date() } }
  )

  const resolvedPermissions = coercePermissionStrings(user.permissions)
  console.log("[AUTH-LOGIN] User:", user.email)
  console.log("[AUTH-LOGIN] Company owner permissions (from DB, not embedded in JWT):", resolvedPermissions)

  const payload = leanCompanyOwnerJwtPayload(user)

  const userForClient = {
    ...payload,
    id: user._id.toString(),
    name: user.name,
    permissions: resolvedPermissions,
  }

  return {
    accessToken: await generateAccessToken(payload, "1d"),
    refreshToken: await generateRefreshToken(payload, "7d"),
    user: userForClient,
  }
}

/************************************************************
 * MAIN AUTH ENTRYPOINT
 * Login priority:
 * 1. admin-user → ADMIN_USERS
 * 2. admin/subscriber → USERS
 ************************************************************/
export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return null

  const adminUser = await authenticateAdminUser(normalizedEmail, password)
  if (adminUser) return adminUser

  const companyOwner = await authenticateCompanyOwner(normalizedEmail, password)
  if (companyOwner) return companyOwner

  return null
}

/**
 * Issue a new access token from a valid refresh token, rebuilding a lean JWT from DB.
 * Keeps access tokens small; permissions always come from DB on API/verify.
 */
export async function reissueAccessTokenFromRefreshToken(refreshToken: string): Promise<string | null> {
  const payload = await verifyToken(refreshToken)
  if (!payload?.userId) return null

  if (payload.role === "super-admin" || payload.isSuperAdmin) {
    const next: Omit<JWTPayload, "exp" | "iat"> = {
      userId: payload.userId,
      email: payload.email,
      role: "super-admin",
      userType: "super-admin",
      companyId: payload.companyId ?? null,
      isAdminUser: false,
      permissions: ["*"],
      isSuperAdmin: true,
    }
    return generateAccessToken(next, "1d")
  }

  const db = await connectDB()
  const uid = payload.userId

  if (payload.isAdminUser || payload.role === "admin-user") {
    let adminUser: any = null
    try {
      adminUser = await db.collection(Collections.ADMIN_USERS).findOne({ _id: new ObjectId(uid) })
    } catch {
      adminUser = await db.collection(Collections.ADMIN_USERS).findOne({ _id: uid as any })
    }
    if (!adminUser || isLoginBlocked(adminUser)) return null

    let parentAccount: any = null
    const companyOid = safeCompanyObjectId(adminUser.companyId)
    if (companyOid) {
      try {
        parentAccount = await db.collection(Collections.USERS).findOne({ _id: companyOid })
      } catch (e) {
        console.error("[AUTH-REFRESH] Parent account lookup failed:", e)
      }
    }

    const subscriptionData = parentAccount
      ? {
          subscriptionPlanId: parentAccount.subscriptionPlanId,
          subscriptionStatus: parentAccount.subscriptionStatus,
          subscriptionStartDate: parentAccount.subscriptionStartDate,
          subscriptionEndDate: parentAccount.subscriptionEndDate,
          trialEndsAt: parentAccount.trialEndsAt,
        }
      : {}

    const lean = leanAdminUserJwtPayload(adminUser, subscriptionData)
    return generateAccessToken(lean, "1d")
  }

  let user: any = null
  try {
    user = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(uid) })
  } catch {
    user = await db.collection(Collections.USERS).findOne({ _id: uid as any })
  }
  if (!user || isLoginBlocked(user)) return null

  const lean = leanCompanyOwnerJwtPayload(user)
  return generateAccessToken(lean, "1d")
}

/************************************************************
 * SUPER ADMIN AUTHENTICATION
 * Validates against environment variables for super admin access
 ************************************************************/
export async function authenticateSuperAdmin(email: string, password: string): Promise<AuthTokens | null> {
  const normalizedEmail = normalizeEmail(email)
  console.log("[AUTH] Attempting super-admin login:", normalizedEmail)

  try {
    // First, try to authenticate from database
    const db = await connectDB()
    // const superAdmin = await db.collection(Collections.SUPER_ADMINS).findOne({ 
    //   email: email.toLowerCase() 
    // })
    const superAdmin = await db.collection(Collections.USERS).findOne({
      email: normalizedEmail,
      role: "super-admin",
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
          name: superAdmin.name || "Prakash Reddy",
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
  if (normalizedEmail !== superAdminEmail.toLowerCase()) {
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
      name: "Prakash Reddy",
      role: "super-admin",
      userType: "super-admin",
      permissions: ["*"],
      isSuperAdmin: true
    }
  }
}
