import { NextResponse, NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import { existsSync, mkdirSync } from "fs"
import path from "path"
import { sendEmail } from "@/lib/email/sendEmail"
import {
  generateDocumentPdf,
  type DocumentPdfOptions,
  type InvoicePdfData,
} from "@/lib/pdf/generateInvoicePdf"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "MyCashLedger"

/**
 * Resolve the public base URL for absolute links in emails.
 * Prefers BASE_URL, then APP_URL / NEXT_PUBLIC_APP_URL, finally localhost.
 */
function getBaseUrl(): string {
  const raw = (
    process.env.BASE_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  )
    .toString()
    .trim()
  return raw.replace(/\/+$/, "")
}

function safeFileSegment(input: string): string {
  return String(input).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document"
}

type DocumentType = "salesInvoice" | "quotation" | "receipt" | "purchaseInvoice" | "payment"

interface DocTypeConfig {
  label: string
  // DB collection the document is actually stored in.
  collection: string
  // How to resolve the user-visible document number on the fetched document.
  resolveNumber: (doc: any) => string | undefined
  // Upload subfolder under public/uploads/ and file prefix.
  folder: string
  filePrefix: string
  // PDF options.
  pdf: DocumentPdfOptions
}

/**
 * Per-document-type config. Collection names here reflect what the app
 * actually writes to in production (see lib/mongodb-store.ts mapping).
 */
const DOC_CONFIG: Record<DocumentType, DocTypeConfig> = {
  // Sales invoices are persisted via mongodb-store's `salesInvoice` model →
  // `sales_categories` collection. `Collections.SALES_INVOICES` isn't defined
  // in db-config, so we fall back to the real runtime collection name.
  salesInvoice: {
    label: "Sales Invoice",
    collection:
      (Collections as { SALES_INVOICES?: string }).SALES_INVOICES || "sales_categories",
    resolveNumber: (d) => d?.salesInvoiceNumber,
    folder: "invoices",
    filePrefix: "invoice",
    pdf: { title: "TAX INVOICE", numberLabel: "Invoice No", partyLabel: "Bill To" },
  },
  quotation: {
    label: "Quotation",
    collection: Collections.QUOTATIONS || "quotations",
    resolveNumber: (d) => d?.quotationNumber,
    folder: "quotations",
    filePrefix: "quotation",
    pdf: { title: "QUOTATION", numberLabel: "Quotation No", partyLabel: "Quote For" },
  },
  receipt: {
    label: "Receipt",
    collection: Collections.RECEIPTS || "receipts",
    resolveNumber: (d) => d?.receiptNumber,
    folder: "receipts",
    filePrefix: "receipt",
    pdf: { title: "RECEIPT", numberLabel: "Receipt No", partyLabel: "Received From" },
  },
  purchaseInvoice: {
    label: "Purchase Invoice",
    collection: Collections.PURCHASE_INVOICES || "purchase_invoices",
    resolveNumber: (d) => d?.purchaseInvoiceNumber,
    folder: "purchase-invoices",
    filePrefix: "purchase-invoice",
    pdf: { title: "PURCHASE INVOICE", numberLabel: "Invoice No", partyLabel: "Vendor" },
  },
  payment: {
    label: "Payment",
    collection: Collections.PAYMENTS || "payments",
    resolveNumber: (d) => d?.paymentNumber,
    folder: "payments",
    filePrefix: "payment",
    pdf: { title: "PAYMENT RECEIPT", numberLabel: "Payment No", partyLabel: "Paid To" },
  },
}

function resolveTotalAmount(doc: any): number {
  return Number(
    doc.grandTotal ??
      doc.total ??
      doc.invoiceTotalAmount ??
      doc.ReceiptAmount ??
      doc.amount ??
      0,
  ) || 0
}

export async function POST(request: NextRequest) {
  try {
    const { documentType, documentId, recipientEmail, recipientName, tenantId } =
      await request.json()

    if (!documentType || !documentId || !recipientEmail) {
      return NextResponse.json(
        { success: false, error: "documentType, documentId and recipientEmail are required" },
        { status: 400 },
      )
    }

    console.log("[SEND-DOC-EMAIL] Incoming request:", {
      documentType,
      documentId,
      recipientEmail,
      recipientName,
      tenantId,
    })

    const cfg = DOC_CONFIG[documentType as DocumentType]
    if (!cfg) {
      return NextResponse.json({ success: false, error: "Invalid document type" }, { status: 400 })
    }

    // Validate documentId can be parsed as ObjectId.
    let objectId: ObjectId
    try {
      objectId = new ObjectId(documentId)
    } catch (e) {
      console.error("[SEND-DOC-EMAIL] Invalid documentId format:", { documentId, error: e })
      return NextResponse.json({ success: false, error: "Invalid document id" }, { status: 400 })
    }

    const db = await connectDB()
    console.log("[SEND-DOC-EMAIL] Fetching document:", {
      documentType,
      collection: cfg.collection,
      invoiceId: String(documentId),
    })

    const doc = await db.collection(cfg.collection).findOne({ _id: objectId })
    if (!doc) {
      console.error("[SEND-DOC-EMAIL] Invoice data not found", {
        documentType,
        collection: cfg.collection,
        invoiceId: String(documentId),
      })
      return NextResponse.json(
        { success: false, error: "Invoice data not found" },
        { status: 404 },
      )
    }

    console.log("[SEND-DOC-EMAIL] Fetched document:", {
      invoiceId: String(doc._id),
      documentType,
      documentNumber: cfg.resolveNumber(doc) || null,
      partyName: doc.clientName || doc.recipientName || null,
      totalAmount: resolveTotalAmount(doc),
      status: doc.status || null,
      itemCount: Array.isArray(doc.items) ? doc.items.length : 0,
    })

    const label = cfg.label
    const docNumber = cfg.resolveNumber(doc) || documentId
    const name =
      recipientName || doc.clientName || doc.recipientName || "Customer"
    const totalAmount = resolveTotalAmount(doc)
    const date = doc.date || doc.invoiceDate || doc.createdAt
    const company = doc.companyDetails || {}

    // ---------------------------------------------------------------
    // Document / PDF generation
    // ---------------------------------------------------------------
    // Generated BEFORE sending the email, with absolute paths under
    // public/uploads/<folder>. If generation or the existence check fails,
    // we still send the email WITHOUT an attachment link (and log a warning).
    let pdfFileUrl: string | null = null
    let pdfFilePath: string | null = null
    let pdfWarning: string | null = null

    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", cfg.folder)
      if (!existsSync(uploadsDir)) {
        mkdirSync(uploadsDir, { recursive: true })
        console.log("[SEND-DOC-EMAIL] Created uploads directory:", uploadsDir)
      }

      const fileName = `${cfg.filePrefix}-${safeFileSegment(String(docNumber))}-${Date.now()}.pdf`
      const filePath = path.join(uploadsDir, fileName)

      console.log("[SEND-DOC-EMAIL] Generating PDF:", {
        documentType,
        invoiceId: String(doc._id),
        filePath,
      })

      await generateDocumentPdf(
        { ...(doc as unknown as InvoicePdfData), companyDetails: company },
        filePath,
        cfg.pdf,
      )

      if (!existsSync(filePath)) {
        throw new Error(`Invoice file not found after generation: ${filePath}`)
      }

      pdfFilePath = filePath
      // Served via the existing /api/uploads/[...path] route, which reliably
      // serves runtime-written files from public/uploads in standalone mode.
      pdfFileUrl = `${getBaseUrl()}/api/uploads/${cfg.folder}/${fileName}`

      console.log("[SEND-DOC-EMAIL] PDF ready:", {
        filePath: pdfFilePath,
        fileUrl: pdfFileUrl,
      })
    } catch (pdfErr) {
      pdfWarning = pdfErr instanceof Error ? pdfErr.message : "Unknown PDF generation error"
      console.warn(
        "[SEND-DOC-EMAIL] PDF generation failed, sending email without attachment:",
        pdfWarning,
      )
      pdfFileUrl = null
      pdfFilePath = null
    }

    const companyName = company.name || ""
    const companyLogo = company.logo || ""
    const companyAddress = company.address || ""
    const companyPhone = company.phone || ""
    const companyEmail = company.email || ""
    const companyWebsite = company.website || ""

    const attachmentBlock = pdfFileUrl
      ? `
    <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 12px; color: #555;">A PDF copy of your ${label.toLowerCase()} is attached below.</p>
      <a href="${pdfFileUrl}" style="display: inline-block; background: #667eea; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Download ${label} PDF
      </a>
      <p style="margin: 12px 0 0; font-size: 12px; color: #999; word-break: break-all;">${pdfFileUrl}</p>
    </div>`
      : ""

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
  
  <h1 style="color: white; margin: 0; font-size: 24px;">
    ${APP_NAME}
  </h1>

  ${companyLogo ? `
    <div style="margin-top: 15px;">
      <img src="${companyLogo}" alt="logo" style="max-height: 60px; object-fit: contain;" />
    </div>
  ` : ""}

  ${companyName ? `
    <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 10px 0 5px;">
      ${companyName}
    </p>
  ` : ""}

  ${(companyAddress || companyPhone || companyEmail || companyWebsite) ? `
    <p style="color: #e0e0e0; font-size: 12px; margin: 0; line-height: 1.5;">
      ${companyAddress ? `${companyAddress}<br/>` : ""}
      ${companyPhone ? `📞 ${companyPhone}<br/>` : ""}
      ${companyEmail ? `✉️ ${companyEmail}<br/>` : ""}
      ${companyWebsite ? `🌐 ${companyWebsite}` : ""}
    </p>
  ` : ""}

</div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">${label}: ${docNumber}</h2>
    <p>Dear ${name},</p>
    <p>Please find below the details of your ${label.toLowerCase()}.</p>
    <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">${label} No:</td><td style="padding: 8px 0;">${docNumber}</td></tr>
        ${date ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Date:</td><td style="padding: 8px 0;">${new Date(date).toLocaleDateString("en-IN")}</td></tr>` : ""}
        <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Amount:</td><td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #667eea;">₹${Number(totalAmount).toLocaleString("en-IN")}</td></tr>
        ${doc.status ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Status:</td><td style="padding: 8px 0; text-transform: capitalize;">${doc.status}</td></tr>` : ""}
      </table>
    </div>
    ${attachmentBlock}
    ${doc.items?.length ? `
    <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #555;">Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 2px solid #e0e0e0;">
          <th style="text-align: left; padding: 8px 4px; color: #555;">Item</th>
          <th style="text-align: right; padding: 8px 4px; color: #555;">Qty</th>
          <th style="text-align: right; padding: 8px 4px; color: #555;">Amount</th>
        </tr>
        ${doc.items.map((item: any) => `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 8px 4px;">${item.name || item.itemName || "-"}</td>
          <td style="text-align: right; padding: 8px 4px;">${item.quantity || "-"}</td>
          <td style="text-align: right; padding: 8px 4px;">₹${Number(item.total || item.amount || 0).toLocaleString("en-IN")}</td>
        </tr>`).join("")}
      </table>
    </div>` : ""}
    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
      This is an automated email from ${APP_NAME}. Please do not reply.
    </p>
  </div>
</body>
</html>`

    const textAttachmentLine = pdfFileUrl ? `\nDownload PDF: ${pdfFileUrl}\n` : ""
    const text = `${label}: ${docNumber}\nDear ${name},\n\nAmount: ₹${Number(totalAmount).toLocaleString("en-IN")}\n${date ? `Date: ${new Date(date).toLocaleDateString("en-IN")}` : ""}\n${doc.status ? `Status: ${doc.status}` : ""}${textAttachmentLine}\n---\n${APP_NAME}`

    console.log("[SEND-DOC-EMAIL] Sending email:", {
      to: recipientEmail,
      documentType,
      invoiceId: String(doc._id),
      pdfFilePath,
      pdfFileUrl,
    })

    const result = await sendEmail({
      to: recipientEmail,
      subject: `${label} ${docNumber} from ${APP_NAME}`,
      html,
      text,
    })
    console.log("[SEND-DOC-EMAIL] Result:", result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${label} sent to ${recipientEmail}`,
        pdfUrl: pdfFileUrl,
        pdfWarning,
      })
    } else {
      return NextResponse.json(
        { success: false, error: (result as any).error || "Failed to send email" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[SEND-DOC-EMAIL] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
  }
}
