/**
 * Bulk Sales Invoice helpers.
 * Parse CSV/XLSX, group by client+date, validate rows, build payload for existing POST /api/salesInvoice.
 */

export const BULK_TEMPLATE_HEADERS = [
  "Client",
  "Invoice Date",
  "Due Date",
  "Item Name",
  "Quantity",
  "Price",
  "Discount",
  "CGST",
  "SGST",
  "IGST",
  "Bank Account",
  "Description",
] as const

export type BulkTemplateHeader = (typeof BULK_TEMPLATE_HEADERS)[number]

export interface BulkInvoiceRow {
  rowIndex: number
  client: string
  invoiceDate: string
  dueDate: string
  itemName: string
  quantity: number
  price: number
  discount: number
  cgst: number
  sgst: number
  igst: number
  bankAccount: string
  description: string
}

export interface ValidationError {
  rowIndex: number
  reason: string
}

export interface ValidatedRow extends BulkInvoiceRow {
  clientId?: string
  itemId?: string
  bankAccountId?: string
  taxRate: number
  amount: number
  taxAmount: number
  total: number
  errors: string[]
  status: "valid" | "invalid"
}

export interface InvoiceGroup {
  clientId: string
  clientName: string
  clientAddress: string
  clientContact: string
  clientEmail: string
  invoiceDate: string
  dueDate: string
  bankAccountId: string
  bankDetails: any
  description: string
  rows: ValidatedRow[]
  subtotal: number
  taxAmount: number
  grandTotal: number
}

function normalizeHeader(h: string): string {
  return (h || "").trim().replace(/\s+/g, " ")
}

/**
 * Parse CSV or XLSX file into rows of key-value objects (header -> value).
 */
export function parseInvoiceFile(
  file: File
): Promise<{ rows: Record<string, string>[]; errors: string[] }> {
  const errors: string[] = []
  const fileName = (file.name || "").toLowerCase()

  if (fileName.endsWith(".csv")) {
    return parseCSV(file, errors)
  }
  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    return parseXLSX(file, errors)
  }
  return Promise.resolve({
    rows: [],
    errors: ["Unsupported format. Please upload CSV or XLSX."],
  })
}

function parseCSV(
  file: File,
  errors: string[]
): Promise<{ rows: Record<string, string>[]; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = (reader.result as string) || ""
        const Papa = require("papaparse")
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
        const rows = (parsed.data || []).filter(
          (r: any) => Object.keys(r).some((k) => r[k] != null && String(r[k]).trim() !== "")
        )
        const out = rows.map((r: any) => {
          const obj: Record<string, string> = {}
          for (const k of Object.keys(r)) {
            const canon = toCanonicalKey(k)
            obj[canon] = String(r[k] ?? "").trim()
          }
          return obj
        })
        resolve({ rows: out, errors })
      } catch (e) {
        errors.push("Failed to parse CSV: " + (e as Error).message)
        resolve({ rows: [], errors })
      }
    }
    reader.onerror = () => {
      errors.push("Failed to read file")
      resolve({ rows: [], errors })
    }
    reader.readAsText(file, "UTF-8")
  })
}

function parseXLSX(
  file: File,
  errors: string[]
): Promise<{ rows: Record<string, string>[]; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const XLSX = require("xlsx")
        const data = reader.result
        const wb = XLSX.read(data, { type: "array" })
        const firstSheet = wb.Sheets[wb.SheetNames[0]]
        const json: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        if (json.length < 2) {
          resolve({ rows: [], errors })
          return
        }
        const headers = (json[0] || []).map((h: any) => toCanonicalKey(String(h ?? "")))
        const rows: Record<string, string>[] = []
        for (let i = 1; i < json.length; i++) {
          const row = json[i] as any[]
          const obj: Record<string, string> = {}
          headers.forEach((h, j) => {
            obj[h] = row[j] != null ? String(row[j]).trim() : ""
          })
          if (Object.values(obj).some((v) => v !== "")) rows.push(obj)
        }
        resolve({ rows, errors })
      } catch (e) {
        errors.push("Failed to parse XLSX: " + (e as Error).message)
        resolve({ rows: [], errors })
      }
    }
    reader.onerror = () => {
      errors.push("Failed to read file")
      resolve({ rows: [], errors })
    }
    reader.readAsArrayBuffer(file)
  })
}

const CANONICAL_HEADERS: Record<string, string> = {
  client: "Client",
  "invoice date": "Invoice Date",
  "due date": "Due Date",
  "item name": "Item Name",
  quantity: "Quantity",
  price: "Price",
  discount: "Discount",
  cgst: "CGST",
  sgst: "SGST",
  igst: "IGST",
  "bank account": "Bank Account",
  description: "Description",
}

