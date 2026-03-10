import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { generateOTP, getExpiry } from "@/lib/otp"
import { Resend } from "resend"

const OTP_EXPIRY_MINUTES = 5
const USE_EMAIL_SERVICE = process.env.USE_EMAIL_SERVICE === "true"
const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@yourdomain.com"
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prantek"

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

    // Fallback mode: return devOtp (only when email service is off)
    if (!USE_EMAIL_SERVICE) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[DEV] OTP for", normalizedEmail, ":", otp)
      }
      return NextResponse.json({ success: true, devOtp: otp })
    }

    // Send via Resend
    if (!RESEND_API_KEY) {
      console.warn("[send-email-otp] USE_EMAIL_SERVICE=true but RESEND_API_KEY not set")
      return NextResponse.json(
        { success: false, error: "Email service is enabled but RESEND_API_KEY is not configured." },
        { status: 503 }
      )
    }
    const resend = new Resend(RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: normalizedEmail,
      subject: `Your ${APP_NAME} verification code`,
      html: `<h2>Your verification code</h2><p>Use this code to verify your email:</p><p style="font-size:24px;letter-spacing:4px;font-weight:bold;">${otp}</p><p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    })
    if (error) {
      console.error("[send-email-otp] Resend error:", error)
      return NextResponse.json(
        { success: false, error: error.message || "Failed to send email" },
        { status: 503 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[send-email-otp] Error:", err)
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}
