import { type NextRequest, NextResponse } from "next/server"
import { mongoStore, logActivity } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withAuth(async (request: NextRequest, user: any) => {
    try {
      const { params } = context

      const client = await mongoStore.getById("clients", params.id)
      console.log(client)

      if (!client) {
        return NextResponse.json(
          { success: false, error: "Client not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: client })
    } catch (error) {
      console.error("GET error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch client" },
        { status: 500 }
      )
    }
  })(request) // ✅ same pattern as your PUT
}



export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  return withAuth(async (request: NextRequest, user: any) => {
    try {
      const { params } = context
      const body = await request.json()

      console.log("params id is::", params.id)

      const client = await mongoStore.update("clients", params.id, body)

      if (!client) {
        return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
      }


      return NextResponse.json({ success: true, data: client })
    } catch (error) {
      console.error("PUT error:", error)
      return NextResponse.json({ success: false, error: "Failed to update client" }, { status: 500 })
    }
  })(request) // ✅ Notice this
}



export const DELETE = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const success = await mongoStore.delete("clients", params.id)

    if (!success) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }


    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete client" }, { status: 500 })
  }
})
