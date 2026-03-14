import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as XLSX from "xlsx"
import Papa from "papaparse"

import { mongoStore } from "@/lib/mongodb-store"
import { withAuth } from "@/lib/api-auth"

export const runtime = "nodejs"

// Convert text → boolean
const toBool = (v: any) => {
  if (v === undefined || v === null) return false
  if (typeof v === "boolean") return v
  return ["true", "1", "yes"].includes(String(v).trim().toLowerCase())
}

// Convert price/tax → number
const parseNumber = (v: any) => {
  if (!v) return 0
  const n = Number(String(v).replace(/[^0-9.-]+/g, ""))
  return isNaN(n) ? 0 : n
}

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const formData = await req.formData()
    const excelFile = formData.get("excel") as File

    if (!excelFile) {
      return NextResponse.json({ error: "Excel file missing" }, { status: 400 })
    }

    const userId = user.isAdminUser && user.companyId ? user.companyId : user.userId

    // ----------------------------
    // LOAD TAX RATES
    // ----------------------------
    const dbTaxRates = await mongoStore.getAll("tax-rates", { userId })

    const allowedCgst = dbTaxRates
      .filter(r => r.type === "CGST" && r.isActive)
      .map(r => r.rate)

    const allowedSgst = dbTaxRates
      .filter(r => r.type === "SGST" && r.isActive)
      .map(r => r.rate)

    const allowedIgst = dbTaxRates
      .filter(r => r.type === "IGST" && r.isActive)
      .map(r => r.rate)

    // ----------------------------
    // PARSE EXCEL OR CSV
    // ----------------------------
    const excelBuffer = Buffer.from(await excelFile.arrayBuffer())
    let rows: any[] = []

    if (excelFile.name.endsWith(".csv")) {
      const csv = excelBuffer.toString("utf8")

      const parsed = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true
      })

      if (parsed.errors.length) {
        return NextResponse.json(
          { error: "CSV parse error", details: parsed.errors },
          { status: 400 }
        )
      }

      rows = parsed.data

    } else {
      const workbook = XLSX.read(excelBuffer, { type: "buffer" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]

      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" })
    }

    // Normalize keys
    const normalized = rows.map(r => {
      const out: any = {}
      for (const key of Object.keys(r)) {
        out[key.trim()] = r[key]
      }
      return out
    })

    let success = 0
    let failed = 0
    const errors: any[] = []

    // ----------------------------
    // PROCESS ROWS
    // ----------------------------
    for (let i = 0; i < normalized.length; i++) {
      const row = normalized[i]

      try {

        const get = (names: string[]) => {
          for (const n of names) {

            if (row[n] !== undefined) return row[n]

            const ci = Object.keys(row).find(
              k => k.toLowerCase() === n.toLowerCase()
            )

            if (ci) return row[ci]

            const fuzzy = Object.keys(row).find(
              k => k.toLowerCase().includes(n.toLowerCase())
            )

            if (fuzzy) return row[fuzzy]
          }

          return undefined
        }

        // REQUIRED
        const name = String(get(["name"]) || "").trim()
        if (!name) throw new Error("Missing product name")

        const description = String(get(["description"]) || "").trim()
        const unitType = String(get(["unitType", "unit_type"]) || "").trim()

        const price = parseNumber(get(["price"]))
        const hsnCode = String(get(["hsnCode", "hsn", "hsn_code"]) || "").trim()

        const applyTax = toBool(get(["applyTax", "apply_tax"]))

        const cgst = parseNumber(get(["cgst"]))
        const sgst = parseNumber(get(["sgst"]))
        const igst = parseNumber(get(["igst"]))

        const isActive = toBool(get(["isActive", "active"]))

        // DUPLICATE CHECK
        const existing = await mongoStore.findOne("items", { name, userId })

        if (existing) {
          failed++
          errors.push({ row: i + 1, error: "Duplicate item (skipped)" })
          continue
        }

        // TAX VALIDATION
        if (applyTax) {

          if (cgst > 0 && !allowedCgst.includes(cgst))
            throw new Error(`Invalid CGST: ${cgst}`)

          if (sgst > 0 && !allowedSgst.includes(sgst))
            throw new Error(`Invalid SGST: ${sgst}`)

          if (igst > 0 && !allowedIgst.includes(igst))
            throw new Error(`Invalid IGST: ${igst}`)
        }

        const item = {
          userId,
          name,
          description,
          type: "product",
          unitType,
          price,
          hsnCode,
          applyTax,
          cgst,
          sgst,
          igst,
          isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await mongoStore.create("items", item)

        success++

      } catch (err: any) {

        failed++
        errors.push({
          row: i + 1,
          error: err.message
        })

      }
    }

    return NextResponse.json({
      success,
      failed,
      errors
    })

  } catch (err: any) {

    console.error("Bulk upload error:", err)

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
})