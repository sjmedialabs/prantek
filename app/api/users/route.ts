import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await connectDB()
    const users = await db.collection("users").find({}).toArray()
    return NextResponse.json(users)
  } catch (error) {
    console.error('[API] Error fetching users:', error)
    return NextResponse.json([], { status: 500 })
  }
}
