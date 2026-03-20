// app/api/auth/update-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { compare, hash } from "bcryptjs"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"

function validateNewPassword(pw: string): string | null {
  if (pw.length < 8) return "New password must be at least 8 characters"
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "New password must include at least one letter and one number"
  }
  return null
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, currentPassword, newPassword, confirmPassword, email: bodyEmail } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!userId && !bodyEmail) {
      return NextResponse.json({ error: "Missing user identifier" }, { status: 400 })
    }

    if (confirmPassword != null && confirmPassword !== newPassword) {
      return NextResponse.json({ error: "New password and confirmation do not match" }, { status: 400 })
    }

    const pwErr = validateNewPassword(String(newPassword))
    if (pwErr) {
      return NextResponse.json({ error: pwErr }, { status: 400 })
    }

    const db = await connectDB()

    let user: { password?: string; _id?: ObjectId } | null = null

    if (userId && ObjectId.isValid(String(userId))) {
      user = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(String(userId)) })
    }

    // Legacy tokens used id "super-admin" while the account lives in USERS — resolve by email
    const normalizedEmail =
      typeof bodyEmail === "string" ? bodyEmail.trim().toLowerCase() : ""
    if (!user && normalizedEmail) {
      user = await db.collection(Collections.USERS).findOne({
        email: normalizedEmail,
        role: "super-admin",
      })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.password || typeof user.password !== "string") {
      return NextResponse.json({ error: "Cannot update password for this account" }, { status: 400 })
    }

    const isValid = await compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    const newHashedPassword = await hash(newPassword, 10)

    await db.collection(Collections.USERS).updateOne({ _id: user._id }, { $set: { password: newHashedPassword } })

    return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("[UPDATE PASSWORD] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
