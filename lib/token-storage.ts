/**
 * Client-side token storage utilities
 * Stores JWT tokens securely in localStorage
 * Separate storage for regular admin and super-admin sessions
 */

const ACCESS_TOKEN_KEY = "auth_access_token"
const REFRESH_TOKEN_KEY = "auth_refresh_token"
const SUPER_ADMIN_ACCESS_TOKEN_KEY = "super_admin_access_token"
const SUPER_ADMIN_REFRESH_TOKEN_KEY = "super_admin_refresh_token"

/**
 * Determine if current path is super-admin
 */
function isSuperAdminPath(): boolean {
  if (typeof window !== "undefined") {
    return window.location.pathname.startsWith("/super-admin")
  }
  return false
}

/**
 * Get appropriate token keys based on context
 */
function getTokenKeys() {
  const isSuperAdmin = isSuperAdminPath()
  return {
    accessKey: isSuperAdmin ? SUPER_ADMIN_ACCESS_TOKEN_KEY : ACCESS_TOKEN_KEY,
    refreshKey: isSuperAdmin ? SUPER_ADMIN_REFRESH_TOKEN_KEY : REFRESH_TOKEN_KEY,
  }
}

export const tokenStorage = {
  /**
   * Store access token (context-aware)
   */
  setAccessToken(token: string, forceSuperAdmin?: boolean): void {
    if (typeof window !== "undefined") {
      const key = forceSuperAdmin ? SUPER_ADMIN_ACCESS_TOKEN_KEY : getTokenKeys().accessKey
      localStorage.setItem(key, token)
    }
  },

  /**
   * Get access token (context-aware)
   */
  getAccessToken(forceSuperAdmin?: boolean): string | null {
    if (typeof window !== "undefined") {
      const key = forceSuperAdmin ? SUPER_ADMIN_ACCESS_TOKEN_KEY : getTokenKeys().accessKey
      return localStorage.getItem(key)
    }
    return null
  },

  /**
   * Store refresh token (context-aware)
   */
  setRefreshToken(token: string, forceSuperAdmin?: boolean): void {
    if (typeof window !== "undefined") {
      const key = forceSuperAdmin ? SUPER_ADMIN_REFRESH_TOKEN_KEY : getTokenKeys().refreshKey
      localStorage.setItem(key, token)
    }
  },

  /**
   * Get refresh token (context-aware)
   */
  getRefreshToken(forceSuperAdmin?: boolean): string | null {
    if (typeof window !== "undefined") {
      const key = forceSuperAdmin ? SUPER_ADMIN_REFRESH_TOKEN_KEY : getTokenKeys().refreshKey
      return localStorage.getItem(key)
    }
    return null
  },

  /**
   * Clear tokens for current context
   */
  clearTokens(forceSuperAdmin?: boolean): void {
    if (typeof window !== "undefined") {
      if (forceSuperAdmin !== undefined) {
        if (forceSuperAdmin) {
          localStorage.removeItem(SUPER_ADMIN_ACCESS_TOKEN_KEY)
          localStorage.removeItem(SUPER_ADMIN_REFRESH_TOKEN_KEY)
        } else {
          localStorage.removeItem(ACCESS_TOKEN_KEY)
          localStorage.removeItem(REFRESH_TOKEN_KEY)
        }
      } else {
        const keys = getTokenKeys()
        localStorage.removeItem(keys.accessKey)
        localStorage.removeItem(keys.refreshKey)
      }
    }
  },

  /**
   * Clear all tokens (both regular and super-admin)
   */
  clearAllTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(SUPER_ADMIN_ACCESS_TOKEN_KEY)
      localStorage.removeItem(SUPER_ADMIN_REFRESH_TOKEN_KEY)
    }
  },

  /**
   * Check if user is authenticated (has access token)
   */
  isAuthenticated(forceSuperAdmin?: boolean): boolean {
    return !!this.getAccessToken(forceSuperAdmin)
  },
}

/**
/**
 * Server-side function to get token from request (checks headers and cookies)
 */
export function getTokenFromRequest(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  
  // Try cookies (for Next.js requests)
  if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
    const token = (request as any).cookies.get("auth_token")?.value || 
                  (request as any).cookies.get("accessToken")?.value
    if (token) return token
  }
  
  return null
}
