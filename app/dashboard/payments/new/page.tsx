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

export default function NewPaymentPage() {
  const router = useRouter()
  const { user, hasPermission } = useUser()
  const { toast } = useToast()

  const [paymentData, setPaymentData] = useState({
    paymentNumber: `PAY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
    date: new Date().toISOString().split("T")[0],
    recipientType: "" as "client" | "vendor" | "team" | "",
    recipientId: "",
    recipientName: "",
    recipientDetails: "",
    category: "",
    description: "",
    amount: "",
    paymentMethod: "",
    bankAccount: "",
    referenceNumber: "",
    billFile: null as File | null,
  })
  const [amountInWords, setAmountInWords] = useState("")
  const [activeTab, setActiveTab] = useState("payment-details")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const tabs = ["payment-details", "payment-info"]
  const currentTabIndex = tabs.indexOf(activeTab)
  const isLastTab = currentTabIndex === tabs.length - 1;
  const [paymentCategories, setPaymentCategories] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [recipientTypes, setRecipientTypes] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, vendorsData, teamData, recipientTypesData, paymentCategories, paymentMethods, bankAccounts] = await Promise.all([
          api.clients.getAll(),
          api.vendors.getAll(),
          api.employees.getAll(),
          api.recipientTypes.getAll(),
          api.paymentCategories.getAll(),
          api.paymentMethods.getAll(),
          api.bankAccounts.getAll(),
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
const activeRecipientTypes = recipientTypesData.filter((t) => t.isEnabled);

const uniqueRecipientTypes = Array.from(
  new Map(
    activeRecipientTypes
      .filter((t) => t.value)  // remove items missing value
      .map((t) => [t.value.toLowerCase(), t])
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
  const validatePaymentDetails = (): boolean => {
    const errors: Record<string, string> = {}

    if (!paymentData.date && !paymentData.category) {
      errors.date = "Date is required"
    }
    if (!paymentData.amount || Number.parseFloat(paymentData.amount) <= 0) {
      errors.amount = "Valid amount is required"
    }

    if (!paymentData.recipientType) {
      errors.recipientType = "Recipient type is required"
    }
    if (!paymentData.recipientId) {
      errors.recipientId = "Recipient must be selected"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // const validateRecipientDetails = (): boolean => {
  //   const errors: Record<string, string> = {}

  //   if (!paymentData.recipientType) {
  //     errors.recipientType = "Recipient type is required"
  //   }
  //   if (!paymentData.recipientId) {
  //     errors.recipientId = "Recipient must be selected"
  //   }

  //   setValidationErrors(errors)
  //   return Object.keys(errors).length === 0
  // }

  const validatePaymentInfo = (): boolean => {
    const errors: Record<string, string> = {}

    if (!paymentData.paymentMethod) {
      errors.paymentMethod = "Payment method is required"
    }

    const requiresReference = ["Bank Transfer", "UPI", "Check"].includes(paymentData.paymentMethod)

    if (requiresReference && !paymentData.referenceNumber) {
      errors.referenceNumber = "Reference number is required for this payment method"
    }

    if (["Bank Transfer", "UPI"].includes(paymentData.paymentMethod) && !paymentData.bankAccount) {
      errors.bankAccount = "Bank account is required for this payment method"
    }

    if (requiresReference && !paymentData.billFile) {
      errors.billFile = "Bill upload is required for this payment method"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleContinue = () => {
    const isValid = validatePaymentDetails();

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields in Payment Details",
        variant: "destructive",
      });
      return;
    }

    setActiveTab("payment-info");
  };


  const handleTabChange = (newTab: string) => {
    if (newTab === "payment-info" && !validatePaymentDetails()) {
      toast({
        title: "Validation Required",
        description: "Please complete Payment Details before proceeding",
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

    if (paymentData.recipientType === "client") {
      recipient = clients.find((c) => c._id === recipientId)
      if (recipient) {
        details = `${recipient.address}\n${recipient.phone}\n${recipient.email}`
      }
    } else if (paymentData.recipientType === "vendor") {
      recipient = vendors.find((v) => v._id === recipientId)
      if (recipient) {
        details = `${recipient.category}\n${recipient.address}\n${recipient.phone}\n${recipient.email}`
      }
    } else if (paymentData.recipientType === "team") {
      recipient = teamMembers.find((t) => t._id === recipientId)
      if (recipient) {
        details = `${recipient.role}\n${recipient.department || "N/A"}\n${recipient.phone}\n${recipient.email}`
      }
    }

    if (recipient) {
      setPaymentData({
        ...paymentData,
        recipientId,
        recipientName: recipient.name,
        recipientDetails: details,
      })
      // Clear recipient validation error
      if (validationErrors.recipientId) {
        setValidationErrors({ ...validationErrors, recipientId: "" })
      }
    }
  }

  const handleAmountChange = (value: string) => {
    setPaymentData({ ...paymentData, amount: value })
    if (value) {
      const num = Number.parseFloat(value)
      setAmountInWords(`${num.toLocaleString()} rupees only`)
      // Clear amount validation error
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
    const isPaymentDetailsValid = validatePaymentDetails()
    // const isRecipientDetailsValid = validateRecipientDetails()
    const isPaymentInfoValid = validatePaymentInfo()

    if (!isPaymentDetailsValid || !isPaymentInfoValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields across all tabs",
        variant: "destructive",
      })

      // Navigate to first tab with errors
      if (!isPaymentDetailsValid) {
        setActiveTab("payment-details")
      } else if (!isPaymentInfoValid) {
        setActiveTab("payment-info")
      }
      return
    }

    try {
      api.payments.create({
        userId: user?.id || "",
        paymentNumber: paymentData.paymentNumber,
        recipientType: paymentData.recipientType as "client" | "vendor" | "team",
        recipientId: paymentData.recipientId,
        recipientName: paymentData.recipientName,
        date: paymentData.date,
        amount: Number.parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod as any,
        category: paymentData.category,
        description: paymentData.description,
        status: paymentData.paymentMethod === "Cash" ? "completed" : "pending",
        bankAccount: paymentData.bankAccount,
        referenceNumber: paymentData.referenceNumber,
        createdBy: user?.id || "",
      })

      toast({
        title: "Payment Created",
        description: `Payment ${paymentData.paymentNumber} has been created successfully.`,
      })

      router.push("/dashboard/payments")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const requiresReference = ["Bank Transfer", "UPI", "Check"].includes(paymentData.paymentMethod)
  const status = paymentData.paymentMethod === "Cash" ? "Cleared" : "Paid"

  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false)
  const [isCreateVendorOpen, setIsCreateVendorOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })
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

  const handleCreateNewVendor = () => {
    if (!newVendor.name || !newVendor.phone || !newVendor.category) {
      toast({
        title: "Validation Error",
        description: "Vendor name, phone, and category are required",
        variant: "destructive",
      })
      return
    }

    const vendor = api.vendors.create(newVendor)
    setVendors([...vendors, vendor])
    handleRecipientChange(vendor._id)
    setIsCreateVendorOpen(false)
    setNewVendor({ name: "", email: "", phone: "", address: "", category: "" })
    toast({
      title: "Success",
      description: "Vendor created successfully",
    })
  }

  if (!hasPermission("manage_payments")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to create payments.</p>
      </div>
    )
  }

  // Check if tab should be disabled
  const isTabDisabled = (tabName: string) => {
    const tabIndex = tabs.indexOf(tabName)
    if (tabIndex === 0) return false // First tab always accessible

    // Check if previous tabs are valid
    if (tabIndex === 1) {
      return !paymentData.date || !paymentData.category || !paymentData.amount || Number.parseFloat(paymentData.amount) <= 0
    }
    if (tabIndex === 2) {
      return !paymentData.recipientType || !paymentData.recipientId
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
            <h1 className="text-2xl font-bold text-gray-900">New Payment</h1>
            <p className="text-gray-600">Create a new payment transaction</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList>
                <TabsTrigger value="payment-details" className="relative">
                  Payment Details
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
                  value="payment-info"
                  disabled={isTabDisabled("payment-info")}
                  className="relative disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Payment Info
                  {isTabDisabled("payment-info") && (
                    <AlertCircle className="h-3 w-3 absolute -top-1 -right-1 text-red-500" />
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="payment-details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                    <CardDescription>Enter basic payment information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paymentNumber">
                          Payment Number <span className="text-red-500">*</span>
                        </Label>
                        <Input id="paymentNumber" value={paymentData.paymentNumber} disabled />
                        <p className="text-xs text-gray-500">Auto-generated</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">
                          Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={paymentData.date}
                          onChange={(e) => {
                            setPaymentData({ ...paymentData, date: e.target.value })
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
                    </div>

                    <div className="space-y-2 flex flex-wrap gap-6">
                      <div>
                        <Label htmlFor="category">
                          Ledger Head <span className="text-red-500">*</span>
                        </Label>

                        <Select
                          value={paymentData.category}
                          onValueChange={(value) => {
                            setPaymentData({ ...paymentData, category: value });
                            if (validationErrors.category) {
                              setValidationErrors({ ...validationErrors, category: "" });
                            }
                          }}
                          required
                        >
                          <SelectTrigger className={validationErrors.category ? "border-red-500" : ""}>
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


                      <div className="space-y-2">
                        <Label htmlFor="recipientType">
                          Party Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={paymentData.recipientType}
                          onValueChange={(value: any) => {
                            setPaymentData({
                              ...paymentData,
                              recipientType: value,
                              recipientId: "",
                              recipientName: "",
                              recipientDetails: "",
                            })
                            if (validationErrors.recipientType) {
                              setValidationErrors({ ...validationErrors, recipientType: "" })
                            }
                          }}
                          required
                        >
                          <SelectTrigger className={validationErrors.recipientType ? "border-red-500" : ""}>
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

                      {paymentData.recipientType === "client" && (
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
                                  value={paymentData.recipientId}
                                  onValueChange={handleRecipientChange}
                                  placeholder="Search and select a client..."
                                  searchPlaceholder="Type to search clients..."
                                  emptyText="No clients found."
                                  className={validationErrors.recipientId ? "border-red-500" : ""}
                                />
                              </div>

                              <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
                                <DialogTrigger asChild>
                                  <Button type="button" variant="outline" size="icon">
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Create New Client</DialogTitle>
                                    <DialogDescription>Add a new client to your records</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div>
                                      <Label htmlFor="newClientName">Client Name *</Label>
                                      <Input
                                        id="newClientName"
                                        value={newClient.name}
                                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                        placeholder="Enter client name"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="newClientEmail">Email</Label>
                                      <Input
                                        id="newClientEmail"
                                        type="email"
                                        value={newClient.email}
                                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                        placeholder="client@example.com"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="newClientPhone">Phone *</Label>
                                      <Input
                                        id="newClientPhone"
                                        value={newClient.phone}
                                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                        placeholder="+91 12345 67890"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="newClientAddress">Address</Label>
                                      <Textarea
                                        id="newClientAddress"
                                        value={newClient.address}
                                        onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                                        placeholder="Enter client address"
                                        rows={2}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateClientOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button type="button" onClick={handleCreateNewClient}>
                                      Create Client
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

                      {paymentData.recipientType === "vendor" && (
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
                                  value={paymentData.recipientId}
                                  onValueChange={handleRecipientChange}
                                  placeholder="Search and select a vendor..."
                                  searchPlaceholder="Type to search vendors..."
                                  emptyText="No vendors found."
                                  className={validationErrors.recipientId ? "border-red-500" : ""}
                                />
                              </div>

                              <Dialog open={isCreateVendorOpen} onOpenChange={setIsCreateVendorOpen}>
                                <DialogTrigger asChild>
                                  <Button type="button" variant="outline" size="icon">
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
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

                      {paymentData.recipientType === "team" && (
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
                              value={paymentData.recipientId}
                              onValueChange={handleRecipientChange}
                              placeholder="Search and select a team member..."
                              searchPlaceholder="Type to search team members..."
                              emptyText="No active team members found."
                              className={validationErrors.recipientId ? "border-red-500" : ""}
                            />
                            {validationErrors.recipientId && (
                              <p className="text-xs text-red-500">{validationErrors.recipientId}</p>
                            )}
                          </div>
                        </>
                      )}

                      {paymentData.recipientId && (
                        <div className="space-y-2">
                          <Label>Recipient Details</Label>
                          <Textarea value={paymentData.recipientDetails} disabled rows={4} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={paymentData.description}
                        onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                        placeholder="Enter payment description"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Amount <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={paymentData.amount}
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

              <TabsContent value="payment-info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>Enter payment method and details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">
                        Payment Method <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={paymentData.paymentMethod}
                        onValueChange={(value) => {
                          setPaymentData({ ...paymentData, paymentMethod: value })
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
                    </div>

                    {["Bank Transfer", "UPI"].includes(paymentData.paymentMethod) && (
                      <div className="space-y-2">
                        <Label htmlFor="bankAccount">
                          Bank Account <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={paymentData.bankAccount}
                          onValueChange={(value) => {
                            setPaymentData({ ...paymentData, bankAccount: value })
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
                    )}

                    {requiresReference && (
                      <div className="space-y-2">
                        <Label htmlFor="referenceNumber">
                          Reference Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="referenceNumber"
                          value={paymentData.referenceNumber}
                          onChange={(e) => {
                            setPaymentData({ ...paymentData, referenceNumber: e.target.value })
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
                    )}

                    {requiresReference && (
                      <div className="space-y-2">
                        <Label htmlFor="billUpload">
                          Bill Upload <span className="text-red-500">*</span>
                        </Label>
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center ${validationErrors.billFile ? "border-red-500" : "border-gray-300"}`}>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                          <Input
                            id="billUpload"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              setPaymentData({ ...paymentData, billFile: e.target.files?.[0] || null })
                              if (validationErrors.billFile) {
                                setValidationErrors({ ...validationErrors, billFile: "" })
                              }
                            }}
                            className="hidden"
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("billUpload")?.click()}
                          >
                            Choose File
                          </Button>
                          {paymentData.billFile && (
                            <p className="text-sm text-green-600 mt-2">{paymentData.billFile.name}</p>
                          )}
                        </div>
                        {validationErrors.billFile && (
                          <p className="text-xs text-red-500">{validationErrors.billFile}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div>
                        <Badge variant={status === "Cleared" ? "default" : "secondary"}>{status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {status === "Cleared"
                            ? "Cash payments are automatically cleared"
                            : "Will be marked as Paid until cleared in reconciliation"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Created By</Label>
                      <Input value={user?.name || ""} disabled />
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
                    <span className="font-medium">{paymentData.paymentNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{paymentData.date || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recipient Type:</span>
                    <span className="font-medium capitalize">{paymentData.recipientType || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recipient:</span>
                    <span className="font-medium">{paymentData.recipientName || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{paymentData.category || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{paymentData.paymentMethod || "-"}</span>
                  </div>
                  {paymentData.bankAccount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bank Account:</span>
                      <span className="font-medium text-xs">{paymentData.bankAccount}</span>
                    </div>
                  )}
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
                      ₹{paymentData.amount ? Number.parseFloat(paymentData.amount).toLocaleString() : "0.00"}
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
