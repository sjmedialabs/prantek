// app/api/auth/update-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { compare, hash } from "bcryptjs"
import { connectDB } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// import { usersCollection } from "@/lib/db-collections" // adjust to your structure

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, currentPassword, newPassword } = body

    console.log("[UPDATE PASSWORD] Request:", userId)

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 1️⃣ Fetch user
    const db = await connectDB()
   const user = await db
  .collection("users")
  .findOne({ _id: new ObjectId(userId) })


    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // 2️⃣ Verify current password
    const isValid = await compare(currentPassword, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      )
    }

    // 3️⃣ Hash new password
    const newHashedPassword = await hash(newPassword, 10)

    // 4️⃣ Update password in DB
   await db.collection("users").updateOne(
  { _id: new ObjectId(userId) },
  { $set: { password: newHashedPassword } }
)


    console.log("[UPDATE PASSWORD] Password updated successfully")

    return NextResponse.json(
      { success: true, message: "Password updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[UPDATE PASSWORD] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
