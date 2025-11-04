"use client"

import { useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CreditCard, Save, Edit2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface PaymentMethodDetails {
  enabled: boolean
  accountNumber?: string
  bankName?: string
  ifscCode?: string
  upiId?: string
  accountHolderName?: string
}

interface PaymentMethods {
  cash: PaymentMethodDetails
  bankTransfer: PaymentMethodDetails
  upi: PaymentMethodDetails
  check: PaymentMethodDetails
}

export default function PaymentMethodsPage() {
  const { hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
    cash: { enabled: true },
    bankTransfer: {
      enabled: true,
      accountNumber: "1234567890",
      bankName: "State Bank of India",
      ifscCode: "SBIN0001234",
      accountHolderName: "Company Name",
    },
    upi: { enabled: true, upiId: "company@paytm" },
    check: { enabled: false, accountHolderName: "Company Name" },
  })

  const [editDialog, setEditDialog] = useState<{
    open: boolean
    method: keyof PaymentMethods | null
    details: PaymentMethodDetails | null
  }>({
    open: false,
    method: null,
    details: null,
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleEdit = (method: keyof PaymentMethods) => {
    setEditDialog({
      open: true,
      method,
      details: { ...paymentMethods[method] },
    })
  }

  const handleSaveEdit = () => {
    if (editDialog.method && editDialog.details) {
      setPaymentMethods({
        ...paymentMethods,
        [editDialog.method]: editDialog.details,
      })
      setEditDialog({ open: false, method: null, details: null })
    }
  }

  const updateDetail = (key: string, value: string) => {
    if (editDialog.details) {
      setEditDialog({
        ...editDialog,
        details: { ...editDialog.details, [key]: value },
      })
    }
  }

  const getMethodName = (method: keyof PaymentMethods) => {
    const names = {
      cash: "Cash",
      bankTransfer: "Bank Transfer",
      upi: "UPI",
      check: "Check",
    }
    return names[method]
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
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600">Configure available payment methods for transactions</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Payment methods saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Available Payment Methods
          </CardTitle>
          <CardDescription>Enable or disable payment methods for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label className="text-base font-medium">Cash</Label>
              <p className="text-sm text-gray-600">Accept cash payments</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit("cash")}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Switch
                checked={paymentMethods.cash.enabled}
                onCheckedChange={(checked) =>
                  setPaymentMethods({ ...paymentMethods, cash: { ...paymentMethods.cash, enabled: checked } })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label className="text-base font-medium">Bank Transfer</Label>
              <p className="text-sm text-gray-600">Accept direct bank transfers</p>
              {paymentMethods.bankTransfer.accountNumber && (
                <p className="text-xs text-gray-500 mt-1">
                  A/C: {paymentMethods.bankTransfer.accountNumber} | {paymentMethods.bankTransfer.bankName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit("bankTransfer")}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Switch
                checked={paymentMethods.bankTransfer.enabled}
                onCheckedChange={(checked) =>
                  setPaymentMethods({
                    ...paymentMethods,
                    bankTransfer: { ...paymentMethods.bankTransfer, enabled: checked },
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label className="text-base font-medium">UPI</Label>
              <p className="text-sm text-gray-600">Accept UPI payments</p>
              {paymentMethods.upi.upiId && (
                <p className="text-xs text-gray-500 mt-1">UPI ID: {paymentMethods.upi.upiId}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit("upi")}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Switch
                checked={paymentMethods.upi.enabled}
                onCheckedChange={(checked) =>
                  setPaymentMethods({ ...paymentMethods, upi: { ...paymentMethods.upi, enabled: checked } })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label className="text-base font-medium">Check</Label>
              <p className="text-sm text-gray-600">Accept check payments</p>
              {paymentMethods.check.accountHolderName && (
                <p className="text-xs text-gray-500 mt-1">Payable to: {paymentMethods.check.accountHolderName}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit("check")}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Switch
                checked={paymentMethods.check.enabled}
                onCheckedChange={(checked) =>
                  setPaymentMethods({ ...paymentMethods, check: { ...paymentMethods.check, enabled: checked } })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, method: null, details: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit {editDialog.method && getMethodName(editDialog.method)}</DialogTitle>
            <DialogDescription>Update payment method details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editDialog.method === "cash" && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Cash payments don't require additional configuration.</p>
              </div>
            )}

            {editDialog.method === "bankTransfer" && editDialog.details && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    value={editDialog.details.accountHolderName || ""}
                    onChange={(e) => updateDetail("accountHolderName", e.target.value)}
                    placeholder="Enter account holder name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={editDialog.details.bankName || ""}
                    onChange={(e) => updateDetail("bankName", e.target.value)}
                    placeholder="Enter bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={editDialog.details.accountNumber || ""}
                    onChange={(e) => updateDetail("accountNumber", e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={editDialog.details.ifscCode || ""}
                    onChange={(e) => updateDetail("ifscCode", e.target.value)}
                    placeholder="Enter IFSC code"
                  />
                </div>
              </>
            )}

            {editDialog.method === "upi" && editDialog.details && (
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  value={editDialog.details.upiId || ""}
                  onChange={(e) => updateDetail("upiId", e.target.value)}
                  placeholder="Enter UPI ID (e.g., company@paytm)"
                />
              </div>
            )}

            {editDialog.method === "check" && editDialog.details && (
              <div className="space-y-2">
                <Label htmlFor="checkAccountHolder">Payable To (Account Holder Name)</Label>
                <Input
                  id="checkAccountHolder"
                  value={editDialog.details.accountHolderName || ""}
                  onChange={(e) => updateDetail("accountHolderName", e.target.value)}
                  placeholder="Enter name for check payments"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, method: null, details: null })}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
