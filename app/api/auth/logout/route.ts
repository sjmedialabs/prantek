import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Clear auth cookies
  response.cookies.delete("accessToken")
  response.cookies.delete("refreshToken")

  return response
}
