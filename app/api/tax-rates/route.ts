import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // For admin users, filter by companyId (parent account)
    // For regular users, filter by userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const taxRates = await mongoStore.getAll("tax-rates", { userId: filterUserId }, { sort: { createdAt: -1 } })
    
    return NextResponse.json({ success: true, data: taxRates })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch tax rates" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    
    // For admin users, use companyId (parent account)
    // For regular users, use userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const taxRate = await mongoStore.create("tax-rates", { ...body, userId: filterUserId })
    
    return NextResponse.json({ success: true, data: taxRate })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create tax rate" }, { status: 500 })
  }
})
