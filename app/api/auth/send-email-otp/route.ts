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

    await col.insertOne({
      email: normalizedEmail,
      otp,
      expiresAt,
      verified: false,
      createdAt: new Date(),
    })

    // Development fallback: if SES is not configured, return devOtp so signup flow still works
    const sesConfigured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    if (!sesConfigured && process.env.NODE_ENV !== "production") {
      console.log("[send-email-otp] SES not configured. Returning devOtp for", normalizedEmail)
      return NextResponse.json({ success: true, devOtp: otp })
    }

    const result = await sendSignupOtpEmail(normalizedEmail, otp)
    if (!result.sent) {
      console.error("[send-email-otp] SES send failed:", result.reason)
      return NextResponse.json(
        { success: false, error: result.reason || "Failed to send verification email." },
        { status: 503 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[send-email-otp] Error:", err)
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}
