import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { signEmailVerificationToken } from "@/lib/jwt"

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json()
    const normalizedEmail = email ? String(email).trim().toLowerCase() : ""
    const otpStr = otp ? String(otp).trim() : ""
    if (!normalizedEmail || !otpStr) {
      return NextResponse.json({ success: false, error: "Email and OTP are required" }, { status: 400 })
    }

    const db = await connectDB()
    const col = db.collection(Collections.OTPS)

    const record = await col.findOne({
      email: normalizedEmail,
      otp: otpStr,
      verified: false,
    })

    if (!record) {
      return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 })
    }

    if (new Date() > new Date(record.expiresAt)) {
      return NextResponse.json({ success: false, error: "OTP expired" }, { status: 400 })
    }

    await col.updateOne({ _id: record._id }, { $set: { verified: true } })

    const token = await signEmailVerificationToken(normalizedEmail)
    return NextResponse.json({ success: true, token })
  } catch (err) {
    console.error("[verify-email-otp] Error:", err)
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 })
  }
}
