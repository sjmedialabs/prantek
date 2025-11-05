import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { isSuperAdmin } = body

    const response = NextResponse.json({ success: true })

    // Clear the appropriate cookies based on user type
    if (isSuperAdmin) {
      response.cookies.delete("super_admin_auth_token")
      response.cookies.delete("super_admin_accessToken")
      response.cookies.delete("super_admin_refreshToken")
    } else {
      response.cookies.delete("auth_token")
      response.cookies.delete("accessToken")
      response.cookies.delete("refreshToken")
    }

    return response
  } catch (error) {
    console.error("[AUTH-LOGOUT] Error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
