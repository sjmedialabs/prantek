import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"

// ------------------- GET (NO AUTH, BUT NEEDS USER ID) -------------------
export const GET = async (req: NextRequest) => {
  const db = await connectDB()

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const assets = await db
    .collection(Collections.ASSETS)
    .find({ userId })
    .toArray()

  return NextResponse.json({ assets })
}


// ------------------- POST (NO AUTH, BUT REQUIRES userId) -------------------
export const POST = async (req: NextRequest) => {
  try {
    const db = await connectDB()
    const data = await req.json()

    // userId must be sent by frontend
    if (!data.userId) {
      return NextResponse.json(
        { error: "userId is required in POST data" },
        { status: 400 }
      )
    }

    const { id, _id, ...cleanData } = data

    const asset = {
      ...cleanData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection(Collections.ASSETS).insertOne(asset)

    return NextResponse.json({ ...asset, _id: result.insertedId, success: true })
  } catch (err: any) {
    console.error("Error creating asset", err)
    return NextResponse.json(
      { error: "Failed to create asset", message: err.message },
      { status: 500 }
    )
  }
}
