import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity } from "@/lib/mongodb-store"
import { withAuth, hasPermission } from "@/lib/api-auth"
import { createNotification } from "@/lib/notification-utils"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    console.log("[VENDOR GET] User:", JSON.stringify({
      userId: user.userId,
      email: user.email,
      role: user.role,
      userType: user.userType,
      isAdminUser: user.isAdminUser,
      permissions: user.permissions
    }))
    
    const hasVendorPermission = hasPermission(user, "view_vendors")
    console.log("[VENDOR GET] Has view_vendors permission:", hasVendorPermission)
    
    if (!hasVendorPermission) {
      console.log("[VENDOR GET] Permission denied for user:", user.userId)
      return NextResponse.json({ success: false, error: "Forbidden - view_vendors permission required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const skip = (page - 1) * limit

    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const vendors = await mongoStore.getAll("vendors", { userId: filterUserId }, { skip, limit, sort: { createdAt: -1 } })
    const total = await mongoStore.count("vendors", { userId: filterUserId })

    return NextResponse.json({
      success: true,
      data: vendors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("[VENDOR GET] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch vendors" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Check add_vendors permission
    if (!hasPermission(user, "add_vendors")) {
      return NextResponse.json({ success: false, error: "Forbidden - add_vendors permission required" }, { status: 403 })
    }

    const body = await request.json()
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
