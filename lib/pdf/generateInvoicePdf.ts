/**
 * Server-side PDF generator for transactional documents:
 *   - Sales Invoice (TAX INVOICE)
 *   - Quotation
 *   - Receipt
 *   - Purchase Invoice
 *   - Payment (Payment Receipt)
 *
 * Uses `jspdf` + `jspdf-autotable` which run in Node without a DOM.
 * Writes the resulting PDF to an absolute file path and returns the
 * same path on success. Throws on failure so callers can fall back.
 */
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { promises as fsp } from "fs"
import { existsSync, mkdirSync } from "fs"
import path from "path"

export interface InvoicePdfItem {
  name?: string
  itemName?: string
  description?: string
  quantity?: number
  price?: number
  discount?: number
  taxRate?: number
  taxAmount?: number
  total?: number
  amount?: number
}

export interface InvoicePdfParty {
  name?: string
  email?: string
  phone?: string
  address?: string
}

export interface InvoicePdfData {
  _id?: unknown
  // Party / client (back-compat fields)
  clientName?: string
  clientAddress?: string
  clientEmail?: string
  clientPhone?: string
  clientContact?: string
  // Party / recipient (purchase invoice / payment)
  recipientName?: string
  recipientAddress?: string
  recipientEmail?: string
  recipientPhone?: string
  // Explicit party object — takes precedence if provided by the caller
  party?: InvoicePdfParty
  // Document numbers (any one may be present)
  salesInvoiceNumber?: string
  purchaseInvoiceNumber?: string
  receiptNumber?: string
  paymentNumber?: string
  quotationNumber?: string
  // Dates
  date?: string | Date
  invoiceDate?: string | Date
  dueDate?: string | Date
  validity?: string | Date
  // Status / items / totals
  status?: string
  items?: InvoicePdfItem[]
  subtotal?: number
  grandTotal?: number
  total?: number
  invoiceTotalAmount?: number
  ReceiptAmount?: number
  amount?: number
  balanceAmount?: number
  paidAmount?: number
  // Text fields
  notes?: string
  note?: string
  terms?: string
  description?: string
  // Misc transaction metadata (payment / receipt)
  paymentMethod?: string
  paymentType?: string
  category?: string
  referenceNumber?: string
  amountInWords?: string
  // Company
  companyDetails?: {
    name?: string
    address?: string
    phone?: string
    email?: string
    website?: string
  }
}

export interface DocumentPdfOptions {
  /** Big header title, e.g. "TAX INVOICE", "QUOTATION", "RECEIPT". */
  title?: string
  /** Label shown before the document number, e.g. "Invoice No". */
  numberLabel?: string
  /** Left-side party section heading, e.g. "Bill To", "Quote For", "Pay To". */
  partyLabel?: string
  /** Extra right-side header meta rows (appended after number/date/status). */
  extraMeta?: Array<[string, string | undefined | null]>
  /** Extra rows to show in a summary block when there are no items. */
  summaryRows?: Array<[string, string | undefined | null]>
}

function formatDate(value?: string | Date): string {
  if (!value) return ""
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ""
    return d.toLocaleDateString("en-IN")
  } catch {
    return ""
  }
}

