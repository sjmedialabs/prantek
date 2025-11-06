import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const taxRates = await db.collection(Collections.TAX_RATES).find({ userId: user.userId }).toArray()

  return NextResponse.json(taxRates)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const taxRate = {
    ...data,
    userId: user.userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.TAX_RATES).insertOne(taxRate)

  return NextResponse.json({ ...taxRate, _id: result.insertedId })
})
