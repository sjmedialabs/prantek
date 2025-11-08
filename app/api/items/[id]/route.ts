import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

function getId(req: NextRequest) {
    const segments = req.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

//
// ✅ PUT — Update by ID
//
export const PUT = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = await connectDB()
    const data = await req.json()
    const id = getId(req)

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    const result = await db
      .collection(Collections.ITEMS)
      .findOneAndUpdate(
        { _id: new ObjectId(id), userId: String(user.userId) },
        { $set: { 
            ...data, 
            userId: String(user.userId), 
            updatedAt: new Date() 
          } 
        },
        { returnDocument: "after" }
      )

    const updated = result?.value
    // if (!updated) {
    //   return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 })
    // }

    return NextResponse.json({ success: true, data: updated }, { status: 200 })
  } catch (error) {
    console.error("PUT /items/[id] error:", error)
    return NextResponse.json({ success: false, error: "Failed to update item" }, { status: 500 })
  }
})

