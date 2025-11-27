"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import type { Vendor } from "@/lib/models/types"
import { ArrowLeft, Edit, Store } from "lucide-react"
import { toast } from "@/lib/toast"
import { useUser } from "@/components/auth/user-context"

export default function VendorDetailsPage() {
  const {user} = useUser()
  const params = useParams()
  const vendorId = params.id as string
  const router = useRouter()
  const { hasPermission } = useUser()

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (vendorId) loadVendor()
  }, [vendorId])

  const loadVendor = async () => {
    try {
      const data = await api.vendors.getById(vendorId)
      setVendor(data)
    } catch (err) {
      toast.error("Error", "Failed to load vendor details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Vendor not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 text-purple-600" />
            Vendor Details
          </h1>
        </div>

        )}
      </div>

      {/* Vendor Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{vendor.name}</CardTitle>
          <CardDescription>Vendor / Supplier Information</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Email</p>
            <p className="font-semibold">{vendor.email}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Phone</p>
            <p className="font-semibold">{vendor.phone || "—"}</p>
          </div>

          <div className="space-y-1 col-span-2">
            <p className="text-sm font-medium text-gray-600">Address</p>
            <p className="font-semibold">
              {vendor.address}, {vendor.city}, {vendor.state} - {vendor.pincode}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">GSTIN</p>
            <p className="font-semibold">{vendor.gstin || "—"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">PAN</p>
            <p className="font-semibold">{vendor.pan || "—"}</p>
          </div>

          <div className="space-y-1 col-span-2">
            <p className="text-sm font-medium text-gray-600">Notes</p>
            <p className="font-semibold whitespace-pre-line">{vendor.notes || "No notes added."}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Created On</p>
            <p className="font-semibold">{new Date(vendor.createdAt).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
