import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("[FORGOT-PASSWORD] Request for email:", email)

    const db = await connectDB()
    // Case-insensitive email search using regex
    const user = await db.collection("users").findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    })

    if (!user) {
      console.log("[FORGOT-PASSWORD] User not found:", email)
      // Return success anyway for security (don't reveal if email exists)
      return NextResponse.json({ 
        success: true, 
        message: "If an account exists with this email, a password reset link has been sent.",
        emailSent: false
      })
    }

    // Generate reset token
    const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token in database using the actual email from DB
    await db.collection("users").updateOne(
      { email: user.email },
      { 
        $set: { 
          resetToken,
          resetTokenExpiry 
        } 
      }
    )

    console.log("[FORGOT-PASSWORD] Reset token generated for:", user.email)

    // Send email using the actual email from DB
    const emailSent = await sendPasswordResetEmail(user.email, resetToken)

    // Build response
    const response: any = {
      success: true,
      message: emailSent 
        ? "A password reset link has been sent to your email." 
        : "Password reset link generated.",
      emailSent
    }

    // If email wasn't sent (SMTP not configured), include the reset link for development
    if (!emailSent) {
      response.resetToken = resetToken
      response.resetLink = `/reset-password?email=${encodeURIComponent(user.email)}&token=${resetToken}`
      console.log("[FORGOT-PASSWORD] Email not sent. Reset link:", response.resetLink)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("[FORGOT-PASSWORD] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