function toCanonicalKey(h: string): string {
  const n = normalizeHeader(h).toLowerCase()
  return CANONICAL_HEADERS[n] ?? normalizeHeader(h)
}

function mapRow(raw: Record<string, string>, rowIndex: number): BulkInvoiceRow | null {
  const get = (key: string) => {
    const v = raw[key] ?? raw[CANONICAL_HEADERS[key.toLowerCase()]] ?? ""
    return String(v).trim()
  }
  const client = get("Client")
  const itemName = get("Item Name")
  if (!client && !itemName) return null
  const q = parseFloat(get("Quantity")) || 0
  const p = parseFloat(get("Price")) || 0
  const d = parseFloat(get("Discount")) || 0
  const cgst = parseFloat(get("CGST")) || 0
  const sgst = parseFloat(get("SGST")) || 0
  const igst = parseFloat(get("IGST")) || 0
  return {
    rowIndex,
    client,
    invoiceDate: get("Invoice Date"),
    dueDate: get("Due Date"),
    itemName,
    quantity: q,
    price: p,
    discount: d,
    cgst,
    sgst,
    igst,
    bankAccount: get("Bank Account"),
    description: get("Description"),
  }
}

/**
 * Convert raw parsed rows into BulkInvoiceRow[] (one row per line item).
 */
export function rowsToInvoiceRows(rawRows: Record<string, string>[]): BulkInvoiceRow[] {
  const out: BulkInvoiceRow[] = []
  rawRows.forEach((raw, i) => {
    const row = mapRow(raw, i + 2)
    if (row) out.push(row)
  })
  return out
}

/**
 * Group rows by Client + Invoice Date so each group becomes one invoice with multiple items.
 */
