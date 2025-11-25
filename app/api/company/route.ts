import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

//
// ✅ GET – retrieve company settings
//
export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()

  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const company = await db
    .collection(Collections.COMPANY_SETTINGS)
    .findOne({ userId: String(filterUserId) })

  return NextResponse.json({ company })
})

//
// ✅ POST – create new company settings (initial setup) — NO AUTH
export const POST = async (req: NextRequest) => {
  const db = await connectDB()
  const data = await req.json()

  // ✅ Extract userId from body since auth removed
  if (!data.userId) {
    return NextResponse.json(
      { error: "userId is required when auth is disabled" },
      { status: 400 }
    )
  }

  const existing = await db
    .collection(Collections.COMPANY_SETTINGS)
    .findOne({ userId: String(data.userId) })

  if (existing) {
    return NextResponse.json(
      { error: "Company settings already exist. Use PUT to update." },
      { status: 400 }
    )
  }

  const now = new Date()

  const newCompany = {
    ...data,
    createdAt: now,
    updatedAt: now,
  }

  const result = await db
    .collection(Collections.COMPANY_SETTINGS)
    .insertOne(newCompany)

  return NextResponse.json({
    company: { ...newCompany, _id: result.insertedId },
  })
}

//
// ✅ PUT – upsert (update or create if not exists)
//
export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  const data = await req.json()

  // For admin users, use companyId (parent account)
  // For regular users, use userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const now = new Date()

  const updated = await db
    .collection(Collections.COMPANY_SETTINGS)
    .findOneAndUpdate(
      { userId: String(filterUserId) },
      {
        $set: {
          ...data,
          updatedAt: now,
        },
        $setOnInsert: {
          userId: String(filterUserId),
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    )

  return NextResponse.json({ company: updated })
})
