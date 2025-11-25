import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"
import { createNotification } from "@/lib/notification-utils"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    // For admin users, filter by companyId (parent account)
    // For regular users, filter by userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const vendors = await mongoStore.getAll("vendors", { userId: filterUserId }, { skip, limit, sort: { createdAt: -1 } })
    const total = await mongoStore.count("vendors", { userId: filterUserId })

    return NextResponse.json({
      success: true,
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch vendors" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    
    // For admin users, use companyId (parent account)
    // For regular users, use userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    
    const vendor = await mongoStore.create("vendors", { ...body, userId: filterUserId })

    await logActivity(filterUserId, "create", "vendor", vendor._id?.toString(), { name: body.name })
    try{
       await createNotification({
        userId: user.userId,
        type: "vendor",
        title: "New Vendor Created",
        message: "A new vendor has been created: " + body.name,
        link: `/dashboard/vendor/${vendor?._id?.toString()}`
       })
    }catch(err){
      console.error("Error logging activity for vendor creation:", err)
    }

    return NextResponse.json({ success: true, data: vendor })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create vendor" }, { status: 500 })
  }
})