export function groupInvoiceRows(rows: BulkInvoiceRow[]): Map<string, BulkInvoiceRow[]> {
  const map = new Map<string, BulkInvoiceRow[]>()
  for (const row of rows) {
    const key = `${row.client}|${row.invoiceDate}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(row)
  }
  return map
}

function calculateRowTotals(row: BulkInvoiceRow): { amount: number; taxAmount: number; total: number; taxRate: number } {
  const taxRate = row.cgst + row.sgst + row.igst
  const amount = (row.price - row.discount) * row.quantity
  const taxAmount = amount * (taxRate / 100)
  const total = amount + taxAmount
  return { amount, taxAmount, total, taxRate }
}

/**
 * Validate rows: client exists, item exists, bank exists, quantity > 0, price > 0, tax valid.
 * Requires lists of clients, items, bank accounts from API.
 */
export function validateInvoiceRows(
  rows: BulkInvoiceRow[],
  clients: { _id: string; name?: string; clientName?: string; email?: string; address?: string; phone?: string; city?: string; state?: string; pincode?: string }[],
  items: { _id: string; name?: string; itemName?: string }[],
  bankAccounts: { _id: string; accountName?: string }[]
): { validated: ValidatedRow[]; errors: ValidationError[] } {
  const errors: ValidationError[] = []
  const validated: ValidatedRow[] = []

  const clientByName = new Map<string | undefined, (typeof clients)[0]>()
  clients.forEach((c) => {
    const n = (c.clientName ?? c.name ?? "").trim()
    if (n) clientByName.set(n, c)
  })
  const itemByName = new Map<string | undefined, (typeof items)[0]>()
  items.forEach((i) => {
    const n = (i.itemName ?? i.name ?? "").trim()
    if (n) itemByName.set(n, i)
  })
  const bankByName = new Map<string | undefined, (typeof bankAccounts)[0]>()
  bankAccounts.forEach((b) => {
    const n = (b.accountName ?? "").trim()
    if (n) bankByName.set(n, b)
  })

  for (const row of rows) {
    const rowErrors: string[] = []
    const client = clientByName.get(row.client)
    const item = itemByName.get(row.itemName)
    const bank = bankByName.get(row.bankAccount)

    if (!row.client) rowErrors.push("Client is required")
    else if (!client) rowErrors.push("Client not found")
    if (!row.itemName) rowErrors.push("Item name is required")
    else if (!item) rowErrors.push("Item not found")
    if (!row.bankAccount) rowErrors.push("Bank account is required")
    else if (!bank) rowErrors.push("Bank account not found")
    if (row.quantity <= 0) rowErrors.push("Quantity must be greater than 0")
    if (row.price <= 0) rowErrors.push("Price must be greater than 0")
    const taxRate = row.cgst + row.sgst + row.igst
    if (taxRate < 0 || taxRate > 100) rowErrors.push("Tax values must be between 0 and 100")
    if (!row.invoiceDate) rowErrors.push("Invoice date is required")
    if (row.dueDate && row.invoiceDate && new Date(row.dueDate) < new Date(row.invoiceDate)) {
      rowErrors.push("Due date cannot be before invoice date")
    }

    if (rowErrors.length) {
      rowErrors.forEach((r) => errors.push({ rowIndex: row.rowIndex, reason: r }))
    }

    const { amount, taxAmount, total, taxRate: tr } = calculateRowTotals(row)
    validated.push({
      ...row,
      clientId: client?._id,
      itemId: item?._id,
      bankAccountId: bank?._id,
      taxRate: tr,
      amount,
      taxAmount,
      total,
      errors: rowErrors,
      status: rowErrors.length > 0 ? "invalid" : "valid",
    })
  }

  return { validated, errors }
}

/**
 * Build one invoice payload per group for POST /api/salesInvoice (same shape as manual form).
 */
export function buildInvoicePayloadFromGroup(
  group: InvoiceGroup,
  createdBy: string
): Record<string, any> {
  const items = group.rows.map((r) => ({
    type: "service" as const,
    itemName: r.itemName,
    description: r.description || undefined,
    quantity: r.quantity,
    price: r.price,
    discount: r.discount,
    cgst: r.cgst,
    sgst: r.sgst,
    igst: r.igst,
    itemId: r.itemId,
    taxName: `GST ${r.taxRate}%`,
    taxRate: r.taxRate,
    total: r.total,
    amount: r.amount,
    taxAmount: r.taxAmount,
  }))
  return {
    invoiceType: "direct",
    quotationId: undefined,
    quotationNumber: undefined,
    clientId: group.clientId,
    clientName: group.clientName,
    clientAddress: group.clientAddress,
    clientContact: group.clientContact,
    clientEmail: group.clientEmail,
    items,
    grandTotal: group.grandTotal,
    paidAmount: 0,
    balanceAmount: group.grandTotal,
    description: group.description || "",
    date: new Date(group.invoiceDate).toISOString(),
    dueDate: group.dueDate ? new Date(group.dueDate).toISOString() : undefined,
    status: "not collected",
    terms: "",
    createdBy,
    isActive: "active",
    bankDetails: group.bankDetails,
  }
}

/**
 * Build invoice groups from validated rows (only valid rows; one group per client+invoice date).
 */
export function buildInvoiceGroups(
  validated: ValidatedRow[],
  clients: { _id: string; name?: string; clientName?: string; email?: string; address?: string; phone?: string; city?: string; state?: string; pincode?: string }[],
  bankAccounts: { _id: string; accountName?: string; [k: string]: any }[]
): InvoiceGroup[] {
  const validRows = validated.filter((r) => r.status === "valid")
  const clientMap = new Map(clients.map((c) => [c._id, c]))
  const bankMap = new Map(bankAccounts.map((b) => [b._id, b]))
  const groupMap = new Map<string, ValidatedRow[]>()
  for (const r of validRows) {
    if (!r.clientId) continue
    const key = `${r.clientId}|${r.invoiceDate}`
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(r)
  }

  const groups: InvoiceGroup[] = []
  groupMap.forEach((rows, key) => {
    const [clientId, invoiceDate] = key.split("|")
    const client = clientMap.get(clientId)
    const first = rows[0]
    const bankId = first?.bankAccountId
    const bank = bankId ? bankMap.get(bankId) : null
    const subtotal = rows.reduce((s, r) => s + r.total, 0)
    const taxAmount = rows.reduce((s, r) => s + r.taxAmount, 0)
    const grandTotal = subtotal
    groups.push({
      clientId,
      clientName: client?.clientName ?? client?.name ?? "",
      clientAddress: [client?.address, client?.city, client?.state, client?.pincode].filter(Boolean).join(", ") || "",
      clientContact: client?.phone ?? "",
      clientEmail: client?.email ?? "",
      invoiceDate,
      dueDate: first?.dueDate || invoiceDate,
      bankAccountId: bankId ?? "",
      bankDetails: bank ?? null,
      description: first?.description ?? "",
      rows,
      subtotal,
      taxAmount,
      grandTotal,
    })
  })
  return groups
}

/**
 * Generate sample CSV template string.
 */
export function getSampleTemplateCSV(): string {
  const headers = BULK_TEMPLATE_HEADERS.join(",")
  const row1 =
    "ABC Pvt Ltd,2026-03-15,2026-03-20,Website Development,1,50000,0,9,9,0,HDFC Current Account,Development Invoice"
  const row2 =
    "ABC Pvt Ltd,2026-03-15,2026-03-20,Hosting Service,1,2000,0,9,9,0,HDFC Current Account,Hosting charges"
  return [headers, row1, row2].join("\n")
}
