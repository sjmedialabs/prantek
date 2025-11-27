import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as XLSX from "xlsx"
import Papa from "papaparse"
import { withAuth } from "@/lib/api-auth"
import { mongoStore } from "@/lib/mongodb-store"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[6-9]\d{9}$/
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

export const POST = withAuth(async (req: NextRequest, user: any) => {
    try {
        const form = await req.formData()
        const file = form.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filterUserId =
            user.isAdminUser && user.companyId ? user.companyId : user.userId

        let rows: any[] = []

        // Parse CSV or XLSX
        if (file.name.endsWith(".csv")) {
            const csvStr = buffer.toString("utf8")
            const parsed = Papa.parse(csvStr, { header: true, skipEmptyLines: true })
            rows = parsed.data
        } else {
            const wb = XLSX.read(buffer, { type: "buffer" })
            const sheet = wb.Sheets[wb.SheetNames[0]]
            rows = XLSX.utils.sheet_to_json(sheet, { defval: "" })
        }

        let success = 0
        let failed = 0
        const errors: any[] = []

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]

            try {
                const toStr = (v: any) => (v === undefined || v === null ? "" : String(v).trim())

                const type = toStr(row.type).toLowerCase()
                const name = toStr(row.name)
                const companyName = toStr(row.companyName)
                const contactName = toStr(row.contactName)

                const email = toStr(row.email)
                const phone = toStr(row.phone)
                const address = toStr(row.address)
                const state = toStr(row.state)
                const city = toStr(row.city)
                const pincode = toStr(row.pincode)

                const gst = toStr(row.gst)
                const pan = toStr(row.pan)


                // Validate
                if (!emailRegex.test(email)) throw new Error("Invalid email")
                if (!phoneRegex.test(phone)) throw new Error("Invalid phone")
                if (!state || !city || !pincode) throw new Error("State/City/Pincode required")

                if (type === "individual") {
                    if (!name) throw new Error("Name required for individual")
                }

                if (type === "company") {
                    if (!companyName) throw new Error("Company name required")
                    if (!contactName) throw new Error("Contact name required")
                    if (gst && !gstRegex.test(gst)) throw new Error("Invalid GST")
                    if (pan && !panRegex.test(pan)) throw new Error("Invalid PAN")
                }

                // Unique under user
                const exists = await mongoStore.findOne("clients", {
                    userId: String(filterUserId),
                    $or: [{ email }, { phone }],
                })

                if (exists) {
                    throw new Error("Duplicate email or phone")
                }

                // Build client
                const client: any = {
                    userId: String(filterUserId),
                    type,
                    email,
                    phone,
                    address,
                    state,
                    city,
                    pincode,
                    status: "active",
                }

                if (type === "individual") client.name = name
                if (type === "company") {
                    client.companyName = companyName
                    client.name = contactName
                    if (gst) client.gst = gst
                    if (pan) client.pan = pan
                }

                await mongoStore.create("clients", client)
                success++
            } catch (err: any) {
                failed++
                errors.push({ row: i + 1, error: err.message })
            }
        }

        return NextResponse.json({ success, failed, errors })
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Bulk upload failed" },
            { status: 500 }
        )
    }
})
