import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { withAuth } from "@/lib/api-auth"

const EMPLOYEE_ROLES_COLLECTION = "employee_roles"

// PUT - Update employee role
export const PUT = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const db = await connectDB()
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const data = await req.json()
    const { id, _id, ...updateData } = data

    const result = await db.collection(EMPLOYEE_ROLES_COLLECTION).updateOne(
      { _id: new ObjectId(params.id), userId: String(filterUserId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating employee role:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update role" },
      { status: 500 }
    )
  }
})

// DELETE - Delete employee role
export const DELETE = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const db = await connectDB()

    const result = await db.collection(EMPLOYEE_ROLES_COLLECTION).deleteOne({
      _id: new ObjectId(params.id), userId: String(filterUserId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting employee role:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete role" },
      { status: 500 }
    )
  }
})
