import { tokenStorage } from "./token-storage"
import { isTokenExpired } from "./jwt"

/**
 * Check if access token is expired and refresh if needed
 * @returns true if token is valid or refreshed, false if refresh failed
 */
export async function ensureValidToken(): Promise<boolean> {
  const accessToken = tokenStorage.getAccessToken()
  const refreshToken = tokenStorage.getRefreshToken()

  if (!accessToken || !refreshToken) {
    return false
  }

  // Check if access token is expired
  const expired = await isTokenExpired(accessToken)

  if (!expired) {
    // Token is still valid
    return true
  }

  // Token is expired, try to refresh
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      // Refresh failed, clear tokens
      tokenStorage.clearTokens()
      return false
    }

    const data = await response.json()

    // Store new access token
    tokenStorage.setAccessToken(data.accessToken)

    return true
  } catch (error) {
    // Refresh failed, clear tokens
    tokenStorage.clearTokens()
    return false
  }
}

/**
 * Automatically refresh token before it expires
 * Call this function periodically (e.g., every 5 minutes)
 */
export async function autoRefreshToken(): Promise<void> {
  const accessToken = tokenStorage.getAccessToken()

  if (!accessToken) {
    return
  }

  // Check if token will expire in the next 5 minutes
  const expired = await isTokenExpired(accessToken)

  if (expired) {
    await ensureValidToken()
  }
}

/**
 * Setup automatic token refresh interval
 * @param intervalMs - Interval in milliseconds (default: 5 minutes)
 * @returns Cleanup function to stop the interval
 */
export function setupAutoRefresh(intervalMs: number = 5 * 60 * 1000): () => void {
  const intervalId = setInterval(() => {
    autoRefreshToken()
  }, intervalMs)

  // Return cleanup function
  return () => clearInterval(intervalId)
}
