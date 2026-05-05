import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"

type GroupEmail = { email: string; name?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Normalize and dedupe an array of group-email entries. Accepts:
 *   - strings: "foo@bar.com"
 *   - objects: { email, name? }
 * Invalid entries are silently dropped. Emails are lowercased and trimmed.
 */
function normalizeEmails(input: unknown): GroupEmail[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const out: GroupEmail[] = []
  for (const raw of input) {
    let email = ""
    let name: string | undefined
    if (typeof raw === "string") {
      email = raw
    } else if (raw && typeof raw === "object") {
      const o = raw as { email?: unknown; name?: unknown }
      if (typeof o.email === "string") email = o.email
      if (typeof o.name === "string" && o.name.trim()) name = o.name.trim()
    }
    email = String(email || "").trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) continue
    seen.add(email)
    out.push(name ? { email, name } : { email })
  }
  return out
}

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const groups = await db.collection(Collections.CLIENT_GROUPS)
      .find({ userId: String(userId) }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ success: true, data: groups })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch groups" }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId
    const body = await request.json()
    const { name, description, filters, emails } = body
    if (!name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    const doc = {
      name,
      description: description || "",
      filters: filters || {},
      emails: normalizeEmails(emails),
      userId: String(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await db.collection(Collections.CLIENT_GROUPS).insertOne(doc)
    return NextResponse.json({ success: true, data: { ...doc, _id: result.insertedId } })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create group" }, { status: 500 })
  }
})

export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const body = await request.json()
    const { id, ...update } = body
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
    // Only normalize `emails` if the caller sent it; otherwise leave untouched.
    if (Object.prototype.hasOwnProperty.call(update, "emails")) {
      update.emails = normalizeEmails(update.emails)
    }
    await db.collection(Collections.CLIENT_GROUPS).updateOne(
      { _id: new ObjectId(id) }, { $set: { ...update, updatedAt: new Date() } }
    )
    const updated = await db.collection(Collections.CLIENT_GROUPS).findOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update group" }, { status: 500 })
  }
})

export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {
    const db = await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
    await db.collection(Collections.CLIENT_GROUPS).deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete group" }, { status: 500 })
  }
})
