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
const formatDateTime = (value: any) => {
  if (!value) return ""

  const date = new Date(value)

  // Invalid date check
  if (isNaN(date.getTime())) return value

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}
const EXCLUDED_FIELDS = ["_id", "createdAt", "updatedAt", "updateAt", "id", "Id", "clientId", "vendorId", "employeeId", "userId", "companyId", "tenantId", "recipientId", "designation", "transactionId", "lastLogin", "employee", "screenshotUrl", "screenshotFile", "billFile", "billUpload", "photo", "adharUpload", "educationCertificates", "experienceCertificates", "userCount", "isActive", ]
const capitalizeWords = (value: any) => {
  if (typeof value !== "string") return value

  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
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
          if (EXCLUDED_FIELDS.includes(key)) return false
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
    if (EXCLUDED_FIELDS.includes(key)) return

    let value = row[key]

    if (value === null || value === undefined) {
      value = ""
    }

    const lowerKey = key.toLowerCase()

    // 🔥 Detect DATE properly (field name + ISO format)
    const isDateValue =
      value instanceof Date ||
      (typeof value === "string" && /^\d{4}-\d{2}-\d{2}t/i.test(value))

    const isDateField =
      lowerKey.includes("date") ||
      lowerKey.includes("created") ||
      lowerKey.includes("updated") ||
      lowerKey.includes("time") ||
      lowerKey.includes("login") // 🔥 FIXED (covers lastLogin)

    if ((isDateField || isDateValue) && value) {
      value = formatDateTime(value)
    } 
    // 🔥 Convert objects AFTER date check
else if (typeof value === "object") {

  // ✅ Handle ITEMS ARRAY
  if (Array.isArray(value) && key.toLowerCase().includes("item")) {
    value = value
      .map((item: any) =>
        `${item.itemName || ""} (Qty:${item.quantity || 0}, Price:${item.price || 0})`
      )
      .join(" | ")
  }

  // ✅ Handle BANK DETAILS OBJECT
  else if (key.toLowerCase().includes("bank")) {
    value = `${value.bankName || ""} - ${value.accountNumber || ""} (IFSC: ${value.ifscCode || ""})`
  }

  // ✅ Fallback (if any other object)
  else {
    try {
      value = JSON.stringify(value)
    } catch {
      value = ""
    }
  }
}

    // Capitalization
    if (fieldsToCapitalize.includes(key)) {
      value = capitalizeWords(value)
    }

    // Protect sensitive numbers
    if (
      typeof value === "string" &&
      (
        lowerKey.includes("phone") ||
        lowerKey.includes("mobile") ||
        lowerKey.includes("pincode") ||
        lowerKey.includes("gst") ||
        lowerKey.includes("pan") ||
        lowerKey.includes("aadharNo") || lowerKey.includes("accountNumber") || lowerKey.includes("ifsc") || lowerKey.includes("reference")
      )
    ) {
      value = `="${value}"`
    }

    // Currency formatting
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
      value = `="${value}"`
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
          <Button onClick={() => exportData("admin-users", api.users.getAdminUsers)}>Users</Button>
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