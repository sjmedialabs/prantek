import { NextResponse, type NextRequest } from "next/server"
import path from "path"
import fs from "fs/promises"
import { randomUUID } from "crypto"
import { withAuth } from "@/lib/api-auth"
import { mongoStore } from "@/lib/mongodb-store"

export const runtime = "nodejs"

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const form = await req.formData()

    // --------------------------
    // INPUT FIELDS
    // --------------------------
    const name = String(form.get("name") || "").trim()
    const description = String(form.get("description") || "").trim()
    const type= String(form.get("type") || "product").trim() 
    const unitType = String(form.get("unitType") || "").trim()
    const price = Number(form.get("price") || 0)
    const hsnCode = String(form.get("hsnCode") || "").trim()

    const applyTax = form.get("applyTax") === "true"
    const cgst = Number(form.get("cgst") || 0)
    const sgst = Number(form.get("sgst") || 0)
    const igst = Number(form.get("igst") || 0)
    const isActive = form.get("isActive") === "true"

    const folder = String(form.get("folder") || "")
    const newFolder = String(form.get("newFolder") || "")
    const file = form.get("image") as File | null

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    // --------------------------
    // DUPLICATE CHECK
    // --------------------------
    const existing = await mongoStore.findOne("items", { name, userId })
    if (existing) {
      return NextResponse.json({ error: "Item already exists" }, { status: 400 })
    }

    // --------------------------
    // IMAGE UPLOAD LOGIC
    // --------------------------
    let imageUrl = null

    if (file) {
      const uploadRoot = path.join(process.cwd(), "public/uploads/items")
      await ensureDir(uploadRoot)

      let finalFolder = ""

      if (newFolder.trim().length > 0) {
        finalFolder = newFolder.trim()
        await ensureDir(path.join(uploadRoot, finalFolder))
      } else if (folder.trim().length > 0) {
        finalFolder = folder.trim()
      }

      const uploadPath = finalFolder
        ? path.join(uploadRoot, finalFolder)
        : uploadRoot

      await ensureDir(uploadPath)

      const ext = path.extname(file.name) || ".jpg"
      const filename = `${Date.now()}-${randomUUID()}${ext}`
      const fileBuffer = Buffer.from(await file.arrayBuffer())

      await fs.writeFile(path.join(uploadPath, filename), fileBuffer)

      imageUrl = finalFolder
        ? `/uploads/items/${finalFolder}/${filename}`
        : `/uploads/items/${filename}`
    }

    // --------------------------
    // SAVE PRODUCT IN DB
    // --------------------------
    const item = {
      userId,
      name,
      description,
      type,
      unitType,
      price,
      hsnCode,
      applyTax,
      cgst,
      sgst,
      igst,
      isActive,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const inserted = await mongoStore.create("items", item)

    return NextResponse.json({ success: true, item: inserted })

  } catch (err: any) {
    console.error("Item create error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
})
