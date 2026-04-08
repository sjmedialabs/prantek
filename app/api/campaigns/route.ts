import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import { sendEmailBatch } from "@/lib/email/sendEmail"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId
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
    const body = await request.json()
    const { name, type, templateId, subject, content, audience, groupId, scheduledAt, action } = body

    if (!name) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 })

    // If action === "send", execute immediately
    if (action === "send") {
      // Resolve recipients
      let recipients: any[] = []
      if (audience === "group" && groupId) {
        const group = await db.collection(Collections.CLIENT_GROUPS).findOne({ _id: new ObjectId(groupId) })
        if (group?.filters) {
          const filter: any = { userId: String(userId) }
          if (group.filters.location) filter.address = { $regex: group.filters.location, $options: "i" }
          recipients = await db.collection("clients").find(filter).project({ email: 1, name: 1 }).toArray()
        }
      } else {
        recipients = await db.collection("clients").find({ userId: String(userId) })
          .project({ email: 1, name: 1 }).toArray()
      }

      const campaign = {
        name, type: type || "email", templateId, subject, content, audience: audience || "all",
        groupId, status: "sending", sentAt: new Date(), userId: String(userId),
        totalRecipients: recipients.length, sentCount: 0, failedCount: 0,
        createdAt: new Date(), updatedAt: new Date(),
      }
      const result = await db.collection(Collections.CAMPAIGNS).insertOne(campaign)
      const campaignId = result.insertedId

      const withEmail = recipients.filter((r) => r.email)
      let sentCount = 0
      let failedCount = recipients.length - withEmail.length

      const items = withEmail.map((r) => {
        const personalizedContent = (content || "").replace(/\{\{name\}\}/g, r.name || "Customer")
        return {
          to: r.email,
          subject: subject || name,
          html: personalizedContent,
          text: personalizedContent.replace(/<[^>]*>/g, ""),
        }
      })

      const batchResults = await sendEmailBatch(items)

      for (let idx = 0; idx < withEmail.length; idx++) {
        const r = withEmail[idx]
        const emailResult = batchResults[idx]
        const recipientDoc = {
          campaignId,
          recipientEmail: r.email,
          recipientName: r.name || "",
          status: emailResult.success ? "sent" : "failed",
          sentAt: new Date(),
          failedReason: emailResult.success ? null : (emailResult as { error?: string }).error ?? null,
        }
        await db.collection(Collections.CAMPAIGN_RECIPIENTS).insertOne(recipientDoc)
        if (emailResult.success) sentCount++
        else failedCount++
      }

      await db.collection(Collections.CAMPAIGNS).updateOne(
        { _id: campaignId },
        { $set: { status: "sent", sentCount, failedCount, updatedAt: new Date() } }
      )
      return NextResponse.json({ success: true, data: { _id: campaignId, sentCount, failedCount } })
    }

    // Otherwise create as draft/scheduled
    const campaign = {
      name, type: type || "email", templateId, subject, content,
      audience: audience || "all", groupId,
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      userId: String(userId), totalRecipients: 0, sentCount: 0, failedCount: 0,
      createdAt: new Date(), updatedAt: new Date(),
    }
    const result = await db.collection(Collections.CAMPAIGNS).insertOne(campaign)
    return NextResponse.json({ success: true, data: { ...campaign, _id: result.insertedId } })
  } catch (error) {
    console.error("[CAMPAIGNS] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to process campaign" }, { status: 500 })
  }
})
