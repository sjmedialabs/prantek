"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  parseInvoiceFile,
  rowsToInvoiceRows,
  validateInvoiceRows,
  buildInvoiceGroups,
  buildInvoicePayloadFromGroup,
  getSampleTemplateCSV,
  type ValidatedRow,
  type ValidationError,
} from "@/lib/bulk-invoice-helpers"
import { api } from "@/lib/api-client"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Step = "upload" | "preview" | "result"

export default function BulkUploadSalesInvoicesPage() {
  const { hasPermission } = useUser()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [validated, setValidated] = useState<ValidatedRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [createdIds, setCreatedIds] = useState<string[]>([])
  const [failedRows, setFailedRows] = useState<{ rowIndex: number; reason: string }[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [createdBy, setCreatedBy] = useState("Bulk Import")

  const loadData = useCallback(async () => {
    try {
      const [clientsRes, itemsRes, banksRes] = await Promise.all([
        api.clients.getAll(),
        api.items.getAll(),
        api.bankAccounts.getAll(),
      ])
      setClients(Array.isArray(clientsRes) ? clientsRes : [])
      setItems(Array.isArray(itemsRes) ? itemsRes : [])
      setBankAccounts(Array.isArray(banksRes) ? banksRes : [])
      const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("auth_user") || "{}") : {}
      const name = user?.companyName ?? user?.name ?? "Bulk Import"
      setCreatedBy(name)
    } catch (e) {
      toast({ title: "Error", description: "Failed to load clients/items/banks", variant: "destructive" })
    } finally {
      setDataLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setParseErrors([])
    setValidated([])
    setValidationErrors([])
    const { rows, errors } = await parseInvoiceFile(selected)
    if (errors.length) setParseErrors(errors)
    if (rows.length === 0 && errors.length === 0) {
      setParseErrors(["No valid rows found in file."])
      return
    }
    const invoiceRows = rowsToInvoiceRows(rows)
    if (invoiceRows.length === 0) {
      setParseErrors(["No valid data rows. Check column headers."])
      return
    }
    const { validated: v, errors: ve } = validateInvoiceRows(
      invoiceRows,
      clients,
      items,
      bankAccounts
    )
    setValidated(v)
    setValidationErrors(ve)
    setStep("preview")
  }

  const handleDownloadTemplate = () => {
    const csv = getSampleTemplateCSV()
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sales-invoice-bulk-template.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Downloaded", description: "Sample template downloaded." })
  }

  const handleImport = async () => {
    const groups = buildInvoiceGroups(validated, clients, bankAccounts)
    const validGroups = groups.filter((g) => g.rows.every((r) => r.status === "valid"))
    if (validGroups.length === 0) {
      toast({ title: "No valid invoices", description: "Fix validation errors first.", variant: "destructive" })
      return
    }
    setLoading(true)
    setCreatedIds([])
    setFailedRows([])
    setImportError(null)
    const failed: { rowIndex: number; reason: string }[] = []
    const created: string[] = []

    for (const group of validGroups) {
      try {
        const payload = buildInvoicePayloadFromGroup(group, createdBy)
        const res = await fetch("/api/salesInvoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const result = await res.json()
        if (result.success && result.data?._id) {
          created.push(result.data._id)
        } else {
          group.rows.forEach((r) => failed.push({ rowIndex: r.rowIndex, reason: result.error || "Create failed" }))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Request failed"
        group.rows.forEach((r) => failed.push({ rowIndex: r.rowIndex, reason: msg }))
      }
    }

    const invalidRows = validated.filter((r) => r.status === "invalid")
    invalidRows.forEach((r) => r.errors.forEach((e) => failed.push({ rowIndex: r.rowIndex, reason: e })))

    setCreatedIds(created)
    setFailedRows(failed)
    setImportError(failed.length > 0 ? "Some rows failed." : null)
    setStep("result")
    setLoading(false)
    toast({
      title: "Import complete",
      description: `Created ${created.length} invoice(s). Failed: ${failed.length} row(s).`,
      variant: failed.length ? "destructive" : "default",
    })
  }

  const downloadErrorReport = () => {
    if (failedRows.length === 0) return
    const header = "Row,Error\n"
    const body = failedRows.map((f) => `${f.rowIndex},"${(f.reason || "").replace(/"/g, '""')}"`).join("\n")
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "bulk-invoice-errors.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Downloaded", description: "Error report downloaded." })
  }

  const validCount = validated.filter((r) => r.status === "valid").length
  const invalidCount = validated.filter((r) => r.status === "invalid").length
  const invoiceGroupCount = buildInvoiceGroups(validated, clients, bankAccounts).length

  if (!hasPermission("add_sales_invoice")) {
    return (
      <div className="p-6">
        <p className="text-destructive">You do not have permission to add sales invoices.</p>
        <Link href="/dashboard/salesInvoices">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/salesInvoices" className="text-sm text-muted-foreground hover:underline mb-2 inline-block">
            <ArrowLeft className="h-4 w-4 inline mr-1" />
            Sales Invoices
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Sales Invoices</h1>
          <p className="text-gray-600">Upload CSV or XLSX to create multiple invoices at once.</p>
        </div>
      </div>

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload File
            </CardTitle>
            <CardDescription>
              Use the sample template. Multiple rows with the same Client and Invoice Date will be grouped into one invoice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Sample Template
            </Button>
            <div className="border-2 border-dashed rounded-xl p-8 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="bulk-file"
              />
              <label htmlFor="bulk-file" className="cursor-pointer flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                <span className="font-medium">Choose CSV or XLSX</span>
                <span className="text-sm text-muted-foreground">Client, Invoice Date, Due Date, Item Name, Quantity, Price, Discount, CGST, SGST, IGST, Bank Account, Description</span>
              </label>
            </div>
            {parseErrors.length > 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {parseErrors.map((e, i) => (
                  <div key={i}>{e}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {validCount} valid row(s), {invalidCount} invalid. About {invoiceGroupCount} invoice(s) will be created.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Tax %</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validated.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.client}</TableCell>
                        <TableCell>{r.invoiceDate}</TableCell>
                        <TableCell>{r.itemName}</TableCell>
                        <TableCell>{r.quantity}</TableCell>
                        <TableCell>{r.price}</TableCell>
                        <TableCell>{r.cgst + r.sgst + r.igst}%</TableCell>
                        <TableCell>₹{r.total.toLocaleString()}</TableCell>
                        <TableCell>
                          {r.status === "valid" ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Valid
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" /> {r.errors[0] || "Invalid"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => { setStep("upload"); setFile(null); setValidated([]); setValidationErrors([]); }}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={validCount === 0 || loading}>
                  {loading ? "Importing…" : `Import ${invoiceGroupCount} Invoice(s)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === "result" && (
        <Card>
          <CardHeader>
            <CardTitle>Import Result</CardTitle>
            <CardDescription>
              Invoices Created: {createdIds.length} — Failed Rows: {failedRows.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {importError && failedRows.length > 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="font-medium text-destructive mb-2">Errors (e.g. Row number — Reason):</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {failedRows.slice(0, 20).map((f, i) => (
                    <li key={i}>Row {f.rowIndex} — {f.reason}</li>
                  ))}
                  {failedRows.length > 20 && <li>… and {failedRows.length - 20} more</li>}
                </ul>
                <Button variant="outline" size="sm" className="mt-2" onClick={downloadErrorReport}>
                  Download Error Report CSV
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Link href="/dashboard/salesInvoices">
                <Button>View Created Invoices</Button>
              </Link>
              <Button variant="outline" onClick={() => { setStep("upload"); setFile(null); setValidated([]); setCreatedIds([]); setFailedRows([]); }}>
                Upload Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
