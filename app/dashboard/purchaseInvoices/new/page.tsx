"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Upload, UserPlus, AlertCircle } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { ClientSelectSimple } from "@/components/client-select-simple"
import { ImageUpload } from "@/components/ui/image-upload"
import { toast as toast2 } from "@/lib/toast"

export default function NewPurchaseInvoicePage() {
  const router = useRouter()
  const { user, hasPermission } = useUser()
  const { toast } = useToast()

  const [invoiceData, setInvoiceData] = useState<any>({
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    vendorInvoiceNumber: "",
    purchaseInvoiceNumber: `PR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
    recipientType: "",
    recipientId: "",
    recipientName: "",
    recipientDetails: "",
    recipientEmail: "",
    recipientPhone: "",
    recipientAddress: "",

    paymentCategory: "",
    description: "",

    invoiceTotal: "",
    balanceAmount: "",
    amountInWords: "",

    paymentMethod: "",
    bankAccount: "",
    referenceNumber: "",
    paymentStatus: "Unpaid",
        invoiceStatus: "Open",
    billFile: null,
    screenshotFile: null,

    expenseAdjustment: 0,
    expenseAdjustmentReason: "",
  })

  const [amountInWords, setAmountInWords] = useState("")
  const [activeTab, setActiveTab] = useState("invoice-details")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const tabs = ["invoice-details", "invoice-info"]
  const currentTabIndex = tabs.indexOf(activeTab)
  const isLastTab = currentTabIndex === tabs.length - 1;
  const [paymentCategories, setPaymentCategories] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [recipientTypes, setRecipientTypes] = useState<any[]>([])
  const [companyName, setCompanyName] = useState("")
  const [dueDate, setDueDate] = useState("")


  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, vendorsData, teamData, recipientTypesData, paymentCategories, paymentMethods, bankAccounts, companyData] = await Promise.all([
          api.clients.getAll(),
          api.vendors.getAll(),
          api.employees.getAll(),
          api.recipientTypes.getAll(),
          api.paymentCategories.getAll(),
          api.paymentMethods.getAll(),
          api.bankAccounts.getAll(),
          api.company.get(),
        ]);

        console.log("Loaded data:", clientsData, vendorsData, teamData, recipientTypesData, paymentCategories, paymentMethods, bankAccounts);

        // 🧹 Filter → Dedupe → Set

        // ⬅️ 1. ACTIVE clients only + dedupe by _id
        const activeClients = clientsData
          .filter((c: any) => c.status === "active" || c.isActive === true)
          .map((c: any) => ({ ...c, name: c.name?.trim() || c.email?.trim() || "Unnamed Client" }));

        const uniqueClients = Array.from(new Map(activeClients.map((c: any) => [c._id, c])).values());

        setClients(uniqueClients);

        // ⬅️ 2. ACTIVE vendors only + dedupe by _id
        const activeVendors = vendorsData

        const uniqueVendors = Array.from(new Map(activeVendors.map((v: any) => [v._id, v])).values());

        setVendors(uniqueVendors);

        // ⬅️ 3. ACTIVE team members only + dedupe
        const activeEmployees = teamData.filter((t: any) => t.isActive === true);

        const uniqueTeams = Array.from(new Map(activeEmployees.map((t: any) => [t._id, t])).values());

        setTeamMembers(uniqueTeams);
        const activeRecipientTypes = recipientTypesData.filter((t: any) => t.isEnabled);

        const uniqueRecipientTypes = Array.from(
          new Map(
            activeRecipientTypes
              .filter((t: any) => t.value)  // remove items missing value
              .map((t: any) => [t.value.toLowerCase(), t])
          ).values()
        );

        setRecipientTypes(uniqueRecipientTypes);


        const activePaymentCategories = paymentCategories.filter((t: any) => t.isEnabled);

        const uniquePaymentCategories = Array.from(
          new Map(activePaymentCategories.map((t: any) => [t._id, t])).values()
        );

        setPaymentCategories(uniquePaymentCategories);

        const activePaymentMethods = paymentMethods.filter((t: any) => t.isEnabled);
        setPaymentMethods(activePaymentMethods);

        const activeBankAccounts = bankAccounts.filter((t: any) => t.isActive);
        setBankAccounts(activeBankAccounts);
        const company = companyData.companyName || companyData.name || ""
        setCompanyName(company)
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  // const uniqueRecipientTypes = Array.from(
  //   new Map(recipientTypes.map((type) => [type.value, type])).values()
  // )
  console.log("uniqueRecipientTypes", recipientTypes);

  // Validation functions for each tab
  const validateInvoiceDetails = (): boolean => {
    const errors: Record<string, string> = {}

    if (!invoiceData.date && !invoiceData.category) {
      errors.date = "Date is required"
    }
    if (!invoiceData.amount || Number.parseFloat(invoiceData.amount) <= 0) {
      errors.amount = "Valid amount is required"
    }

    if (!invoiceData.recipientType) {
      errors.recipientType = "Recipient type is required"
    }
    if (!invoiceData.recipientId) {
      errors.recipientId = "Recipient must be selected"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // const validateRecipientDetails = (): boolean => { // Kept commented out as in original
  //   const errors: Record<string, string> = {}

  //   if (!invoiceData.recipientType) {
  //     errors.recipientType = "Recipient type is required"
  //   }
  //   if (!invoiceData.recipientId) {
  //     errors.recipientId = "Recipient must be selected"
  //   }

  //   setValidationErrors(errors)
  //   return Object.keys(errors).length === 0
  // }

  const validateInvoiceInfo = (): boolean => {
    const errors: Record<string, string> = {}

    // if (!invoiceData.paymentMethod) {
    //   errors.paymentMethod = "Payment method is required"
    // }

    // const requiresReference = ["Bank Transfer", "UPI", "Check"].includes(invoiceData.paymentMethod)

    // if (requiresReference && !invoiceData.referenceNumber) {
    //   errors.referenceNumber = "Reference number is required for this payment method"
    // }

    // if (["Bank Transfer", "UPI"].includes(invoiceData.paymentMethod) && !invoiceData.bankAccount) {
    //   errors.bankAccount = "Bank account is required for this payment method"
    // }

    if (!invoiceData.billFile) {
      errors.billFile = "Bill upload is required for this payment method"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleContinue = () => {
    const isValid = validateInvoiceDetails();

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields in Invoice Details",
        variant: "destructive",
      });
      return;
    }

    setActiveTab("invoice-info");
  };


  const handleTabChange = (newTab: string) => {
    if (newTab === "invoice-info" && !validateInvoiceDetails()) {
      toast({
        title: "Validation Required",
        description: "Please complete Invoice Details before proceeding",
        variant: "destructive",
      });
      return;
    }

    setActiveTab(newTab);
  };


  // const paymentCategories = ["Salary", "Rent", "Stationary", "Miscellaneous", "Refund", "Purchase", "Service", "Other"]
  // const paymentMethods = ["Cash", "Bank Transfer", "UPI", "Check"]
  // const bankAccounts = ["HDFC Bank - ****1234", "ICICI Bank - ****5678", "SBI - ****9012"]

  const handleRecipientChange = (recipientId: string) => {
    let recipient: any = null
    let details = ""

    if (invoiceData.recipientType === "client") {
      recipient = clients.find((c) => c._id === recipientId)
      if (recipient) {
        details = `${recipient.address}\n${recipient.phone}\n${recipient.email}`
      }
    } else if (invoiceData.recipientType === "vendor") {
      recipient = vendors.find((v) => v._id === recipientId)
      if (recipient) {
        details = `${recipient.category}\n${recipient.address}\n${recipient.phone}\n${recipient.email}`
      }
    } else if (invoiceData.recipientType === "team") {
      recipient = teamMembers.find((t) => t._id === recipientId)
      if (recipient) {
        details = `${recipient.role}\n${recipient.department || "N/A"}\n${recipient.phone}\n${recipient.email}`
      }
    }

    if (recipient) {
      const email = recipient.email || ""
      const phone = recipient.phone || recipient.contactNumber || ""
      const address = recipient.address || ""

      setInvoiceData({
        ...invoiceData,
        recipientId,
        recipientName: recipient.name || (recipient.employeeName + " " + recipient.surname),
        recipientDetails: details,
        recipientEmail: email,
        recipientPhone: phone,
        recipientAddress: address,
      })

      // Clear recipient validation error
      if (validationErrors.recipientId) {
        setValidationErrors({ ...validationErrors, recipientId: "" })
      }
    }
  }

  const handleAmountChange = (value: string) => {
    const amount = Number.parseFloat(value || "0")
    const expenseAdj = Number.parseFloat(invoiceData.expenseAdjustmentAmount || "0")

    const balance =
      expenseAdj > 0 ? amount - expenseAdj : amount

    setInvoiceData({
      ...invoiceData,
      amount: value,
      balance: balance.toFixed(2),
    })

    if (value) {
      setAmountInWords(`${amount.toLocaleString()} rupees only`)

      if (validationErrors.amount) {
        setValidationErrors({ ...validationErrors, amount: "" })
      }
    } else {
      setAmountInWords("")
    }
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Final validation of all tabs
    const isInvoiceDetailsValid = validateInvoiceDetails()
    // const isRecipientDetailsValid = validateRecipientDetails()
    const isInvoiceInfoValid = validateInvoiceInfo()

    if (!isInvoiceDetailsValid || !isInvoiceInfoValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields across all tabs",
        variant: "destructive",
      })

      // Navigate to first tab with errors
      if (!isInvoiceDetailsValid) {
        setActiveTab("invoice-details")
      } else if (!isInvoiceInfoValid) {
        setActiveTab("invoice-info")
      }
      return
    }

    try {
      api.purchaseInvoice.create({
        purchaseInvoiceNumber: invoiceData.purchaseInvoiceNumber,
        recipientType: invoiceData.recipientType as "client" | "vendor" | "team",
        recipientId: invoiceData.recipientId,
        recipientName: invoiceData.recipientName,
        recipientEmail: invoiceData.recipientEmail,
        recipientPhone: invoiceData.recipientPhone,
        recipientAddress: invoiceData.recipientAddress,
        date: invoiceData.date,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        paymentStatus: "Unpaid",
        invoiceStatus: "Open",
        paymentMethod: invoiceData.paymentMethod,
        paymentCategory: invoiceData.category,
        description: invoiceData.description,
        invoiceTotalAmount: Number(invoiceData.amount),
        balanceAmount: Number(invoiceData.balance),
        amountInWords: amountInWords,
        billUpload: invoiceData.billFile,
        expenseAdjustmentAmount: Number(invoiceData.expenseAdjustmentAmount),
        expenseAdjustmentReason: invoiceData.expenseAdjustmentReason,
        createdBy: companyName || "",
      })

      toast({
        title: "Purchase Invoice Created",
        description: `Purchase Invoice ${invoiceData.purchaseInvoiceNumber} has been created successfully.`,
      })

      router.push("/dashboard/purchaseInvoices")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create purchase invoice.. Please try again.",
        variant: "destructive",
      })
    }
  }

  const requiresReference = ["Bank Transfer", "UPI", "Check", "Cheque", "Card"].includes(invoiceData.paymentMethod)
  const status = invoiceData.paymentMethod === "Cash" ? "Cleared" : "Paid"

  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false)
  const [isCreateVendorOpen, setIsCreateVendorOpen] = useState(false)
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    companyName: "",
    contactName: "",
    gst: "",
    pan: "",
    clientName: "",
    clientAddress: "",
    clientContact: "",
    clientEmail: "",
  })
  const [newClient, setNewClient] = useState({
    type: "individual",
    name: "",
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    gst: "",
    pan: "",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const handleCreateClient = async () => {
    const localStored = localStorage.getItem("loginedUser");
    const parsed = localStored ? JSON.parse(localStored) : null;

    // ---------- DUPLICATE CHECKS ----------
    const emailExists = clients.some(
      (c) => c.email.toLowerCase() === newClient.email.trim().toLowerCase()
    );

    if (emailExists) {
      toast2.error("Email already registered");
      return;
    }

    const phoneExists = clients.some(
      (c) => c.phone.trim() === newClient.phone.trim()
    );

    if (phoneExists) {
      toast2.error("Phone number already registered");
      return;
    }

    // Name logic differs for individual/company
    let nameExists = false;

    if (newClient.type === "individual") {
      nameExists = clients.some(
        (c) =>
          c.type === "individual" &&
          (c.name || "").trim().toLowerCase() ===
          newClient.name.trim().toLowerCase()
      );
    } else {
      // company: companyName + contactName (mapped to name)
      nameExists = clients.some(
        (c) =>
          c.type === "company" &&
          (c.companyName || "").trim().toLowerCase() ===
          newClient.companyName.trim().toLowerCase() &&
          (c.name || "").trim().toLowerCase() ===
          newClient.contactName.trim().toLowerCase()
      );
    }

    if (nameExists) {
      toast2.error("Client already exists");
      return;
    }

    // ---------------------------------------
    // -------- VALIDATION START -------------
    // ---------------------------------------

    let newErrors = {
      name: "",
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      state: "",
      city: "",
      pincode: "",
      gst: "",
      pan: "",
    };

    let isValid = true;

    const phoneRegex = /^[6-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pincodeRegex = /^\d{6}$/;
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    // common validations
    if (!phoneRegex.test(newClient.phone)) {
      newErrors.phone = "Enter valid 10-digit Indian mobile number";
      isValid = false;
    }

    if (!emailRegex.test(newClient.email)) {
      newErrors.email = "Enter a valid email";
      isValid = false;
    }

    if (!newClient.address.trim()) {
      newErrors.address = "Address is required";
      isValid = false;
    }

    if (!newClient.state.trim()) {
      newErrors.state = "State is required";
      isValid = false;
    }

    if (!newClient.city.trim()) {
      newErrors.city = "City is required";
      isValid = false;
    }

    if (!pincodeRegex.test(newClient.pincode)) {
      newErrors.pincode = "Enter a valid 6-digit pincode";
      isValid = false;
    }

    // individual
    if (newClient.type === "individual") {
      if (!newClient.name.trim()) {
        newErrors.name = "Client name is required";
        isValid = false;
      }
      if (newClient.pan && !panRegex.test(newClient.pan)) {
        newErrors.pan = "Enter valid PAN number";
        isValid = false;
      }
    }

    // company
    if (newClient.type === "company") {
      if (!newClient.companyName.trim()) {
        newErrors.companyName = "Company name is required";
        isValid = false;
      }
      if (!newClient.contactName.trim()) {
        newErrors.contactName = "Contact person name is required";
        isValid = false;
      }
      if (newClient.gst && !gstRegex.test(newClient.gst)) {
        newErrors.gst = "Enter valid GST number";
        isValid = false;
      }
      if (newClient.pan && !panRegex.test(newClient.pan)) {
        newErrors.pan = "Enter valid PAN number";
        isValid = false;
      }
    }

    setErrors(newErrors);
    if (!isValid) return;

    // ---------------------------------------
    // -------- CREATE PAYLOAD --------------
    // ---------------------------------------

    try {
      const payload: any = {
        type: newClient.type,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        state: newClient.state,
        city: newClient.city,
        pincode: newClient.pincode,
        status: "active",
        userId: parsed?.id,
      };

      if (newClient.type === "individual") {
        payload.name = newClient.name;
        if (newClient.pan) payload.pan = newClient.pan;
      } else {
        payload.companyName = newClient.companyName;
        payload.name = newClient.contactName;
        if (newClient.gst) payload.gst = newClient.gst;
        if (newClient.pan) payload.pan = newClient.pan;
      }

      await api.clients.create(payload);
      toast2.success("Client Created Successfully");

      // reload latest list
      const updatedClients = await api.clients.getAll();
      setClients(updatedClients);


      setIsCreateDialogOpen(false);

      setNewClient({
        type: "individual",
        name: "",
        companyName: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
        state: "",
        city: "",
        pincode: "",
        gst: "",
        pan: "",
      });
    } catch (error) {
      toast2.error("Failed to create client");
    }
  };
  const [newVendor, setNewVendor] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    category: "",
  })

  const handleCreateNewClient = () => {
    if (!newClient.name || !newClient.phone) {
      toast({
        title: "Validation Error",
        description: "Client name and phone are required",
        variant: "destructive",
      })
      return
    }

    const client = api.clients.create(newClient)
    setClients([...clients, client])
    handleRecipientChange(client._id)
    setIsCreateClientOpen(false)
    setNewClient({ name: "", email: "", phone: "", address: "" })
    toast({
      title: "Success",
      description: "Client created successfully",
    })
  }

  const handleCreateNewVendor = async () => {
    if (!newVendor.name || !newVendor.phone || !newVendor.category) {
      toast({
        title: "Validation Error",
        description: "Vendor name, phone, and category are required",
        variant: "destructive",
      })
      return
    }

    const vendor = await api.vendors.create(newVendor)
    setVendors([...vendors, vendor])
    handleRecipientChange(vendor._id)
    setIsCreateVendorOpen(false)
    setNewVendor({ name: "", email: "", phone: "", address: "", category: "" })
    toast({
      title: "Success",
      description: "Vendor created successfully",
    })
  }

  // if (!hasPermission("view_purchases")) {
  //   return (
  //     <div className="text-center py-12">
  //       <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
  //       <p className="text-gray-600">You don't have permission to create payments.</p>
  //     </div>
  //   )
  // }

  // Check if tab should be disabled
  const isTabDisabled = (tabName: string) => {
    const tabIndex = tabs.indexOf(tabName)
    if (tabIndex === 0) return false // First tab always accessible

    // Check if previous tabs are valid
    if (tabIndex === 1) {
      return !invoiceData.date || !invoiceData.category || !invoiceData.amount || Number.parseFloat(invoiceData.amount) <= 0
    }
    if (tabIndex === 2) {
      return !invoiceData.recipientType || !invoiceData.recipientId
    }
    return false
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/payments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Purchase Invoice</h1>
            <p className="text-gray-600">Create a new Purchase Invoice</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList>
                <TabsTrigger value="invoice-details" className="relative">
                  Invoice Details
                </TabsTrigger>
                {/* <TabsTrigger 
                  value="recipient-details" 
                  disabled={isTabDisabled("recipient-details")}
                  className="relative disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Party Details
                  {isTabDisabled("recipient-details") && (
                    <AlertCircle className="h-3 w-3 absolute -top-1 -right-1 text-red-500" />
                  )}
                </TabsTrigger> */}
                <TabsTrigger
                  value="invoice-info"
                  disabled={isTabDisabled("invoice-info")}
                  className="relative disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bill and Expense Details
                  {isTabDisabled("invoice-info") && (
                    <AlertCircle className="h-3 w-3 absolute -top-1 -right-1 text-red-500" />
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invoice-details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>Enter basic Invoice information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="purchaseInvoiceNumber">
                          Invoice Number <span className="text-red-500">*</span>
                        </Label>
                        <Input id="purchaseInvoiceNumber" value={invoiceData.purchaseInvoiceNumber} disabled />
                        <p className="text-xs text-gray-500">Auto-generated</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">
                          Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={invoiceData.date}
                          onChange={(e) => {
                            setInvoiceData({ ...invoiceData, date: e.target.value })
                            if (validationErrors.date) {
                              setValidationErrors({ ...validationErrors, date: "" })
                            }
                          }}
                          className={validationErrors.date ? "border-red-500" : ""}
                          required
                        />
                        {validationErrors.date && (
                          <p className="text-xs text-red-500">{validationErrors.date}</p>
                        )}
                      </div>
                      <div>
                        <Label>Due Date</Label>
                        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2 flex flex-wrap gap-6">
                      {/* ledger head  */}
                      <div>
                        <Label htmlFor="category">
                          Ledger Head <span className="text-red-500">*</span>
                        </Label>

                        <Select
                          value={invoiceData.category}
                          onValueChange={(value) => {
                            setInvoiceData({ ...invoiceData, category: value });
                            if (validationErrors.category) {
                              setValidationErrors({ ...validationErrors, category: "" });
                            }
                          }}
                          required
                        >
                          <SelectTrigger className={validationErrors.category ? "border-red-500" : "w-36"}>
                            <SelectValue placeholder="Select ledger head" />
                          </SelectTrigger>

                          <SelectContent>
                            {paymentCategories.map((cat) => (
                              <SelectItem key={cat._id} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {validationErrors.category && (
                          <p className="text-xs text-red-500">{validationErrors.category}</p>
                        )}
                      </div>

                      {/* Part Type  */}
                      <div className="space-y-2">
                        <Label htmlFor="recipientType">
                          Party Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={invoiceData.recipientType}
                          onValueChange={(value: any) => {
                            setInvoiceData({
                              ...invoiceData,
                              recipientType: value,
                              recipientId: "",
                              recipientName: "",
                              recipientDetails: "",
                              recipientEmail: "",
                              recipientPhone: "",
                              recipientAddress: "",
                            })
                            if (validationErrors.recipientType) {
                              setValidationErrors({ ...validationErrors, recipientType: "" })
                            }
                          }}
                          required
                        >
                          <SelectTrigger className={validationErrors.recipientType ? "border-red-500" : "w-36"}>
                            <SelectValue placeholder="Select party type" />
                          </SelectTrigger>
                          <SelectContent>

                            <SelectItem value="client">
                              Client
                            </SelectItem>
                            <SelectItem value="vendor">
                              Vendor
                            </SelectItem>
                            <SelectItem value="team">
                              Team
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {validationErrors.recipientType && (
                          <p className="text-xs text-red-500">{validationErrors.recipientType}</p>
                        )}
                      </div>
                      {/* if client  */}
                      {invoiceData.recipientType === "client" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="client">
                              Client Name <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <ClientSelectSimple
                                  options={clients.map((client) => ({
                                    value: client._id,
                                    label: client.name || client.email,
                                  }))}
                                  value={invoiceData.recipientId}
                                  onValueChange={handleRecipientChange}
                                  placeholder="Search and select a client..."
                                  searchPlaceholder="Type to search clients..."
                                  emptyText="No clients found."
                                  className={validationErrors.recipientId ? "border-red-500" : "w-60"}
                                />
                              </div>

                              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                {
                                  (hasPermission("add_clients")) && (
                                    <DialogTrigger asChild>
                                      <Button type="button" variant="outline" size="icon">
                                        <UserPlus className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                  )
                                }

                                <DialogContent className="w-[90vw]! sm:max-w-[90vw] h-[95vh] flex flex-col p-0 gap-0">
                                  {/* HEADER */}
                                  <div className="sticky top-0 bg-white border-b px-6 py-4 z-20">
                                    <DialogHeader>
                                      <DialogTitle>Create New Client</DialogTitle>
                                      <DialogDescription>Add a new client record</DialogDescription>
                                    </DialogHeader>
                                  </div>

                                  {/* BODY */}
                                  <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
                                    <form className="space-y-6 pb-20" id="quotation-create-client-form">

                                      {/* CLIENT TYPE DROPDOWN — same as ClientsPage */}
                                      <div className="pb-4">
                                        <Label className="text-sm font-medium">Client Type</Label>
                                        <Select
                                          value={newClient.type}
                                          onValueChange={(v) =>
                                            setNewClient({ ...newClient, type: v as "individual" | "company" })
                                          }
                                        >
                                          <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select client type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="individual">Individual</SelectItem>
                                            <SelectItem value="company">Company</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* INDIVIDUAL FIELDS */}
                                      {newClient.type === "individual" && (
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                            <Label required>Client Name</Label>
                                            <Input
                                              value={newClient.name}
                                              placeholder="Client Name"
                                              onChange={(e) =>
                                                setNewClient({ ...newClient, name: e.target.value })
                                              }
                                            />
                                            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                                          </div>

                                          <div className="space-y-1">
                                            <Label>PAN</Label>
                                            <Input
                                              value={newClient.pan}
                                              placeholder="Enter PAN"
                                              onChange={(e) =>
                                                setNewClient({ ...newClient, pan: e.target.value.toUpperCase() })
                                              }
                                            />
                                            {errors.pan && <p className="text-red-500 text-sm">{errors.pan}</p>}
                                          </div>
                                        </div>
                                      )}

                                      {/* COMPANY FIELDS */}
                                      {newClient.type === "company" && (
                                        <>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                              <Label required>Company Name</Label>
                                              <Input
                                                value={newClient.companyName}
                                                placeholder="Company Name"
                                                onChange={(e) =>
                                                  setNewClient({ ...newClient, companyName: e.target.value })
                                                }
                                              />
                                              {errors.companyName && (
                                                <p className="text-red-500 text-sm">{errors.companyName}</p>
                                              )}
                                            </div>

                                            <div className="space-y-1">
                                              <Label>Contact Person *</Label>
                                              <Input
                                                value={newClient.contactName}
                                                placeholder="Contact Person Name"
                                                onChange={(e) =>
                                                  setNewClient({ ...newClient, contactName: e.target.value })
                                                }
                                              />
                                              {errors.contactName && (
                                                <p className="text-red-500 text-sm">{errors.contactName}</p>
                                              )}
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                              <Label>GST</Label>
                                              <Input
                                                value={newClient.gst}
                                                placeholder="Enter GST"
                                                onChange={(e) =>
                                                  setNewClient({ ...newClient, gst: e.target.value.toUpperCase() })
                                                }
                                              />
                                              {errors.gst && <p className="text-red-500 text-sm">{errors.gst}</p>}
                                            </div>

                                            <div className="space-y-1">
                                              <Label>PAN</Label>
                                              <Input
                                                value={newClient.pan}
                                                placeholder="Enter PAN"
                                                onChange={(e) =>
                                                  setNewClient({ ...newClient, pan: e.target.value.toUpperCase() })
                                                }
                                              />
                                              {errors.pan && <p className="text-red-500 text-sm">{errors.pan}</p>}
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      {/* COMMON FIELDS */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <Label required>Phone</Label>
                                          <Input
                                            value={newClient.phone}
                                            placeholder="Enter Phone"
                                            onChange={(e) =>
                                              setNewClient({ ...newClient, phone: e.target.value })
                                            }
                                          />
                                          {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                                        </div>

                                        <div className="space-y-1">
                                          <Label required>Email</Label>
                                          <Input
                                            type="email"
                                            value={newClient.email}
                                            placeholder="Enter Email"
                                            onChange={(e) =>
                                              setNewClient({ ...newClient, email: e.target.value })
                                            }
                                          />
                                          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <Label required>Address</Label>
                                        <Textarea
                                          rows={2}
                                          value={newClient.address}
                                          placeholder="Enter Address"
                                          onChange={(e) =>
                                            setNewClient({ ...newClient, address: e.target.value })
                                          }
                                        />
                                        {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                                      </div>

                                      <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                          <Label required>State</Label>
                                          <Input
                                            value={newClient.state}
                                            placeholder="Enter State"
                                            onChange={(e) =>
                                              setNewClient({ ...newClient, state: e.target.value })
                                            }
                                          />
                                          {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
                                        </div>

                                        <div className="space-y-1">
                                          <Label required>City</Label>
                                          <Input
                                            value={newClient.city}
                                            placeholder="Enter City"
                                            onChange={(e) =>
                                              setNewClient({ ...newClient, city: e.target.value })
                                            }
                                          />
                                          {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                                        </div>

                                        <div className="space-y-1">
                                          <Label required>Pincode</Label>
                                          <Input
                                            value={newClient.pincode}
                                            placeholder="Enter Pincode"
                                            onChange={(e) =>
                                              setNewClient({ ...newClient, pincode: e.target.value })
                                            }
                                          />
                                          {errors.pincode && (
                                            <p className="text-red-500 text-sm">{errors.pincode}</p>
                                          )}
                                        </div>
                                      </div>
                                    </form>
                                  </div>

                                  {/* FOOTER */}
                                  <div className="bg-white border-t px-6 py-4">
                                    <div className="flex justify-end space-x-2">
                                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                        Cancel
                                      </Button>
                                      <Button
                                        type="button"
                                        onClick={handleCreateClient}
                                      >
                                        Create Client
                                      </Button>

                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                            {validationErrors.recipientId && (
                              <p className="text-xs text-red-500">{validationErrors.recipientId}</p>
                            )}
                          </div>
                        </>
                      )}
                      {/* if vendor */}
                      {invoiceData.recipientType === "vendor" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="vendor">
                              Vendor Name <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <ClientSelectSimple
                                  options={vendors.map((vendor) => ({
                                    value: vendor._id,
                                    label: vendor.name,
                                  }))}
                                  value={invoiceData.recipientId}
                                  onValueChange={handleRecipientChange}
                                  placeholder="Search and select a vendor..."
                                  searchPlaceholder="Type to search vendors..."
                                  emptyText="No vendors found."
                                  className={validationErrors.recipientId ? "border-red-500" : "w-60"}
                                />
                              </div>

                              <Dialog open={isCreateVendorOpen} onOpenChange={setIsCreateVendorOpen}>
                                <DialogTrigger asChild>
                                  {
                                    (hasPermission("add_vendors")) && (
                                      <Button type="button" variant="outline" size="icon">
                                        <UserPlus className="h-4 w-4" />
                                      </Button>
                                    )
                                  }
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Create New Vendor</DialogTitle>
                                    <DialogDescription>Add a new vendor to your records</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div>
                                      <Label htmlFor="newVendorName">Vendor Name *</Label>
                                      <Input
                                        id="newVendorName"
                                        value={newVendor.name}
                                        onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                                        placeholder="Enter vendor name"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="newVendorCategory">Category *</Label>
                                      <Select
                                        value={newVendor.category}
                                        onValueChange={(value) => setNewVendor({ ...newVendor, category: value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Supplier">Supplier</SelectItem>
                                          <SelectItem value="Service Provider">Service Provider</SelectItem>
                                          <SelectItem value="Contractor">Contractor</SelectItem>
                                          <SelectItem value="Consultant">Consultant</SelectItem>
                                          <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="newVendorEmail">Email</Label>
                                      <Input
                                        id="newVendorEmail"
                                        type="email"
                                        value={newVendor.email}
                                        onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                                        placeholder="vendor@example.com"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="newVendorPhone">Phone *</Label>
                                      <Input
                                        id="newVendorPhone"
                                        value={newVendor.phone}
                                        onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                                        placeholder="+91 12345 67890"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="newVendorAddress">Address</Label>
                                      <Textarea
                                        id="newVendorAddress"
                                        value={newVendor.address}
                                        onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                                        placeholder="Enter vendor address"
                                        rows={2}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateVendorOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button type="button" onClick={handleCreateNewVendor}>
                                      Create Vendor
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                            {validationErrors.recipientId && (
                              <p className="text-xs text-red-500">{validationErrors.recipientId}</p>
                            )}
                          </div>
                        </>
                      )}
                      {/* if team */}
                      {invoiceData.recipientType === "team" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="teamMember">
                              Team Member <span className="text-red-500">*</span>
                            </Label>
                            <ClientSelectSimple
                              options={teamMembers
                                .filter((m) => m.isActive === true)
                                .map((member) => ({
                                  value: member._id,
                                  label: `${member.employeeName} ${member.middleName} ${member.surname}`,
                                }))}
                              value={invoiceData.recipientId}
                              onValueChange={handleRecipientChange}
                              placeholder="Search and select a team member..."
                              searchPlaceholder="Type to search team members..."
                              emptyText="No active team members found."
                              className={validationErrors.recipientId ? "border-red-500" : "w-60"}
                            />
                            {validationErrors.recipientId && (
                              <p className="text-xs text-red-500">{validationErrors.recipientId}</p>
                            )}
                          </div>
                        </>
                      )}

                      {invoiceData.recipientId && (
                        <div className="space-y-2">
                          <Label>Recipient Details</Label>
                          <Textarea value={invoiceData.recipientName + " " + invoiceData.recipientDetails} disabled rows={4} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={invoiceData.description}
                        onChange={(e) => setInvoiceData({ ...invoiceData, description: e.target.value })}
                        placeholder="Enter payment description"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Invoice Total Amount <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={invoiceData.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0.00"
                        className={validationErrors.amount ? "border-red-500" : ""}
                        required
                      />
                      {validationErrors.amount && (
                        <p className="text-xs text-red-500">{validationErrors.amount}</p>
                      )}
                      {amountInWords && <p className="text-sm text-gray-600 italic">{amountInWords}</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invoice-info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>Enter payment method and details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* <div className="space-y-2">
                      <Label htmlFor="paymentMethod">
                        Payment Method <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={invoiceData.paymentMethod}
                        onValueChange={(value) => {
                          setInvoiceData({ ...invoiceData, paymentMethod: value })
                          if (validationErrors.paymentMethod) {
                            setValidationErrors({ ...validationErrors, paymentMethod: "" })
                          }
                        }}
                        required
                      >
                        <SelectTrigger className={validationErrors.paymentMethod ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method._id} value={method.name}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.paymentMethod && (
                        <p className="text-xs text-red-500">{validationErrors.paymentMethod}</p>
                      )}
                    </div> */}

                    {/* {invoiceData.paymentMethod && invoiceData?.paymentMethod?.toLowerCase() != "cash" && (
                      <div className="space-y-2">
                        <Label htmlFor="bankAccount">
                          Bank Account <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={invoiceData.bankAccount}
                          onValueChange={(value) => {
                            setInvoiceData({ ...invoiceData, bankAccount: value })
                            if (validationErrors.bankAccount) {
                              setValidationErrors({ ...validationErrors, bankAccount: "" })
                            }
                          }}
                          required
                        >
                          <SelectTrigger className={validationErrors.bankAccount ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select bank account" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((account) => (
                              <SelectItem key={account._id} value={account.bankName}>
                                {account.bankName}, {account.branchName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors.bankAccount && (
                          <p className="text-xs text-red-500">{validationErrors.bankAccount}</p>
                        )}
                      </div>
                    )} */}

                    {/* {invoiceData?.paymentMethod?.toLowerCase() != "cash" && (
                      <div className="space-y-2">
                        <Label htmlFor="referenceNumber">
                          Reference Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="referenceNumber"
                          value={invoiceData.referenceNumber}
                          onChange={(e) => {
                            setInvoiceData({ ...invoiceData, referenceNumber: e.target.value })
                            if (validationErrors.referenceNumber) {
                              setValidationErrors({ ...validationErrors, referenceNumber: "" })
                            }
                          }}
                          placeholder="Enter transaction reference number"
                          className={validationErrors.referenceNumber ? "border-red-500" : ""}
                          required
                        />
                        {validationErrors.referenceNumber && (
                          <p className="text-xs text-red-500">{validationErrors.referenceNumber}</p>
                        )}
                      </div>
                    )} */}

                    {/* BILL UPLOAD */}
                    <div className="mb-2">
                      <Label>Bill Upload <span className="text-red-500">*</span></Label>

                      <ImageUpload
                        label="Bill File"
                        value={invoiceData.billFile}
                        onChange={(value) => {
                          setInvoiceData({ ...invoiceData, billFile: value })
                          if (validationErrors.billFile) {
                            setValidationErrors({ ...validationErrors, billFile: "" })
                          }
                        }}
                        previewClassName="w-32 h-32 rounded-lg"
                        allowedTypes={["image/*", "application/pdf"]}
                        maxSizeMB={10}
                      />

                      {validationErrors.billFile && (
                        <p className="text-xs text-red-500">{validationErrors.billFile}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Expense Adjustment Amount <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={invoiceData.expenseAdjustmentAmount}
                        onChange={(e) => {
                          const expenseAdj = Number.parseFloat(e.target.value || "0")
                          const amount = Number.parseFloat(invoiceData.amount || "0")

                          const balance =
                            expenseAdj > 0 ? amount - expenseAdj : amount

                          setInvoiceData({
                            ...invoiceData,
                            expenseAdjustmentAmount: e.target.value,
                            balance: balance.toFixed(2),
                          })
                        }}
                        placeholder="0.00"
                        className={validationErrors.expenseAdjustmentAmount ? "border-red-500" : ""}
                      />
                      <div className="text-sm text-gray-600">
                        Payable Amount:&nbsp;
                        <span className="font-semibold text-purple-600">
                          ₹{Number(invoiceData.balance || 0).toLocaleString()}
                        </span>
                      </div>

                      {validationErrors.expenseAdjustmentAmount && (
                        <p className="text-xs text-red-500">{validationErrors.expenseAdjustmentAmount}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Adjustment Reason</Label>
                      <Textarea
                        id="reason"
                        value={invoiceData.expenseAdjustmentReason}
                        onChange={(e) => setInvoiceData({ ...invoiceData, expenseAdjustmentReason: e.target.value })}
                        placeholder="Enter expense adjustment reason"
                        rows={2}
                      />
                    </div>
                    {/* {invoiceData?.paymentMethod?.toLowerCase() != "cash" && (
                      <div className="mt-5 mb-5"> */}



                    {/* SCREENSHOT UPLOAD */}
                    {/* <div>
                          <Label>Screenshot Upload</Label>

                          <ImageUpload
                            label="Screenshot File"
                            value={invoiceData.screenshotFile}
                            onChange={(value) => {
                              setInvoiceData({ ...invoiceData, screenshotFile: value })
                              if (validationErrors.screenshotFile) {
                                setValidationErrors({ ...validationErrors, screenshotFile: "" })
                              }
                            }}
                            previewClassName="w-32 h-32 rounded-lg"
                            allowedTypes={["image/*", "application/pdf"]}
                            maxSizeMB={10}
                          />

                          {validationErrors.screenshotFile && (
                            <p className="text-xs text-red-500">{validationErrors.screenshotFile}</p>
                          )}
                        </div>

                      </div>

                    )} */}

                    <div className="space-y-2">
                      <Label>Payment Status</Label>
                      <div>
                        <Badge variant={invoiceData.paymentStatus === "Paid" ? "default" : "secondary"}>{status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {invoiceData.paymentStatus === "Paid"
                            ? "Payment Done For this Invoice"
                            : "Will be marked as Paid until cleared in reconciliation"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Status</Label>
                      <div>
                        <Badge variant={invoiceData.invoiceStatus === "Closed" ? "default" : "secondary"}>{status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {invoiceData.invoiceStatus === "Cleared"
                            ? "Payment Done For this Invoice"
                            : "Will be marked as Paid until cleared in reconciliation"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Created By</Label>
                      <Input value={companyName || ""} disabled />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Number:</span>
                    <span className="font-medium">{invoiceData.paymentNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{invoiceData.date || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recipient Type:</span>
                    <span className="font-medium capitalize">{invoiceData.recipientType || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recipient:</span>
                    <span className="font-medium">{invoiceData.recipientName || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{invoiceData.category || "-"}</span>
                  </div>
                  {/* <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{invoiceData.paymentMethod || "-"}</span>
                  </div> */}
                  {/* {invoiceData.bankAccount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bank Account:</span>
                      <span className="font-medium text-xs">{invoiceData.bankAccount}</span>
                    </div>
                  )} */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={status === "Cleared" ? "default" : "secondary"} className="text-xs">
                      {status}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{invoiceData.amount ? Number.parseFloat(invoiceData.amount).toLocaleString() : "0.00"}
                    </span>
                  </div>
                  {amountInWords && <p className="text-xs text-gray-600 mt-2 italic">{amountInWords}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Fixed bottom action bar with Continue/Create buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard/payments">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <div className="flex gap-3">
            {!isLastTab ? (
              <Button onClick={handleContinue} size="lg" className="min-w-[200px]">
                Continue to Payment Info
              </Button>
            ) : (
              <Button onClick={handleSubmit} type="button" size="lg" className="min-w-[200px]">
                Create Payment
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
