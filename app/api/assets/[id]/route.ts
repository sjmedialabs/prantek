import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import { withAuth } from "@/lib/api-auth"

// Helper: extract ID from URL
function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const data = await req.json()
    const id = getIdFromRequest(req)

    // Use company ID for admin users, user ID for account owners
    const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    // Check if this is an assignment update or regular asset edit
    const isAssignmentUpdate = data.hasOwnProperty('assignedTo') || data.hasOwnProperty('assignmentHistoryItem')
    
    let updateQuery: any = {
      $set: {
        updatedAt: new Date(),
      }
    }

    if (isAssignmentUpdate) {
      // Assignment-related update
      updateQuery.$set = {
        ...updateQuery.$set,
        assignedTo: data.assignedTo,
        assignedToName: data.assignedToName,
        assignedDate: data.assignedDate,
        submittedDate: data.submittedDate ?? null,
        status: data.status,
      }

      // Add assignment history if provided
      const historyPush = data.assignmentHistoryItem || null
      if (historyPush) {
        updateQuery.$push = {
          assignmentHistory: historyPush
        }
      }
    } else {
      // Regular asset field update
      const { _id, userId, createdAt, updatedAt, assignmentHistory, ...updateFields } = data
      updateQuery.$set = {
        ...updateQuery.$set,
        ...updateFields
      }
    }

    const updated = await db
      .collection(Collections.ASSETS)
      .findOneAndUpdate(
        { _id: new ObjectId(id), userId: filterUserId },
        updateQuery,
        { returnDocument: "after" }
      )

    if (!updated) {
      return NextResponse.json(
        { error: "Asset not found or unauthorized" },
        { status: 404 }
      )
    }

    return NextResponse.json({ asset: updated }, { status: 200 })

  } catch (error: any) {
    console.error("PUT /api/assets/:id error", error)
    return NextResponse.json(
      { error: "Failed to update asset", message: error.message },
      { status: 500 }
    )
  }
})
