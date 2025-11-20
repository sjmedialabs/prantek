import { withAuth } from "@/lib/api-auth"
import { mongoStore } from "@/lib/mongodb-store"
import { NextRequest, NextResponse } from "next/server"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // For admin users, filter by companyId (parent account)
    // For regular users, filter by userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const taxRates = await mongoStore.getAll("tax-rates", { userId: filterUserId }, { sort: { createdAt: -1 } })
    
    return NextResponse.json({ success: true, data: taxRates })
  } catch (error) {
    console.error("Error fetching tax rates:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch tax rates" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    
    console.log("Creating tax rate with body:", body)
    console.log("User:", { userId: user.userId, isAdminUser: user.isAdminUser, companyId: user.companyId })
    
    // For admin users, use companyId (parent account)
    // For regular users, use userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const taxRate = await mongoStore.create("tax-rates", { ...body, userId: filterUserId })
    
    console.log("Tax rate created successfully:", taxRate)
    
    return NextResponse.json({ success: true, data: taxRate })
  } catch (error) {
    console.error("Error creating tax rate:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create tax rate" 
    }, { status: 500 })
  }
})
