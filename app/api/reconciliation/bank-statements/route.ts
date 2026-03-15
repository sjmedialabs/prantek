import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { withAuth } from "@/lib/api-auth"
import { ObjectId } from "mongodb"
import {
  suggestSingleMatches,
  suggestMultiMatches,
  type BankRow,
  type SysTransaction,
} from "@/lib/bank-statement-matching"

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }
  const toCells = (line: string): string[] => {
    const out: string[] = []
    let cur = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        inQuotes = !inQuotes
      } else if ((c === "," && !inQuotes) || c === "\t") {
        out.push(cur.trim())
        cur = ""
      } else {
        cur += c
      }
    }
    out.push(cur.trim())
    return out
  }
  const headers = toCells(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = toCells(lines[i])
    const obj: Record<string, string> = {}
    headers.forEach((h, j) => {
      obj[h] = (cells[j] ?? "").replace(/^"|"$/g, "").trim()
    })
    rows.push(obj)
  }
  return { headers, rows }
}

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ")
}

function findKey(row: Record<string, string>, ...names: string[]): string {
  const keys = Object.keys(row)
  for (const n of names) {
    const normN = normHeader(n)
    const found = keys.find((k) => normHeader(k) === normN)
    if (found) return row[found] ?? ""
  }
  return ""
}

function toBankRow(row: Record<string, string>): BankRow {
  const date = findKey(row, "Date", "date")
  const description = findKey(row, "Description", "description")
  const reference = findKey(row, "Reference", "reference")
  const debit = parseFloat(String(findKey(row, "Debit", "debit")).replace(/[^0-9.-]/g, "")) || 0
  const credit = parseFloat(String(findKey(row, "Credit", "credit")).replace(/[^0-9.-]/g, "")) || 0
  const balance = parseFloat(String(findKey(row, "Balance", "balance")).replace(/[^0-9.-]/g, "")) || 0
  return { date, description, reference, debit, credit, balance }
}

async function getTransactions(db: any, filterUserId: string): Promise<SysTransaction[]> {
  const receipts = await db.collection(Collections.RECEIPTS).find({ userId: filterUserId }).toArray()
  const payments = await db.collection(Collections.PAYMENTS).find({ userId: filterUserId }).toArray()
  const list: SysTransaction[] = [
    ...receipts.map((r: any) => ({
      _id: r._id,
      type: "receipt" as const,
      transactionNumber: r.receiptNumber,
      date: r.date,
      clientName: r.clientName,
      recipientName: r.clientName,
      referenceNumber: r.referenceNumber,
      amount: r.ReceiptAmount || r.amountPaid || r.total || 0,
      status: r.status || "received",
    })),
    ...payments.map((p: any) => ({
      _id: p._id,
      type: "payment" as const,
      transactionNumber: p.paymentNumber,
      date: p.date,
      recipientName: p.recipientName,
      referenceNumber: p.referenceNumber,
      amount: p.amount || 0,
      status: p.status || "Paid",
    })),
  ]
  return list
}

/** GET: List bank statements with suggested matches (optional bank_account_id, status) */
export const GET = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  const { searchParams } = new URL(req.url)
  const bank_account_id = searchParams.get("bank_account_id") ?? undefined
  const status = searchParams.get("status") ?? undefined

  const db = await connectDB()
  const coll = db.collection(Collections.BANK_STATEMENTS)
  const filter: any = { userId: filterUserId }
  if (bank_account_id) filter.bank_account_id = bank_account_id
  if (status) filter.status = status

  const rows = await coll.find(filter).sort({ date: -1, createdAt: -1 }).limit(500).toArray()
  const transactions = await getTransactions(db, filterUserId)

  const withSuggestions = rows.map((r: any) => {
    if (r.status !== "pending") {
      return { ...r, suggestedSingle: [], suggestedMulti: [] }
    }
    const bank: BankRow = {
      date: r.date,
      description: r.description ?? "",
      reference: r.reference ?? "",
      debit: r.debit ?? 0,
      credit: r.credit ?? 0,
      balance: r.balance ?? 0,
    }
    const suggestedSingle = suggestSingleMatches(bank, transactions)
    const suggestedMulti = suggestMultiMatches(bank, transactions)
    return {
      ...r,
      suggestedSingle,
      suggestedMulti,
    }
  })

  return NextResponse.json({ success: true, data: withSuggestions })
})

/** POST: Upload CSV and create bank statement rows */
export const POST = withAuth(async (req: NextRequest, user: any) => {
  const filterUserId = user.isAdminUser && user.companyId ? user.companyId : user.userId
  let file: File
  let bank_account_id: string
  try {
    const formData = await req.formData()
    file = formData.get("file") as File
    const bid = formData.get("bank_account_id")
    bank_account_id = typeof bid === "string" ? bid : ""
    if (!file || !bank_account_id) {
      return NextResponse.json(
        { success: false, error: "file and bank_account_id are required" },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 })
  }

  const text = await file.text()
  const { headers, rows } = parseCSV(text)
  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "No data rows in CSV" }, { status: 400 })
  }

  const db = await connectDB()
  const coll = db.collection(Collections.BANK_STATEMENTS)
  const now = new Date()
  const toInsert = rows.map((row) => {
    const br = toBankRow(row)
    return {
      userId: filterUserId,
      bank_account_id,
      date: br.date,
      description: br.description,
      reference: br.reference,
      debit: br.debit,
      credit: br.credit,
      balance: br.balance,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    }
  })

  const inserted = await coll.insertMany(toInsert)
  const ids = Object.values(inserted.insertedIds)
  const insertedRows = await coll.find({ _id: { $in: ids } }).toArray()
  const transactions = await getTransactions(db, filterUserId)

  const withSuggestions = insertedRows.map((r: any) => {
    const bank: BankRow = {
      date: r.date,
      description: r.description ?? "",
      reference: r.reference ?? "",
      debit: r.debit ?? 0,
      credit: r.credit ?? 0,
      balance: r.balance ?? 0,
    }
    return {
      ...r,
      suggestedSingle: suggestSingleMatches(bank, transactions),
      suggestedMulti: suggestMultiMatches(bank, transactions),
    }
  })

  return NextResponse.json({
    success: true,
    data: withSuggestions,
    count: insertedRows.length,
  })
})
