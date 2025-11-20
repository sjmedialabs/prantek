import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, userType = "admin" } = body

    console.log('[AUTH-LOGIN] Login attempt:', email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await authenticateUser(email, password)

    console.log('[AUTH-LOGIN] Auth result:', result ? 'SUCCESS' : 'FAILED')

    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })

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
