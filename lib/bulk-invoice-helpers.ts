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
  "Bank Name",
  "Account Name",
  "Account Number",
  "IFSC",
  "Branch",
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
  /** Legacy single column; also used when new bank columns are empty */
  bankAccount: string
  bankName: string
  accountName: string
  accountNumber: string
  ifsc: string
  branch: string
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
  return (h || "")
    .replace(/\uFEFF/g, "") // BOM
    .trim()
    .replace(/\s+/g, " ")
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
  "client name": "Client",
  customer: "Client",
  "invoice date": "Invoice Date",
  "due date": "Due Date",
  "item name": "Item Name",
  item: "Item Name",
  product: "Item Name",
  service: "Item Name",
  quantity: "Quantity",
  qty: "Quantity",
  price: "Price",
  discount: "Discount",
  cgst: "CGST",
  sgst: "SGST",
  igst: "IGST",
  "bank account": "Bank Account",
  bank: "Bank Account",
  "bank name": "Bank Name",
  "account name": "Account Name",
  "account number": "Account Number",
  ifsc: "IFSC",
  branch: "Branch",
  description: "Description",
  desc: "Description",
}

/** Normalize and trim a value for validation. */
function clean(value: unknown): string {
  return (value != null ? String(value) : "").trim()
}

function toCanonicalKey(h: string): string {
  const n = normalizeHeader(h).toLowerCase()
  return CANONICAL_HEADERS[n] ?? normalizeHeader(h)
}
function parseFlexibleDate(value: any): string {
  if (!value) return ""

  const str = String(value).trim()

  // ✅ Excel serial number (e.g. 44927)
  if (!isNaN(str)) {
    const date = new Date((Number(str) - 25569) * 86400 * 1000)
    return date.toISOString().split("T")[0]
  }

  // ✅ Replace all separators with "/"
  const normalized = str.replace(/[-.]/g, "/")

  const parts = normalized.split("/")

  // Handle DD/MM/YYYY
  if (parts.length === 3) {
    let [day, month, year] = parts

    // handle YYYY/MM/DD
    if (year.length === 2) year = "20" + year

    // If format is YYYY/MM/DD
    if (day.length === 4) {
      return `${day}-${month.padStart(2, "0")}-${parts[2].padStart(2, "0")}`
    }

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  // fallback
  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0]
  }

  return ""
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
    invoiceDate: parseFlexibleDate(get("Invoice Date")),
dueDate: parseFlexibleDate(get("Due Date")),
    itemName,
    quantity: q,
    price: p,
    discount: d,
    cgst,
    sgst,
    igst,
    bankAccount: get("Bank Account"),
    bankName: clean(get("Bank Name")),
    accountName: clean(get("Account Name")),
    accountNumber: clean(get("Account Number")),
    ifsc: clean(get("IFSC")),
    branch: clean(get("Branch")),
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

/** Normalize string for flexible matching: trim, lowercase, collapse spaces. */
function normalizeForMatch(s: string): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

type BankAccountRecord = {
  _id: string
  accountName?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  branchName?: string
}

/**
 * Find bank account using multiple fields (priority: Account Number → IFSC + Account Name → Bank Name).
 * All inputs are normalized (trim). Matching is case-insensitive where specified.
 */
function findBankAccountMultiField(
  row: {
    bankAccount?: string
    bankName?: string
    accountName?: string
    accountNumber?: string
    ifsc?: string
    branch?: string
  },
  bankAccounts: BankAccountRecord[]
): { bank: BankAccountRecord | undefined; identifierForError: string } {
  const bn = clean(row.bankName)
  const an = clean(row.accountName)
  const anum = clean(row.accountNumber)
  const ifsc = clean(row.ifsc)
  const branch = clean(row.branch)
  const legacy = clean(row.bankAccount)

  // Priority 1 — Account Number (exact match, trimmed)
  if (anum) {
    const match = bankAccounts.find(
      (b) => clean(b.accountNumber) === anum
    )
    if (match) return { bank: match, identifierForError: "" }
  }

  // Priority 2 — IFSC + Account Name (case-insensitive account name)
  if (ifsc && an) {
    const match = bankAccounts.find(
      (b) =>
        clean(b.ifscCode) === ifsc &&
        normalizeForMatch(b.accountName ?? "") === normalizeForMatch(an)
    )
    if (match) return { bank: match, identifierForError: "" }
  }

  // Priority 3 — Bank Name (case-insensitive contains)
  if (bn) {
    const normBn = normalizeForMatch(bn)
    const match = bankAccounts.find((b) => {
      const bankNorm = normalizeForMatch(b.bankName ?? "")
      return bankNorm && (bankNorm.includes(normBn) || normBn.includes(bankNorm))
    })
    if (match) return { bank: match, identifierForError: "" }
  }

  // Legacy — single "Bank Account" column: match by account name or bank name (check both)
  if (legacy) {
    const normalized = normalizeForMatch(legacy)
    const exact = bankAccounts.find((b) => {
      const an = normalizeForMatch(b.accountName ?? "")
      const bn = normalizeForMatch(b.bankName ?? "")
      return an === normalized || bn === normalized
    })
    if (exact) return { bank: exact, identifierForError: "" }
    const partial = bankAccounts.find((b) => {
      const an = normalizeForMatch(b.accountName ?? "")
      const bn = normalizeForMatch(b.bankName ?? "")
      return (an && (an.includes(normalized) || normalized.includes(an))) ||
        (bn && (bn.includes(normalized) || normalized.includes(bn)))
    })
    if (partial) return { bank: partial, identifierForError: "" }
  }

  // Build identifier for error message
  if (anum) return { bank: undefined, identifierForError: `Account Number: ${anum}` }
  if (ifsc && an) return { bank: undefined, identifierForError: `IFSC: ${ifsc}, Account Name: ${an}` }
  if (bn) return { bank: undefined, identifierForError: `Bank Name: ${bn}` }
  if (legacy) return { bank: undefined, identifierForError: `Bank Account: ${legacy}` }
  return { bank: undefined, identifierForError: "" }
}

