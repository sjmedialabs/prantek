import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { connectDB } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
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

    // Fetch user from database
    const db = await connectDB()
    let user
    
    try {
      // Try to convert userId to ObjectId if it's a valid ObjectId string
      user = await db.collection("users").findOne({ 
        _id: new ObjectId(payload.userId)
      })
    } catch {
      // If conversion fails, try searching by string id
      user = await db.collection("users").findOne({ 
        _id: payload.userId as any
      })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
      },
    })
  } catch (error) {
    console.error("[AUTH-VERIFY] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
