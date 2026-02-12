import { NextRequest, NextResponse } from "next/server"
import { TermsModel } from "@/lib/models/terms.model"
import { withAuth } from "@/lib/api-auth"
import type { TermType } from "@/lib/models/types"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") as TermType | null
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  if (!type) {
    return NextResponse.json(
      { error: "Missing type parameter" },
      { status: 400 }
    )
  }

  const terms = await TermsModel.findAll(
    { type, userId: filterUserId },
    { sort: { order: 1 } }
  )

  return NextResponse.json(terms)
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  const body = await req.json()
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId

  if (!body.type || !body.content) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    )
  }

  const count = await TermsModel.count({ type: body.type, userId: filterUserId })

  const term = await TermsModel.create({
    title: body.title,
    content: body.content,
    type: body.type,
    isActive: body.isActive ?? true,
    order: count + 1,
    userId: filterUserId,
  })

  return NextResponse.json(term)
})

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  const body = await req.json()

  if (!body.id) {
    return NextResponse.json(
      { error: "Missing term id" },
      { status: 400 }
    )
  }

  const success = await TermsModel.update(body.id, body)

  return NextResponse.json({ success })
})

export const DELETE = withAuth(async (req: NextRequest, user: any) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      { error: "Missing id" },
      { status: 400 }
    )
  }

  const success = await TermsModel.delete(id)
  return NextResponse.json({ success })
})
