"use client"

import { useUser } from "@/components/auth/user-context"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api-client"
import { Client, Item, Quotation, TaxRate } from "@/lib/models/types"
import { Textarea } from "@/components/ui/textarea"
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })
import "react-quill/dist/quill.snow.css"
import { OwnSearchableSelect } from "@/components/searchableSelect"

function numberToIndianCurrencyWords(amount: number): string {
  if (isNaN(amount)) return "";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty",
    "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const convertBelowThousand = (num: number): string => {
    let str = "";

    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }

    if (num > 0) {
      str += ones[num] + " ";
    }

    return str.trim();
  };

  const convert = (num: number): string => {
    if (num === 0) return "Zero";

    let result = "";

    if (Math.floor(num / 10000000) > 0) {
      result += convertBelowThousand(Math.floor(num / 10000000)) + " Crore ";
      num %= 10000000;
    }

    if (Math.floor(num / 100000) > 0) {
      result += convertBelowThousand(Math.floor(num / 100000)) + " Lakh ";
      num %= 100000;
    }

    if (Math.floor(num / 1000) > 0) {
      result += convertBelowThousand(Math.floor(num / 1000)) + " Thousand ";
      num %= 1000;
    }

    if (num > 0) {
      result += convertBelowThousand(num);
    }

    return result.trim();
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = convert(rupees) + " Rupees";

  if (paise > 0) {
    words += " and " + convert(paise) + " Paise";
  }

  words += " Only";

  return words;
}
interface QuotationItem {
  id: string
  type: "product" | "service"
  itemName: string
  description: string
  quantity: number
  price: number
  discount: number
  amount: number
  taxName: string
  taxRate: number
  taxAmount: number
  total: number
  cgst: number,
  sgst: number,
  igst: number,
  itemId: string
}
interface MasterItem {
  id: string
  type: "product" | "service"
  itemName: string
  description: string
  price: number
  taxName: string
  taxRate: number
  cgst?: number
  sgst?: number
  igst?: number
}
export default function NewSalesInvoicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const editId = searchParams.get("id")
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("quotation")
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null)
  const [errors, setErrors] = useState<any>({})
  // Data
  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: "1",
      type: "product",
      itemName: "",
      description: "",
      quantity: 1,
      price: 0,
      discount: 0,
      amount: 0,
      taxName: "",
      taxRate: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      itemId: "",
      taxAmount: 0,
      total: 0,
    },
  ])
  const [bankAccounts, setBankAccounts] = useState<any>([]);
  const [sellerState, setSellerState] = useState("")
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [availableTerms, setAvailableTerms] = useState<any[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [masterItems, setMasterItems] = useState<MasterItem[]>([])
  // Scenario 1: From Quotation
  const [selectedQuotationId, setSelectedQuotationId] = useState("")
  const [quotationDetails, setQuotationDetails] = useState<Quotation | null>(null)
  const [terms, setTerms] = useState("")
  const [invoiceDescription, setInvoiceDescription] = useState("")
  const [companyName, setCompanyName] = useState("")
  // Scenario 2: Direct Invoice
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null)
  const [itemToAdd, setItemToAdd] = useState<Array<{
    itemId: string
    itemName: string
    quantity: number
    price: number
    discount: number
    type: string
    taxName: string
    cgst: number
    sgst: number
    igst: number
    taxRate: number
    taxAmount: number
    amount: number
    description?: string
    total: number
  }>>([])
  const [invoiceItems, setInvoiceItems] = useState<Array<{
    itemId: string
    itemName: string
    quantity: number
    price: number
    discount: number
    type: string
    taxName: string
    cgst: number
    sgst: number
    igst: number
    taxRate: number
    taxAmount: number
    amount: number
    description?: string
    total: number
  }>>([])
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [loadingClients, setLoadingClients] = useState(false);
  useEffect(() => {
    loadData()
    if (editId) {
      loadInvoiceForEdit(editId)
    }
  }, [])
  useEffect(() => {
    if (user?.name) {
      setCompanyName(user.name)
    }
  }, [user])
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c._id === selectedClientId)
      setSelectedClientDetails(client || null)
    } else {
      setSelectedClientDetails(null)
    }
  }, [selectedClientId, clients])

  const loadData = async () => {
    try {
      const [clientsData, itemsData, quotationsData, taxRatesData, bankAccountsData, companyData] = await Promise.all([
        api.clients.getAll(),
        api.items.getAll(),
        api.quotations.getAll(),
        api.taxRates.getAll(),
        api.bankAccounts.getAll(),
        fetch("/api/company").then((res) => res.json()),
      ])

      setClients(clientsData.filter((c: any) => c.status === "active"))
      setMasterItems(itemsData.filter((i: any) => i.isActive))
      setQuotations(quotationsData.filter((q: any) => q.isActive === "active" && q.status === "accepted"))
      setTaxRates(taxRatesData || [])
      setBankAccounts(bankAccountsData.filter((eachItem: any) => (eachItem.isActive === true)))
      if (companyData?.company) {
        // setCompanyName(companyData.company.companyName || companyData.company.name || "")
        setSellerState(companyData.company.state || "")
      }

      // Fetch default terms
      const termsRes = await fetch("/api/terms?type=invoice")
      if (termsRes) {
        const termsData = await termsRes.json()
        const formattedTerms = termsData
          .filter((t: any) => t.isActive)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          .map((t: any) => (t.title ? `<p><strong>${t.title}</strong></p>${t.content}` : t.content))
          .join("")
        setTerms(formattedTerms)
      }

    } catch (error) {
      console.error("Error loading data:", error)
      toast({ title: "Error", description: "Failed to load initial data", variant: "destructive" })
    }
  }
  const validateDirectInvoice = () => {
    const newErrors: any = {}

    if (!invoiceDate) {
      newErrors.invoiceDate = "Invoice date is required"
    }

    if (!dueDate) {
      newErrors.dueDate = "Due date is required"
    }

    if (!selectedBankAccount) {
      newErrors.bank = "Bank account is required"
    }

    if (!selectedClientId) {
      newErrors.client = "Client is required"
    }

    const validItems = items.filter(
      (item) =>
        item.itemName &&
        item.quantity > 0 &&
        item.price > 0
    )

    if (validItems.length === 0) {
      newErrors.items = "At least one valid item is required"
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }
  const loadInvoiceForEdit = async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/salesInvoice/${id}`)
      const result = await res.json()

      if (result.success) {
        const invoice = result.data
        setIsEditing(true)
        setActiveTab("direct")
        setSelectedClientId(invoice.clientId)
        setInvoiceDate(new Date(invoice.date).toISOString().split("T")[0])
        if (invoice.dueDate) {
          setDueDate(new Date(invoice.dueDate).toISOString().split("T")[0])
        }
        setTerms(invoice.terms || "")
        setInvoiceItems(invoice.items.map((item: any) => ({
          itemId: item.itemId || item._id, // Handle potential difference in ID field
          itemName: item.itemName,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          taxRate: item.taxRate,
          taxName: item.taxName,
          taxAmount: item.taxAmount,
          amount: item.amount,
          cgst: item.cgst || 0,
          sgst: item.sgst || 0,
          igst: item.igst || 0,
          total: item.total
        })))
      }
    } catch (error) {
      console.error("Error loading invoice for edit:", error)
      toast({ title: "Error", description: "Failed to load invoice details", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Handle Quotation Selection
  const handleQuotationSelect = (quotationId: string) => {
    setSelectedQuotationId(quotationId)
    const quotation = quotations.find(q => q._id === quotationId)
    if (quotation) {
      setQuotationDetails(quotation)
      // if (quotation.terms) {
      //   setTerms(quotation.terms)
      // }
    }
  }

  // const handleTermSelect = (termId: string) => {
  //   const term = availableTerms.find(t => t._id === termId)
  //   if (term) {
  //     setTerms(term.content) // ✅ keep HTML
  //   }
  // }
  // Recalculate taxes when client (and thus state) changes
  useEffect(() => {
    if (selectedClientId && sellerState) {
      const buyer = clients.find((c) => c._id === selectedClientId)
      const buyerState = buyer?.state || ""

      if (buyerState) {
        setItems((prevItems) =>
          prevItems.map((item) => {
            if (!item.itemName) return item
            const masterItem = masterItems.find((i) => i.name === item.itemName)
            if (!masterItem) return item

            const isSameState = sellerState.toLowerCase() === buyerState.toLowerCase()
            const newItem = { ...item }

            if (isSameState) {
              newItem.cgst = masterItem.cgst || 0
              newItem.sgst = masterItem.sgst || 0
              newItem.igst = 0
              newItem.taxRate = (masterItem.cgst || 0) + (masterItem.sgst || 0)
              newItem.taxName = "CGST + SGST"
            } else {
              newItem.cgst = 0
              newItem.sgst = 0
              newItem.igst = masterItem.igst || (masterItem.cgst || 0) + (masterItem.sgst || 0)
              newItem.taxRate = newItem.igst
              newItem.taxName = "IGST"
            }

            newItem.amount = (newItem.price - newItem.discount) * newItem.quantity
            newItem.taxAmount = (newItem.amount * newItem.taxRate) / 100
            newItem.total = newItem.amount + newItem.taxAmount
            return newItem
          })
        )
      }
    }
  }, [selectedClientId, sellerState, clients, masterItems])

  // Handle Item Addition for Direct Invoice
  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      type: "product",
      itemId: "",
      itemName: "",
      description: "",
      quantity: 1,
      price: 0,
      discount: 0,
      amount: 0,
      taxName: "",
      taxRate: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      taxAmount: 0,
      total: 0,
    }
    setItems([...items, newItem])
  }

  const handleUpdateItem = (id: string, field: keyof QuotationItem, value: string | number) => {
    console.log("Selected Item Id is:::", id)
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          if (field === "type") {
            updatedItem.itemName = ""
            updatedItem.description = ""
            updatedItem.price = 0
            updatedItem.taxName = ""
            updatedItem.taxRate = 0
          }

          if (field === "itemName") {
            const masterItem = masterItems.find((i) => i.name === value)

            if (masterItem) {
              updatedItem.description = masterItem.description
              updatedItem.price = masterItem.price
              updatedItem.itemId = masterItem._id;

              if (masterItem) {

                // 🔹 Fetch seller & buyer states
                const buyer = clients.find(c => c._id === selectedClientId)
                const buyerState = buyer?.state || ""

                // 🔹 Same state → CGST + SGST
                if (sellerState && buyerState && sellerState.toLowerCase() === buyerState.toLowerCase()) {
                  updatedItem.cgst = masterItem.cgst || 0
                  updatedItem.sgst = masterItem.sgst || 0
                  updatedItem.igst = 0

                  updatedItem.taxRate = (masterItem.cgst || 0) + (masterItem.sgst || 0)
                  updatedItem.taxName = "CGST + SGST"
                }
                // 🔹 Different state → IGST
                else {
                  updatedItem.cgst = 0
                  updatedItem.sgst = 0
                  updatedItem.igst = masterItem.igst || ((masterItem.cgst || 0) + (masterItem.sgst || 0))

                  updatedItem.taxRate = updatedItem.igst
                  updatedItem.taxName = "IGST"
                }

              } else {

                updatedItem.cgst = 0
                updatedItem.sgst = 0
                updatedItem.igst = 0
                updatedItem.taxRate = 0
                updatedItem.taxName = ""
              }

            }
          }

          if (field === "cgst" || field === "sgst" || field === "igst") {
            updatedItem.taxRate = (Number(updatedItem.cgst) || 0) + (Number(updatedItem.sgst) || 0) + (Number(updatedItem.igst) || 0)

            const taxParts = []
            if (updatedItem.cgst) taxParts.push(`CGST (${updatedItem.cgst}%)`)
            if (updatedItem.sgst) taxParts.push(`SGST (${updatedItem.sgst}%)`)
            if (updatedItem.igst) taxParts.push(`IGST (${updatedItem.igst}%)`)
            updatedItem.taxName = taxParts.join(" + ")
          }

          updatedItem.amount = (updatedItem.price - updatedItem.discount) * updatedItem.quantity
          updatedItem.taxAmount = (updatedItem.amount * updatedItem.taxRate) / 100
          updatedItem.total = updatedItem.amount + updatedItem.taxAmount


          return updatedItem
        }
        return item
      }),
    )
  }

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const calculateTotals = (itemsList: any[]) => {
    const subtotal = itemsList.reduce((sum, item) => sum + (item.total), 0);
    const totalDiscount = itemsList.reduce((sum, item) => sum + ((item.discount * item.quantity) || 0), 0);
    const taxAmount = itemsList.reduce((sum, item) => {
      const taxRate = (item.cgst + item.sgst + item.igst) || 0;
      const taxAmount = (item.price - item.discount || 0) * (taxRate / 100);
      return sum + (item.taxAmount || taxAmount || 0);
    }, 0);
    const total = subtotal + taxAmount;
    return { subtotal, totalDiscount, taxAmount, total };
  }
  useEffect(() => {
    if (!invoiceDate) return

    const selectedDate = new Date(invoiceDate)
    selectedDate.setDate(selectedDate.getDate() + 7)

    const formatted = selectedDate.toISOString().split("T")[0]

    setDueDate(formatted)
  }, [invoiceDate])
  const validateQuotationInvoice = () => {
  const newErrors: any = {}

  if (!selectedQuotationId) {
    newErrors.quotation = "Please select a quotation"
  }

  if (!invoiceDate) {
    newErrors.invoiceDate = "Invoice date is required"
  }

  if (!dueDate) {
    newErrors.dueDate = "Due date is required"
  }

  if (invoiceDate && dueDate) {
    const inv = new Date(invoiceDate)
    const due = new Date(dueDate)

    if (due < inv) {
      newErrors.dueDate = "Due date cannot be before invoice date"
    }
  }

  if (!selectedBankAccount) {
    newErrors.bank = "Bank account is required"
  }

  setErrors(newErrors)

  return Object.keys(newErrors).length === 0
}
  // Create Invoice from Quotation
  const handleCreateFromQuotation = async () => {
      if (!validateQuotationInvoice()) {
    toast({
      title: "Validation Error",
      description: "Please fix required fields",
      variant: "destructive",
    })
    return
  }
    if (!quotationDetails) return

    setLoading(true)
    console.log("quotationDetails", quotationDetails)
    try {
      const payload = {
        // 👇 SALES INVOICE fields ONLY

        invoiceType: "quotation",
        quotationNumber: quotationDetails.quotationNumber,
        clientId: quotationDetails.clientId,
        clientName: quotationDetails.clientName,
        clientAddress: quotationDetails.clientAddress,
        clientContact: quotationDetails.clientContact, // mapping
        clientEmail: quotationDetails.clientEmail,

        items: quotationDetails.items,
        grandTotal: quotationDetails.grandTotal,

        paidAmount: 0,
        balanceAmount: quotationDetails.grandTotal,

        date: new Date().toISOString(),
        status: "not collected",

        terms: terms,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,

        description: invoiceDescription,
        quotationId: quotationDetails._id,
        isActive: "active",
        createdBy: companyName,
        bankDetails: selectedBankAccount,
      }
      console.log("payload", payload)
      const res = await fetch("/api/salesInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create invoice")
      }

      // Optional but recommended
      await api.quotations.update(quotationDetails._id!, {
        status: "invoice created",
        salesInvoiceId: result.data._id.toString(),
        convertedAt: new Date(),
      })

      toast({
        title: "Success",
        description: "Invoice created successfully",
      })
      console.log(result)
      setInvoiceDescription("")
      router.push("/dashboard/salesInvoices")
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update Existing Invoice
  const handleUpdateInvoice = async () => {
    if (!selectedClientId || invoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select client and add items",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const client = clients.find(c => c._id === selectedClientId)
      const directTotals = calculateTotals(invoiceItems)

      const payload = {
        clientId: selectedClientId,
        clientName: client?.name || "",
        clientAddress: client?.address || "",
        clientContact: client?.phone || "",
        clientEmail: client?.email || "",
        items: invoiceItems,
        subtotal: directTotals.subtotal,
        taxAmount: directTotals.taxAmount,
        grandTotal: directTotals.total,
        balanceAmount: directTotals.total, // Note: This resets balance. In a real app, you might want to preserve payments.
        date: new Date(invoiceDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        terms,
        createdBy: companyName,
      }

      const res = await fetch(`/api/salesInvoice/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      toast({ title: "Success", description: "Invoice updated successfully" })
      router.push("/dashboard/salesInvoices")
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to update invoice", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }
  const quotationTotal = items.reduce((sum, item) => sum + item.total, 0)
  // Create Direct Invoice
  const handleCreateDirect = async () => {
    if (!validateDirectInvoice()) {
      toast({
        title: "Validation Error",
        description: "Please fix required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const client = clients.find(c => c._id === selectedClientId)
      const directTotals = calculateTotals(invoiceItems)

      const payload = {
        invoiceType: "direct",

        // ❌ no quotation fields
        quotationId: undefined,
        quotationNumber: undefined,

        clientId: selectedClientId,
        clientName: client?.name || "",
        clientAddress: `${client?.address}, ${client?.city}, ${client?.state}, ${client?.pincode}` || "",
        clientContact: client?.phone || "",
        clientEmail: client?.email || "",

        items: items.map((item) => ({
          type: item.type,
          itemName: item.itemName,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          itemId: item.itemId,
          taxName: item.taxName,
          taxRate: item.taxRate,
          total: item.total,
          amount: item.amount || (item.price - item.discount) * item.quantity,
          taxAmount: item.taxAmount || (item.amount * item.taxRate) / 100 || ((item.price - item.discount) * item.taxRate / 100) * item.quantity,
        })),

        grandTotal: quotationTotal,
        paidAmount: 0,
        balanceAmount: quotationTotal,
        description: invoiceDescription,
        date: new Date(invoiceDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: "not collected",
        terms,
        createdBy: companyName,
        isActive: "active",
        bankDetails: selectedBankAccount,
      }

      const res = await fetch("/api/salesInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create invoice")
      }

      toast({
        title: "Success",
        description: "Invoice created successfully",
      })
      setInvoiceDescription("")
      router.push("/dashboard/salesInvoices")
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const directTotals = calculateTotals(invoiceItems)
  const quotationOptions = quotations.map((q) => ({
    value: q._id,
    label: `${q.quotationNumber} - ${q.clientName}`,
    quotationNumber: q.quotationNumber,
    email: q.clientEmail,
    phone: q.clientContact,
  }));
  // Transform your backend array exactly as before
  const clientOptions = clients.map((c) => ({
    value: String(c._id),
    label: c.clientName || c.name || "Unnamed",
    email: c.email,
    phone: c.phone,
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard/salesInvoices")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Sales Invoice" : "Create Sales Invoice"}</CardTitle>
          <CardDescription>{isEditing ? "Update invoice details" : "Create a new invoice from quotation or directly"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quotation" disabled={isEditing}>From Quotation</TabsTrigger>
              <TabsTrigger value="direct">New Invoice</TabsTrigger>
            </TabsList>

            {/* FROM QUOTATION TAB */}
            <TabsContent value="quotation" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex flex-row gap-4">
                  <div className="w-full">
                    <Label required>Select Quotation</Label>
                    {/* <Select value={selectedQuotationId} onValueChange={handleQuotationSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a quotation" />
                      </SelectTrigger>
                      <SelectContent>
                        {quotations.length > 0 ? (
                          quotations.map((q) => (
                            <SelectItem key={q._id} value={q._id!}>
                              {q.quotationNumber} - {q.clientName} - ₹{q.grandTotal}
                            </SelectItem>
                          ))) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No pending quotation found
                          </div>
                        )}
                      </SelectContent>
                    </Select> */}
                    <OwnSearchableSelect
                      options={quotationOptions}
                      value={selectedQuotationId}
                      onValueChange={handleQuotationSelect}
                      placeholder="Search by quotation no, client, email, or phone..."
                      emptyText="No quotations found"
                    />
                    {errors.quotation && (
  <p className="text-red-500 text-xs mt-1">
    {errors.quotation}
  </p>
)}
                  </div>
                  <div className="flex flex-row gap-4 w-full">
                    <div>
                      <Label required>Invoice Date</Label>
                      <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                      {errors.invoiceDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.invoiceDate}</p>
                      )}
                    </div>
                    <div>
                      <Label required>Due Date</Label>
                      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                      {errors.dueDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
                      )}
                    </div>
                    <div>
                      <Label>Created By</Label>
                      <Input value={companyName} readOnly className="bg-gray-100" />
                    </div>
                  </div>
                </div>
                {quotationDetails && (
                  <div className="border rounded-lg p-4 space-y-2 bg-gray-50">
                    <h3 className="font-semibold">Quotation Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Client: {quotationDetails.clientName}</div>
                      <div>Date: {new Date(quotationDetails.date).toLocaleDateString()}</div>
                      <div>Total Amount: ₹{quotationDetails.grandTotal.toLocaleString()}</div>
                      <div>Items: {quotationDetails.items.length}</div>
                      <div>Amount In Words : {numberToIndianCurrencyWords(quotationDetails.grandTotal)}</div>
                    </div>
                  </div>
                )}
                <div>
                  <Label>
                    Bank Account <span className="text-red-500">*</span>
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
                    <SelectContent>
                      {bankAccounts.map((method: any) => (
                        <SelectItem key={method._id} value={method._id}>
                          {method.bankName}
                        </SelectItem>

                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bank && (
                    <p className="text-red-500 text-xs mt-1">{errors.bank}</p>
                  )}
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
                <div>
                  <label className="text-sm font-medium">
                    Invoice Description (Optional)
                  </label>
                  <Input
                    placeholder="Enter description for invoice"
                    value={invoiceDescription}
                    onChange={(e) => setInvoiceDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  {/* <Select onValueChange={handleTermSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms template" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTerms.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}
                  <div className="[&_.ql-editor]:min-h-[150px]">
                    <ReactQuill
                      theme="snow"
                      value={terms}
                      onChange={setTerms}
                      placeholder="No Terms and conditions Found"
                      readOnly={true}
                    />
                  </div>

                </div>

                <Button
                  onClick={handleCreateFromQuotation}
                  disabled={!quotationDetails || loading}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </TabsContent>

            {/* DIRECT INVOICE TAB */}
            <TabsContent value="direct" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>

                    <Label required>Client</Label>
                    {/* <Select value={selectedClientId || ""} onValueChange={setSelectedClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c._id} value={c._id!}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}
                    <OwnSearchableSelect
                      options={clientOptions}
                      value={selectedClientId}
                      onValueChange={setSelectedClientId}
                      placeholder="Search and select a client..."
                      searchPlaceholder="Type to filter..."
                      emptyText={loadingClients ? "Loading clients..." : "No clients found please create a new client."}
                    />
                    {errors.client && (
                      <p className="text-red-500 text-xs mt-1">{errors.client}</p>
                    )}
                  </div>
                  <div className="flex flex-row gap-4">
                    <div>
                      <Label required>Invoice Date</Label>
                      <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                      {errors.invoiceDate && (
  <p className="text-red-500 text-xs mt-1">
    {errors.invoiceDate}
  </p>
)}
                    </div>
                    <div>
                      <Label required>Due Date</Label>
                      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                      {errors.dueDate && (
  <p className="text-red-500 text-xs mt-1">
    {errors.dueDate}
  </p>
)}
                    </div>
                    <div>
                      <Label>Created By</Label>
                      <Input value={companyName} readOnly className="bg-gray-100" />
                    </div>
                  </div>
                </div>

                {selectedClientDetails && (
                  <Card className="mt-4 bg-slate-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Client Details</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Name:</strong> {selectedClientDetails.name}</p>
                      <p><strong>Email:</strong> {selectedClientDetails.email}</p>
                      <p><strong>Phone:</strong> {selectedClientDetails.phone}</p>
                      <p><strong>Address:</strong> {`${selectedClientDetails.address}, ${selectedClientDetails.city}, ${selectedClientDetails.state}, ${selectedClientDetails.pincode}`}</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Items/Services</CardTitle>
                      <Button onClick={handleAddItem} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Item {index + 1}</h4>
                            {items.length > 1 && (
                              <Button
                                onClick={() => handleRemoveItem(item.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label required>Type</Label>
                              <Select
                                value={item.type}
                                onValueChange={(value: "product" | "service") => handleUpdateItem(item.id, "type", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="product">Product</SelectItem>
                                  <SelectItem value="service">Service</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label required>Item Name</Label>
                              <OwnSearchableSelect
                                options={masterItems
                                  .filter((masterItem) => (masterItem.type === item.type && masterItem.isActive === true))
                                  .map((masterItem) => ({
                                    value: masterItem.name,
                                    label: masterItem.name,
                                  }))}
                                value={item.itemName}
                                onValueChange={(value) => handleUpdateItem(item.id, "itemName", value)}
                                placeholder="Search and select an item..."
                                searchPlaceholder="Type to search items..."
                                emptyText={`No ${item.type === "product" ? "products" : "services"} found.`}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Showing {item.type === "product" ? "products" : "services"} only
                              </p>
                              {errors.items && (
                                <p className="text-red-500 text-sm mt-2">{errors.items}</p>
                              )}
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={item.description}
                                onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                                placeholder="Item description"
                                rows={2}
                                className="bg-white"
                                disabled
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {item.type === "product" && (
                                <div>
                                  <Label required>Quantity</Label>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                                    min="1"
                                    className="bg-white"
                                  />
                                </div>
                              )}
                              <div>
                                <Label required>Price</Label>
                                <Input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => handleUpdateItem(item.id, "price", Number.parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  disabled
                                  className="bg-white"
                                />
                              </div>
                              <div>
                                <Label>Discount</Label>
                                <Input
                                  type="number"
                                  value={item.discount}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, "discount", Number.parseFloat(e.target.value) || 0)
                                  }
                                  min="0"
                                  step="1"
                                  placeholder="0"
                                  className="bg-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label>CGST (%)</Label>
                                <Select
                                  value={String(item.cgst || 0)}
                                  onValueChange={(v) => handleUpdateItem(item.id, "cgst", Number(v))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select CGST" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* <SelectItem value="0">0%</SelectItem> */}
                                    {taxRates
                                      .filter((r) => r.type === "CGST" && r.isActive)
                                      .map((r) => (
                                        <SelectItem key={r.id || String(r._id)} value={String(r.rate)}>{r.rate}%</SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>SGST (%)</Label>
                                <Select
                                  value={String(item.sgst || 0)}
                                  onValueChange={(v) => handleUpdateItem(item.id, "sgst", Number(v))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select SGST" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* <SelectItem value="0">0%</SelectItem> */}
                                    {taxRates
                                      .filter((r) => r.type === "SGST" && r.isActive)
                                      .map((r) => (
                                        <SelectItem key={r.id || String(r._id)} value={String(r.rate)}>{r.rate}%</SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>IGST (%)</Label>
                                <Select
                                  value={String(item.igst || 0)}
                                  onValueChange={(v) => handleUpdateItem(item.id, "igst", Number(v))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select IGST" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* <SelectItem value="0">0%</SelectItem> */}
                                    {taxRates
                                      .filter((r) => r.type === "IGST" && r.isActive)
                                      .map((r) => (
                                        <SelectItem key={r.id || String(r._id)} value={String(r.rate)}>{r.rate}%</SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>


                            <div className="pt-3 border-t space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Amount:</span>
                                <span className="font-medium"> ₹{item.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax Amount:</span>
                                <span className="font-medium">₹{item.taxAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span>Total:</span>
                                <span className="text-purple-600">₹{item.total.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <div>
                  <Card className="sticky top-6">
                    <CardHeader>
                      <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {items.map(
                        (item, index) =>
                          item.itemName && (
                            <div key={item.id} className="pb-2 border-b">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Item {index + 1}:</span>
                                <span className="font-medium">₹{item.total.toLocaleString()}</span>
                              </div>
                            </div>
                          )
                      )}
                      <div className="pt-2 border-t-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Grand Total:</span>
                          <span className="text-purple-600">₹{quotationTotal.toLocaleString()}</span>
                        </div>
                        {/* AMOUNT IN WORDS */}
                        <p className="mt-2 text-sm text-gray-600 italic">
                          Amount in words:{" "}
                          <span className="font-medium text-gray-800">
                            {numberToIndianCurrencyWords(quotationTotal)}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* {invoiceItems.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold">Items</h3>
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex-1 space-y-2">
                          <div className="font-medium">{item.itemName}</div>
                          <div className="flex gap-2 items-end">
                            <div>
                              <Label className="text-xs font-normal">Quantity</Label>
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => handlehandleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-20 h-12 rounded-lg"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-normal">Price</Label>
                              <Input
                                type="number"
                                placeholder="Price"
                                value={item.price}
                                onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value) || 0)}
                                className="w-24 h-12 rounded-lg"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-normal">Discount (₹)</Label>
                              <Input
                                type="number"
                                placeholder="Discount"
                                value={item.discount}
                                onChange={(e) => handleUpdateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                className="w-24 h-12 rounded-lg"
                              />
                            </div>
                            <div className="flex gap-2">
                              <div>
                                <Label className="text-xs font-normal">CGST</Label>
                                <Select
                                  value={String(item.cgst || 0)}
                                  onValueChange={(v) => handleUpdateItem(index, 'cgst', Number(v))}
                                >
                                  <SelectTrigger className="w-20 h-9">
                                    <SelectValue placeholder="Select CGST" />
                                  </SelectTrigger>
                                  <SelectContent>
                                 
                                    {taxRates
                                      .filter((r) => r.type === "CGST" && r.isActive)
                                      .map((r) => (
                                        <SelectItem key={r.id || String(r._id)} value={String(r.rate)}>{r.rate}%</SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs font-normal">SGST</Label>
                                <Select
                                  value={String(item.sgst || 0)}
                                  onValueChange={(v) => handleUpdateItem(index, 'sgst', Number(v))}
                                >
                                  <SelectTrigger className="w-20 h-9">
                                    <SelectValue placeholder="Select SGST" />
                                  </SelectTrigger>
                                  <SelectContent>
                                
                                    {taxRates
                                      .filter((r) => r.type === "SGST" && r.isActive)
                                      .map((r) => (
                                        <SelectItem key={r.id || String(r._id)} value={String(r.rate)}>{r.rate}%</SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs font-normal">IGST</Label>
                                <Select
                                  value={String(item.igst || 0)}
                                  onValueChange={(v) => handleUpdateItem(index, 'igst', Number(v))}
                                >
                                  <SelectTrigger className="w-20 h-9">
                                    <SelectValue placeholder="Select IGST" />
                                  </SelectTrigger>
                                  <SelectContent>
                          
                                    {taxRates
                                      .filter((r) => r.type === "IGST" && r.isActive)
                                      .map((r) => (
                                        <SelectItem key={r.id || String(r._id)} value={String(r.rate)}>{r.rate}%</SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-[100px] pt-3">
                          <div className="font-semibold">₹{item.total.toFixed(2)}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="mt-4"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}

                    <div className="border-t pt-4 mt-4 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>₹{directTotals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Discount:</span>
                        <span className="text-red-600">- ₹{directTotals.totalDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>₹{directTotals.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                        <span>Grand Total:</span>
                        <span>₹{directTotals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )} */}
                <div>
                  <Label>
                    Bank Account <span className="text-red-500">*</span>
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
                    <SelectContent>
                      {bankAccounts.map((method: any) => (
                        <SelectItem key={method._id} value={method._id}>
                          {method.bankName}
                        </SelectItem>

                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bank && (
  <p className="text-red-500 text-xs mt-1">
    {errors.bank}
  </p>
)}
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
                <div>
                  <label className="text-sm font-medium">
                    Invoice Description (Optional)
                  </label>
                  <Input
                    placeholder="Enter description for invoice"
                    value={invoiceDescription}
                    onChange={(e) => setInvoiceDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  {/* <Select onValueChange={handleTermSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms template" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTerms.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}

                  <div className="[&_.ql-editor]:min-h-[150px]">
                    <ReactQuill
                      theme="snow"
                      value={terms}
                      onChange={setTerms}
                      placeholder="No terms and conditions Found..."
                      readOnly={true}
                    />
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-4">
                </div>

                <Button
                  onClick={isEditing ? handleUpdateInvoice : handleCreateDirect}
                  disabled={loading || !selectedClientId || items.length === 0}
                  className="w-full"
                >
                  {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Invoice" : "Create Invoice")}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
