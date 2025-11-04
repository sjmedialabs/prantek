import { generateAccessToken, generateRefreshToken, verifyToken } from "./jwt"
import { dataStore } from "./data-store"

export interface User {
  id: string
  email: string
  name: string
  role: "user" | "super-admin"
  companyId?: string
  subscriptionPlanId?: string
  subscriptionStatus?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

/**
 * Authenticate user with email and password
 * @param email - User email
 * @param password - User password
 * @returns Auth tokens and user data if successful, null if failed
 */
export async function authenticateUser(email: string, password: string): Promise<AuthTokens | null> {
  // Get all users from dataStore
  const users = await dataStore.getAll<any>("users")

  // Find user by email and password
  const user = users.find((u: any) => u.email === email && u.password === password)

  if (!user) {
    return null
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role || "user",
  }

  const accessToken = await generateAccessToken(tokenPayload)
  const refreshToken = await generateRefreshToken(tokenPayload)

  // Return tokens and user data (without password)
  const { password: _, ...userWithoutPassword } = user

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  }
}

/**
 * Authenticate super admin with email and password
 * @param email - Super admin email
 * @param password - Super admin password
 * @returns Auth tokens and user data if successful, null if failed
 */
export async function authenticateSuperAdmin(email: string, password: string): Promise<AuthTokens | null> {
  // Get all super admins from dataStore
  const superAdmins = await dataStore.getAll<any>("superAdmins")

  // Find super admin by email and password
  const admin = superAdmins.find((a: any) => a.email === email && a.password === password)

  if (!admin) {
    return null
  }

  // Generate tokens
  const tokenPayload = {
    userId: admin.id,
    email: admin.email,
    role: "super-admin" as const,
  }

  const accessToken = await generateAccessToken(tokenPayload)
  const refreshToken = await generateRefreshToken(tokenPayload)

  // Return tokens and admin data (without password)
  const { password: _, ...adminWithoutPassword } = admin

  return {
    accessToken,
    refreshToken,
    user: { ...adminWithoutPassword, role: "super-admin" as const },
  }
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - Valid refresh token
 * @returns New access token if successful, null if failed
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const payload = await verifyToken(refreshToken)

  if (!payload) {
    return null
  }

  // Generate new access token with same payload
  const newAccessToken = await generateAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })

  return newAccessToken
}

/**
 * Verify user from access token
 * @param accessToken - JWT access token
 * @returns User data if valid, null if invalid
 */
export async function verifyUser(accessToken: string): Promise<User | null> {
  const payload = await verifyToken(accessToken)

  if (!payload) {
    return null
  }

  // Get user from dataStore
  const collection = payload.role === "super-admin" ? "superAdmins" : "users"
  const user = await dataStore.getById<any>(collection, payload.userId)

  if (!user) {
    return null
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}
