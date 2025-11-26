import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as XLSX from "xlsx"
import Papa from "papaparse"

import { mongoStore } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export const runtime = "nodejs"

const toBool = (v: any) => {
  if (v === undefined || v === null) return false
  if (typeof v === "boolean") return v
  return ["true", "1", "yes"].includes(String(v).trim().toLowerCase())
}

const parseNumber = (v: any) => {
  if (!v) return 0
  const n = Number(String(v).replace(/[^0-9.-]+/g, ""))
  return isNaN(n) ? 0 : n
}

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const filename = file.name || ""
    const buffer = Buffer.from(await file.arrayBuffer())
    const filterUserId =
      user.isAdminUser && user.companyId ? user.companyId : user.userId

    // 🔥 Load tax rates from DB before parsing rows
    const dbTaxRates = await mongoStore.getAll("tax-rates", { userId: String(filterUserId) })
    console.log("Loaded tax rates:", dbTaxRates.length)
    const allowedCgst = dbTaxRates
      .filter((r: any) => r.type === "CGST" && r.isActive)
      .map((r: any) => r.rate)
    console.log("Allowed CGST rates:", allowedCgst)
    const allowedSgst = dbTaxRates
      .filter((r: any) => r.type === "SGST" && r.isActive)
      .map((r: any) => r.rate)
    console.log("Allowed SGST rates:", allowedSgst)
    const allowedIgst = dbTaxRates
      .filter((r: any) => r.type === "IGST" && r.isActive)
      .map((r: any) => r.rate)
    console.log("Allowed IGST rates:", allowedIgst)
    // ---- Parse CSV / Excel ----
    let rows: any[] = []

    if (filename.endsWith(".csv") || filename.endsWith(".CSV")) {
      const csvString = buffer.toString("utf8")
      const parsed = Papa.parse(csvString, { header: true, skipEmptyLines: true })
      if (parsed.errors.length > 0) {
        return NextResponse.json({ error: "CSV parse error", details: parsed.errors }, { status: 400 })
      }
      rows = parsed.data
    } else {
      const workbook = XLSX.read(buffer, { type: "buffer" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" })
    }

    // ---- Normalize Keys ----
    const normalizedRows = rows.map((r) => {
      const out: any = {}
      for (const k of Object.keys(r)) out[k.trim()] = r[k]
      return out
    })

    let success = 0
    let failed = 0
    const errors: any[] = []

    // ---- Process Each Row ----
    for (let i = 0; i < normalizedRows.length; i++) {
      try {
        const row = normalizedRows[i]

        const get = (names: string[]) => {
        for (const n of names) {
            // 1. Exact match
            if (row[n] !== undefined) return row[n]

            // 2. Case-insensitive match
            const match = Object.keys(row).find(
            (k) => k.toLowerCase().trim() === n.toLowerCase().trim()
            )
            if (match) return row[match]

            // 3. Fuzzy match: header contains "cgst"
            const fuzzy = Object.keys(row).find(
            (k) => k.toLowerCase().includes(n.toLowerCase())
            )
            if (fuzzy) return row[fuzzy]
        }
        return undefined
        }


        // ---- Extract Fields ----
        const name = String(get(["name"]) || "").trim()
        if (!name) throw new Error("Missing required field: name")

        const description = String(get(["description"]) || "").trim()
        const type = "product"
        const unitType = String(get(["unitType", "unit_type"]) || "").trim()

        const price = parseNumber(get(["price"]))
        const hsnCode = String(get(["hsnCode", "hsn_code", "hsn"]) || "").trim()

        const applyTax = toBool(get(["applyTax", "apply_tax", "applytax"]))
        const cgst = parseNumber(get(["cgst"]))
        const sgst = parseNumber(get(["sgst"]))
        const igst = parseNumber(get(["igst"]))
        console.log("ROW DEBUG:", {
  rawCgst: get(["cgst"]),
  parsedCgst: parseNumber(get(["cgst"])),
  allowedCgst
})

        const isActive = toBool(get(["isActive", "active", "is_active"]))

        // ---- Duplicate Check (name + userId) ----
        const existing = await mongoStore.findOne("items", {
          name,
          userId: String(filterUserId),
        })

        if (existing) {
          failed++
          errors.push({ row: i + 1, name, error: "Duplicate item (skipped)" })
          continue
        }

        // ---- TAX VALIDATION ----
        if (applyTax) {
          if (cgst>0 && !allowedCgst.includes(cgst))
            throw new Error(`Invalid CGST value: ${cgst}`)

          if (sgst>0 && !allowedSgst.includes(sgst))
            throw new Error(`Invalid SGST value: ${sgst}`)

          if (igst>0 && !allowedIgst.includes(igst))
            throw new Error(`Invalid IGST value: ${igst}`)
        }

        // ---- Build Item ----
        const item = {
          userId: String(filterUserId),
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
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // ---- Insert ----
        await mongoStore.create("items", item)
        success++
      } catch (err: any) {
        failed++
        errors.push({ row: i + 1, error: err.message })
      }
    }

    return NextResponse.json({ success, failed, errors })
  } catch (err: any) {
    console.error("Bulk upload error:", err)
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
})
