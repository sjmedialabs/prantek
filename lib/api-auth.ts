import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractTokenFromHeader } from "./jwt"
import type { JWTPayload } from "./jwt"

/**
 * Verify JWT token from API request (checks both Authorization header and cookies)
 * @param request - Next.js API request
 * @returns JWT payload if valid, null if invalid
 */
export async function verifyApiRequest(request: NextRequest): Promise<JWTPayload | null> {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization")
  let token = extractTokenFromHeader(authHeader)

  // If no token in header, try cookies
  if (!token) {
    token = request.cookies.get("auth_token")?.value || request.cookies.get("accessToken")?.value || null
  }

  if (!token) {
    return null
  }

  return await verifyToken(token)
}

/**
 * Middleware wrapper for protected API routes
 * Automatically verifies JWT and adds user to request
 */
export function withAuth(handler: (request: NextRequest, user: JWTPayload, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const user = await verifyApiRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - Invalid or missing token" }, { status: 401 })
    }

    return handler(request, user, context)
  }
}

/**
 * Middleware wrapper for super admin only API routes
 */
export function withSuperAdmin(handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await verifyApiRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - Invalid or missing token" }, { status: 401 })
    }

    if (user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    return handler(request, user)
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(user: JWTPayload, role: "user" | "super-admin" | "admin"): boolean {
  return user.role === role
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 })
}
