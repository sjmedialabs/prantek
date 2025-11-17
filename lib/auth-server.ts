import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { generateAccessToken, generateRefreshToken, type JWTPayload } from "@/lib/jwt"
import bcrypt from "bcryptjs"

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    role: "user" | "admin" | "super-admin"
    clientId?: string
    permissions?: string[]
    roleId?: string
  }
}

// Authenticate admin users with dashboard access
export async function authenticateAdminUser(email: string, password: string): Promise<AuthTokens | null> {
  console.log('[AUTH-SERVER] authenticateAdminUser() called for:', email)
  
  const db = await connectDB()
  const adminUser = await db.collection(Collections.ADMIN_USERS).findOne({ 
    email: { $regex: new RegExp(`^${email}$`, 'i') } 
  })

  if (!adminUser) {
    console.log('[AUTH-SERVER] Admin user not found')
    return null
  }

  // Check if user is active
  if (!adminUser.isActive) {
    console.log('[AUTH-SERVER] Admin user is inactive')
    return null
  }

  console.log('[AUTH-SERVER] Admin user found, verifying password')
  const isPasswordValid = await bcrypt.compare(password, adminUser.password)
  console.log('[AUTH-SERVER] Password valid:', isPasswordValid)
  
  if (!isPasswordValid) {
    return null
  }

  // Update last login
  await db.collection(Collections.ADMIN_USERS).updateOne(
    { _id: adminUser._id },
    { $set: { lastLogin: new Date() } }
  )

  const tokenPayload: Omit<JWTPayload, "iat" | "exp"> = {
    userId: adminUser._id.toString(),
    email: adminUser.email,
    role: adminUser.role || "admin",
    permissions: adminUser.permissions || [],
    roleId: adminUser.roleId?.toString(),
  }
  console.log("[AUTH-SERVER] Token payload:", JSON.stringify(tokenPayload))

  const accessToken = await generateAccessToken(tokenPayload, "1d") 
  const refreshToken = await generateRefreshToken(tokenPayload, "7d")

  return {
    accessToken,
    refreshToken,
    user: {
      id: adminUser._id.toString(),
      email: adminUser.email, 
      name: adminUser.name,
      role: adminUser.role || "admin",
      permissions: adminUser.permissions || [],
      roleId: adminUser.roleId?.toString(),
    },
  }
}

// Legacy authentication for regular users (account owners with subscriptions)
export async function authenticate(email: string, password: string): Promise<AuthTokens | null> {
  console.log('[AUTH-SERVER] authenticate() called for:', email)
  
  const db = await connectDB()
  const user = await db.collection(Collections.USERS).findOne({ 
    email: { $regex: new RegExp(`^${email}$`, 'i') } 
  })

  if (!user) {
    console.log('[AUTH-SERVER] User not found')
    return null
  }

  console.log('[AUTH-SERVER] User found, verifying password')
  const isPasswordValid = await bcrypt.compare(password, user.password)
  console.log('[AUTH-SERVER] Password valid:', isPasswordValid)
  
  if (!isPasswordValid) {
    return null
  }
  
  console.log("[AUTH-SERVER] User subscription data:", { 
    subscriptionPlanId: user.subscriptionPlanId, 
    subscriptionStatus: user.subscriptionStatus 
  })

  const tokenPayload: Omit<JWTPayload, "iat" | "exp"> = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role || "user",
    subscriptionPlanId: user.subscriptionPlanId,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndDate: user.subscriptionEndDate,
  }
  console.log("[AUTH-SERVER] Token payload:", JSON.stringify(tokenPayload))

  const accessToken = await generateAccessToken(tokenPayload, "1d") 
  const refreshToken = await generateRefreshToken(tokenPayload, "7d")

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      email: user.email, 
      name: user.name,
      role: user.role || "user",
      clientId: user.clientId,
    },
  }
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

// Main authentication function - tries admin users first, then regular users
export async function authenticateUser(email: string, password: string): Promise<AuthTokens | null> {
  // Try admin user authentication first
  const adminAuth = await authenticateAdminUser(email, password)
  if (adminAuth) {
    return adminAuth
  }
  
  // Fallback to regular user authentication for backward compatibility
  return authenticate(email, password)
}
