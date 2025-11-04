/**
 * Client-side token storage utilities
 * Stores JWT tokens securely in localStorage
 */

const ACCESS_TOKEN_KEY = "auth_access_token"
const REFRESH_TOKEN_KEY = "auth_refresh_token"

export const tokenStorage = {
  /**
   * Store access token
   */
  setAccessToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
    }
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ACCESS_TOKEN_KEY)
    }
    return null
  },

  /**
   * Store refresh token
   */
  setRefreshToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
    }
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    }
    return null
  },

  /**
   * Clear all tokens (logout)
   */
  clearTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  },

  /**
   * Check if user is authenticated (has access token)
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  },
}

/**
 * Server-side function to get token from request headers
 */
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  return null
}
