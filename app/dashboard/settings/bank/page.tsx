"use client"

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
  const { hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [bankData, setBankData] = useState({
    bankName: "",
    branchName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    upiScanner: null as File | null,
  })

  useEffect(() => {
    const loadAccounts = async () => {
      const accounts = await api.bankAccounts.getAll()
      setBankAccounts(accounts)
    }
    loadAccounts()
  }, [])

  const handleSave = async () => {
    if (!bankData.bankName || !bankData.accountNumber) {
      alert("Please fill in required fields")
      return
    }

    if (editingAccount) {
      // Update existing account
      const updated = await api.bankAccounts.update( editingAccount.id, {
        ...bankData,
        upiScanner: bankData.upiScanner ? URL.createObjectURL(bankData.upiScanner) : editingAccount.upiScanner,
      })
      if (updated) {
        setBankAccounts(bankAccounts.map((acc) => (acc.id === updated.id ? updated : acc)))
      }
    } else {
      // Create new account
      const newAccount = await api.bankAccounts.create( {
        ...bankData,
        upiScanner: bankData.upiScanner ? URL.createObjectURL(bankData.upiScanner) : null,
        isActive: true,
      })
      setBankAccounts([...bankAccounts, newAccount])
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setBankData({
      bankName: "",
      branchName: "",
      accountName: "",
      accountNumber: "",
      ifscCode: "",
      upiId: "",
      upiScanner: null,
    })
    setEditingAccount(null)
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setBankData({
      bankName: account.bankName,
      branchName: account.branchName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      upiId: account.upiId,
      upiScanner: null,
    })
    setIsDialogOpen(true)
  }

  const handleToggleStatus = async (account: BankAccount) => {
    const updated = await api.bankAccounts.update( account.id, {
      isActive: !account.isActive,
    })
    if (updated) {
      setBankAccounts(bankAccounts.map((acc) => (acc.id === updated.id ? updated : acc)))
    }
  }

  const handleScannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBankData({ ...bankData, upiScanner: e.target.files[0] })
    }
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
            Bank Accounts List
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
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>IFSC Code</TableHead>
                  <TableHead>Account Holder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.bankName}</TableCell>
                    <TableCell>{account.accountNumber}</TableCell>
                    <TableCell>{account.ifscCode}</TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? "default" : "secondary"}>
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(account)}>
                          {account.isActive ? (
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="!w-[90vw] sm:max-w-[90vw] h-[95vh] flex flex-col p-0 gap-0">
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
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={bankData.bankName}
                    onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                    placeholder="Enter bank name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={bankData.branchName}
                    onChange={(e) => setBankData({ ...bankData, branchName: e.target.value })}
                    placeholder="Enter branch name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Bank Account Name</Label>
                <Input
                  id="accountName"
                  value={bankData.accountName}
                  onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })}
                  placeholder="Account holder name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Bank Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={bankData.ifscCode}
                    onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value })}
                    placeholder="Enter IFSC code"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  value={bankData.upiId}
                  onChange={(e) => setBankData({ ...bankData, upiId: e.target.value })}
                  placeholder="yourname@upi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upiScanner">UPI Scanner (QR Code)</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    {bankData.upiScanner ? (
                      <img
                        src={URL.createObjectURL(bankData.upiScanner) || "/placeholder.svg"}
                        alt="QR Code"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : editingAccount?.upiScanner ? (
                      <img
                        src={editingAccount.upiScanner || "/placeholder.svg"}
                        alt="QR Code"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Input
                      id="upiScanner"
                      type="file"
                      accept="image/*"
                      onChange={handleScannerUpload}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-gray-500 mt-1">Upload UPI QR code for payments</p>
                  </div>
                </div>
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
