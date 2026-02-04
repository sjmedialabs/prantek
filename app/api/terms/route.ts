import { NextResponse } from "next/server"
import { TermsModel } from "@/lib/models/terms.model"
import type { TermType } from "@/lib/models/types"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") as TermType | null

  if (!type) {
    return NextResponse.json(
      { error: "Missing type parameter" },
      { status: 400 }
    )
  }

  const terms = await TermsModel.findAll(
    { type },
    { sort: { order: 1 } }
  )

  return NextResponse.json(terms)
}

export async function POST(req: Request) {
  const body = await req.json()

  if (!body.type || !body.content) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    )
  }

  const count = await TermsModel.count({ type: body.type })

  const term = await TermsModel.create({
    title: body.title,
    content: body.content,
    type: body.type,
    isActive: body.isActive ?? true,
    order: count + 1,
  })

  return NextResponse.json(term)
}

export async function PUT(req: Request) {
  const body = await req.json()

  if (!body.id) {
    return NextResponse.json(
      { error: "Missing term id" },
      { status: 400 }
    )
  }

  const success = await TermsModel.update(body.id, body)

  return NextResponse.json({ success })
}

export async function DELETE(req: Request) {
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
}
