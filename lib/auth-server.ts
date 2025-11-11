import { connectDB } from "@/lib/mongodb"
import { generateAccessToken, generateRefreshToken, type JWTPayload } from "@/lib/jwt"
import bcrypt from "bcryptjs"

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    role: "user" | "client" | "super-admin"
    clientId?: string
  }
}

export async function authenticate(email: string, password: string): Promise<AuthTokens | null> {
  console.log('[AUTH-SERVER] authenticate() called for:', email)
  
  const db = await connectDB()
  const user = await db.collection("users").findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })

  if (!user) {
    console.log('[AUTH-SERVER] User not found')
    return null
  }

  console.log('[AUTH-SERVER] User found, verifying password')
  const isPasswordValid = await bcrypt.compare(password, user.password)
  console.log('[AUTH-SERVER] Password valid:', isPasswordValid)
  
  if (!isPasswordValid) {
    return null
  console.log("[AUTH-SERVER] User subscription data:", { subscriptionPlanId: user.subscriptionPlanId, subscriptionStatus: user.subscriptionStatus })
  }

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
      subscriptionPlanId: user.subscriptionPlanId,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate,
    },
  }
}

export async function authenticateSuperAdmin(email: string, password: string): Promise<AuthTokens | null> {
  console.log('[AUTH-SERVER] authenticateSuperAdmin() called for:', email)
  
  const db = await connectDB()
  const admin = await db.collection("users").findOne({ 
    email,
    $or: [{ role: "superadmin" }, { role: "super-admin" }]
  })

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
      role: "super-admin" as const
    },
  }
}

// Alias for regular user authentication
export async function authenticateUser(email: string, password: string): Promise<AuthTokens | null> {
  return authenticate(email, password)
}
