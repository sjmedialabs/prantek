import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

// ✅ GET QUOTATION BY ID
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withAuth(async (request: NextRequest, user: any) => {
    try {
      const { params } = context

      const quotation = await mongoStore.getById("quotations", params.id)

      if (!quotation) {
        return NextResponse.json(
          { success: false, error: "Quotation not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: quotation })
    } catch (error) {
      console.error("GET error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch quotation" },
        { status: 500 }
      )
    }
  })(request) // ✅ Keep this exactly the same
}


// ✅ UPDATE QUOTATION
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  return withAuth(async (request: NextRequest, user: any) => {
    try {
      const { params } = context
      
      const body = await request.json()

      console.log("Updating quotation with ID:", params.id)

      const quotation = await mongoStore.update("quotations", params.id, body)

      if (!quotation) {
        return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 })
      }

      await logActivity(user.userId, "update", "quotation", params.id, { quotationNumber: body.quotationNumber })

      return NextResponse.json({ success: true, data: quotation })
    } catch (error) {
      console.error("PUT error:", error)
      return NextResponse.json({ success: false, error: "Failed to update quotation" }, { status: 500 })
    }
  })(request) // ✅ Keep this
}

// ✅ DELETE QUOTATION
export const DELETE = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const success = await mongoStore.delete("quotations", params.id)

    if (!success) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 })
    }

    await logActivity(user.userId, "delete", "quotation", params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: "Failed to delete quotation" }, { status: 500 })
  }
})
