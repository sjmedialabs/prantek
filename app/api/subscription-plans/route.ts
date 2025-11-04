import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"

export async function GET() {
  const db = await connectDB()
  const plans = await db.collection(Collections.SUBSCRIPTION_PLANS).find({ active: true }).toArray()

  return NextResponse.json(plans)
}
