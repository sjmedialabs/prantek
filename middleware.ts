import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/jwt"

// Define protected routes - /super-admin/dashboard and subpaths need auth, but /super-admin login page doesn't
const protectedRoutes = ["/dashboard", "/super-admin/dashboard", "/super-admin/clients", "/super-admin/sales", "/super-admin/settings", "/super-admin/cms", "/super-admin/activity", "/super-admin/subscriptions"]
const authRoutes = ["/signin", "/signup", "/super-admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname === route)

  // Get token from cookie or Authorization header
  const token = request.cookies.get("auth_token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

  // If accessing protected route
  if (isProtectedRoute) {
    if (!token) {
      // No token, redirect to signin
      const url = request.nextUrl.clone()
      url.pathname = "/signin"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }

    // Verify token
    const payload = await verifyToken(token)

    if (!payload) {
      // Invalid token, redirect to signin
      const url = request.nextUrl.clone()
      url.pathname = "/signin"
      url.searchParams.set("redirect", pathname)
      url.searchParams.set("error", "session_expired")
      return NextResponse.redirect(url)
    }

    // Check role-based access
    if (pathname.startsWith("/super-admin") && payload.role !== "super-admin") {
      // Not a super admin, redirect to regular dashboard
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    // Token is valid, allow access
    const response = NextResponse.next()

    // Add user info to headers for server components
    response.headers.set("x-user-id", payload.userId)
    response.headers.set("x-user-email", payload.email)
    response.headers.set("x-user-role", payload.role)

    return response
  }

  // If accessing auth routes while logged in
  if (isAuthRoute && token) {
    const payload = await verifyToken(token)

    if (payload) {
      // Already logged in, redirect to appropriate dashboard
      const url = request.nextUrl.clone()
      url.pathname = payload.role === "super-admin" ? "/super-admin/dashboard" : "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
