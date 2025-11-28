import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractTokenFromHeader } from "./jwt"
import type { JWTPayload } from "./jwt"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"

// Backward-compatibility: map legacy permissions to the new granular ones
const LEGACY_TO_NEW: Record<string, string[]> = {
  // Vendors
  manage_vendors: ["add_vendors", "edit_vendors"],
  create_vendors: ["add_vendors"],
  // Clients
  manage_clients: ["add_clients", "edit_clients"],
  create_clients: ["add_clients"],
  // Viewing used to be combined under clients; allow during migration
  view_clients: ["view_clients", "view_vendors"],
}

function expandWithLegacy(perms: string[] | undefined | null): string[] {
  const out = new Set<string>()
  for (const p of perms || []) {
    out.add(p)
    const mapped = LEGACY_TO_NEW[p]
    if (mapped) mapped.forEach(m => out.add(m))
  }
  return Array.from(out)
}

/**
 * Verify JWT token from API request and refresh permissions from DB
 */
export async function verifyApiRequest(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get("authorization")
  let token = extractTokenFromHeader(authHeader)

  if (!token) {
    token =
      request.cookies.get("super_admin_auth_token")?.value ||
      request.cookies.get("super_admin_accessToken")?.value ||
      request.cookies.get("auth_token")?.value ||
      request.cookies.get("accessToken")?.value ||
      null
  }
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  try {
    const db = await connectDB()
    let user: any = null

    // Admin users first
    try {
      user = await db.collection(Collections.ADMIN_USERS).findOne({ _id: new ObjectId(payload.userId) })
    } catch {
      user = await db.collection(Collections.ADMIN_USERS).findOne({ _id: payload.userId as any })
    }

    if (user) {
      payload.isAdminUser = true
      payload.companyId = user.companyId || payload.companyId
      payload.permissions = expandWithLegacy(user.permissions || [])
      return payload
    }

    // Regular account owners
    try {
      user = await db.collection(Collections.USERS).findOne({ _id: new ObjectId(payload.userId) })
    } catch {
      user = await db.collection(Collections.USERS).findOne({ _id: payload.userId as any })
    }
    if (user) {
      payload.isAdminUser = false
      payload.permissions = expandWithLegacy(user.permissions || [])
    }
  } catch (e) {
    console.error("[API-AUTH] Failed to resolve user from DB:", e)
  }

  return payload
}

export function withAuth(handler: (request: NextRequest, user: JWTPayload, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const user = await verifyApiRequest(request)
    if (!user) return NextResponse.json({ error: "Unauthorized - Invalid or missing token" }, { status: 401 })
    return handler(request, user, context)
  }
}

export function withSuperAdmin(handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await verifyApiRequest(request)
    if (!user) return NextResponse.json({ error: "Unauthorized - Invalid or missing token" }, { status: 401 })
    if (user.role !== "super-admin") return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    return handler(request, user)
  }
}

export function hasRole(user: JWTPayload, role: "user" | "super-admin" | "admin"): boolean {
  return user.role === role
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 })
}

// Derive feature key from permission id (used for plan gating if added later)
function moduleFromPermission(permission: string): string | null {
  if (permission.includes("clients")) return "clients"
  if (permission.includes("vendors")) return "vendors"
  if (permission.includes("quotations")) return "quotations"
  if (permission.includes("receipts")) return "receipts"
  if (permission.includes("payments")) return "payments"
  if (permission.includes("reconciliation")) return "reconciliation"
  if (permission.includes("assets")) return "assets"
  if (permission.includes("reports")) return "reports"
  return null
}

/**
 * Check if user has a specific permission
 * Hierarchy: Super-admin > Account Owner > Admin User with permissions
 * Note: Plan-based gating can be inserted here if planFeatures are available on the payload
 */
export function hasPermission(user: JWTPayload, permission: string): boolean {
  if (user.role === "super-admin" || user.isSuperAdmin) return true
  if (!user.isAdminUser) return true // Account owners

  const perms = expandWithLegacy(user.permissions || [])
  return perms.includes(permission)
}

export function withPermission(permission: string, handler: (request: NextRequest, user: JWTPayload, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const user = await verifyApiRequest(request)
    if (!user) return NextResponse.json({ error: "Unauthorized - Invalid or missing token" }, { status: 401 })

    // Optional place to add plan-based gating in future
    if (!hasPermission(user, permission)) {
      return NextResponse.json({ error: `Forbidden - ${permission} permission required` }, { status: 403 })
    }
    return handler(request, user, context)
  }
}
