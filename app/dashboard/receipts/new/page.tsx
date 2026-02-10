"use client"

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
  const { toast } = useToast()
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
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
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [notes, setNotes] = useState("")
  const [masterItems, setMasterItems] = useState<MasterItem[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentType, setPaymentType] = useState<any>("FullPayment")// Ful, Payment or Partial Payment
  const [amountToPay, setAmountToPay] = useState(0)// if partial amount is selected then need to enter amount they paying currently
  const [paymentMethods, setPaymentMethods] = useState<any>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Cash")
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
        r.status === "cleared" &&
        !r.parentReceiptNumber
      )

      setAdvanceReceipts(advances)
    }
  }

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
        setCompanyName(companyData.company.companyName || companyData.company.name || "")
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
        setSalesInvoices(result.data.filter((i: any) => i.isActive === "active" && i.status !== "Cleared"))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadCompany = async () => {
    try {
      const response = await fetch("/api/company", { credentials: "include" })
      const result = await response.json()
      setCompanyName(result.company.companyName || result.company.name || "")
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
    setPaymentMethods(data.filter((eachItem: any) => (eachItem.isEnabled === true)));
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
        clientPhone: invoiceDetails.clientPhone,

        items: invoiceDetails.items,

        invoiceAmount: invoiceDetails.subtotal,
        invoicegrandTotal: invoiceDetails.grandTotal,
        invoiceBalance,

        paymentType,
        paymentMethod: selectedPaymentMethod,
        ReceiptAmount: receiptAmount,

        bankDetails: invoiceDetails.bankDetails || selectedBankAcount,
        referenceNumber,

        status: selectedPaymentMethod.toLowerCase() === "cash" ? "Cleared" : "Pending",
        parentReceiptNumber: selectedAdvanceReceipt?.receiptNumber || null,
        advanceAppliedAmount: advanceApplyAmount || 0,
        createdBy: invoiceDetails.createdBy,
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
          status: invoiceBalance <= 0 ? "Cleared" : "Partial",
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
            const masterItem = masterItems.find((i) => i.name === value)

            if (masterItem) {
              updatedItem.description = masterItem.description
              updatedItem.price = masterItem.price
              updatedItem.itemId = masterItem._id;

              if (masterItem) {

                // 🔹 Fetch seller & buyer states
                const buyer = clients.find(c => c._id === setScenario2Client)
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

    setLoading(true)
    try {
      const { subtotal, taxAmount, total } = calculateScenario2Totals(items)
      const amountPaid = parseFloat(scenario2AmountPaid) || 0
      const client = clients.find(c => c._id === scenario2Client)

      const receiptData = {
        receiptType: "nonInvoiced",
        clientId: scenario2Client,
        clientName: client?.name || "",
        clientEmail: client?.email || "",
        clientPhone: client?.phone || "",
        clientAddress: `${client?.address}, ${client?.city}, ${client?.state}, ${client?.pincode}` || "",
        items: items,
        subtotal,
        taxAmount,
        total,
        ReceiptAmount: amountPaid,
        balanceAmount: total - amountPaid - (advanceApplyAmount || 0),
        paymentType: (amountPaid + (advanceApplyAmount || 0)) >= total ? "Full Payment" : "Partial Payment",
        paymentMethod: scenario2PaymentMethod,
        referenceNumber: scenario2ReferenceNumber,
        bankDetails: selectedAccount,
        parentReceiptNumber: selectedAdvanceReceipt?.receiptNumber || null,
        advanceAppliedAmount: advanceApplyAmount || 0,
        date: new Date().toISOString(),
        status: `${scenario2PaymentMethod.trim().toLowerCase() === "cash" ? "Cleared" : "Pending"}`,
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
            parentReceiptNumber: result.data.receiptNumber
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
        clientPhone: client?.phone || "",
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
        referenceNumber: scenario3ReferenceNumber,
        date: new Date().toISOString(),
        status: "pending",
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

    setLoading(true)
    try {

      const amountPaid = parseFloat(scenario3AmountPaid) || 0
      const client = clients.find(c => c._id === scenario3Client)

      const receiptData = {
        receiptType: "advance",
        clientId: scenario3Client,
        clientName: client?.name || "",
        clientEmail: client?.email || "",
        clientPhone: client?.phone || "",
        clientAddress: `${client?.address}, ${client?.city}, ${client?.state}, ${client?.pincode}` || "",
        items: [],
        // subtotal: totalAmount,
        taxAmount: 0,
        // total: totalAmount,
        ReceiptAmount: amountPaid,
        // balanceAmount: totalAmount - amountPaid,
        paymentType: "Advance Payment",
        paymentMethod: scenario3PaymentMethod,
        bankDetails: selectedAccount,
        referenceNumber: scenario3ReferenceNumber,
        date: new Date().toISOString(),
        status: "pending",
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
                <div>
                  <Label>Select SalesInvoice</Label>
                  <Select value={selectedInvoice} onValueChange={handleInvoiceSelect}>
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
                  </Select>
                </div>
                {advanceReceipts.length > 0 && (
                  <div>
                    <Label>Apply Advance Receipt</Label>

                    <Select
                      value={selectedAdvanceReceipt?._id}
                      onValueChange={(id) => {
                        const adv = advanceReceipts.find(r => r._id === id)
                        setSelectedAdvanceReceipt(adv)
                        setAdvanceApplyAmount(adv?.ReceiptAmount || 0)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select advance receipt" />
                      </SelectTrigger>

                      <SelectContent>
                        {advanceReceipts.map((adv) => (
                          <SelectItem key={adv._id} value={adv._id}>
                            {adv.receiptNumber} — ₹{adv.ReceiptAmount}
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
                      max={selectedAdvanceReceipt.ReceiptAmount}
                      onChange={(e) =>
                        setAdvanceApplyAmount(
                          Math.min(
                            Number(e.target.value),
                            selectedAdvanceReceipt.ReceiptAmount
                          )
                        )
                      }
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      Max: ₹{selectedAdvanceReceipt.ReceiptAmount}
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
                      {paymentMethods.map((method: any) => (
                        <SelectItem key={method._id} value={method.name}>
                          {method.name}
                        </SelectItem>
                      ))}
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
                  <div className="flex space-x-4">
                    <div>
                      <Label>Reference Number </Label>
                      <Input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => (setReferenceNumber(e.target.value))}
                        placeholder="Enter Your Regerence Number"
                        required />
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">
                        Bank Account <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedBankAcount}
                        onValueChange={(value) => setSelectedBankAccount(value)}
                        required
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
                    </div>
                  </div>
                )}
                {invoiceDetails && (
                  <div className="border rounded-lg p-4 space-y-2 bg-gray-50">
                    <h3 className="font-semibold">Invoice Details</h3>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Client: {invoiceDetails.clientName}</div>
                      <div>Invoice: {invoiceDetails.salesInvoiceNumber}</div>
                      <div>Original Invoice Total: ₹{invoiceDetails.grandTotal?.toLocaleString()}</div>
                      {/* <div>Current Balance: ₹{invoiceDetails.balanceAmount?.toLocaleString()}</div> */}

                      {selectedAdvanceReceipt && (
                        <div className="text-blue-600 font-medium">
                          Advance Applied: - ₹{advanceApplyAmount?.toLocaleString()}
                        </div>
                      )}

                      <div className="font-semibold col-span-2 border-t pt-2 mt-2">
                        Net Payable Amount: ₹{(invoiceDetails.balanceAmount - (advanceApplyAmount || 0))?.toLocaleString()}
                      </div>
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
                {/* Client Selector */}
                <div>
                  <Label>Client *</Label>
                  <div className="flex gap-2">
                    <Select value={scenario2Client} onValueChange={setScenario2Client}>
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
                    </Select>
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
                    {selectedAdvanceReceipt && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Advance Applied:</span>
                        <span>- ₹{advanceApplyAmount?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Grand Total:</span>
                        <span className="text-purple-600">₹{grandTotal.toLocaleString()}</span>
                      </div>
                      {selectedAdvanceReceipt && (
                        <div className="flex justify-between font-bold text-lg mt-2 border-t pt-2">
                          <span>Net Payable:</span>
                          <span className="text-green-600">₹{(grandTotal - (advanceApplyAmount || 0)).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                {advanceReceipts.length > 0 && (
                  <div>
                    <Label>Apply Advance Receipt</Label>

                    <Select
                      value={selectedAdvanceReceipt?._id}
                      onValueChange={(id) => {
                        const adv = advanceReceipts.find(r => r._id === id)
                        setSelectedAdvanceReceipt(adv)
                        setAdvanceApplyAmount(adv?.ReceiptAmount || 0)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select advance receipt" />
                      </SelectTrigger>

                      <SelectContent>
                        {advanceReceipts.map((adv) => (
                          <SelectItem key={adv._id} value={adv._id}>
                            {adv.receiptNumber} — ₹{adv.ReceiptAmount}
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
                      max={selectedAdvanceReceipt.ReceiptAmount}
                      onChange={(e) =>
                        setAdvanceApplyAmount(
                          Math.min(
                            Number(e.target.value),
                            selectedAdvanceReceipt.ReceiptAmount
                          )
                        )
                      }
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      Max: ₹{selectedAdvanceReceipt.ReceiptAmount}
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
                        {paymentMethods.map((method: any) => (
                          <SelectItem key={method._id} value={method.name}>
                            {method.name}
                          </SelectItem>
                        ))}
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
                    <div className="flex space-x-4">
                      <div>
                        <Label>Reference Number </Label>
                        <Input
                          type="text"
                          value={scenario2ReferenceNumber}
                          onChange={(e) => (setScenario2ReferenceNumber(e.target.value))}
                          placeholder="Enter Your Reference Number"
                          required />
                      </div>
                      <div>
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
                  )}
                  {/* amounnt paying  */}
                  <div>
                    <Label>Amount Paid</Label>
                    <Input
                      type="number"
                      value={scenario2AmountPaid}
                      onChange={(e) => setScenario2AmountPaid(e.target.value)}
                      placeholder="Enter amount paid (full or advance)"
                    />
                    {(scenario2AmountPaid || selectedAdvanceReceipt) && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Balance: ₹{(grandTotal - (parseFloat(scenario2AmountPaid) || 0) - (advanceApplyAmount || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                  {/* created by */}
                  <div>
                    <Label>Created By</Label>
                    <Input value={companyName} readOnly className="bg-gray-100" />
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
                {/* Client Selector */}
                <div>
                  <Label>Client *</Label>
                  <div className="flex gap-2">
                    <Select value={scenario3Client} onValueChange={setScenario3Client}>
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
                    </Select>
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
                        {paymentMethods.map((method: any) => (
                          <SelectItem key={method._id} value={method.name}>
                            {method.name}
                          </SelectItem>
                        ))}
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
                  {scenario2PaymentMethod.trim().toLowerCase() != ("Cash" || "cash") && (
                    <div className="flex space-x-4">
                      <div>
                        <Label>Reference Number </Label>
                        <Input
                          type="text"
                          value={scenario3ReferenceNumber}
                          onChange={(e) => (setScenario3ReferenceNumber(e.target.value))}
                          placeholder="Enter Your Reference Number"
                          required />
                      </div>
                      <div>
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
                  </div>
                  {/* created by */}
                  <div>
                    <Label>Created By</Label>
                    <Input value={companyName} readOnly className="bg-gray-100" />
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
                {/* Client Selector */}
                <div>
                  <Label>Client *</Label>
                  <div className="flex gap-2">
                    <Select value={scenario3Client} onValueChange={setScenario3Client}>
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
                    </Select>
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
                        {paymentMethods.map((method: any) => (
                          <SelectItem key={method._id} value={method.name}>
                            {method.name}
                          </SelectItem>
                        ))}
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
                    <div className="flex space-x-4">
                      <div>
                        <Label>Reference Number </Label>
                        <Input
                          type="text"
                          value={scenario3ReferenceNumber}
                          onChange={(e) => (setScenario3ReferenceNumber(e.target.value))}
                          placeholder="Enter Your Reference Number"
                          required />
                      </div>
                      <div>
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
                  </div>
                  {/* created by */}
                  <div>
                    <Label>Created By</Label>
                    <Input value={companyName} readOnly className="bg-gray-100" />
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
