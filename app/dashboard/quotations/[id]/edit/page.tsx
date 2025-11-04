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
import type { Quotation } from "@/lib/data-store"
import { toast } from "react-toastify"

export default function EditQuotationPage() {
  const params = useParams()
  const router = useRouter()
  const quotationId = params.id as string

  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    validity: "",
    note: "",
  })

  useEffect(() => {
    loadQuotation()
  }, [quotationId])

  const loadQuotation = () => {
    try {
      const data = api.quotations.getById(quotationId)
      if (data) {
        setQuotation(data)
        setFormData({
          validity: data.validity,
          note: data.note || "",
        })
      }
    } catch (error) {
      console.error("Error loading quotation:", error)
      toast.error("Failed to load quotation")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updated = api.quotations.update(quotationId, formData)
      if (updated) {
        toast.success("Quotation updated successfully")
        router.push(`/dashboard/quotations/${quotationId}`)
      }
    } catch (error) {
      console.error("Error updating quotation:", error)
      toast.error("Failed to update quotation")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotation...</p>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quotation Not Found</h2>
        <p className="text-gray-600 mb-4">The quotation you're trying to edit doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/quotations")}>Back to Quotations</Button>
      </div>
    )
  }

  if (quotation.status === "accepted") {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cannot Edit Accepted Quotation</h2>
        <p className="text-gray-600 mb-4">This quotation has been accepted and cannot be edited.</p>
        <Button onClick={() => router.push(`/dashboard/quotations/${quotationId}`)}>Back to Quotation</Button>
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Quotation</h1>
          <p className="text-gray-600">{quotation.quotationNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quotation Number</Label>
                <Input value={quotation.quotationNumber} disabled />
              </div>
              <div>
                <Label>Date</Label>
                <Input value={new Date(quotation.date).toLocaleDateString()} disabled />
              </div>
            </div>

            <div>
              <Label htmlFor="validity">Valid Until *</Label>
              <Input
                id="validity"
                type="date"
                value={formData.validity}
                onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
