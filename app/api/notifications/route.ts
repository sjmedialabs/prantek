import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Notification } from "@/lib/models/types"
import { verifyToken } from "@/lib/jwt"

// Helper to extract and verify token
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    if (payload?.userId) return payload.userId
  }

  // Try cookies
  const cookieToken = request.cookies.get("accessToken")?.value || 
                     request.cookies.get("auth_token")?.value
  
  if (cookieToken) {
    const payload = await verifyToken(cookieToken)
    if (payload?.userId) return payload.userId
  }

  return null
}

// GET - Fetch notifications for current user
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      console.log("[NOTIFICATIONS] No valid token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[NOTIFICATIONS] Fetching for user:", userId)

    const db = await getDb()
    const notifications = await db
      .collection<Notification>("notifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    console.log("[NOTIFICATIONS] Found", notifications.length, "notifications")
    return NextResponse.json(notifications)
  } catch (error) {
    console.error("[NOTIFICATIONS] Error fetching:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId, type, title, message, entityId, entityType, link } = body

    if (!targetUserId || !type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDb()
    const notification: Partial<Notification> = {
      userId: targetUserId,
      type,
      title,
      message,
      entityId,
      entityType,
      link,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<Notification>("notifications").insertOne(notification as Notification)

    return NextResponse.json({ _id: result.insertedId, ...notification })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

// PATCH - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, isRead } = body

    if (!notificationId) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.collection<Notification>("notifications").updateOne(
      { _id: new ObjectId(notificationId), userId },
      { $set: { isRead, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
