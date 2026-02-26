"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, FileText, Filter, X, Eye } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Quotation } from "@/lib/models/types"
import dynamic from "next/dynamic"
import { Check, Repeat } from "lucide-react"
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })
import "react-quill/dist/quill.snow.css"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

// interface Quotation {
//   _id: string
//   quotationNumber: string
//   date: string
//   clientName: string
//   clientEmail: string
//   grandTotal: number
//   validity: string
//   status: "pending" | "accepted" | "expired" | "confirmed"
//   paidAmount?: number
//   balanceAmount?: number
//   isActive: "active" | "inactive"
//   salesInvoiceId?: string
//   convertedAt?: Date
//   terms?: string
// }

export default function QuotationsPage() {
  const router = useRouter()
  const { hasPermission } = useUser()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null)
  const [bankAccounts, setBankAccounts] = useState<any>([]);
  // Accept dialog
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [acceptedDate, setAcceptedDate] = useState(new Date().toISOString().split("T")[0])

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [minAmountFilter, setMinAmountFilter] = useState("")
  const [maxAmountFilter, setMaxAmountFilter] = useState("")
  const [clientFilter, setClientFilter] = useState("all")
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [invoiceDescription, setInvoiceDescription] = useState("")
  const [quotationToConvert, setQuotationToConvert] = useState<Quotation | null>(null)
  // const [terms, setTerms] = useState("")
  const [availableTerms, setAvailableTerms] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [date, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [companyName, setCompanyName] = useState("")
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadQuotations()
  }, [])

  const loadQuotations = async () => {
    const [data, bankAccountsData, termsRes] = await Promise.all([
      api.quotations.getAll(),
      api.bankAccounts.getAll(),
      fetch("/api/terms?type=invoice"),
    ])
    const termsData = await termsRes.json()
    const formattedTerms = termsData
      .filter((t: any) => t.isActive)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((t: any) => (t.title ? `<p><strong>${t.title}</strong></p>${t.content}` : t.content))
      .join("")
    setAvailableTerms(formattedTerms)
    console.log("formattedTerms", formattedTerms)
    console.log("bankAccountsData", bankAccountsData)
    setBankAccounts(bankAccountsData.filter((eachItem: any) => (eachItem.isActive === true)))
    console.log("bankAccountsData", bankAccountsData)
    // if (termsData.success) {
    //   setAvailableTerms(termsData.data.filter((t: any) => t.type === 'invoice' && t.isActive))
    // }

    // Check for expired quotations
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const updates: Promise<any>[] = []
    const updatedData = data.map((q: Quotation) => {
      if (q.status === "pending" && q.validity) {
        const validity = new Date(q.validity)
        validity.setHours(0, 0, 0, 0)

        if (validity < today) {
          updates.push(api.quotations.update(q._id, { status: "expired" }))
          return { ...q, status: "expired" }
        }
      }
      return q
    })

    if (updates.length > 0) {
      Promise.allSettled(updates)
    }

    setQuotations(updatedData)
    setLoading(false)
  }

  // ---------------- FILTERING LOGIC ----------------
  const filteredQuotations = quotations.filter((q) => {
    const searchMatch =
      q?.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase())

    const statusMatch = statusFilter === "all" || q.status === statusFilter

    const dateFromMatch = !dateFromFilter || new Date(q.date) >= new Date(dateFromFilter)
    const dateToMatch = !dateToFilter || new Date(q.date) <= new Date(dateToFilter)

    const minMatch = !minAmountFilter || q.grandTotal >= Number(minAmountFilter)
    const maxMatch = !maxAmountFilter || q.grandTotal <= Number(maxAmountFilter)

    const clientMatch = clientFilter === "all" || q.clientName === clientFilter

    return (
      searchMatch &&
      statusMatch &&
      dateFromMatch &&
      dateToMatch &&
      minMatch &&
      maxMatch &&
      clientMatch
    )
  })

  // ---------------- PAGINATION ----------------
  const totalPages = Math.ceil(filteredQuotations.length / pageSize)
  const paginatedData = filteredQuotations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  console.log("bank acounts list ", bankAccounts)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "bg-gray-100 text-gray-800"
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case ("invoice created"):
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  const fetchCompanyName = async () => {
    try {
      const res = await fetch("/api/company").then((res) => res.json()),
        result = await res

      if (result?.company) {
        setCompanyName(result.company.companyName || result.company.name || "")
        console.log("companyName", companyName)
      }
    } catch (error) {
      console.error("Failed to fetch company name", error)
    }
  }
  useEffect(() => {
    fetchCompanyName()
  }, [])
  const handleAccept = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setAcceptDialogOpen(true)
  }

  const confirmAcceptance = async () => {
    if (!selectedQuotation) return
    try {
      await api.quotations.accept(selectedQuotation._id)
      await loadQuotations()
      setAcceptDialogOpen(false)
      window.location.href = `/dashboard/receipts/new?quotationId=${selectedQuotation._id}`
    } catch (error) {
      console.error(error)
    }
  }
  const handleConvertToInvoice = async () => {
    if (!quotationToConvert) return
    console.log("quotationToConvert", quotationToConvert)
    setLoading(true)

    try {
      const payload = {
        // 👇 SALES INVOICE fields ONLY

        invoiceType: "quotation",
        quotationNumber: quotationToConvert.quotationNumber,
        clientId: quotationToConvert.clientId,
        clientName: quotationToConvert.clientName,
        clientAddress: quotationToConvert.clientAddress,
        clientPhone: quotationToConvert.clientContact, // mapping
        clientEmail: quotationToConvert.clientEmail,

        items: quotationToConvert.items,
        grandTotal: quotationToConvert.grandTotal,

        paidAmount: 0,
        balanceAmount: quotationToConvert.grandTotal,

        date: new Date().toISOString(),
        status: "Not Cleared",

        terms: availableTerms,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,

        description: invoiceDescription,
        quotationId: quotationToConvert._id,
        isActive: "active",
        createdBy: companyName,
        bankDetails: selectedBankAccount,
      }

      console.log("Invoice Payload", payload)

      const res = await fetch("/api/salesInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create invoice")
      }

      // ✅ mark quotation confirmed
      await api.quotations.update(quotationToConvert._id, {
        status: "invoice created",
        salesInvoiceId: result.data._id.toString(),
        convertedAt: new Date(),
      })

      toast.success("Invoice created successfully")

      setConvertDialogOpen(false)
      setInvoiceDescription("")
      router.push("/dashboard/salesInvoices")
    } catch (err) {
      console.error(err)
      toast.error("Failed to convert quotation to invoice")
    } finally {
      setLoading(false)
    }
  }



  const handleStatusToggle = async (id: string, isActive: string) => {
    try {
      await api.quotations.updateStatus(id, isActive === "active" ? "inactive" : "active")
      toast.success(`Quotation ${isActive === "active" ? "Disabled" : "Enabled"}`)
      loadQuotations()
    } catch (err) {
      toast.error("Failed to update")
    }
  }
  const handleAcceptQuotation = async (id: string) => {
    try {
      await api.quotations.update(id, { status: "accepted" })
      toast.success("Quotation accepted")
      loadQuotations()
    } catch (error) {
      toast.error("Failed to accept quotation")
    }
  }
  const uniqueClients = Array.from(new Set(quotations.map((q) => q.clientName)))

  const clearFilters = () => {
    setStatusFilter("all")
    setDateFromFilter("")
    setDateToFilter("")
    setMinAmountFilter("")
    setMaxAmountFilter("")
    setClientFilter("all")
    setSearchTerm("")
  }

  // const handleTermSelect = (termId: string) => {
  //   const term = availableTerms.find(t => t._id === termId)
  //   if (term) {
  //     const plainText = term.content.replace(/<[^>]+>/g, '')
  //     setTerms(plainText)
  //   }
  // }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">Loading...</div>
    )
  }
  if (!hasPermission("view_quotations")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You don't have permission to view Quotations.</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotations / Agreements</h1>
          <p className="text-gray-600">Manage your quotations & proposals</p>
        </div>

        {
          (hasPermission("add_quotations")) && (
            <Link href="/dashboard/quotations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Quotation/Agreement
              </Button>
            </Link>
          )
        }
      </div>

      {/* ---------------- FILTERS ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotations/Agreement ({filteredQuotations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search + filter buttons */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by quotation no or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" /> Filters
            </Button>

            {(statusFilter !== "all" ||
              dateFromFilter ||
              dateToFilter ||
              minAmountFilter ||
              maxAmountFilter ||
              clientFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" /> Clear
                </Button>
              )}
          </div>

          {/* Filter dropdown section */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Client</label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueClients.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input type="date" value={dateToFilter} min={dateFromFilter} onChange={(e) => setDateToFilter(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium">Min Amount</label>
                <Input type="number" value={minAmountFilter} onChange={(e) => setMinAmountFilter(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium">Max Amount</label>
                <Input type="number" value={maxAmountFilter} onChange={(e) => setMaxAmountFilter(e.target.value)} />
              </div>
            </div>
          )}

          {/* ---------------- TABLE VIEW ---------------- */}
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Quotation/Agreement No</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.map((q, index) => (
                  <TableRow key={q?._id?.toString() || index}>
                    <TableCell>
                      {(currentPage - 1) * pageSize + (index + 1)}
                    </TableCell>

                    <TableCell className="font-medium">{q.quotationNumber}</TableCell>
                    <TableCell>{q.clientName}</TableCell>
                    <TableCell>{new Date(q.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(q?.validity || "").toLocaleDateString()}</TableCell>

                    <TableCell>₹{(q.balanceAmount || 0).toLocaleString()}</TableCell>

                    <TableCell>
                      <Badge className={getStatusColor(q.status)}><span className="capitalize">{q.status}</span></Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">

                      {/* VIEW */}
                      <Link href={`/dashboard/quotations/${q._id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* IF ACTIVE ONLY */}
                      {q.isActive === "active" && (

                        <>
                          {/* CREATED → SHOW ACCEPT ICON */}
                          {q.status === "created" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600"
                              title="Accept Quotation"
                              onClick={() => handleAcceptQuotation(q._id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}

                          {/* ACCEPTED → SHOW CONVERT ICON */}
                          {q.status === "accepted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-600"
                              title="Convert to Invoice"
                              onClick={() => {
                                setQuotationToConvert(q)
                                setConvertDialogOpen(true)
                              }}
                            >
                              <Repeat className="h-4 w-4" />
                            </Button>
                          )}

                          {/* EDIT allowed only before invoice created */}
                          {hasPermission("edit_quotations") &&
                            q.status !== "invoice created" && (
                              <Link href={`/dashboard/quotations/${q._id}/edit`}>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                        </>
                      )}

                      {/* STATUS TOGGLE ALWAYS AVAILABLE */}
                      {hasPermission("edit_quotations") && (
                        <Switch
                          checked={q.isActive === "active"}
                          onCheckedChange={() => handleStatusToggle(q._id, q.isActive)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
              <DialogContent className="max-h-[90vh]">
                <DialogHeader className="fixed top-2 left-6">
                  <DialogTitle>Convert to Sales Invoice</DialogTitle>
                  <DialogDescription>
                    This will create a sales invoice using the quotation details.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-10 mb-16 max-h-[70vh] overflow-y-scroll no-scrollbar">

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Invoice Description</label>
                    <Input
                      placeholder="Enter description for invoice"
                      value={invoiceDescription}
                      onChange={(e) => setInvoiceDescription(e.target.value)}
                    />
                  </div>

                  {/* Due Date */}
                  <div className="flex flex-row gap-2">
                    <div>
                      <Label>Invoice Date</Label>
                      <Input type="date" value={date} onChange={(e) => setInvoiceDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Created By</Label>
                      <Input value={companyName} readOnly className="bg-gray-100" />
                    </div>
                  </div>
                  {quotationToConvert && (
                    <div className="bg-gray-100 p-3 rounded text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Quotation:</span>
                        <span className="font-medium">
                          {quotationToConvert.quotationNumber}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Client:</span>
                        <span>{quotationToConvert.clientName}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>₹{quotationToConvert.grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>
                      Bank Account
                    </Label>
                    <Select
                      value={selectedBankAccount?._id}
                      onValueChange={(id) => {
                        const bank = bankAccounts.find((b: any) => b._id === id)
                        setSelectedBankAccount(bank)
                      }}
                    >

                      <SelectTrigger>
                        <SelectValue placeholder="Slect Bank Accounts" />
                      </SelectTrigger>
                      <SelectContent className="z-9999">
                        {bankAccounts.length !== 0 ? (bankAccounts.map((acc: any) => (
                          <SelectItem key={acc._id} value={acc._id}>
                            {acc.bankName}
                          </SelectItem>

                        ))) : (
                          <p >
                            No Bank Accounts Available. Please Add Bank Account
                          </p>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedBankAccount && (
                      <div className="border rounded-lg mt-2 p-4 bg-gray-50 text-sm space-y-1">
                        <p><strong>Bank:</strong> {selectedBankAccount.bankName}</p>
                        <p><strong>Account Name:</strong> {selectedBankAccount.accountName}</p>
                        <p><strong>Account Number:</strong> {selectedBankAccount.accountNumber}</p>
                        <p><strong>IFSC:</strong> {selectedBankAccount.ifscCode}</p>
                        <p><strong>Branch:</strong> {selectedBankAccount.branchName}</p>

                        {selectedBankAccount.upiId && (
                          <p><strong>UPI ID:</strong> {selectedBankAccount.upiId}</p>
                        )}
                        {selectedBankAccount?.upiScanner && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">UPI QR Code</p>
                            <img
                              src={selectedBankAccount.upiScanner}
                              alt="UPI Scanner"
                              className="h-40 w-40 object-contain border rounded"
                            />
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                  {/* Terms */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Terms & Conditions</label>

                    <div className="[&_.ql-editor]:min-h-[150px]">
                      <ReactQuill
                        theme="snow"
                        value={availableTerms}
                        onChange={setAvailableTerms}
                        placeholder="Enter terms and conditions..."
                      />
                    </div>
                  </div>
                </div>

                <div className="fixed flex left-6 bottom-2 justify-end gap-2">
                  <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
                    Cancel
                  </Button>

                  <Button
                    className="bg-green-600"
                    disabled={loading}
                    onClick={handleConvertToInvoice}
                  >
                    {loading ? "Creating..." : "Create Invoice"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>


          </div>

          {/* ---------------- PAGINATION ---------------- */}
          <div className="flex justify-end items-center gap-3 mt-4">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- ACCEPT DIALOG ---------------- */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
            <DialogDescription>
              Confirm acceptance to convert this quotation into a receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <label className="text-sm font-medium">Accepted Date</label>
            <Input type="date" value={acceptedDate} onChange={(e) => setAcceptedDate(e.target.value)} />

            {selectedQuotation && (
              <div className="p-4 bg-gray-100 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Quotation:</span>
                  <span className="font-medium">{selectedQuotation.quotationNumber}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Client:</span>
                  <span className="font-medium">{selectedQuotation.clientName}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Amount:</span>
                  <span className="font-medium">
                    ₹{(selectedQuotation.grandTotal || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>Cancel</Button>
            <Button className="bg-green-600" onClick={confirmAcceptance}>
              Confirm Acceptance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
