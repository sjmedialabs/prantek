"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { dataStore } from "@/lib/data-store"

interface Client {
  id: string
  clientNumber: string
  clientName: string
  email: string
  phone: string
  address: string
  bankAccount?: string
  upiId?: string
  startDate?: string
  status: string
}

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    phone: "",
    address: "",
    bankAccount: "",
    upiId: "",
  })

  useEffect(() => {
    const loadClient = async () => {
      if (params.id) {
        try {
          const client = await dataStore.getById<Client>("clients", params.id as string)
          if (client) {
            setFormData({
              clientName: client.clientName || "",
              email: client.email || "",
              phone: client.phone || "",
              address: client.address || "",
              bankAccount: client.bankAccount || "",
              upiId: client.upiId || "",
            })
          } else {
            setError("Client not found")
          }
        } catch (error) {
          console.error("Failed to load client:", error)
          setError("Failed to load client")
        }
      }
    }
    loadClient()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      if (!formData.clientName || !formData.email || !formData.phone || !formData.address) {
        setError("Please fill in all required fields")
        return
      }

      const updated = await dataStore.update("clients", params.id as string, formData)

      if (updated) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/dashboard/clients/${params.id}`)
        }, 1500)
      } else {
        setError("Failed to update client")
      }
    } catch (err) {
      console.error("[v0] Error updating client:", err)
      setError("An error occurred while updating the client")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/clients/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Client Details
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Client</CardTitle>
          <CardDescription>Update client information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>Client updated successfully! Redirecting...</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="clientName">
                Client Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Enter client name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank Account (Optional)</Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                placeholder="Enter bank account number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID (Optional)</Label>
              <Input
                id="upiId"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="Enter UPI ID"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Link href={`/dashboard/clients/${params.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
