"use client"

import type React from "react"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import { api } from "@/lib/api-client"
import type { Payment } from "@/lib/models/types"
import { toast } from "react-toastify"

export default function EditPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params.id as string

  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    referenceNumber: "",
    description: "",
  })

useEffect(() => {
  loadPayment()
}, [paymentId])

const loadPayment = async () => {
  setLoading(true)
  try {
    const data = await api.payments.getById(paymentId)

    if (data) {
      setPayment(data.payment)
      setFormData({
        referenceNumber: data.payment.referenceNumber || "",
        description: data.payment.description || "",
      })
    }
  } catch (error) {
    console.error("Error loading payment:", error)
    toast.error("Failed to load payment")
  } finally {
    setLoading(false)
  }
}


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updated = await api.payments.update(paymentId, formData)
      if (updated.status === 200) {
        alert("Payment updated successfully!")
        toast.success("Payment updated successfully")
        router.push(`/dashboard/payments/${paymentId}`)
      }
      
    } catch (error) {
      console.error("Error updating payment:", error)
      toast.error("Failed to update payment")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment...</p>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
        <p className="text-gray-600 mb-4">The payment you're trying to edit doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/payments")}>Back to Payments</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Payment</h1>
          <p className="text-gray-600">{payment.paymentNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Number</Label>
                <Input value={payment.paymentNumber} disabled />
              </div>
              <div>
                <Label>Date</Label>
                <Input value={new Date(payment.date).toLocaleDateString()} disabled />
              </div>
            </div>

            <div>
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="Enter reference number"
              />
            </div>

            <div>
              <Label htmlFor="description">description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
