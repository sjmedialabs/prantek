import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    const campaigns = await db.collection(Collections.CAMPAIGNS)
      .find({ userId: String(userId) }).toArray()

    const totalCampaigns = campaigns.length
    const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)
    const totalFailed = campaigns.reduce((sum, c) => sum + (c.failedCount || 0), 0)
    const totalRecipients = campaigns.reduce((sum, c) => sum + (c.totalRecipients || 0), 0)
    const deliveryRate = totalSent > 0 ? Math.round(((totalSent - totalFailed) / totalSent) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        totalCampaigns,
        totalEmailsSent: totalSent,
        totalFailed,
        totalRecipients,
        deliveryRate,
        // Open rate requires tracking pixel - placeholder
        openRate: 0,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch metrics" }, { status: 500 })
  }
})