function formatMoney(value: unknown): string {
  const n = Number(value ?? 0) || 0
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function stripHtml(html: string): string {
  return String(html).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

function resolveParty(doc: InvoicePdfData): InvoicePdfParty {
  if (doc.party) return doc.party
  // Prefer client* fields; fall back to recipient* for purchase-side docs.
  const name = doc.clientName || doc.recipientName
  const email = doc.clientEmail || doc.recipientEmail
  const phone = doc.clientPhone || doc.clientContact || doc.recipientPhone
  const address = doc.clientAddress || doc.recipientAddress
  return { name, email, phone, address }
}

function resolveDocNumber(doc: InvoicePdfData): string {
  return (
    doc.salesInvoiceNumber ||
    doc.quotationNumber ||
    doc.receiptNumber ||
    doc.purchaseInvoiceNumber ||
    doc.paymentNumber ||
    ""
  )
}

function resolveGrandTotal(doc: InvoicePdfData): number {
  return Number(
    doc.grandTotal ??
      doc.total ??
      doc.invoiceTotalAmount ??
      doc.ReceiptAmount ??
      doc.amount ??
      0,
  ) || 0
}

/** Ensures the directory for `filePath` exists. */
export function ensureDirFor(filePath: string): string {
  const dir = path.dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Generate a PDF for any supported document type and write it to `filePath`.
 * Returns the absolute file path on success. Throws on failure.
 */
export async function generateDocumentPdf(
  doc: InvoicePdfData,
  filePath: string,
  opts: DocumentPdfOptions = {},
): Promise<string> {
  if (!doc || typeof doc !== "object") {
    throw new Error("Document data not provided to PDF generator")
  }

  ensureDirFor(filePath)

  const title = opts.title || "TAX INVOICE"
  const numberLabel = opts.numberLabel || "Invoice No"
  const partyLabel = opts.partyLabel || "Bill To"

  const pdf = new jsPDF({ unit: "pt", format: "a4" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 40

  const company = doc.companyDetails || {}
  const party = resolveParty(doc)
  const docNumber = resolveDocNumber(doc)
  const dateStr = formatDate(doc.date || doc.invoiceDate)
  const dueDateStr = formatDate(doc.dueDate)
  const validityStr = formatDate(doc.validity)

  // Header — company info
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(16)
  pdf.text(String(company.name || ""), margin, margin + 6)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  let headerY = margin + 24
  const companyLines = [
    company.address,
    company.phone ? `Phone: ${company.phone}` : "",
    company.email ? `Email: ${company.email}` : "",
    company.website ? `Web: ${company.website}` : "",
  ].filter(Boolean) as string[]
  for (const line of companyLines) {
    pdf.text(String(line), margin, headerY)
    headerY += 14
  }

  // Header — title + meta (right-aligned)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(20)
  pdf.text(title, pageWidth - margin, margin + 6, { align: "right" })

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  let metaY = margin + 28
  const metaLines: string[] = []
  if (docNumber) metaLines.push(`${numberLabel}: ${docNumber}`)
  if (dateStr) metaLines.push(`Date: ${dateStr}`)
  if (dueDateStr) metaLines.push(`Due Date: ${dueDateStr}`)
  if (validityStr) metaLines.push(`Valid Until: ${validityStr}`)
  if (doc.status) metaLines.push(`Status: ${String(doc.status).toUpperCase()}`)
  for (const [label, value] of opts.extraMeta || []) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      metaLines.push(`${label}: ${value}`)
    }
  }
  for (const line of metaLines) {
    pdf.text(line, pageWidth - margin, metaY, { align: "right" })
    metaY += 14
  }

  // Party block
  const partyY = Math.max(headerY, metaY) + 12
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text(partyLabel, margin, partyY)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  let btY = partyY + 14
  const partyLines = [party.name, party.address, party.email, party.phone].filter(Boolean) as string[]
  for (const line of partyLines) {
    pdf.text(String(line), margin, btY)
    btY += 14
  }

  // Items table (if any)
  const items = Array.isArray(doc.items) ? doc.items : []
  let finalY = btY + 8

  if (items.length > 0) {
    const body = items.map((item) => {
      const name = String(item.itemName || item.name || "-")
      const desc = item.description ? `\n${stripHtml(String(item.description))}` : ""
      const qty = Number(item.quantity ?? 0) || 0
      const price = Number(item.price ?? 0) || 0
      const discount = Number(item.discount ?? 0) || 0
      const taxRate = Number(item.taxRate ?? 0) || 0
      const lineTotal = Number(item.total ?? item.amount ?? price * qty) || 0
      return [
        `${name}${desc}`,
        String(qty),
        formatMoney(price),
        formatMoney(discount),
        `${taxRate}%`,
        formatMoney(lineTotal),
      ]
    })

    autoTable(pdf, {
      head: [["Item", "Qty", "Price", "Discount", "Tax %", "Total"]],
      body,
      startY: btY + 8,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: [240, 240, 240], textColor: 30, halign: "left" },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "right", cellWidth: 40 },
        2: { halign: "right", cellWidth: 70 },
        3: { halign: "right", cellWidth: 70 },
        4: { halign: "right", cellWidth: 50 },
        5: { halign: "right", cellWidth: 80 },
      },
    })
    finalY =
      (pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? btY + 40

    // Totals
    const subtotal =
      doc.subtotal ??
      items.reduce((acc, it) => acc + (Number(it.price ?? 0) || 0) * (Number(it.quantity ?? 0) || 0), 0)
    const discountTotal = items.reduce(
      (acc, it) => acc + (Number(it.discount ?? 0) || 0) * (Number(it.quantity ?? 0) || 0),
      0,
    )
    const taxTotal = items.reduce((acc, it) => acc + (Number(it.taxAmount ?? 0) || 0), 0)
    const grand = resolveGrandTotal(doc)

    pdf.setFontSize(10)
    const totalsRight = pageWidth - margin
    const totalsLeft = pageWidth - margin - 200
    let ty = finalY + 20

    const totalsRows: Array<[string, string, boolean?]> = [
      ["Subtotal:", formatMoney(subtotal)],
      ["Discount:", `-${formatMoney(discountTotal)}`],
      ["Tax Amount:", formatMoney(taxTotal)],
      ["Grand Total:", formatMoney(grand), true],
    ]
    if (doc.balanceAmount !== undefined && doc.balanceAmount !== null) {
      totalsRows.push(["Balance Due:", formatMoney(doc.balanceAmount)])
    }
    for (const [label, value, bold] of totalsRows) {
      pdf.setFont("helvetica", bold ? "bold" : "normal")
      pdf.text(label, totalsLeft, ty)
      pdf.text(value, totalsRight, ty, { align: "right" })
      ty += 16
    }
    finalY = ty
  } else {
    // No line items: render a simple amount summary box for receipts / payments.
    pdf.setFontSize(10)
    const boxLeft = pageWidth - margin - 260
    const labelLeft = boxLeft + 10
    const valueRight = pageWidth - margin - 10
    let ty = btY + 14
    pdf.setDrawColor(220)
    pdf.roundedRect(boxLeft, ty - 14, 260, 90, 4, 4)

    const summaryRows: Array<[string, string | undefined | null, boolean?]> = [
      ["Amount", formatMoney(resolveGrandTotal(doc)), true],
    ]
    if (doc.paymentMethod) summaryRows.push(["Payment Method", String(doc.paymentMethod)])
    if (doc.paymentType) summaryRows.push(["Payment Type", String(doc.paymentType)])
    if (doc.category) summaryRows.push(["Category", String(doc.category)])
    if (doc.referenceNumber) summaryRows.push(["Reference", String(doc.referenceNumber)])
    for (const row of opts.summaryRows || []) summaryRows.push([row[0], row[1]])

    for (const [label, value, bold] of summaryRows) {
      if (value === undefined || value === null || String(value).trim() === "") continue
      pdf.setFont("helvetica", bold ? "bold" : "normal")
      pdf.text(`${label}:`, labelLeft, ty)
      pdf.text(String(value), valueRight, ty, { align: "right" })
      ty += 14
    }
    finalY = Math.max(ty, btY + 110)
  }

  // Amount in words
  if (doc.amountInWords) {
    finalY += 10
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    pdf.text("Amount in words:", margin, finalY)
    pdf.setFont("helvetica", "normal")
    const lines = pdf.splitTextToSize(String(doc.amountInWords), pageWidth - margin * 2 - 120)
    pdf.text(lines, margin + 110, finalY)
    finalY += lines.length * 12
  }

  // Notes / terms / description
  const notes = doc.notes || doc.note || doc.description
  if (notes) {
    finalY += 14
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    pdf.text("Notes:", margin, finalY)
    finalY += 14
    pdf.setFont("helvetica", "normal")
    const notesLines = pdf.splitTextToSize(stripHtml(String(notes)), pageWidth - margin * 2)
    pdf.text(notesLines, margin, finalY)
    finalY += notesLines.length * 12
  }
  if (doc.terms) {
    finalY += 10
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    pdf.text("Terms & Conditions:", margin, finalY)
    finalY += 14
    pdf.setFont("helvetica", "normal")
    const termsLines = pdf.splitTextToSize(stripHtml(String(doc.terms)), pageWidth - margin * 2)
    pdf.text(termsLines, margin, finalY)
    finalY += termsLines.length * 12
  }

  const pdfBuffer = Buffer.from(pdf.output("arraybuffer"))
  await fsp.writeFile(filePath, pdfBuffer)
  return filePath
}

/** Back-compat alias: sales invoice PDF (default title "TAX INVOICE"). */
export async function generateInvoicePdf(
  doc: InvoicePdfData,
  filePath: string,
  opts: DocumentPdfOptions = {},
): Promise<string> {
  return generateDocumentPdf(doc, filePath, {
    title: "TAX INVOICE",
    numberLabel: "Invoice No",
    partyLabel: "Bill To",
    ...opts,
  })
}
