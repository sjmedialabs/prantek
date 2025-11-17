import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"

// Helper: extract ID from URL
function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

export const PUT = async (req: NextRequest) => {
  try {
    const db = await connectDB()
    const data = await req.json()

    const id = getIdFromRequest(req)

    // REQUIRE userId
    if (!data.userId) {
      return NextResponse.json(
        { error: "userId is required to update asset" },
        { status: 400 }
      )
    }

    // Create push object safely
    const historyPush = data.assignmentHistoryItem || null

    const updateQuery: any = {
      $set: {
        assignedTo: data.assignedTo,
        assignedToName: data.assignedToName,
        assignedDate: data.assignedDate,
        submittedDate: data.submittedDate ?? null,
        status: data.status,
        updatedAt: new Date(),
      }
    }

    // Only include $push if needed
    if (historyPush) {
      updateQuery.$push = {
        assignmentHistory: historyPush
      }
    }

    const updated = await db
      .collection(Collections.ASSETS)
      .findOneAndUpdate(
        { _id: new ObjectId(id), userId: String(data.userId) },
        updateQuery,
        { returnDocument: "after" }
      )

    if (!updated) {
      return NextResponse.json(
        { error: "Asset not found or userId mismatch" },
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
}

