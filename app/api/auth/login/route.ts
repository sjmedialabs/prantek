import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

    console.log("[AUTH-LOGIN] Login attempt:", normalizedEmail)

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await authenticateUser(normalizedEmail, password)

    console.log("[AUTH-LOGIN] Auth result:", result ? "SUCCESS" : "FAILED")
    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const p = result.user.permissions
    console.log("[AUTH-LOGIN] User:", result.user.email)
    console.log("[AUTH-LOGIN] Permissions (session from DB on verify):", Array.isArray(p) ? p : [])

    const response = NextResponse.json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })

    response.cookies.set("userType", result.user.userType, { path: "/" })
    response.cookies.set("companyId", result.user.companyId, { path: "/" })


    // Set tokens in httpOnly cookies for security
    // Note: Secure flag removed for HTTP access (add it back for HTTPS)
    response.cookies.set("auth_token", result.accessToken, {
      httpOnly: true,
      secure: false, // Set to true for HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30, // 30 minutes to match inactivity timeout
    })

    response.cookies.set("accessToken", result.accessToken, {
      httpOnly: true,
      secure: false, // Set to true for HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30, // 30 minutes to match inactivity timeout
    })

    response.cookies.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false, // Set to true for HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("[AUTH-LOGIN] Error in /api/auth/login:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
