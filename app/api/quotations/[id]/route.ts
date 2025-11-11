import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

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


export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  return withAuth(async (request: NextRequest, user: any) => {
    try {
      const { params } = context
      const body = await request.json()
      console.log("BODY RECEIVED:", body)

      // ✅ Only update isActive if that's the only field provided
      if (body && Object.keys(body).length === 1 && body.isActive !== undefined) {
        await mongoStore.update("quotations", params.id, { isActive: body.isActive })

        return NextResponse.json({ success: true })
      }

      // ✅ Otherwise → Perform normal update
      const quotation = await mongoStore.update("quotations", params.id, body)

      if (!quotation) {
        return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 })
      }


      return NextResponse.json({ success: true, data: quotation })
    } catch (error) {
      console.error("PUT error:", error)
      return NextResponse.json({ success: false, error: "Failed to update quotation" }, { status: 500 })
    }
  })(request)
}


// ✅ DELETE QUOTATION (same style as PUT)
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  return withAuth(async (request: NextRequest, user: any) => {
    try {
      const { params } = context

      console.log("Deleting quotation with ID:", params.id)

      const success = await mongoStore.delete("quotations", params.id)

      if (!success) {
        return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 })
      }


      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("DELETE error:", error)
      return NextResponse.json({ success: false, error: "Failed to delete quotation" }, { status: 500 })
    }
  })(request) // ✅ same pattern as PUT
}
