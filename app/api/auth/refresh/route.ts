import { type NextRequest, NextResponse } from "next/server"
import { refreshAccessToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    // Generate new access token
    const newAccessToken = await refreshAccessToken(refreshToken)

    if (!newAccessToken) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 })
    }

    return NextResponse.json({
      accessToken: newAccessToken,
      message: "Token refreshed successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 })
  }
}
