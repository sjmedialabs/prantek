import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

export async function GET() {
  const basePath = path.join(process.cwd(), "public/uploads/items")
  await fs.mkdir(basePath, { recursive: true })

  const items = await fs.readdir(basePath, { withFileTypes: true })
  const folders = items.filter(i => i.isDirectory()).map(i => i.name)

  return NextResponse.json({ folders })
}
