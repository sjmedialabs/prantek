import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await connectDB()
    const { days = 14 } = await request.json()
    
    // Set trial end date
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + days)
    
    // Update user
    await db.collection("users").updateOne(
      { _id: new ObjectId(payload.userId) },
      {
        $set: {
          subscriptionStatus: "trial",
          trialEndsAt: trialEndDate,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: trialEndDate,
          updatedAt: new Date()
        }
      }
    )

    // Fetch updated user
    const user = await db.collection("users").findOne({ _id: new ObjectId(payload.userId) })

    return NextResponse.json({
      success: true,
      user: {
        id: user?._id.toString(),
        email: user?.email,
        subscriptionStatus: user?.subscriptionStatus,
        trialEndsAt: user?.trialEndsAt,
      },
      message: `Trial period set to ${days} days`
    })
  } catch (error) {
    console.error("[SET-TRIAL] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
