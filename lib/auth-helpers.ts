import { cookies } from "next/headers"
import { verifyToken } from "./jwt"
import type { JWTPayload } from "./jwt"

/**
 * Get current user from JWT token in server components
 * @returns User payload if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return null
  }

  return await verifyToken(token)
}

/**
 * Require authentication in server components
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}

/**
 * Require super admin role in server components
 * Throws error if not super admin
 */
export async function requireSuperAdmin(): Promise<JWTPayload> {
  const user = await requireAuth()

  if (user.role !== "super-admin") {
    throw new Error("Forbidden: Super admin access required")
  }

  return user
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: "user" | "super-admin"): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}
