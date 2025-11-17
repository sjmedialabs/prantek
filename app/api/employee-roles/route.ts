import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

const EMPLOYEE_ROLES_COLLECTION = "employee_roles"

// GET - Fetch all employee roles
export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const query = user.role === "super-admin" ? {} : { userId: String(filterUserId) }
  const roles = await db
    .collection(EMPLOYEE_ROLES_COLLECTION)
    .find(query)
    .toArray()

  return NextResponse.json({ success: true, roles })
})

// POST - Create new employee role (no permissions)
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const data = await req.json()
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    if (!data.name || !data.code) {
      return NextResponse.json(
        { success: false, error: "Role name and code are required" },
        { status: 400 }
      )
    }

    const { id, _id, ...cleanData } = data

    const role = {
      ...cleanData,
      userId: String(filterUserId),
      name: data.name,
      code: data.code,
      description: data.description || "",
      isActive: data?.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection(EMPLOYEE_ROLES_COLLECTION).insertOne(role)

    return NextResponse.json({ 
      success: true, 
      role: { ...role, _id: result.insertedId } 
    })
  } catch (error: any) {
    console.error("Error creating employee role:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create role", message: error.message },
      { status: 500 }
    )
  }
})
