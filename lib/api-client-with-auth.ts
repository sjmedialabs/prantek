import { tokenStorage } from "./token-storage"
import { ensureValidToken } from "./token-refresh"

/**
 * Fetch wrapper that automatically includes JWT token and handles refresh
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Ensure token is valid (refresh if needed)
  const tokenValid = await ensureValidToken()

  if (!tokenValid) {
    throw new Error("Authentication required")
  }

  const accessToken = tokenStorage.getAccessToken()

  // Add Authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  })

  // If unauthorized, try to refresh token once
  if (response.status === 401) {
    const refreshed = await ensureValidToken()

    if (refreshed) {
      // Retry the request with new token
      const newAccessToken = tokenStorage.getAccessToken()
      const retryHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newAccessToken}`,
      }

      return fetch(url, {
        ...options,
        headers: retryHeaders,
      })
    }

    // Refresh failed, redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/signin?error=session_expired"
    }
  }

  return response
}

/**
 * Convenience methods for authenticated API calls
 */
export const authApi = {
  get: (url: string, options?: RequestInit) => authenticatedFetch(url, { ...options, method: "GET" }),

  post: (url: string, data?: any, options?: RequestInit) =>
    authenticatedFetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: any, options?: RequestInit) =>
    authenticatedFetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: RequestInit) => authenticatedFetch(url, { ...options, method: "DELETE" }),
}
