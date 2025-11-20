import { generateAccessToken, generateRefreshToken, verifyToken } from "./jwt"

export interface User {
  id: string
  email: string
  name: string
  role: "user" | "super-admin" | "admin" | "employee"
  permissions?: string[]
  isAdminUser?: boolean
  roleId?: string
  companyId?: string
  subscriptionPlanId?: string
  subscriptionStatus?: string
  clientId?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

/**
 * Verify user from access token by calling the API
 * @param accessToken - JWT access token
 * @returns User data if valid, null if invalid
 */
export async function verifyUser(accessToken: string): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/verify", {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error("Error verifying user:", error)
    return null
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
  const newAccessToken = await generateAccessToken(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      roleId: payload.roleId,
    },
    "15m"
  )

  return newAccessToken
}
