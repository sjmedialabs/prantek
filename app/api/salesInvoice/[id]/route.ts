import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import { withAuth } from "@/lib/api-auth"

function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const id = getIdFromRequest(req)
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    const db = await connectDB()
    
    // For admin users, filter by companyId (parent account)
    // For regular users, filter by userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const query: any = { _id: new ObjectId(id) }
    
    // If not super-admin, restrict to own data
    if (user.role !== "super-admin") {
        query.userId = filterUserId
    }

    const invoice = await db.collection(Collections.SALES_CATEGORIES).findOne(query)

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: invoice })
  } catch (error: any) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoice", message: error.message },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  try {
    const id = getIdFromRequest(req)
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    const body = await req.json()
    const { _id, ...updateData } = body

    const db = await connectDB()
    
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    
    const query: any = { _id: new ObjectId(id) }
    
    if (user.role !== "super-admin") {
        query.userId = filterUserId
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date()

    const result = await db.collection(Collections.SALES_CATEGORIES).updateOne(
      query,
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Invoice not found or permission denied" }, { status: 404 })
    }

    // Fetch updated document
    const updatedInvoice = await db.collection(Collections.SALES_CATEGORIES).findOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, data: updatedInvoice, message: "Invoice updated successfully" })
  } catch (error: any) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update invoice", message: error.message },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (req: NextRequest, user: any) => {
  try {
    const id = getIdFromRequest(req)
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    const db = await connectDB()
    
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    
    const query: any = { _id: new ObjectId(id) }
    
    if (user.role !== "super-admin") {
        query.userId = filterUserId
    }

    const result = await db.collection(Collections.SALES_CATEGORIES).deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Invoice not found or permission denied" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete invoice", message: error.message },
      { status: 500 }
    )
  }
})