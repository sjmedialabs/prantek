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
  avatar?: string
  address?: string
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

