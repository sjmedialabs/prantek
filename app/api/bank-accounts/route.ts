import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const bankAccounts = await db
    .collection(Collections.BANK_ACCOUNTS)
    .find({ organizationId: user.organizationId })
    .toArray()

  return NextResponse.json(bankAccounts)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  const bankAccount = {
    ...data,
    organizationId: user.organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.BANK_ACCOUNTS).insertOne(bankAccount)

  return NextResponse.json({ ...bankAccount, _id: result.insertedId })
})
