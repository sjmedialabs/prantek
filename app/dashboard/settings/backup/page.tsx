"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api-client"
import { downloadCSV } from "@/lib/export-utils"
import { toast } from "@/lib/toast"

export default function BackupPage() {
  const fieldsToCapitalize = [
  "type",
  "address",
  "city",
  "status",
  "name",
  "pan",
  "category",
  "notes",
  "note",
  "clientName",
  "clientAddress",
  "isActive",
  "createdBy",
  "invoiceType",
  "description",
  "receiptType",
  "recipientType",
  "recipientName",
  "recipientAddress",
  "condition",
  "location",
  "assignedToName",
  "employeeName",
  "surName",
  "employmentStatus",
  "roleName",
  "unitType",
]
const capitalizeWords = (value: any) => {
  if (typeof value !== "string") return value

  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
// const SENSITIVE_KEYS_TO_EXCLUDE = [
//   // Phone numbers
//   "phone", "phone2", "mobileNo1", "mobileNo2", "clientPhone", "clientContact", "recipientPhone", "contactNumber", "emergencyContact",

//   // Financial amounts & numbers
//   "amount", "price", "total", "subtotal", "grandTotal", "paidAmount", "balanceAmount", "taxAmount", "discount", "salary", "purchasePrice", "currentValue", "depreciationRate", "ReceiptAmount", "refundedAmount", "invoiceTotalAmount", "expenseAdjustment", "payAbleAmount", "subscriptionPrice", "invoicegrandTotal", "invoiceBalance", "quantity", "cgst", "sgst", "igst", "taxRate",

//   // Financial identifiers
//   "bankAccount", "bankAccountNumber", "ifscCode", "upiId", "razorpayTokenId", "stripeCustomerId", "razorpayCustomerId",

//   // Government IDs
//   "gst", "gstin", "pan", "tan", "aadharNumber",

//   // Other
//   "pincode",

//   // Passwords/secrets
//   "password",

//   // Location
//   "address", "city", "state",
// ]
  const exportData = async (
    label: string,
    fetcher: () => Promise<any[]>
  ) => {
    try {
      const data = await fetcher()

      if (!data.length) {
        toast({ title: "No data found", description: label })
        return
      }

      const formatHeader = (key: string) => {
        return key
          // convert camelCase to space
          .replace(/([A-Z])/g, " $1")
          // convert snake_case to space
          .replace(/_/g, " ")
          // capitalize first letter of every word
          .replace(/\b\w/g, (char) => char.toUpperCase())
      }

      const seenLabels = new Set<string>()
      const columns = Object.keys(data[0])
        .filter((key) => {
          if (key === "userId") return false
          return true
        })
        .map((key) => {
          const label = formatHeader(key)
          // Handle cases where different keys might produce the same header label
          if (seenLabels.has(label)) {
            // Use the raw key as a fallback to ensure header uniqueness
            return { key, label: key }
          }
          seenLabels.add(label)
          return { key, label }
        })

      const formattedData = data.map((row) => {
        const newRow: any = {}

Object.keys(row).forEach((key) => {
  let value = row[key]

  if (value === null || value === undefined) {
    value = ""
  } else if (typeof value === "object") {
    try {
      value = JSON.stringify(value)
    } catch {
      value = ""
    }
  }

  if (fieldsToCapitalize.includes(key)) {
    value = capitalizeWords(value)
  }

  const lowerKey = key.toLowerCase()

  // Protect sensitive numbers
  if (
    typeof value === "string" &&
    (
      lowerKey.includes("phone") ||
      lowerKey.includes("mobile") ||
      lowerKey.includes("pincode") ||
      lowerKey.includes("gst") ||
      lowerKey.includes("pan") ||
      lowerKey.includes("aadhaar")
    )
  ) {
    value = `="${value}"`
  }

  // Handle currency properly
  const isCurrencyField = [
    "amount",
    "total",
    "price",
    "grandtotal",
    "paidamount",
    "balanceamount",
    "taxamount",
  ].includes(lowerKey)

  if (isCurrencyField && value !== "") {
    value = `="₹${value}"`
  }

  newRow[key] = value
})

  return newRow
})
      downloadCSV(`${label}.csv`, formattedData, columns)

      toast({ title: `${label} exported` })
    } catch (err) {
      console.error(err)
      toast({ title: "Export failed", variant: "destructive" })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Backup Center</h1>

      <Card>
        <CardHeader>
          <CardTitle>Export Individual Modules</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <Button onClick={() => exportData("clients", api.clients.getAll)}>Clients</Button>
          <Button onClick={() => exportData("vendors", api.vendors.getAll)}>Vendors</Button>
          <Button onClick={() => exportData("quotations", api.quotations.getAll)}>Quotations</Button>
          <Button onClick={() => exportData("sales-invoices", api.salesInvoice.getAll)}>Sales Invoices</Button>
          <Button onClick={() => exportData("receipts", api.receipts.getAll)}>Receipts</Button>
          <Button onClick={() => exportData("purchase-invoices", api.purchaseInvoice.getAll)}>Purchase Invoices</Button>
          <Button onClick={() => exportData("payments", api.payments.getAll)}>Payments</Button>
          <Button onClick={() => exportData("assets", api.assets.getAll)}>Assets</Button>
          <Button onClick={() => exportData("employees", api.employees.getAll)}>Employees</Button>
          <Button onClick={() => exportData("users", api.users.getAll)}>Users</Button>
          <Button onClick={() => exportData("products", api.items.getAll)}>Products</Button>

          <Button
            className="bg-black text-white hover:bg-black/90"
            onClick={async () => {
              try {
                const [transactions, entries, statements] = await Promise.all([
                  api.reconciliation.getAll(),
                  api.backup.getReconciliationEntries(),
                  api.backup.getBankStatements(),
                ])
                const rows = (transactions || []).map((t: any) => {
                  const bankAccount = t.bankAccount != null
                    ? (typeof t.bankAccount === "object"
                      ? (t.bankAccount.accountName || t.bankAccount.bankName || JSON.stringify(t.bankAccount))
                      : String(t.bankAccount))
                    : ""
                  return {
                    transaction_id: t._id != null ? String(t._id) : "",
                    transaction_type: t.type,
                    date: t.date || "",
                    party_name: t.clientName || t.recipientName || "",
                    payment_method: t.paymentMethod || "",
                    bank_account: bankAccount,
                    reference: t.referenceNumber || "",
                    status: t.status || "",
                  }
                })
                if (rows.length > 0) {
                  await exportData("reconciliation_transactions", () => Promise.resolve(rows))
                }
                if (entries.length > 0) {
                  await exportData("reconciliation_entries", () => Promise.resolve(entries))
                }
                if (statements.length > 0) {
                  await exportData("bank_statements", () => Promise.resolve(statements))
                }
                if (rows.length === 0 && entries.length === 0 && statements.length === 0) {
                  toast({ title: "No data found", description: "Reconciliation backup" })
                }
              } catch (e) {
                toast({ title: "Export failed", variant: "destructive" })
              }
            }}
          >
            Reconciliation Backup
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}