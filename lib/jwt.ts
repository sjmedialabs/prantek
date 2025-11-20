import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const secret = new TextEncoder().encode(JWT_SECRET)

export interface JWTPayload {
  userId: string
  id?: string // Alias for userId for backward compatibility
  email: string
  role: "user" | "super-admin" | "admin"
  permissions?: string[] // Permissions array for admin users
  roleId?: string // Reference to assigned role
  companyId?: string // Reference to parent account for admin users
  isAdminUser?: boolean // Distinguishes admin users from account owners
  subscriptionStartDate?: Date
  trialEndsAt?: Date
  subscriptionPlanId?: string // For legacy user system
  subscriptionStatus?: string
  subscriptionEndDate?: Date
  iat?: number
  exp?: number
}

/**
 * Generate a JWT access token
 * @param payload - User data to encode in the token
 * @param expiresIn - Token expiration time (default: 1 hour)
 */
export async function generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp">, expiresIn = "1h"): Promise<string> {
  // Ensure both userId and id are set for compatibility
  const tokenPayload = { ...payload, id: payload.userId } as any
  
  const token = await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)

  return token
}

/**
 * Generate a JWT refresh token
 * @param payload - User data to encode in the token
 * @param expiresIn - Token expiration time (default: 7 days)
 */
export async function generateRefreshToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresIn = "7d",
): Promise<string> {
  // Ensure both userId and id are set for compatibility
  const tokenPayload = { ...payload, id: payload.userId } as any
  
  const token = await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)

  return token
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload if valid, null if invalid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    const result = payload as JWTPayload
    // Ensure id is set if userId exists
    if (result.userId && !result.id) {
      result.id = result.userId
    }
    return result
  } catch (error) {
    return null
  }
}

/**
 * Check if a token is expired
 * @param token - JWT token to check
 * @returns true if expired, false if valid
 */
export async function isTokenExpired(token: string): Promise<boolean> {
  const payload = await verifyToken(token)
  if (!payload || !payload.exp) return true

  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * Check if user has a specific permission
 * @param user - User object with permissions array
 * @param permission - Permission to check
 * @returns true if user has permission
 */
export function hasPermission(user: JWTPayload, permission: string): boolean {
  // Super admins have all permissions
  if (user.role === "super-admin") {
    return true
  }
  
  // Check if user has the specific permission
  return user.permissions?.includes(permission) || false
}

/**
 * Check if user has any of the specified permissions
 * @param user - User object with permissions array
 * @param permissions - Array of permissions to check
 * @returns true if user has at least one permission
 */
export function hasAnyPermission(user: JWTPayload, permissions: string[]): boolean {
  // Super admins have all permissions
  if (user.role === "super-admin") {
    return true
  }
  
  // Check if user has any of the specified permissions
  return permissions.some(permission => user.permissions?.includes(permission))
}

/**
 * Check if user has all of the specified permissions
 * @param user - User object with permissions array
 * @param permissions - Array of permissions to check
 * @returns true if user has all permissions
 */
export function hasAllPermissions(user: JWTPayload, permissions: string[]): boolean {
  // Super admins have all permissions
  if (user.role === "super-admin") {
    return true
  }
  
  // Check if user has all of the specified permissions
  return permissions.every(permission => user.permissions?.includes(permission))
}
