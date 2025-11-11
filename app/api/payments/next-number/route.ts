import { type NextRequest, NextResponse } from "next/server"
import { peekNextNumber } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const recipientName = searchParams.get("recipientName") || "Unknown"
    
    const nextNumber = await peekNextNumber("payments", "PAY", recipientName)
    
    return NextResponse.json({
      success: true,
      data: { nextNumber }
    })
  } catch (error) {
    console.error("Error fetching next payment number:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch next payment number" },
      { status: 500 }
    )
  }
})
