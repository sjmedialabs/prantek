import { NextResponse, NextRequest } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email/sendEmail"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "MyCashLedger"

export async function POST(request: NextRequest) {
  console.log("[SEND-DOC-EMAIL] Request:", request)
  try {
    const { documentType, documentId, recipientEmail, recipientName, tenantId, companyDetails } = await request.json()

    if (!documentType || !documentId || !recipientEmail) {
      return NextResponse.json(
        { success: false, error: "documentType, documentId and recipientEmail are required" },
        { status: 400 }
      )
    }

    const db = await connectDB()

    // Map documentType to collection
    const collectionMap: Record<string, string> = {
      salesInvoice: Collections.SALES_CATEGORIES || "salesInvoices",
      receipt: Collections.RECEIPTS || "receipts",
      purchaseInvoice: Collections.PURCHASE_INVOICES || "purchaseInvoices",
      payment: Collections.PAYMENTS || "payments",
    }

    const collectionName = collectionMap[documentType]
    if (!collectionName) {
      return NextResponse.json({ success: false, error: "Invalid document type" }, { status: 400 })
    }

    const doc = await db.collection(collectionName).findOne({ _id: new ObjectId(documentId) })
    if (!doc) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 })
    }
    console.log("[SEND-DOC-EMAIL] Document data:", doc)
    // Build email content based on document type
    const typeLabels: Record<string, string> = {
      salesInvoice: "Sales Invoice",
      receipt: "Receipt",
      purchaseInvoice: "Purchase Invoice",
      payment: "Payment",
    }
    const label = typeLabels[documentType] || "Document"
    const docNumber =
      doc.salesInvoiceNumber || doc.receiptNumber || doc.purchaseInvoiceNumber || doc.paymentNumber || documentId

    const name = recipientName || doc.clientName || "Customer"
    const totalAmount = doc.grandTotal ?? doc.total ?? doc.ReceiptAmount ?? doc.amount ?? 0
    const date = doc.date || doc.invoiceDate || doc.createdAt
    const company = doc.companyDetails || {}
    console.log("[SEND-DOC-EMAIL] Company details from document:", company , "Company details from request:", companyDetails)
const companyName = company.name || companyDetails?.name || ""
const companyLogo = company.logo || companyDetails?.logo || ""
const companyAddress = company.address || companyDetails?.address || ""
const companyPhone = company.phone || companyDetails?.phone || ""
const companyEmail = company.email || companyDetails?.email || ""
const companyWebsite = company.website || companyDetails?.website || ""
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

    const text = `${label}: ${docNumber}\nDear ${name},\n\nAmount: ₹${Number(totalAmount).toLocaleString("en-IN")}\n${date ? `Date: ${new Date(date).toLocaleDateString("en-IN")}` : ""}\n${doc.status ? `Status: ${doc.status}` : ""}\n\n---\n${APP_NAME}`

    const result = await sendEmail({
      to: recipientEmail,
      subject: `${label} ${docNumber} from ${APP_NAME}`,
      html,
      text,
    })
    console.log("[SEND-DOC-EMAIL] Result:", result)

    if (result.success) {
      return NextResponse.json({ success: true, message: `${label} sent to ${recipientEmail}` })
    } else {
      return NextResponse.json(
        { success: false, error: (result as any).error || "Failed to send email" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[SEND-DOC-EMAIL] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
  }
}
