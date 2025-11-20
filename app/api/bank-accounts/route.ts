import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  
  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  
  const bankAccounts = await db
    .collection(Collections.BANK_ACCOUNTS)
    .find({ userId: String(filterUserId) })
    .toArray()

  return NextResponse.json(bankAccounts)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  // For admin users, use companyId (parent account)
  // For regular users, use userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const bankAccount = {
    ...data,
    userId: String(filterUserId),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection(Collections.BANK_ACCOUNTS).insertOne(bankAccount)

  return NextResponse.json({ ...bankAccount, _id: result.insertedId })
})
