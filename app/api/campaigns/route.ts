import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { hasReachProAccess } from "@/lib/reachpro-wallet"
import { processCampaignSend } from "@/lib/campaigns/processCampaignSend"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const reachProAllowed = await hasReachProAccess(String(userId))
    if (!reachProAllowed) {
      return NextResponse.json(
        { success: false, error: "ReachPro top-up required to use communication features." },
        { status: 403 },
      )
    }
    const campaigns = await db.collection(Collections.CAMPAIGNS)
      .find({ userId: String(userId) }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ success: true, data: campaigns })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch campaigns" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const reachProAllowed = await hasReachProAccess(String(userId))
    if (!reachProAllowed) {
      return NextResponse.json(
        { success: false, error: "ReachPro top-up required to use communication features." },
        { status: 403 },
      )
    }
    const body = await request.json()
    const { name, type, templateId, subject, content, audience, groupId, scheduledAt, action } = body

    if (!name) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 })
    if (action === "schedule") {
      if (!scheduledAt) {
        return NextResponse.json({ success: false, error: "Scheduled time is required.", message: "Scheduled time is required." }, { status: 400 })
      }
      const scheduledDate = new Date(scheduledAt)
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        return NextResponse.json(
          { success: false, error: "Cannot schedule campaign in the past.", message: "Cannot schedule campaign in the past." },
          { status: 400 },
        )
      }
    }

    // If action === "send", execute immediately
    if (action === "send") {
      const campaign = {
        name, type: type || "email", templateId, subject, content, audience: audience || "all",
        groupId, status: "processing", userId: String(userId),
        totalRecipients: 0, sentCount: 0, failedCount: 0, failureReason: null,
        createdAt: new Date(), updatedAt: new Date(),
      }
      const result = await db.collection(Collections.CAMPAIGNS).insertOne(campaign)
      const campaignId = result.insertedId
      const { sentCount, failedCount } = await processCampaignSend(db, {
        _id: campaignId,
        userId: String(userId),
        name,
        subject,
        content,
        audience: audience || "all",
        groupId,
        type: type || "email",
      })
      return NextResponse.json({ success: true, data: { _id: campaignId, sentCount, failedCount } })
    }

    // Otherwise create as draft/scheduled
    const campaign = {
      name, type: type || "email", templateId, subject, content,
      audience: audience || "all", groupId,
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      userId: String(userId), totalRecipients: 0, sentCount: 0, failedCount: 0, failureReason: null,
      createdAt: new Date(), updatedAt: new Date(),
    }
    const result = await db.collection(Collections.CAMPAIGNS).insertOne(campaign)
    return NextResponse.json({ success: true, data: { ...campaign, _id: result.insertedId } })
  } catch (error) {
    console.error("[CAMPAIGNS] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to process campaign" }, { status: 500 })
  }
})
