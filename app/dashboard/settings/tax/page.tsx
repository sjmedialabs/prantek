"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Save, Plus, Edit2, Power, PowerOff } from "lucide-react"
import { dataStore, type TaxSettings, type TaxRate } from "@/lib/data-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function TaxDetailsPage() {
  const { hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    tanNumber: "",
    tanDocument: null,
    gstNumber: "",
    gstDocument: null,
    updatedAt: new Date().toISOString(),
  })
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null)
  const [rateData, setRateData] = useState({
    type: "CGST" as "CGST" | "SGST" | "IGST",
    rate: "",
    description: "",
  })

  useEffect(() => {
    const loadTaxData = async () => {
      const settings = await dataStore.getTaxSettings()
      setTaxSettings(settings)
      const rates = await dataStore.getAllTaxRates()
      setTaxRates(rates)
    }
    loadTaxData()
  }, [])

  const handleSaveSettings = async () => {
    await dataStore.saveTaxSettings(taxSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleTanDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setTaxSettings({ ...taxSettings, tanDocument: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGstDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setTaxSettings({ ...taxSettings, gstDocument: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveRate = async () => {
    if (!rateData.rate || !rateData.description) {
      alert("Please fill in all fields")
      return
    }

    if (editingRate) {
      const updated = await dataStore.updateTaxRate(editingRate.id, {
        ...rateData,
        rate: Number.parseFloat(rateData.rate),
      })
      if (updated) {
        setTaxRates(taxRates.map((rate) => (rate.id === updated.id ? updated : rate)))
      }
    } else {
      const newRate = await dataStore.createTaxRate({
        ...rateData,
        rate: Number.parseFloat(rateData.rate),
        isActive: true,
      })
      setTaxRates([...taxRates, newRate])
    }

    setIsDialogOpen(false)
    resetRateForm()
  }

  const resetRateForm = () => {
    setRateData({
      type: "CGST",
      rate: "",
      description: "",
    })
    setEditingRate(null)
  }

  const handleEditRate = (rate: TaxRate) => {
    setEditingRate(rate)
    setRateData({
      type: rate.type,
      rate: rate.rate.toString(),
      description: rate.description,
    })
    setIsDialogOpen(true)
  }

  const handleToggleRateStatus = async (rate: TaxRate) => {
    const updated = await dataStore.updateTaxRate(rate.id, {
      isActive: !rate.isActive,
    })
    if (updated) {
      setTaxRates(taxRates.map((r) => (r.id === updated.id ? updated : r)))
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
          <h1 className="text-2xl font-bold text-gray-900">Tax Settings</h1>
          <p className="text-gray-600">Manage your tax registration and rates</p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Tax settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Tax Registration Information
          </CardTitle>
          <CardDescription>Enter your TAN and GST details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanNumber">TAN Number</Label>
              <Input
                id="tanNumber"
                value={taxSettings.tanNumber}
                onChange={(e) => setTaxSettings({ ...taxSettings, tanNumber: e.target.value })}
                placeholder="Enter TAN number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanDocument">TAN Document</Label>
              <Input id="tanDocument" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleTanDocumentUpload} />
              {taxSettings.tanDocument && <p className="text-sm text-green-600">Document uploaded</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={taxSettings.gstNumber}
                onChange={(e) => setTaxSettings({ ...taxSettings, gstNumber: e.target.value })}
                placeholder="Enter GST number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstDocument">GST Document</Label>
              <Input id="gstDocument" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleGstDocumentUpload} />
              {taxSettings.gstDocument && <p className="text-sm text-green-600">Document uploaded</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tax Rates</CardTitle>
              <CardDescription>Manage CGST, SGST, and IGST rates</CardDescription>
            </div>
            <Button
              onClick={() => {
                resetRateForm()
                setIsDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tax Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {taxRates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tax rates configured. Click "Add Tax Rate" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate (%)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      <Badge variant="outline">{rate.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{rate.rate}%</TableCell>
                    <TableCell>{rate.description}</TableCell>
                    <TableCell>
                      <Badge variant={rate.isActive ? "default" : "secondary"}>
                        {rate.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditRate(rate)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleRateStatus(rate)}>
                          {rate.isActive ? (
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRate ? "Edit Tax Rate" : "Add Tax Rate"}</DialogTitle>
            <DialogDescription>Configure tax rate for products and services</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tax Type</Label>
              <Select
                value={rateData.type}
                onValueChange={(value: "CGST" | "SGST" | "IGST") => setRateData({ ...rateData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CGST">CGST</SelectItem>
                  <SelectItem value="SGST">SGST</SelectItem>
                  <SelectItem value="IGST">IGST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={rateData.rate}
                onChange={(e) => setRateData({ ...rateData, rate: e.target.value })}
                placeholder="e.g., 5, 12, 18"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={rateData.description}
                onChange={(e) => setRateData({ ...rateData, description: e.target.value })}
                placeholder="e.g., Standard rate for goods"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                resetRateForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRate}>{editingRate ? "Update Rate" : "Add Rate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
