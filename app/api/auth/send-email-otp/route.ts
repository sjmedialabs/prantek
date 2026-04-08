import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { generateOTP, getExpiry } from "@/lib/otp"
import { sendSignupOtpEmail } from "@/lib/email"

const OTP_EXPIRY_MINUTES = 5

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    const normalizedEmail = email ? String(email).trim().toLowerCase() : ""
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 })
    }

    const otp = generateOTP()
    const expiresAt = getExpiry(OTP_EXPIRY_MINUTES)
    const db = await connectDB()
    const col = db.collection(Collections.OTPS)

    const inserted = await col.insertOne({
      email: normalizedEmail,
      otp,
      expiresAt,
      verified: false,
      createdAt: new Date(),
    })

    const result = await sendSignupOtpEmail(normalizedEmail, otp)
    if (!result.sent) {
      await col.deleteOne({ _id: inserted.insertedId })
      console.error("[send-email-otp] Email send failed:", result.reason)
      return NextResponse.json(
        {
          success: false,
          error:
            result.reason ||
            "Could not send verification email. Check your email settings or try again in a few minutes.",
        },
        { status: 503 },
      )
    }

    return NextResponse.json({ success: true, emailSent: true, message: "Verification code sent to your email." })
  } catch (err) {
    console.error("[send-email-otp] Error:", err)
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}
