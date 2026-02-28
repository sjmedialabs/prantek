"use client"

import { useUser } from "@/components/auth/user-context"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Trash2, ArrowLeft, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Client, Item, Quotation, Receipt, TaxRate } from "@/lib/models/types"
import { api } from "@/lib/api-client"
import { OwnSearchableSelect } from "@/components/searchableSelect"
import FileUpload from "@/components/file-upload"

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
  name: string
  description: string
  price: number
  taxName: string
  taxRate: number
  cgst?: number
  sgst?: number
  igst?: number
}
export default function ReceiptsPage() {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [screenshotUrl, setScreenshotUrl] = useState("")
  const [scenario2ScreenshotUrl, setScenario2ScreenshotUrl] = useState("")
  const [scenario3ScreenshotUrl, setScenario3ScreenshotUrl] = useState("")
  // Shared state
  const [salesInvoices, setSalesInvoices] = useState<any[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState("")
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null)
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
  const [loadingClients, setLoadingClients] = useState(false);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [notes, setNotes] = useState("")
  const [masterItems, setMasterItems] = useState<MasterItem[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentType, setPaymentType] = useState<any>("FullPayment")// Ful, Payment or Partial Payment
  const [amountToPay, setAmountToPay] = useState(0)// if partial amount is selected then need to enter amount they paying currently
  // const [paymentMethods, setPaymentMethods] = useState<any>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash")
  const [referenceNumber, setReferenceNumber] = useState("");
  const [bankAccounts, setBankAccounts] = useState<any>([]);
  const [selectedBankAcount, setSelectedBankAccount] = useState<any>();
  // Tab state
  const [activeTab, setActiveTab] = useState("invoice")
  const [advanceReceipts, setAdvanceReceipts] = useState<any[]>([])
  const [selectedAdvanceReceipt, setSelectedAdvanceReceipt] = useState<any>(null)
  const [advanceApplyAmount, setAdvanceApplyAmount] = useState(0)

  // Scenario 2: With Items state
  const [scenario2Client, setScenario2Client] = useState("")
  const [scenario2PaymentMethod, setScenario2PaymentMethod] = useState("cash")
  const [scenario2AmountPaid, setScenario2AmountPaid] = useState("")
  const [scenario2ReferenceNumber, setScenario2ReferenceNumber] = useState("")
  const [scenario2BankAccount, setScenario2BankAccount] = useState<any>(null)
  const [companyName, setCompanyName] = useState("")
  console.log("scenario 2 payment method is::::", scenario2PaymentMethod)
  // Scenario 3: Quick Receipt state
  const [scenario3Client, setScenario3Client] = useState<any>("")
  const [scenario3Amount, setScenario3Amount] = useState("")
  const [scenario3AmountPaid, setScenario3AmountPaid] = useState("")
  const [scenario3PaymentMethod, setScenario3PaymentMethod] = useState("cash")
  const [scenario3ReferenceNumber, setScenario3ReferenceNumber] = useState("");
  const [scenario3BankAccount, setScenario3BankAccount] = useState<any>(null)
  const [sellerState, setSellerState] = useState("")
  // Dialogs
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)

  // Client form
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gst: ""
  })

  // Item form
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    unit: "pcs",
    price: "",
    taxRate: ""
  })

  // Load data
  useEffect(() => {
    loadData()
    loadClients()
    loadCompany()
    loadItems()
    loadSalesInvoices()
    loadPaymentMethods()
    loadAdvanceReceipts()
  }, [])
  const loadAdvanceReceipts = async () => {
    const res = await fetch("/api/receipts")
    const result = await res.json()

    if (result.success) {
      const advances = result.data.filter((r: any) =>
        r.receiptType === "advance" &&
        r.status === ("cleared") &&
        (r.balanceAmount === undefined ? r.ReceiptAmount > 0 : r.balanceAmount > 0)
      )

      setAdvanceReceipts(advances)
    }
  }
  useEffect(() => {
    if (user?.email) {
      setCompanyName(user.email)
    }
  }, [user])
  const loadData = async () => {
    try {
      const [clientsData, itemsData, taxRatesData, bankAccountsData, companyData] = await Promise.all([
        api.clients.getAll(),
        api.items.getAll(),
        api.taxRates.getAll(),
        api.bankAccounts.getAll(),
        fetch("/api/company").then((res) => res.json()),
      ])

      setClients(clientsData.filter((c: any) => c.status === "active"))
      setMasterItems(itemsData.filter((i: any) => i.isActive))
      setTaxRates(taxRatesData || [])
      setBankAccounts(bankAccountsData.filter((eachItem: any) => (eachItem.isActive === true)))
      if (companyData?.company) {
        // setCompanyName(companyData.company.companyName || companyData.company.name || "")
        setSellerState(companyData.company.state || "")
      }

    } catch (error) {
      console.error("Error loading data:", error)
      toast({ title: "Error", description: "Failed to load initial data", variant: "destructive" })
    }
  }
  const loadSalesInvoices = async () => {
    try {
      const res = await fetch("/api/salesInvoice", { credentials: "include" })
      const result = await res.json()

      if (result.success) {
        setSalesInvoices(result.data.filter((i: any) => i.isActive === "active" && i.status !== "collected"))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadCompany = async () => {
    try {
      const response = await fetch("/api/company", { credentials: "include" })
      const result = await response.json()
      // setCompanyName(result.company.companyName || result.company.name || "")
      setSellerState(result.company.state || "")
    }
    catch (error) {
      console.error("Error loading company:", error)
    }
  }


  const loadClients = async () => {
    try {
      const response = await fetch("/api/clients", { credentials: "include" })
      const result = await response.json()
      if (result.success) {
        setClients(result.data)
      }
    } catch (error) {
      console.error("Error loading clients:", error)
    }
  }

  const loadItems = async () => {
    try {
      const response = await fetch("/api/items", { credentials: "include" })
      const result = await response.json()
      if (result.success) {
        // setItems(result.data)
        setMasterItems(result.data.filter((i: any) => i.isActive))
      }
    } catch (error) {
      console.error("Error loading items:", error)
    }
  }

  // const loadQuotations = async () => {
  //   try {
  //     const response = await fetch("/api/quotations", { credentials: "include" })
  //     const result = await response.json()
  //     if (result.success) {
  //       // Only show approved quotations
  //       setQuotations(result.data.filter((q: Quotation) => q.isActive === "active"))
  //     }
  //   } catch (error) {
  //     console.error("Error loading quotations:", error)
  //   }
  // }
  const loadPaymentMethods = async () => {
    const data = await api.paymentMethods.getAll();
    const bankAccountsData = await api.bankAccounts.getAll();

    console.log("bank Accounts Avaible Are:::", bankAccountsData);
    // setPaymentMethods(data.filter((eachItem: any) => (eachItem.isEnabled === true)));
    setBankAccounts(bankAccountsData.filter((eachItem: any) => (eachItem.isActive === true)))
  }
  //  console.log("Avavilbele Payment Methods are:::",paymentMethods)

  // Create client inline
  const handleCreateClient = async () => {
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient)
      })
      const result = await response.json()
      if (result.success) {
        toast({ title: "Success", description: "Client created successfully" })
        setClients([...clients, result.data])
        setShowClientDialog(false)
        setNewClient({
          name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          gst: ""
        })
        // Auto-select the new client
        if (activeTab === "items") {
          setScenario2Client(result.data._id)
        } else if (activeTab === "quick") {
          setScenario3Client(result?.data._id)
        }
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create client", variant: "destructive" })
    }
  }

  // Create item inline
  const handleCreateItem = async () => {
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItem,
          price: parseFloat(newItem.price),
          taxRate: parseFloat(newItem.taxRate)
        })
      })
      const result = await response.json()
      if (result.success) {
        toast({ title: "Success", description: "Item created successfully" })
        setItems([...items, result.data])
        setShowItemDialog(false)
        setNewItem({
          name: "",
          description: "",
          unit: "pcs",
          price: "",
          taxRate: ""
        })
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create item", variant: "destructive" })
    }
  }

  useEffect(() => {
    if (activeTab === 'invoice' && invoiceDetails) {
      const effectiveBalance = invoiceDetails.balanceAmount - (advanceApplyAmount || 0);
      if (paymentType === 'Full Payment') {
        setAmountToPay(effectiveBalance > 0 ? effectiveBalance : 0);
      }
    }
  }, [paymentType, invoiceDetails, advanceApplyAmount, activeTab]);

  // Amount To Pay Handle

  const amountPayHandle = (event: any) => {
    const value = Number(event.target.value) || 0;
    const maxPayable = invoiceDetails ? invoiceDetails.balanceAmount - (advanceApplyAmount || 0) : 0;
    setAmountToPay(value > maxPayable ? maxPayable : value);
  }

  // Scenario 1: Load quotation details
  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoice(invoiceId)

    const invoice = salesInvoices.find((i) => i._id === invoiceId)
    if (invoice) {
      setInvoiceDetails(invoice)
      // Reset advance and payment type, useEffect will handle amountToPay
      setSelectedAdvanceReceipt(null)
      setAdvanceApplyAmount(0)
      setPaymentType("Full Payment")
    }
  }


  // console.log("Selected Bank Account:::",selectedBankAcount);
  // console.log("Quotation Details Are :::", quotationDetails)
  // Scenario 1: Create receipt from quotation
  const handleCreateFromInvoice = async () => {
    if (!invoiceDetails) return

    // if (amountToPay <= 0) {
    //   toast({ title: "Validation Error", description: "Paid amount must be greater than zero.", variant: "destructive" })
    //   return
    // }

    if (selectedPaymentMethod.toLowerCase() !== 'cash') {
      if (!referenceNumber) {
        toast({ title: "Validation Error", description: "Reference number is required for non-cash payments.", variant: "destructive" })
        return
      }
      if (!selectedBankAcount) {
        toast({ title: "Validation Error", description: "Bank account is required for non-cash payments.", variant: "destructive" })
        return
      }
    }

    setLoading(true)

    try {
      const receiptAmount = amountToPay
      const appliedAdvance = advanceApplyAmount || 0

      const invoiceBalance =
        invoiceDetails.balanceAmount -
        receiptAmount -
        appliedAdvance


      const receiptPayload = {
        receiptType: "salesInvoice",
        salesInvoiceNumber: invoiceDetails.salesInvoiceNumber,
        invoiceId: invoiceDetails._id,
        invoiceDate: invoiceDetails.date,

        clientId: invoiceDetails.clientId,
        clientName: invoiceDetails.clientName,
        clientAddress: invoiceDetails.clientAddress,
        clientEmail: invoiceDetails.clientEmail,
        clientContact: invoiceDetails.clientContact,

        items: invoiceDetails.items,

        invoiceAmount: invoiceDetails.subtotal,
        invoicegrandTotal: invoiceDetails.grandTotal,
        invoiceBalance,

        paymentType,
        paymentMethod: selectedPaymentMethod,
        ReceiptAmount: receiptAmount,

        bankDetails: invoiceDetails.bankDetails || selectedBankAcount,
        referenceNumber,
        screenshotUrl,

        status: selectedPaymentMethod.toLowerCase() === "cash" ? "cleared" : "received",
        parentReceiptNumber: selectedAdvanceReceipt?.receiptNumber || null,
        advanceAppliedAmount: advanceApplyAmount || 0,
        createdBy: companyName,
        userId: invoiceDetails.userId,
        notes: notes,
        date: new Date().toISOString()
      }

      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptPayload)
      })

      const result = await res.json()

      await fetch(`/api/salesInvoice/${invoiceDetails._id}`, {
        method: "PUT", // or PATCH depending on your API
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paidAmount: Number(invoiceDetails.paidAmount) + Number(receiptAmount),
          balanceAmount: invoiceBalance,
          status: invoiceBalance <= 0 ? "collected" : "partially collected",
        }),
      })
            await fetch(`/api/receipts/${selectedAdvanceReceipt._id}`, {
        method: "PUT", // or PATCH depending on your API
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          balanceAmount: (selectedAdvanceReceipt.balanceAmount ?? selectedAdvanceReceipt.ReceiptAmount) - advanceApplyAmount,
        }),
      })

      if (selectedAdvanceReceipt) {
        await fetch(`/api/receipts/${selectedAdvanceReceipt._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentReceiptNumber: result.data.receiptNumber
          })
        })
      }

      if (result.success) {
        toast({ title: "Success", description: "Receipt created" })
        router.push("/dashboard/receipts")
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }

    } catch (e) {
      toast({ title: "Error", description: "Failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }


  // Scenario 2: Add item to list

  // Recalculate taxes when client (and thus state) changes
  useEffect(() => {
    if (setScenario2Client && sellerState) {
      const buyer = clients.find((c) => c._id === setScenario2Client)
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
  }, [setScenario2Client, sellerState, clients, masterItems])
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
const isTaxActive = (type: "CGST" | "SGST" | "IGST", rate: number) => {
  return taxRates.some(
    (t) => t.type === type && Number(t.rate) === Number(rate) && t.isActive
  )
}
  // Scenario 2: Update item quantity/price
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
  const masterItem = masterItems.find((i) => i._id === value)

  if (masterItem) {
    updatedItem.description = masterItem.description ?? ""
    updatedItem.price = masterItem.price ?? 0
    updatedItem.itemId = masterItem._id

    const buyer = clients.find(c => c._id === selectedScenario2Client?._id)
    const buyerState = buyer?.state || ""

    let cgst = 0
    let sgst = 0
    let igst = 0

    if (sellerState && buyerState &&
        sellerState.toLowerCase() === buyerState.toLowerCase()) {

      // 🔹 Intra-state → CGST + SGST
      if (masterItem.cgst && isTaxActive("CGST", masterItem.cgst)) {
        cgst = masterItem.cgst
      }

      if (masterItem.sgst && isTaxActive("SGST", masterItem.sgst)) {
        sgst = masterItem.sgst
      }

    } else {

      // 🔹 Inter-state → IGST
      const igstRate =
        masterItem.igst ||
        ((masterItem.cgst || 0) + (masterItem.sgst || 0))

      if (igstRate && isTaxActive("IGST", igstRate)) {
        igst = igstRate
      }
    }

    updatedItem.cgst = cgst
    updatedItem.sgst = sgst
    updatedItem.igst = igst
  }
}

       if (field === "cgst" || field === "sgst" || field === "igst") {

  let cgst = Number(updatedItem.cgst) || 0
  let sgst = Number(updatedItem.sgst) || 0
  let igst = Number(updatedItem.igst) || 0

  // Validate active status again
  if (cgst && !isTaxActive("CGST", cgst)) cgst = 0
  if (sgst && !isTaxActive("SGST", sgst)) sgst = 0
  if (igst && !isTaxActive("IGST", igst)) igst = 0

  updatedItem.cgst = cgst
  updatedItem.sgst = sgst
  updatedItem.igst = igst
}
const taxRate =
  (Number(updatedItem.cgst) || 0) +
  (Number(updatedItem.sgst) || 0) +
  (Number(updatedItem.igst) || 0)

updatedItem.taxRate = taxRate

const taxParts = []
if (updatedItem.cgst) taxParts.push(`CGST (${updatedItem.cgst}%)`)
if (updatedItem.sgst) taxParts.push(`SGST (${updatedItem.sgst}%)`)
if (updatedItem.igst) taxParts.push(`IGST (${updatedItem.igst}%)`)

updatedItem.taxName = taxParts.join(" + ")

updatedItem.amount =
  (Number(updatedItem.price) - Number(updatedItem.discount || 0)) *
  Number(updatedItem.quantity)

updatedItem.taxAmount =
  (updatedItem.amount * taxRate) / 100

updatedItem.total =
  updatedItem.amount + updatedItem.taxAmount


          return updatedItem
        }
   
        return item
      }),
    )
  }

  // Scenario 2: Remove item
  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }
  // Scenario 2: Calculate totals
  const calculateScenario2Totals = (itemsList: any[]) => {
    const subtotal = itemsList.reduce((sum, item) => sum + (item.amount), 0);
    const totalDiscount = itemsList.reduce((sum, item) => sum + ((item.discount * item.quantity) || 0), 0);
    const taxAmount = itemsList.reduce((sum, item) => {
      const taxRate = (item.cgst + item.sgst + item.igst) || 0;
      const taxAmount = (item.price - item.discount || 0) * (taxRate / 100);
      return sum + (item.taxAmount || taxAmount || 0);
    }, 0);
    const total = subtotal + taxAmount;
    return { subtotal, totalDiscount, taxAmount, total };
  }
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0)
  // Scenario 2: Create receipt with items
  const handleCreateWithItems = async () => {
    if (!scenario2Client || items.length === 0) {
      toast({ title: "Error", description: "Please select client and add items", variant: "destructive" })
      return
    }

    const { subtotal, taxAmount, total } = calculateScenario2Totals(items)
    const amountPaid = total - (advanceApplyAmount || 0)

    if (amountPaid <= 0 && (advanceApplyAmount || 0) <= 0) {
      toast({ title: "Validation Error", description: "Amount paid must be greater than zero.", variant: "destructive" })
      return
    }

    if (amountPaid > 0 && scenario2PaymentMethod.toLowerCase() !== 'cash') {
      if (!scenario2ReferenceNumber) {
        toast({ title: "Validation Error", description: "Reference number is required for non-cash payments.", variant: "destructive" })
        return
      }
      if (!selectedAccount) {
        toast({ title: "Validation Error", description: "Bank account is required for non-cash payments.", variant: "destructive" })
        return
      }
    }

    setLoading(true)
    try {
      const client = clients.find(c => c._id === scenario2Client)

      const receiptData = {
        receiptType: "nonInvoiced",
        clientId: scenario2Client,
        clientName: client?.name || "",
        clientEmail: client?.email || "",
        clientContact: client?.phone || "",
        clientAddress: `${client?.address}, ${client?.city}, ${client?.state}, ${client?.pincode}` || "",
        items: items,
        subtotal,
        taxAmount,
        total,
        ReceiptAmount: amountPaid,
        balanceAmount: 0,
        paymentType: "Full Payment",
        paymentMethod: scenario2PaymentMethod,
        referenceNumber: scenario2ReferenceNumber,
        screenshotUrl: scenario2ScreenshotUrl,
        bankDetails: selectedAccount,
        parentReceiptNumber: selectedAdvanceReceipt?.receiptNumber || null,
        advanceAppliedAmount: advanceApplyAmount || 0,
        date: new Date().toISOString(),
        status: `${scenario2PaymentMethod.trim().toLowerCase() === "cash" ? "cleared" : "received"}`,
        notes: notes,
        createdBy: companyName
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData)
      })

      const result = await response.json()
      if (selectedAdvanceReceipt) {
        await fetch(`/api/receipts/${selectedAdvanceReceipt._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentReceiptNumber: result.data.receiptNumber,
            balanceAmount: (selectedAdvanceReceipt.balanceAmount ?? selectedAdvanceReceipt.ReceiptAmount) - advanceApplyAmount
          })
        })
      }

      if (result.success) {
        toast({ title: "Success", description: "Receipt created successfully" })
        router.push("/dashboard/receipts")
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create receipt", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Scenario 3: Create quick receipt
  const handleCreateQuickReceipt = async () => {
    if (!scenario3Client) {
      toast({ title: "Error", description: "Please select clienT", variant: "destructive" })
      return
    }

    const amountPaid = parseFloat(scenario3AmountPaid) || 0
    if (amountPaid <= 0) {
      toast({ title: "Validation Error", description: "Amount paid must be greater than zero.", variant: "destructive" })
      return
    }

    if (scenario3PaymentMethod.toLowerCase() !== 'cash') {
      if (!scenario3ReferenceNumber) {
        toast({ title: "Validation Error", description: "Reference number is required for non-cash payments.", variant: "destructive" })
        return
      }
      if (!selectedAccount) {
        toast({ title: "Validation Error", description: "Bank account is required for non-cash payments.", variant: "destructive" })
        return
      }
    }

    setLoading(true)
    try {
      const totalAmount = parseFloat(scenario3Amount)
      const amountPaid = parseFloat(scenario3AmountPaid) || 0
      const client = clients.find(c => c._id === scenario3Client)

      const receiptData = {
        receiptType: "quick",
        clientId: scenario3Client,
        clientName: client?.name || "",
        clientEmail: client?.email || "",
        clientContact: client?.phone || "",
        clientAddress: `${client?.address}, ${client?.city}, ${client?.state}, ${client?.pincode}` || "",
        items: [],
        // subtotal: totalAmount,
        taxAmount: 0,
        // total: totalAmount,
        ReceiptAmount: amountPaid,
        // balanceAmount: totalAmount - amountPaid,
        paymentType: amountPaid < totalAmount ? "Partial Payment" : "Full Payment",
        paymentMethod: scenario3PaymentMethod,
        bankDetails: selectedAccount,
        screenshotUrl: scenario3ScreenshotUrl,
        referenceNumber: scenario3ReferenceNumber,
        date: new Date().toISOString(),
        status: `${scenario3PaymentMethod.trim().toLowerCase() === "cash" ? "cleared" : "received"}`,
        notes: notes,
        createdBy: companyName
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData)
      })

      const result = await response.json()
      if (result.success) {
        toast({ title: "Success", description: "Receipt created successfully" })
        router.push("/dashboard/receipts")
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create receipt", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Scenario 4: Create advance receipt
  const handleCreateAdvanceReceipt = async () => {
    if (!scenario3Client) {
      toast({ title: "Error", description: "Please select client", variant: "destructive" })
      return
    }

    const amountPaid = parseFloat(scenario3AmountPaid) || 0
    if (amountPaid <= 0) {
      toast({ title: "Validation Error", description: "Amount paid must be greater than zero.", variant: "destructive" })
      return
    }

    if (scenario3PaymentMethod.toLowerCase() !== 'cash') {
      if (!scenario3ReferenceNumber) {
        toast({ title: "Validation Error", description: "Reference number is required for non-cash payments.", variant: "destructive" })
        return
      }
      if (!selectedAccount) {
        toast({ title: "Validation Error", description: "Bank account is required for non-cash payments.", variant: "destructive" })
        return
      }
    }

    setLoading(true)
    try {

      const amountPaid = parseFloat(scenario3AmountPaid) || 0
      const client = clients.find(c => c._id === scenario3Client)

      const receiptData = {
        receiptType: "advance",
        clientId: scenario3Client,
        clientName: client?.name || "",
        clientEmail: client?.email || "",
        clientContact: client?.phone || "",
        clientAddress: `${client?.address}, ${client?.city}, ${client?.state}, ${client?.pincode}` || "",
        items: [],
        // subtotal: totalAmount,
        taxAmount: 0,
        // total: totalAmount,
        ReceiptAmount: amountPaid,
        balanceAmount: amountPaid,
        paymentType: "Advance Payment",
        paymentMethod: scenario3PaymentMethod,
        bankDetails: selectedAccount,
        screenshotUrl: scenario3ScreenshotUrl,
        referenceNumber: scenario3ReferenceNumber,
        date: new Date().toISOString(),
        status: `${scenario3PaymentMethod.trim().toLowerCase() === "cash" ? "cleared" : "received"}`,
        notes: notes,
        createdBy: companyName
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData)
      })

      const result = await response.json()
      if (result.success) {
        toast({ title: "Success", description: "Receipt created successfully" })
        router.push("/dashboard/receipts")
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create receipt", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const quotationOptions = salesInvoices.map((q: any) => ({
    value: q._id,
    label: `${q.salesInvoiceNumber} - ${q.clientName}`,
    quotationNumber: q.salesInvoiceNumber,
    email: q.clientEmail,
    phone: q.clientContact,
  }));
  const clientOptions = clients.map((c) => ({
    value: String(c._id),
    label: c.clientName || c.name || "Unnamed",
    email: c.email,
    phone: c.phone,
  }));
  const selectedScenario2Client =
    clients.find((c) => c._id === scenario2Client) || null;
      const selectedScenario3Client =
    clients.find((c) => c._id === scenario3Client) || null;
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard/receipts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Receipts
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Receipt</CardTitle>
          <CardDescription>Choose how you want to create a receipt</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="invoice">From SalesInvoice</TabsTrigger>
              <TabsTrigger value="nonInvoiced">Non Invoiced Receipt</TabsTrigger>
              <TabsTrigger value="quick">Non Item Receipt</TabsTrigger>
              <TabsTrigger value="advance">Advance Receipt</TabsTrigger>
            </TabsList>

            {/* Scenario 1: From SalesInvoice */}
            <TabsContent value="invoice" className="space-y-4">
              <div className="space-y-4">
                <div className="flex flex-row gap-2">
                <div className="w-full">
                  <Label>Select SalesInvoice</Label>
                  {/* <Select value={selectedInvoice} onValueChange={handleInvoiceSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesInvoices.map((inv) => (
                        <SelectItem key={inv._id} value={inv._id}>
                          {inv.salesInvoiceNumber} - {inv.clientName} - ₹{inv.balanceAmount}
                        </SelectItem>
                      ))}

                    </SelectContent>
                  </Select> */}
                  <OwnSearchableSelect
                    options={quotationOptions}
                    value={selectedInvoice}
                    onValueChange={handleInvoiceSelect}
                    placeholder="Search by Sales Invoice No. no, client, email, or phone..."
                    emptyText="No invoice found"
                  />
                </div>
                <div className="w-full">
                    <Label>Created By</Label>
                    <Input value={companyName} readOnly className="bg-gray-100" />
                  </div></div>
                {advanceReceipts.filter(adv => !invoiceDetails || adv.clientId === invoiceDetails.clientId).length > 0 && (
                  <div>
                    <Label>Apply Advance Receipt</Label>

                    <Select
                      value={selectedAdvanceReceipt?._id}
                      onValueChange={(id) => {
                        const adv = advanceReceipts.find(r => r._id === id)
                        setSelectedAdvanceReceipt(adv)
                        const balance = invoiceDetails?.balanceAmount || Infinity
                        const amount = adv?.balanceAmount ?? adv?.ReceiptAmount ?? 0
                        setAdvanceApplyAmount(amount > balance ? balance : amount)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select advance receipt" />
                      </SelectTrigger>

                      <SelectContent>
                        {advanceReceipts.filter(adv => !invoiceDetails || adv.clientId === invoiceDetails.clientId).map((adv) => (
                          <SelectItem key={adv._id} value={adv._id}>
                            {adv.receiptNumber}:{adv.clientName} — ₹{adv.balanceAmount ?? adv.ReceiptAmount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedAdvanceReceipt && (
                  <div>
                    <Label>Advance Apply Amount</Label>

                    <Input
                      type="number"
                      value={advanceApplyAmount}
                      max={selectedAdvanceReceipt.balanceAmount ?? selectedAdvanceReceipt.ReceiptAmount}
                      onChange={(e) =>
                        setAdvanceApplyAmount(
                          Math.min(
                            Number(e.target.value),
                            selectedAdvanceReceipt.balanceAmount ?? selectedAdvanceReceipt.ReceiptAmount,
                            invoiceDetails?.balanceAmount || Infinity
                          )
                        )
                      }
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      Max: ₹{Math.min(selectedAdvanceReceipt.balanceAmount ?? selectedAdvanceReceipt.ReceiptAmount, invoiceDetails?.balanceAmount || Infinity)}
                    </p>
                  </div>
                )}

                <div>
                  <Label>
                    Select payment Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={paymentType}
                    onValueChange={(value: "Full Payment" | "Partial Payment") =>
                      setPaymentType(value)
                    }
                  >

                    <SelectTrigger>
                      <SelectValue placeholder="Select FullPayment/Partial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Payment">Full Payment</SelectItem>
                      <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedPaymentMethod}
                    onValueChange={(value) => setSelectedPaymentMethod(value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>

                      <SelectItem value="cash">
                        Cash
                      </SelectItem>
                      <SelectItem value="upi">
                        UPI
                      </SelectItem>
                       <SelectItem value="card">
                       Card
                      </SelectItem>
                      <SelectItem value="cheque">
                        Cheque
                      </SelectItem>
                      <SelectItem value="bankTransfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="other">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>

                </div>
                <div>
                  {paymentType === "Partial Payment" && (
                    <div>
                      <Label>Enter Your Amount</Label>
                      <Input
                        value={amountToPay}
                        type="number"
                        min="1"
                        onChange={amountPayHandle}
                        placeholder="Enter Your Amount"
                      />
                    </div>
                  )}
                </div>
                {selectedPaymentMethod.trim().toLowerCase() != "cash" && (
                  <div className="space-y-4">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Label>Reference Number </Label>
                      <Input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => (setReferenceNumber(e.target.value))}
                        placeholder="Enter Your Reference Number"
                        required />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="paymentMethod">
                        Bank Account <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedBankAcount}
                        onValueChange={(value) => setSelectedBankAccount(value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Bank Accounts" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((method: any) => (
                            <SelectItem key={method._id} value={method._id}>
                              {method.bankName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Payment Screenshot</Label>
                    <FileUpload value={screenshotUrl} onChange={setScreenshotUrl} />
                  </div>
                  </div>
                )}
                {invoiceDetails && (
                  <div className="border rounded-lg p-4 space-y-2 bg-gray-50">
                    <h3 className="font-semibold">Invoice Details</h3>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Client: {invoiceDetails.clientName}</div>
                      <div>Email: {invoiceDetails.clientEmail}</div>
                      <div>Contact: {invoiceDetails.clientContact}</div>
                      <div>Address: {invoiceDetails.clientAddress}</div>
                      <div>Invoice: {invoiceDetails.salesInvoiceNumber}</div>
                      <div>Original Invoice Total: ₹{invoiceDetails.grandTotal?.toLocaleString()}</div>
                      <div>Current Balance: ₹{invoiceDetails.balanceAmount?.toLocaleString()}</div>

                      {selectedAdvanceReceipt && (
                        <div className="text-blue-600 font-medium">
                          Advance Applied: - ₹{advanceApplyAmount?.toLocaleString()}
                        </div>
                      )}

                      <div className="font-semibold col-span-2 border-t pt-2 mt-2">
                        Net Payable Amount: ₹{(invoiceDetails.balanceAmount - (advanceApplyAmount || 0))?.toLocaleString()}
                      </div>
                      <div>Amount In Words : {numberToIndianCurrencyWords(invoiceDetails.balanceAmount - (advanceApplyAmount || 0))}</div>
                      {paymentType === "Partial Payment" && (
                        <div>
                          New Balance After This Payment: ₹{(invoiceDetails.balanceAmount - (advanceApplyAmount || 0) - amountToPay)?.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">
                    Notes
                  </label>
                  <Input
                    placeholder="Enter description for invoice"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleCreateFromInvoice}
                  disabled={!invoiceDetails || loading}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Receipt"}
                </Button>
              </div>
            </TabsContent>

            {/* Scenario 2: With Items */}
            <TabsContent value="nonInvoiced" className="space-y-4">
              <div className="space-y-4">
                <div className="flex flex-row gap-2 iems-center">
                {/* Client Selector */}
                <div className="w-full">
                  <Label>Client *</Label>
                  <div className="flex gap-2">
                    {/* <Select value={scenario2Client} onValueChange={setScenario2Client}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any) => (
                          <SelectItem key={c._id} value={c._id!}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}
                    <OwnSearchableSelect
                      options={clientOptions}
                      value={scenario2Client}
                      onValueChange={setScenario2Client}
                      placeholder="Search and select a client..."
                      searchPlaceholder="Type to filter..."
                      emptyText={loadingClients ? "Loading clients..." : "No clients found please create a new client."}
                    />
                     {/* created by */}
            
                    <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
                      <DialogTrigger asChild>
                        {/* <Button variant="outline" size="icon">
                          <Plus className="h-4 w-4" />
                        </Button> */}
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Client</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={newClient.name}
                              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Phone *</Label>
                            <Input
                              value={newClient.phone}
                              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={newClient.email}
                              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Address</Label>
                            <Input
                              value={newClient.address}
                              onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateClient}>Create Client</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                </div>
                      <div className="w-full">
                    <Label>Created By</Label>
                    <Input value={companyName} readOnly className="bg-gray-100" />
                  </div></div>
                    {selectedScenario2Client && (
                      <Card className="mt-4 bg-slate-50 border">
                        <CardContent className="p-4 text-sm space-y-2">

                          <div className="flex gap-2">
                            <span className="text-gray-500">Client Name:</span>
                            <span className="font-medium">
                              {selectedScenario2Client.name || selectedScenario2Client.clientName}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <span className="text-gray-500">Email:</span>
                            <span>{selectedScenario2Client.email}</span>
                          </div>

                          <div className="flex gap-2">
                            <span className="text-gray-500">Contact:</span>
                            <span>{selectedScenario2Client.phone}</span>
                          </div>

                          <div className="flex gap-2">
                            <span className="text-gray-500">Address:</span>
                            <p className="mt-1">
                              {selectedScenario2Client.address},
                              {" "}{selectedScenario2Client.city},
                              {" "}{selectedScenario2Client.state} - {selectedScenario2Client.pincode}
                            </p>
                          </div>

                        </CardContent>
                      </Card>
                    )}
                {/* Items card */}

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
                                    value: masterItem._id,
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
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {item.type === "product" && (
                                <div>
                                  <Label required>Quantity</Label>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateItem(item.id, "quantity", Number.parseInt(e.target.value))}
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
                                  className="bg-white"
                                  disabled
                                />
                              </div>
                              <div>
                                <Label>Discount</Label>
                                <Input
                                  type="number"
                                  value={item.discount}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, "discount", Number.parseFloat(e.target.value))
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
                {/* //items summery */}
                <Card className="">
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
                        <span className="text-purple-600">₹{grandTotal.toLocaleString()}</span>
                      </div>
                           {selectedAdvanceReceipt && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Advance Applied:</span>
                        <span>- ₹{advanceApplyAmount?.toLocaleString()}</span>
                      </div>
                    )}
                      {selectedAdvanceReceipt && (
                        <div className="flex justify-between font-bold text-lg mt-2 border-t pt-2">
                          <span>Net Payable:</span>
                          <span className="text-green-600">₹{(grandTotal - (advanceApplyAmount || 0)).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex flex-row justify-between">
                       <span> In Words:</span> <span> {numberToIndianCurrencyWords(grandTotal - (advanceApplyAmount || 0))}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {advanceReceipts.filter(adv => !scenario2Client || adv.clientId === scenario2Client).length > 0 && (
                  <div>
                    <Label>Apply Advance Receipt</Label>

                    <Select
                      value={selectedAdvanceReceipt?._id}
                      onValueChange={(id) => {
                        const adv = advanceReceipts.find(r => r._id === id)
                        setSelectedAdvanceReceipt(adv)
                        const amount = adv?.balanceAmount ?? adv?.ReceiptAmount ?? 0
                        setAdvanceApplyAmount(amount > grandTotal ? grandTotal : amount)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select advance receipt" />
                      </SelectTrigger>

                      <SelectContent>
                        {advanceReceipts.filter(adv => !scenario2Client || adv.clientId === scenario2Client).map((adv) => (
                          <SelectItem key={adv._id} value={adv._id}>
                            {adv.receiptNumber} — ₹{adv.balanceAmount ?? adv.ReceiptAmount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedAdvanceReceipt && (
                  <div>
                    <Label>Advance Apply Amount</Label>

                    <Input
                      type="number"
                      value={advanceApplyAmount}
                      max={selectedAdvanceReceipt.balanceAmount ?? selectedAdvanceReceipt.ReceiptAmount}
                      onChange={(e) =>
                        setAdvanceApplyAmount(
                          Math.min(
                            Number(e.target.value),
                            selectedAdvanceReceipt.balanceAmount ?? selectedAdvanceReceipt.ReceiptAmount,
                            grandTotal
                          )
                        )
                      }
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      Max: ₹{Math.min(selectedAdvanceReceipt.balanceAmount ?? selectedAdvanceReceipt.ReceiptAmount, grandTotal)}
                    </p>
                  </div>
                )}

                {/* Payment Details */}
                <div className="space-y-3 flex flex-wrap gap-2">
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={scenario2PaymentMethod} onValueChange={setScenario2PaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Slect Payment Method" />
                      </SelectTrigger>
                      <SelectContent>

                        <SelectItem value="cash">
                          Cash
                        </SelectItem>
                        <SelectItem value="upi">
                          UPI
                        </SelectItem>
                        <SelectItem value="card">
                          Card
                        </SelectItem>
                        <SelectItem value="cheque">
                          Cheque
                        </SelectItem>
                        <SelectItem value="bankTransfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="other">
                         Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* <div>
                    <Label>
                      Select payment Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={paymentType}
                      onValueChange={(value: "Full Payment" | "Partial Payment") =>
                        setPaymentType(value)
                      }
                    >

                      <SelectTrigger>
                        <SelectValue placeholder="Select FullPayment/Partial" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Payment">Full Payment</SelectItem>
                        <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                        <SelectItem value="Advance Payment">Advance Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}
                  {/* account no. and refrence no. if no cash */}
                  {scenario2PaymentMethod.trim().toLowerCase() != "cash" && (
                    <div className="space-y-4">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Label>Reference Number </Label>
                        <Input
                          type="text"
                          value={scenario2ReferenceNumber}
                          onChange={(e) => (setScenario2ReferenceNumber(e.target.value))}
                          placeholder="Enter Your Reference Number"
                          required />
                      </div>
                      <div className="flex-1">
                        <Label>
                          Bank Account <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={selectedAccount?._id}
                          onValueChange={(id) => {
                            const bank = bankAccounts.find((b: any) => b._id === id)
                            setSelectedAccount(bank)
                          }}
                        >

                          <SelectTrigger>
                            <SelectValue placeholder="Select Bank Accounts" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((method: any) => (
                              <SelectItem key={method._id} value={method._id}>
                                {method.bankName}
                              </SelectItem>

                            ))}
                          </SelectContent>
                        </Select>
                        {/* {selectedAccount && (
                    <div className="border rounded-lg mt-2 p-4 bg-gray-50 text-sm space-y-1">
                      <p><strong>Bank:</strong> {selectedAccount.bankName}</p>
                      <p><strong>Account Name:</strong> {selectedAccount.accountName}</p>
                      <p><strong>Account Number:</strong> {selectedAccount.accountNumber}</p>
                      <p><strong>IFSC:</strong> {selectedAccount.ifscCode}</p>
                      <p><strong>Branch:</strong> {selectedAccount.branchName}</p>

                      {selectedAccount.upiId && (
                        <p><strong>UPI ID:</strong> {selectedAccount.upiId}</p>
                      )}
                      {selectedAccount?.upiScanner && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">UPI QR Code</p>
                          <img
                            src={selectedAccount.upiScanner}
                            alt="UPI Scanner"
                            className="h-40 w-40 object-contain border rounded"
                          />
                        </div>
                      )}

                    </div>
                  )} */}
                      </div>
                    </div>
                    <div>
                      <Label>Payment Screenshot</Label>
                      <FileUpload value={scenario2ScreenshotUrl} onChange={setScenario2ScreenshotUrl} />
                    </div>
                    </div>
                  )}
                  {/* amounnt paying  */}
                  <div>
                    <Label>Amount Paid</Label>
                    <Input
                      type="text"
                      value={(grandTotal - (advanceApplyAmount || 0)).toLocaleString()}
                      disabled
                      placeholder="Enter amount paid (full or advance)"
                    />
                  </div>
                 
                </div>
                {/* notes */}
                <div>
                  <label className="text-sm font-medium">
                    Notes
                  </label>
                  <Input
                    placeholder="Enter description for invoice"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleCreateWithItems}
                  disabled={loading || !scenario2Client || items.length === 0}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Receipt"}
                </Button>
              </div>
            </TabsContent>

            {/* Scenario 3: Quick Receipt */}
            <TabsContent value="quick" className="space-y-4">
              <div className="space-y-4">
                              <div className="flex flex-row items-center gap-2">
                {/* Client Selector */}
                <div className="w-full">
                  <Label>Client *</Label>
                  <div className="flex gap-2">
                    {/* <Select value={scenario3Client} onValueChange={setScenario3Client}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any, idx: number) => (
                          <SelectItem key={c._id || idx} value={c._id!}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}
                     <OwnSearchableSelect
                      options={clientOptions}
                      value={scenario3Client}
                      onValueChange={setScenario3Client}
                      placeholder="Search and select a client..."
                      searchPlaceholder="Type to filter..."
                      emptyText={loadingClients ? "Loading clients..." : "No clients found please create a new client."}
                    />
                    <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
                      <DialogTrigger asChild>
                        {/* <Button variant="outline" size="icon">
                          <Plus className="h-4 w-4" />
                        </Button> */}
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Client</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={newClient.name}
                              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Phone *</Label>
                            <Input
                              value={newClient.phone}
                              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={newClient.email}
                              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Address</Label>
                            <Input
                              value={newClient.address}
                              onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateClient}>Create Client</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                  </div>
                
                </div>
                                      {/* created by */}
                  <div className="w-full">
                    <Label>Created By</Label>
                    <Input value={companyName} readOnly className="bg-gray-100" />
                  </div>
                  </div>
                                           {selectedScenario3Client && (
                      <Card className="mt-4 bg-slate-50 border">
                        <CardContent className="p-4 text-sm space-y-2">

                          <div className="flex gap-2">
                            <span className="text-gray-500">Client Name:</span>
                            <span className="font-medium">
                              {selectedScenario3Client.name || selectedScenario3Client.clientName}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <span className="text-gray-500">Email:</span>
                            <span>{selectedScenario3Client.email}</span>
                          </div>

                          <div className="flex gap-2">
                            <span className="text-gray-500">Contact:</span>
                            <span>{selectedScenario3Client.phone}</span>
                          </div>

                          <div className="flex gap-2">
                            <span className="text-gray-500">Address:</span>
                            <p className="mt-1">
                              {selectedScenario3Client.address},
                              {" "}{selectedScenario3Client.city},
                              {" "}{selectedScenario3Client.state} - {selectedScenario3Client.pincode}
                            </p>
                          </div>

                        </CardContent>
                      </Card>
                    )}

                {/* Amount */}
                {/* <div>
                  <Label>Total Amount *</Label>
                  <Input
                    type="number"
                    value={scenario3Amount}
                    onChange={(e) => setScenario3Amount(e.target.value)}
                    placeholder="Enter total amount"
                  />
                </div> */}
                {/* Payment Details */}
                <div className="space-y-3 flex flex-wrap gap-2">
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={scenario3PaymentMethod} onValueChange={setScenario3PaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Slect Payment Method" />
                      </SelectTrigger>
                      <SelectContent>

                        <SelectItem value="cash">
                          Cash
                        </SelectItem>
                        <SelectItem value="upi">
                          UPI
                        </SelectItem>
                        <SelectItem value="card">
                         Card
                        </SelectItem>
                        <SelectItem value="cheque">
                          Cheque
                        </SelectItem>
                        <SelectItem value="bankTransfer">
                          Bank Transfer
                        </SelectItem>
                         <SelectItem value="other">
                        Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* <div>
                    <Label>
                      Select payment Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={paymentType}
                      onValueChange={(value: "Full Payment" | "Partial Payment") =>
                        setPaymentType(value)
                      }
                    >

                      <SelectTrigger>
                        <SelectValue placeholder="Select FullPayment/Partial" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Payment">Full Payment</SelectItem>
                        <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                        <SelectItem value="Advance Payment">Advance Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}
                  {/* account no. and refrence no. if no cash */}
                  {scenario3PaymentMethod.trim().toLowerCase() != ("cash") && (
                    <div className="space-y-4">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Label>Reference Number </Label>
                        <Input
                          type="text"
                          value={scenario3ReferenceNumber}
                          onChange={(e) => (setScenario3ReferenceNumber(e.target.value))}
                          placeholder="Enter Your Reference Number"
                          required />
                      </div>
                      <div className="flex-1">
                        <Label>
                          Bank Account <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={selectedAccount?._id}
                          onValueChange={(id) => {
                            const bank = bankAccounts.find((b: any) => b._id === id)
                            setSelectedAccount(bank)
                          }}
                        >

                          <SelectTrigger>
                            <SelectValue placeholder="Select Bank Accounts" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((method: any) => (
                              <SelectItem key={method._id} value={method._id}>
                                {method.bankName}
                              </SelectItem>

                            ))}
                          </SelectContent>
                        </Select>
                        {/* {selectedAccount && (
                    <div className="border rounded-lg mt-2 p-4 bg-gray-50 text-sm space-y-1">
                      <p><strong>Bank:</strong> {selectedAccount.bankName}</p>
                      <p><strong>Account Name:</strong> {selectedAccount.accountName}</p>
                      <p><strong>Account Number:</strong> {selectedAccount.accountNumber}</p>
                      <p><strong>IFSC:</strong> {selectedAccount.ifscCode}</p>
                      <p><strong>Branch:</strong> {selectedAccount.branchName}</p>

                      {selectedAccount.upiId && (
                        <p><strong>UPI ID:</strong> {selectedAccount.upiId}</p>
                      )}
                      {selectedAccount?.upiScanner && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">UPI QR Code</p>
                          <img
                            src={selectedAccount.upiScanner}
                            alt="UPI Scanner"
                            className="h-40 w-40 object-contain border rounded"
                          />
                        </div>
                      )}

                    </div>
                  )} */}
                      </div>
                    </div>
                    <div>
                      <Label>Payment Screenshot</Label>
                      <FileUpload value={scenario3ScreenshotUrl} onChange={setScenario3ScreenshotUrl} />
                    </div>
                    </div>
                  )}
                  {/* amounnt paying  */}
                  <div>
                    <Label>Amount Paid</Label>
                    <Input
                      type="number"
                      value={scenario3AmountPaid}
                      onChange={(e) => setScenario3AmountPaid(e.target.value)}
                      placeholder="Enter amount paid (full or advance)"
                    />
                    {/* {scenario3AmountPaid && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Balance: ₹{(parseFloat(scenario3Amount) - parseFloat(scenario3AmountPaid)).toFixed(2)}
                      </div>
                    )} */}
                       <p className="text-xs text-gray-600">In words : {numberToIndianCurrencyWords(scenario3AmountPaid)}</p>
                  </div>
                  
                  {/* created by */}
                  {/* <div>
                    <Label>Created By</Label>
                    <Input value={companyName} readOnly className="bg-gray-100" />
                  </div> */}
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Notes
                  </label>
                  <Input
                    placeholder="Enter description for invoice"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateQuickReceipt}
                  disabled={loading || !scenario3Client}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Quick Receipt"}
                </Button>
              </div>
            </TabsContent>

            {/* Scenario 4: Advance Receipt */}
            <TabsContent value="advance" className="space-y-4">
              <div className="space-y-4">
                <div className="flex flex-row items-center gap-2">
                {/* Client Selector */}
                <div className="w-full">
                  <Label>Client *</Label>
                  <div className="flex gap-2">
                    {/* <Select value={scenario3Client} onValueChange={setScenario3Client}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any, idx: number) => (
                          <SelectItem key={c._id || idx} value={c._id!}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}
                     <OwnSearchableSelect
                      options={clientOptions}
                      value={scenario3Client}
                      onValueChange={setScenario3Client}
                      placeholder="Search and select a client..."
                      searchPlaceholder="Type to filter..."
                      emptyText={loadingClients ? "Loading clients..." : "No clients found please create a new client."}
                    />
                    <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
                      <DialogTrigger asChild>
                        {/* <Button variant="outline" size="icon">
                          <Plus className="h-4 w-4" />
                        </Button> */}
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Client</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={newClient.name}
                              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Phone *</Label>
                            <Input
                              value={newClient.phone}
                              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={newClient.email}
                              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Address</Label>
                            <Input
                              value={newClient.address}
                              onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateClient}>Create Client</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                  </div>
                
                </div>
                                      {/* created by */}
                  <div className="w-full">
                    <Label>Created By</Label>
                    <Input value={companyName} readOnly className="bg-gray-100" />
                  </div>
                  </div>
                                           {selectedScenario3Client && (
                      <Card className="mt-4 bg-slate-50 border">
                        <CardContent className="p-4 text-sm space-y-2">

                          <div className="flex gap-2">
                            <span className="text-gray-500">Client Name:</span>
                            <span className="font-medium">
                              {selectedScenario3Client.name || selectedScenario3Client.clientName}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <span className="text-gray-500">Email:</span>
                            <span>{selectedScenario3Client.email}</span>
                          </div>

                          <div className="flex gap-2">
                            <span className="text-gray-500">Contact:</span>
                            <span>{selectedScenario3Client.phone}</span>
                          </div>

                          <div className="flex gap-2">
                            <span className="text-gray-500">Address:</span>
                            <p className="mt-1">
                              {selectedScenario3Client.address},
                              {" "}{selectedScenario3Client.city},
                              {" "}{selectedScenario3Client.state} - {selectedScenario3Client.pincode}
                            </p>
                          </div>

                        </CardContent>
                      </Card>
                    )}
                {/* Amount */}
                {/* <div>
                  <Label>Total Amount *</Label>
                  <Input
                    type="number"
                    value={scenario3Amount}
                    onChange={(e) => setScenario3Amount(e.target.value)}
                    placeholder="Enter total amount"
                  />
                </div> */}
                {/* Payment Details */}
                <div className="space-y-3 flex flex-wrap gap-2">
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={scenario3PaymentMethod} onValueChange={setScenario3PaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Slect Payment Method" />
                      </SelectTrigger>
                      <SelectContent>

                        <SelectItem value="cash">
                          Cash
                        </SelectItem>
                        <SelectItem value="upi">
                          UPI
                        </SelectItem>
                        <SelectItem value="card">
                         Card
                        </SelectItem>
                        <SelectItem value="cheque">
                          Cheque
                        </SelectItem>
                        <SelectItem value="bankTransfer">
                          Bank Transfer
                        </SelectItem>
                         <SelectItem value="other">
                        Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* <div>
                    <Label>
                      Select payment Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={paymentType}
                      onValueChange={(value: "Full Payment" | "Partial Payment") =>
                        setPaymentType(value)
                      }
                    >

                      <SelectTrigger>
                        <SelectValue placeholder="Select FullPayment/Partial" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Payment">Full Payment</SelectItem>
                        <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                        <SelectItem value="Advance Payment">Advance Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}
                  {/* account no. and refrence no. if no cash */}
                  {scenario3PaymentMethod.trim().toLowerCase() != "cash" && (
                    <div className="space-y-4">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Label>Reference Number </Label>
                        <Input
                          type="text"
                          value={scenario3ReferenceNumber}
                          onChange={(e) => (setScenario3ReferenceNumber(e.target.value))}
                          placeholder="Enter Your Reference Number"
                          required />
                      </div>
                      <div className="flex-1">
                        <Label>
                          Bank Account <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={selectedAccount?._id}
                          onValueChange={(id) => {
                            const bank = bankAccounts.find((b: any) => b._id === id)
                            setSelectedAccount(bank)
                          }}
                        >

                          <SelectTrigger>
                            <SelectValue placeholder="Select Bank Accounts" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((method: any) => (
                              <SelectItem key={method._id} value={method._id}>
                                {method.bankName}
                              </SelectItem>

                            ))}
                          </SelectContent>
                        </Select>
                        {/* {selectedAccount && (
                    <div className="border rounded-lg mt-2 p-4 bg-gray-50 text-sm space-y-1">
                      <p><strong>Bank:</strong> {selectedAccount.bankName}</p>
                      <p><strong>Account Name:</strong> {selectedAccount.accountName}</p>
                      <p><strong>Account Number:</strong> {selectedAccount.accountNumber}</p>
                      <p><strong>IFSC:</strong> {selectedAccount.ifscCode}</p>
                      <p><strong>Branch:</strong> {selectedAccount.branchName}</p>

                      {selectedAccount.upiId && (
                        <p><strong>UPI ID:</strong> {selectedAccount.upiId}</p>
                      )}
                      {selectedAccount?.upiScanner && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">UPI QR Code</p>
                          <img
                            src={selectedAccount.upiScanner}
                            alt="UPI Scanner"
                            className="h-40 w-40 object-contain border rounded"
                          />
                        </div>
                      )}

                    </div>
                  )} */}
                      </div>
                    </div>
                    <div>
                      <Label>Payment Screenshot</Label>
                      <FileUpload value={scenario3ScreenshotUrl} onChange={setScenario3ScreenshotUrl} size="sm" width={20} height={20}/>
                    </div>
                    </div>
                  )}
                  {/* amounnt paying  */}
                  <div>
                    <Label>Amount Paid</Label>
                    <Input
                      type="number"
                      value={scenario3AmountPaid}
                      onChange={(e) => setScenario3AmountPaid(e.target.value)}
                      placeholder="Enter amount paid (full or advance)"
                    />
                    <p className="text-xs text-gray-600">In words : {numberToIndianCurrencyWords(scenario3AmountPaid)}</p>
                    {/* {scenario3AmountPaid && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Balance: ₹{(parseFloat(scenario3Amount) - parseFloat(scenario3AmountPaid)).toFixed(2)}
                      </div>
                    )} */}
                  </div>

                </div>
                <div>
                  <label className="text-sm font-medium">
                    Notes
                  </label>
                  <Input
                    placeholder="Enter description for invoice"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateAdvanceReceipt}
                  disabled={loading || !scenario3Client}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Advance Receipt"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
