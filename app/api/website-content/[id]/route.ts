import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"

function getIdFromRequest(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/").filter(Boolean)
  return segments[segments.length - 1] || ""
}

/** Avoid Mongo error: cannot $set immutable _id */
function sanitizeWebsiteContentBody(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (k === "_id" || k === "id") continue
    if (k.startsWith("$")) continue
    out[k] = v
  }
  return out
}

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const id = getIdFromRequest(req)

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid content id" }, { status: 400 })
  }

  const db = await connectDB()
  const raw = (await req.json()) as Record<string, unknown>
  const data = sanitizeWebsiteContentBody(raw)

  const coll = db.collection(Collections.WEBSITE_CONTENT || "website_content")

  const filter: Record<string, unknown> = { _id: new ObjectId(id) }
  const isSuperAdmin = user.role === "super-admin" || user.isSuperAdmin === true
  if (!isSuperAdmin) {
    filter.userId = String(filterUserId)
  }

  try {
    const updated = await coll.findOneAndUpdate(
      filter,
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    )

    if (!updated) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updated,
      content: updated,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update content"
    console.error("[website-content PUT]", e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
})

export const DELETE = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  const db = await connectDB()
  const id = getIdFromRequest(req)

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid content id" }, { status: 400 })
  }

  const coll = db.collection(Collections.WEBSITE_CONTENT || "website_content")

  const filter: Record<string, unknown> = { _id: new ObjectId(id) }
  const isSuperAdmin = user.role === "super-admin" || user.isSuperAdmin === true
  if (!isSuperAdmin) {
    filter.userId = String(filterUserId)
  }

  const result = await coll.deleteOne(filter)

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
})
