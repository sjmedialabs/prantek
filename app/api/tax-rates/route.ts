import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const taxRates = await db.collection(Collections.TAX_RATES).find({ organizationId: user.organizationId }).toArray()

  return NextResponse.json(taxRates)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const taxRate = {
    ...data,
    organizationId: user.organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.TAX_RATES).insertOne(taxRate)

  return NextResponse.json({ ...taxRate, _id: result.insertedId })
})
