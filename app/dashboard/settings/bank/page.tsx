"use client"
import { toast } from "@/lib/toast"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Landmark, Save, Upload, Plus, Edit2, Power, PowerOff } from "lucide-react"
import { api } from "@/lib/api-client"
import FileUpload from "@/components/file-upload"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface BankAccount {
  id: string
  _id: string
  bankName: string
  branchName: string
  accountName: string
  accountNumber: string
  ifscCode: string
  upiId: string
  upiScanner: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function BankAccountPage() {
  const { loading, hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const [bankData, setBankData] = useState({
    bankName: "",
    branchName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    upiScanner: "",
  })
  const [errors, setErrors] = useState({
    bankName: false,
    branchName: false,
    accountName: false,
    accountNumber: false,
    ifscCode: false,
    // upiId: false,
  })

  useEffect(() => {
    const loadAccounts = async () => {
      const accounts = await api.bankAccounts.getAll()
      setBankAccounts(accounts)
    }
    loadAccounts()
  }, [])
  const validateAccountNumber = (num: string) => {
    return /^[0-9]{9,18}$/.test(num)   // bank account numbers are 9–18 digits
  }

  const validateIFSC = (ifsc: string) => {
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())
  }

  const validateUPI = (upi: string) => {
    return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi)
  }

  const isDuplicateAccountNumber = (
    bankName: string,
    accountNumber: string,
    accounts: any[],
    editingId?: string
  ) => {
    return accounts.some(
      (acc) =>
        acc.bankName.trim().toLowerCase() === bankName.trim().toLowerCase() && // same bank
        acc.accountNumber.trim() === accountNumber.trim() &&                    // same account number
        acc._id !== editingId                                                   // ignore self when editing
    )
  }
  const handleSave = async () => {
    const newErrors = {
      bankName: !bankData.bankName.trim(),
      accountNumber: !validateAccountNumber(bankData.accountNumber),
      accountName: !bankData.accountName.trim(),
      branchName: !bankData.branchName.trim(),
      ifscCode: !validateIFSC(bankData.ifscCode || ""),
      // upiId: !validateUPI(bankData.upiId || "")
    }

    // 🔥 CHECK FOR DUPLICATE ACCOUNT NUMBER
    const isDuplicate = isDuplicateAccountNumber(
      bankData.bankName,
      bankData.accountNumber,
      bankAccounts,
      editingAccount?._id
    )

    if (isDuplicate) {
      newErrors.accountNumber = true

      toast({
        title: "Duplicate Account Number",
        description: "This account number already exists. Please enter a unique one.",
        variant: "destructive",
      })

      setErrors(newErrors)
      return
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some((e) => e)) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted fields",
        variant: "destructive",
      })
      return
    }

    // ---- UPDATE EXISTING ACCOUNT ----
    if (editingAccount) {
      const updated = await api.bankAccounts.update(editingAccount._id, {
        ...bankData
      })

      if (updated) {
        setBankAccounts(bankAccounts.map((acc) => (acc._id === updated._id ? updated : acc)))
      }
    }

    // ---- CREATE NEW ACCOUNT ----
    else {
      const newAccount = await api.bankAccounts.create({
        ...bankData,
        isActive: true,
      })

      setBankAccounts([...bankAccounts, newAccount])
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setIsDialogOpen(false)
    toast({ title: "Success", description: "Account saved successfully!", variant: "success" })

    resetForm()
    window.location.reload()
  }

  const resetForm = () => {
    setBankData({
      bankName: "",
      branchName: "",
      accountName: "",
      accountNumber: "",
      ifscCode: "",
      upiId: "",
      upiScanner: "",
    })
    setEditingAccount(null)
  }
  const startIndex = (page - 1) * itemsPerPage
  const paginatedAccounts = bankAccounts.slice(startIndex, startIndex + itemsPerPage)

  const totalPages = Math.ceil(bankAccounts.length / itemsPerPage)

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setBankData({
      bankName: account.bankName,
      branchName: account.branchName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      upiId: account.upiId,
      upiScanner: account.upiScanner || "",
    })
    setIsDialogOpen(true)
  }

  const handleToggleStatus = async (account: BankAccount) => {
    const updated = await api.bankAccounts.update(account._id, {
      isActive: !account.isActive,
    })
    if (updated) {
      setBankAccounts(bankAccounts.map((acc) => (acc._id === updated._id ? updated : acc)))
    }
    toast({ title: "Success", description: "Account status updated successfully!", variant: "success" })
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company details...</p>
        </div>
      </div>
    )
  }
  if (!hasPermission("tenant_settings")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-gray-600">Manage your bank accounts and payment details</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Bank account saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Landmark className="h-5 w-5 mr-2" />
            Accounts List ({paginatedAccounts.length})
          </CardTitle>
          <CardDescription>View and manage all your bank accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bank accounts added yet. Click "Add Bank Account" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>IFSC Code</TableHead>
                  <TableHead>Account Holder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAccounts.map((account, index) => (
                  <TableRow key={account?.id || account?._id || index}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">{account?.bankName}</TableCell>
                    <TableCell>{account?.branchName}</TableCell>
                    <TableCell>{account?.accountNumber}</TableCell>
                    <TableCell>{account?.ifscCode}</TableCell>
                    <TableCell>{account?.accountName}</TableCell>
                    <TableCell>
                      <Badge variant={account?.isActive ? "default" : "secondary"}>
                        {account?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(account)}>
                          {account?.isActive ? (
                            <PowerOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Power className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-between items-center py-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>

        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[90vw]! sm:max-w-[90vw] h-[95vh] flex flex-col p-0 gap-0">
          <DialogHeader className="sticky top-0 bg-white border-b px-6 py-4 z-20">
            <DialogTitle>{editingAccount ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Update bank account details" : "Enter bank account details for transactions"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName" required>Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankData?.bankName}
                    className={errors.bankName ? "border-red-500" : ""}
                    onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                    placeholder="Enter bank name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchName" required>Branch</Label>
                  <Input
                    id="branchName"
                    className={errors.branchName ? "border-red-500" : ""}
                    value={bankData?.branchName}
                    onChange={(e) => setBankData({ ...bankData, branchName: e.target.value })}
                    placeholder="Enter branch name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName" required>Bank Account Name</Label>
                <Input
                  id="accountName"
                  className={errors.accountName ? "border-red-500" : ""}
                  value={bankData?.accountName}
                  onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })}
                  placeholder="Account holder name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" required>Bank Account Number </Label>
                  <Input
                    id="accountNumber"
                    className={errors.accountNumber ? "border-red-500" : ""}
                    value={bankData?.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode" required>IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    className={errors.ifscCode ? "border-red-500" : ""}
                    value={bankData?.ifscCode}
                    onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value })}
                    placeholder="Enter IFSC code"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  // className={errors.upiId ? "border-red-500" : ""}
                  value={bankData?.upiId}
                  onChange={(e) => setBankData({ ...bankData, upiId: e.target.value })}
                  placeholder="yourname@upi"
                />
              </div>

              <div className="space-y-2 mb-[75px]">
                <Label>UPI Scanner (QR Code)</Label>
                <FileUpload
                  value={bankData.upiScanner}
                  onChange={(url) => setBankData({ ...bankData, upiScanner: url })}
                  className="w-20 h-20"
                  accept="image/*"
                  placeholder="Upload UPI QR code"
                />
                {/* <p className="text-sm text-gray-500 mt-1 max-w-20 px-2">Upload UPI QR code for payments</p> */}
              </div>
            </div>
          </div>

          <DialogFooter className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-4 z-30 shadow-lg">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {editingAccount ? "Update Account" : "Save Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
