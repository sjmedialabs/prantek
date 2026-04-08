import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { sendSignupOtpEmail } from "@/lib/email"

const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const OTP_LENGTH = 6
const MAX_OTP_PER_EMAIL_MS = 15 * 60 * 1000 // 15 min window
const MAX_OTP_PER_EMAIL = 5

function generateOtp(): string {
  const digits = "0123456789"
  let otp = ""
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone } = body as { email?: string; phone?: string }

    const normalizedEmail = email ? String(email).trim().toLowerCase() : ""
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      )
    }

    const db = await connectDB()
    const col = db.collection(Collections.OTP_VERIFICATIONS)

    const since = new Date(Date.now() - MAX_OTP_PER_EMAIL_MS)
    const recentCount = await col.countDocuments({
      email: normalizedEmail,
      createdAt: { $gte: since },
    })
    if (recentCount >= MAX_OTP_PER_EMAIL) {
      return NextResponse.json(
        { success: false, error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      )
    }

    const emailOtp = generateOtp()
    const phoneOtp = phone ? generateOtp() : null
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)
    const normalizedPhone = phone ? String(phone).trim().replace(/\D/g, "").slice(-10) : null

    const inserted = await col.insertOne({
      email: normalizedEmail,
      emailOtp,
      phoneOtp: phoneOtp ?? null,
      phone: normalizedPhone,
      expiresAt,
      createdAt: new Date(),
    })

    const result = await sendSignupOtpEmail(normalizedEmail, emailOtp)

    if (!result.sent) {
      await col.deleteOne({ _id: inserted.insertedId })
      console.error("[send-signup-otp] SES send failed:", result.reason)
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

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
      emailSent: true,
      ...(normalizedPhone ? { phoneOtpSent: false, messagePhone: "SMS not configured. Use email OTP only." } : {}),
    })
  } catch (error) {
    console.error("[send-signup-otp] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    )
  }
}
