import { NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"
// ✅ helper
function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}
// ---------------- GET ONE VENDOR ----------------
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const id = getIdFromRequest(request)
    console.log("Fetching vendor with ID:", id)
    // Admin -> filter by companyId
    // User  -> filter by userId
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    console.log("Filter user ID:", filterUserId)
    const vendor = await mongoStore.getById("vendors", id)
    console.log("Fetched vendor:", vendor)
    if (!vendor || vendor.userId !== filterUserId) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: vendor })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch vendor" }, { status: 500 })
  }
})


// ---------------- UPDATE VENDOR ----------------
export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const id = getIdFromRequest(request)
    const body = await request.json()

    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const vendor = await mongoStore.getById("vendors", id)
    if (!vendor || vendor.userId !== filterUserId) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 })
    }

    const updated = await mongoStore.update("vendors", id, {
      ...body,
      updatedAt: new Date(),
    })

    await logActivity(filterUserId, "update", "vendor", id, { updatedFields: Object.keys(body) })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update vendor" }, { status: 500 })
  }
})


// ---------------- DELETE VENDOR ----------------
export const DELETE = withAuth(async (request: NextRequest, user, params) => {
  try {
    const id = params.id

    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const vendor = await mongoStore.getById("vendors", id)
    if (!vendor || vendor.userId !== filterUserId) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 })
    }

    await mongoStore.delete("vendors", id)
    await logActivity(filterUserId, "delete", "vendor", id, { name: vendor.name })

    return NextResponse.json({ success: true, message: "Vendor deleted successfully" })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete vendor" }, { status: 500 })
  }
})
