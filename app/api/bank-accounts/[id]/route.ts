import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"
function getId(req: NextRequest) {
  return req.nextUrl.pathname.split("/").pop()!
}
export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
    const id = getId(req)
  const bankAccount = await db
    .collection(Collections.BANK_ACCOUNTS)
    .findOne({
    _id: new ObjectId(id),
    userId: String(user.id),
  })

  if (!bankAccount) {
    return NextResponse.json({ error: "Bank account not found" }, { status: 404 })
  }

  return NextResponse.json(bankAccount)
})

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
    const id = getId(req)
  const data = await req.json()

  const result = await db
    .collection(Collections.BANK_ACCOUNTS)
    .findOneAndUpdate(
{
    _id: new ObjectId(id),
    userId: String(user.id),
  },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    )

  if (!result) {
    return NextResponse.json({ error: "Bank account not found" }, { status: 404 })
  }

  return NextResponse.json(result)
})