/**
 * Check that a tax exists in application settings by type and percentage (rate).
 */
function findTaxByTypeAndRate(
  taxRates: { type: string; rate: number }[],
  type: "CGST" | "SGST" | "IGST",
  rate: number
): boolean {
  const num = Number(rate)
  if (!Number.isFinite(num)) return false
  return taxRates.some(
    (t) => t.type === type && Math.abs(Number(t.rate) - num) < 0.01
  )
}

/**
 * Validate rows: client exists, item exists, bank exists, quantity > 0, price > 0, tax valid.
 * Tax must exist in application settings (Settings → Taxes). Bank matching is case-insensitive and allows partial names.
 */
export function validateInvoiceRows(
  rows: BulkInvoiceRow[],
  clients: { _id: string; name?: string; clientName?: string; email?: string; address?: string; phone?: string; city?: string; state?: string; pincode?: string }[],
  items: { _id: string; name?: string; itemName?: string }[],
  bankAccounts: BankAccountRecord[],
  taxRates: { _id?: string; type: string; rate: number }[] = []
): { validated: ValidatedRow[]; errors: ValidationError[] } {
  const errors: ValidationError[] = []
  const validated: ValidatedRow[] = []

  const clientByName = new Map<string, (typeof clients)[0]>()
  clients.forEach((c) => {
    const n = normalizeForMatch(c.clientName ?? c.name ?? "")
    if (n) clientByName.set(n, c)
  })
  const itemByName = new Map<string, (typeof items)[0]>()
  items.forEach((i) => {
    const n = normalizeForMatch(i.itemName ?? i.name ?? "")
    if (n) itemByName.set(n, i)
  })

  for (const row of rows) {
    const rowErrors: string[] = []
    const client = row.client ? clientByName.get(normalizeForMatch(row.client)) : undefined
    const item = row.itemName ? itemByName.get(normalizeForMatch(row.itemName)) : undefined
    const hasBankId =
      clean(row.bankAccount) !== "" ||
      clean(row.accountNumber) !== "" ||
      (clean(row.ifsc) !== "" && clean(row.accountName) !== "") ||
      clean(row.bankName) !== ""
    const { bank, identifierForError } = findBankAccountMultiField(
      {
        bankAccount: row.bankAccount,
        bankName: row.bankName,
        accountName: row.accountName,
        accountNumber: row.accountNumber,
        ifsc: row.ifsc,
        branch: row.branch,
      },
      bankAccounts
    )

    if (!row.client) rowErrors.push("Client is required")
    else if (!client) rowErrors.push("Client not found")
    if (!row.itemName) rowErrors.push("Item name is required")
    else if (!item) rowErrors.push("Item not found")
    if (!hasBankId) rowErrors.push("Bank account is required (provide Bank Name, Account Number, or IFSC + Account Name)")
    else if (!bank) rowErrors.push(identifierForError ? `Bank account not found (${identifierForError})` : "Bank account not found")
    if (row.quantity <= 0) rowErrors.push("Quantity must be greater than 0")
    if (row.price <= 0) rowErrors.push("Price must be greater than 0")
    const taxRate = row.cgst + row.sgst + row.igst
    if (taxRate < 0 || taxRate > 100) rowErrors.push("Tax values must be between 0 and 100")
    if (taxRate >= 0 && taxRate <= 100 && taxRates.length > 0) {
      const missingTax =
        (Number(row.cgst) > 0 && !findTaxByTypeAndRate(taxRates, "CGST", row.cgst)) ||
        (Number(row.sgst) > 0 && !findTaxByTypeAndRate(taxRates, "SGST", row.sgst)) ||
        (Number(row.igst) > 0 && !findTaxByTypeAndRate(taxRates, "IGST", row.igst))
      if (missingTax) rowErrors.push("Tax not found in application settings")
    }
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
    "ABC Pvt Ltd,2026-03-15,2026-03-20,Website Development,1,50000,0,9,9,0,HDFC Bank,Lovely,7896857441526385,HDFC0001234,Bandlaguda Suncity,Development Invoice"
  const row2 =
    "ABC Pvt Ltd,2026-03-15,2026-03-20,Hosting Service,1,2000,0,9,9,0,HDFC Bank,Lovely,7896857441526385,HDFC0001234,Bandlaguda Suncity,Hosting charges"
  return [headers, row1, row2].join("\n")
}
