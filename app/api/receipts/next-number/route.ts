import { type NextRequest, NextResponse } from "next/server"
import { peekNextNumber } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"
import { mongoStore } from "@/lib/mongodb-store"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")
    
    let clientName = "Unknown"
    if (clientId) {
      try {
        const client = await mongoStore.getById("clients", clientId)
        clientName = client?.name || "Unknown"
      } catch (err) {
        console.error("Error fetching client for preview:", err)
      }
    }
    
    const nextNumber = await peekNextNumber("receipts", "RC", clientName)
    
    return NextResponse.json({
      success: true,
      data: { nextNumber }
    })
  } catch (error) {
    console.error("Error fetching next receipt number:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch next receipt number" },
      { status: 500 }
    )
  }
})
