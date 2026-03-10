import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import crypto from "crypto"

const VERIFICATION_TOKEN_EXPIRY_MS = 15 * 60 * 1000 // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, emailOtp, phone, phoneOtp } = body as {
      email?: string
      emailOtp?: string
      phone?: string
      phoneOtp?: string
    }

    const normalizedEmail = email ? String(email).trim().toLowerCase() : ""
    if (!normalizedEmail || !emailOtp || String(emailOtp).length < 6) {
      return NextResponse.json(
        { success: false, error: "Email and 6-digit email OTP are required" },
        { status: 400 }
      )
    }

    const db = await connectDB()
    const col = db.collection(Collections.OTP_VERIFICATIONS)
    const doc = await col.findOne(
      { email: normalizedEmail },
      { sort: { createdAt: -1 } }
    )
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "No OTP found for this email. Please request a new code." },
        { status: 400 }
      )
    }
    if (new Date() > new Date(doc.expiresAt)) {
      await col.deleteOne({ email: normalizedEmail })
      return NextResponse.json(
        { success: false, error: "Verification code expired. Please request a new one." },
        { status: 400 }
      )
    }
    if (String(doc.emailOtp) !== String(emailOtp).trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid email verification code." },
        { status: 400 }
      )
    }

    const hasPhone = doc.phone && phone
    if (hasPhone && doc.phoneOtp) {
      const normalizedPhone = String(phone).trim().replace(/\D/g, "").slice(-10)
      const docPhone = String(doc.phone).replace(/\D/g, "").slice(-10)
      if (docPhone === normalizedPhone && String(doc.phoneOtp) !== String(phoneOtp || "").trim()) {
        return NextResponse.json(
          { success: false, error: "Invalid phone verification code." },
          { status: 400 }
        )
      }
    }

    const verificationToken = crypto.randomBytes(32).toString("hex")
    const tokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS)
    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          verifiedAt: new Date(),
          verificationToken,
          tokenExpiresAt,
        },
      }
    )

    return NextResponse.json({
      success: true,
      verificationToken,
      expiresIn: Math.floor(VERIFICATION_TOKEN_EXPIRY_MS / 1000),
    })
  } catch (error) {
    console.error("[verify-signup-otp] Error:", error)
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    )
  }
}
