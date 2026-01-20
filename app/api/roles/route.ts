import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"

// GET - Fetch all roles for admin users (dashboard permissions)
export const GET = withAuth(async (req: NextRequest, user: any) => {
  const db = await connectDB()
  
  // For admin users, filter by companyId (parent account)
  // For regular users, filter by userId (their own account)
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  // Fetch roles - can be filtered by userId or fetch all for super-admin
  const query = user.role === "super-admin" ? {} : { userId: String(filterUserId) }
  const roles = await db
    .collection(Collections.ROLES)
    .find(query)
    .toArray()

  return NextResponse.json({ roles })
})

// POST - Create new role for admin users
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const data = await req.json()

    // Validate required fields
    if (!data.name || !data.permissions || !Array.isArray(data.permissions)) {
      return NextResponse.json(
        { error: "Role name and permissions array are required" },
        { status: 400 }
      )
    }

    // Remove empty id and _id fields
    const { id, _id, ...cleanData } = data

    // For admin users, use companyId (parent account)
    // For regular users, use userId (their own account)
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const role = {
      ...cleanData,
      userId: filterUserId,  // Owner of this role definition
      name: data.name,
      code: data.code || data.name.toLowerCase().replace(/\s+/g, '_'),
      permissions: data.permissions,
      description: data.description || '',
      isActive: data?.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection(Collections.ROLES).insertOne(role)

    return NextResponse.json({ ...role, _id: result.insertedId })
  } catch (error: any) {
    console.error("Error creating role:", error)
    return NextResponse.json(
      { error: "Failed to create role", message: error.message },
      { status: 500 }
    )
  }
})
