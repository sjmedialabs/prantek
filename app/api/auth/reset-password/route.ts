import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, token, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    console.log("[RESET-PASSWORD] Request for email:", email)

    const db = await connectDB()
    // Case-insensitive email search using regex
    const user = await db.collection("users").findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    })

    if (!user) {
      console.log("[RESET-PASSWORD] User not found:", email)
      return NextResponse.json({ error: "Invalid reset link" }, { status: 400 })
    }

    // If token is provided, verify it
    if (token) {
      if (!user.resetToken || user.resetToken !== token) {
        console.log("[RESET-PASSWORD] Invalid token")
        return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
      }

      if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
        console.log("[RESET-PASSWORD] Token expired")
        return NextResponse.json({ error: "Reset link has expired" }, { status: 400 })
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and clear reset token using the actual email from DB
    await db.collection("users").updateOne(
      { email: user.email },
      { 
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetTokenExpiry: "" }
      }
    )

    console.log("[RESET-PASSWORD] Password reset successful for:", user.email)

    return NextResponse.json({ 
      success: true,
      message: "Password reset successful. You can now log in with your new password." 
    })

  } catch (error) {
    console.error("[RESET-PASSWORD] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
