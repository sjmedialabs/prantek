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
import { ArrowLeft, Upload, UserPlus } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { SearchableSelect } from "@/components/searchable-select"

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
  const tabs = ["payment-details", "recipient-details", "payment-info"]
  const currentTabIndex = tabs.indexOf(activeTab)
  const isLastTab = currentTabIndex === tabs.length - 1

  const [clients, setClients] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  useEffect(() => {
    setClients(api.clients.getAll())
    setVendors(api.vendors.getAll())
    setTeamMembers(api.teamMembers.getAll())
  }, [])

  const handleContinue = () => {
    if (!isLastTab) {
      setActiveTab(tabs[currentTabIndex + 1])
    }
  }

  const paymentCategories = ["Salary", "Rent", "Stationary", "Miscellaneous", "Refund", "Purchase", "Service", "Other"]
  const paymentMethods = ["Cash", "Bank Transfer", "UPI", "Check"]
  const bankAccounts = ["HDFC Bank - ****1234", "ICICI Bank - ****5678", "SBI - ****9012"]

  const handleRecipientChange = (recipientId: string) => {
    let recipient: any = null
    let details = ""

    if (paymentData.recipientType === "client") {
      recipient = clients.find((c) => c.id === recipientId)
      if (recipient) {
        details = `${recipient.address}\n${recipient.phone}\n${recipient.email}`
      }
    } else if (paymentData.recipientType === "vendor") {
      recipient = vendors.find((v) => v.id === recipientId)
      if (recipient) {
        details = `${recipient.category}\n${recipient.address}\n${recipient.phone}\n${recipient.email}`
      }
    } else if (paymentData.recipientType === "team") {
      recipient = teamMembers.find((t) => t.id === recipientId)
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
    }
  }

  const handleAmountChange = (value: string) => {
    setPaymentData({ ...paymentData, amount: value })
    if (value) {
      const num = Number.parseFloat(value)
      setAmountInWords(`${num.toLocaleString()} rupees only`)
    } else {
      setAmountInWords("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      api.payments.create({
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
    const client = api.clients.create(newClient)
    setClients([...clients, client])
    handleRecipientChange(client.id)
    setIsCreateClientOpen(false)
    setNewClient({ name: "", email: "", phone: "", address: "" })
  }

  const handleCreateNewVendor = () => {
    const vendor = api.vendors.create(newVendor)
    setVendors([...vendors, vendor])
    handleRecipientChange(vendor.id)
    setIsCreateVendorOpen(false)
    setNewVendor({ name: "", email: "", phone: "", address: "", category: "" })
  }

  if (!hasPermission("manage_payments")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to create payments.</p>
      </div>
    )
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="payment-details">Payment Details</TabsTrigger>
                <TabsTrigger value="recipient-details">Recipient Details</TabsTrigger>
                <TabsTrigger value="payment-info">Payment Info</TabsTrigger>
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
                          onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Payment Category <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={paymentData.category}
                        onValueChange={(value) => setPaymentData({ ...paymentData, category: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        required
                      />
                      {amountInWords && <p className="text-sm text-gray-600 italic">{amountInWords}</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recipient-details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recipient Details</CardTitle>
                    <CardDescription>Select who will receive this payment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientType">
                        Recipient Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={paymentData.recipientType}
                        onValueChange={(value: any) =>
                          setPaymentData({
                            ...paymentData,
                            recipientType: value,
                            recipientId: "",
                            recipientName: "",
                            recipientDetails: "",
                          })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="team">Team Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentData.recipientType === "client" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="client">
                            Client Name <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex gap-2">
                            <SearchableSelect
                              options={clients.map((client) => ({
                                value: client.id,
                                label: client.name,
                              }))}
                              value={paymentData.recipientId}
                              onValueChange={handleRecipientChange}
                              placeholder="Search and select a client..."
                              searchPlaceholder="Type to search clients..."
                              emptyText="No clients found."
                            />

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
                            <SearchableSelect
                              options={vendors.map((vendor) => ({
                                value: vendor.id,
                                label: vendor.name,
                              }))}
                              value={paymentData.recipientId}
                              onValueChange={handleRecipientChange}
                              placeholder="Search and select a vendor..."
                              searchPlaceholder="Type to search vendors..."
                              emptyText="No vendors found."
                            />

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
                        </div>
                      </>
                    )}

                    {paymentData.recipientType === "team" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="teamMember">
                            Team Member <span className="text-red-500">*</span>
                          </Label>
                          <SearchableSelect
                            options={teamMembers
                              .filter((m) => m.status === "active")
                              .map((member) => ({
                                value: member.id,
                                label: `${member.name} - ${member.role}`,
                              }))}
                            value={paymentData.recipientId}
                            onValueChange={handleRecipientChange}
                            placeholder="Search and select a team member..."
                            searchPlaceholder="Type to search team members..."
                            emptyText="No active team members found."
                          />
                        </div>
                      </>
                    )}

                    {paymentData.recipientId && (
                      <div className="space-y-2">
                        <Label>Recipient Details</Label>
                        <Textarea value={paymentData.recipientDetails} disabled rows={4} />
                      </div>
                    )}
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
                        onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {["Bank Transfer", "UPI"].includes(paymentData.paymentMethod) && (
                      <div className="space-y-2">
                        <Label htmlFor="bankAccount">
                          Bank Account <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={paymentData.bankAccount}
                          onValueChange={(value) => setPaymentData({ ...paymentData, bankAccount: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank account" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((account) => (
                              <SelectItem key={account} value={account}>
                                {account}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                          placeholder="Enter transaction reference number"
                          required
                        />
                      </div>
                    )}

                    {requiresReference && (
                      <div className="space-y-2">
                        <Label htmlFor="billUpload">
                          Bill Upload <span className="text-red-500">*</span>
                        </Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                          <Input
                            id="billUpload"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setPaymentData({ ...paymentData, billFile: e.target.files?.[0] || null })}
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
                Continue to {tabs[currentTabIndex + 1] === "recipient-details" ? "Recipient Details" : "Payment Info"}
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
