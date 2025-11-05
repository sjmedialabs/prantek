import { type NextRequest, NextResponse } from "next/server"
import { authenticateSuperAdmin } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('[SUPER-ADMIN AUTH] Attempting login for:', email)

    if (!email || !password) {
      console.log('[SUPER-ADMIN AUTH] Missing email or password')
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await authenticateSuperAdmin(email, password)

    if (!result) {
      console.log('[SUPER-ADMIN AUTH] Authentication failed for:', email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log('[SUPER-ADMIN AUTH] Authentication successful for:', email)

    const response = NextResponse.json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })

    // Set super-admin specific cookies (separate from regular admin)
    response.cookies.set("super_admin_auth_token", result.accessToken, {
      httpOnly: true,
      secure: false, // Set to true for HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    })

    response.cookies.set("super_admin_accessToken", result.accessToken, {
      httpOnly: true,
      secure: false, // Set to true for HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    })

    response.cookies.set("super_admin_refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false, // Set to true for HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("[SUPER-ADMIN AUTH] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
