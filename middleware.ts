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
  const isSuperAdminRoute = pathname.startsWith("/super-admin")

  // Get token based on context (super-admin has separate tokens)
  let token: string | undefined
  if (isSuperAdminRoute) {
    token = request.cookies.get("super_admin_auth_token")?.value || 
            request.cookies.get("super_admin_accessToken")?.value ||
            request.headers.get("authorization")?.replace("Bearer ", "")
  } else {
    token = request.cookies.get("auth_token")?.value || 
            request.cookies.get("accessToken")?.value ||
            request.headers.get("authorization")?.replace("Bearer ", "")
  }

  // If accessing protected route
  if (isProtectedRoute) {
    if (!token) {
      // No token, redirect to appropriate signin
      const url = request.nextUrl.clone()
      url.pathname = isSuperAdminRoute ? "/super-admin" : "/signin"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }

    // Verify token
    const payload = await verifyToken(token)

    if (!payload) {
      // Invalid token, redirect to appropriate signin
      const url = request.nextUrl.clone()
      url.pathname = isSuperAdminRoute ? "/super-admin" : "/signin"
      url.searchParams.set("redirect", pathname)
      url.searchParams.set("error", "session_expired")
      return NextResponse.redirect(url)
    }

    // Check role-based access
    if (isSuperAdminRoute && payload.role !== "super-admin") {
      // Not a super admin, redirect to regular dashboard
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    if (!isSuperAdminRoute && pathname.startsWith("/dashboard") && payload.role === "super-admin") {
      // Super admin trying to access regular dashboard, redirect to super-admin
      const url = request.nextUrl.clone()
      url.pathname = "/super-admin/dashboard"
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
      
      // If on super-admin login and have super-admin token, go to super-admin dashboard
      if (pathname === "/super-admin" && payload.role === "super-admin") {
        url.pathname = "/super-admin/dashboard"
        return NextResponse.redirect(url)
      }
      
      // If on regular signin and have regular token, go to dashboard
      if (pathname === "/signin" && payload.role !== "super-admin") {
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
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
