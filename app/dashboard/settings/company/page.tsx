"use client"
import { toast } from "@/lib/toast"
import { useEffect, useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building, Save } from "lucide-react"
import { api } from "@/lib/api-client"
import { ImageUpload } from "@/components/ui/image-upload"
import { CompanySetting } from "@/lib/models/types"

export default function CompanyDetailsPage() {
const { user, loading, hasPermission } = useUser()
  const [saved, setSaved] = useState(false)

  // ✅ ADDED error message state
  const [errors, setErrors] = useState<string[]>([])

  const [companyData, setCompanyData] = useState<CompanySetting>({
    userId: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
    tan: "",
    logo: "",
    website: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  useEffect(() => {
    const loadDetails = async () => {
      const details = await api.company.get()
      console.log("Loaded company details:", details)
      if (details) {
        setCompanyData(prev => ({
          ...prev,
          ...details,
        }))
      }
    }
    loadDetails()
  }, [])

  // ✅ VALIDATION FUNCTION
  const validateFields = () => {
    const newErrors: string[] = []

    if (!companyData.companyName.trim()) newErrors.push("Company Name is required")
    if (!companyData.email.trim()) newErrors.push("Email is required")
    if (!(companyData.address ?? "").trim()) newErrors.push("Address is required")
    if (!(companyData.phone ?? "").trim()) newErrors.push("Phone is required")
    if (!(companyData.city ?? "").trim()) newErrors.push("City is required")
    if (!(companyData.state ?? "").trim()) newErrors.push("State is required")
    if (!(companyData.pincode ?? "").trim()) newErrors.push("Pincode is required")
    if (!(companyData.gstin ?? "").trim()) newErrors.push("GSTIN is required")
    if (!(companyData.pan ?? "").trim()) newErrors.push("PAN is required")
    if (!(companyData.tan ?? "").trim()) newErrors.push("TAN is required")

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(companyData.email)) newErrors.push("Invalid Email format")

    // ✅ Phone validation (10 digits India)
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(companyData.phone ?? "")) newErrors.push("Invalid Phone (must be 10 digits)")

    // ✅ Pincode (6 digits)
    const pincodeRegex = /^\d{6}$/
    if (!pincodeRegex.test(companyData.pincode ?? "")) newErrors.push("Invalid Pincode (must be 6 digits)")

    // ✅ PAN validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    if (!panRegex.test(companyData.pan ?? "")) newErrors.push("Invalid PAN format")

    // ✅ GSTIN validation
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!gstRegex.test(companyData.gstin ?? "")) newErrors.push("Invalid GSTIN format")
        const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]$/
    if (!tanRegex.test(companyData.tan ?? "")) newErrors.push("Invalid TAN format")
    setErrors(newErrors)
    return newErrors.length === 0
  }

const handleSave = async () => {
  console.log("button clicked")

  if (!validateFields()) {
    toast({ title: "Validation Error", description: errors.join(", "), variant: "destructive" })
    return
  }

  console.log("Updating company details:", companyData)

  try {
    let response

    if (companyData._id) {
      // ✅ If company exists → UPDATE
      response = await api.company.update({
        companyName: companyData.companyName,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        city: companyData.city,
        state: companyData.state,
        pincode: companyData.pincode,
        gstin: companyData.gstin,
        pan: companyData.pan,
        tan: companyData.tan,
        logo: companyData.logo,
        website: companyData.website,
      })

      console.log("Company updated:", response)
      toast({ title: "Success", description: "Company details updated successfully!" })  // ✅ ADDED

    } else {
      console.log("userid", user?.id)
      // ✅ If no record exists → CREATE
      response = await api.company.create({
        userId: user?.id,   // ✅ REQUIRED only for create
        companyName: companyData.companyName,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        city: companyData.city,
        state: companyData.state,
        pincode: companyData.pincode,
        gstin: companyData.gstin,
        pan: companyData.pan,
        tan: companyData.tan,
        logo: companyData.logo,
        website: companyData.website,
      })

      console.log("Company created:", response)
      toast({ title: "Success", description: "Company details saved successfully!" })   // ✅ ADDED
    }

    // ✅ Update UI state
    setCompanyData((prev) => ({
      ...prev,
      ...response,
    }))

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

  } catch (error) {
    console.error("Error saving company:", error)
    toast({ title: "Error", description: "Something went wrong while saving company details.", variant: "destructive" })
  }
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
          <h1 className="text-2xl font-bold text-gray-900">Company Details</h1>
          <p className="text-gray-600">Manage your company information and branding</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Company details saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Company Information
          </CardTitle>
          <CardDescription>Enter your company details below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* ✅ LOGO */}
          <ImageUpload
            label="Company Logo"
            value={companyData.logo}
            onChange={(value) => setCompanyData({ ...companyData, logo: value })}
            description="Upload your company logo (PNG, JPG) or provide a URL"
            previewClassName="w-24 h-24"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ✅ COMPANY NAME */}
            <div className="space-y-2">
              <Label htmlFor="name" required>
                Company Name
              </Label>
              <Input
                id="name"
                value={companyData.companyName}
                onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                placeholder="Enter company name"
                required
              />
            </div>

            {/* ✅ EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={companyData.email}
                onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                placeholder="company@example.com"
                required
              />
            </div>
          </div>

          {/* ✅ ADDRESS */}
          <div className="space-y-2">
            <Label htmlFor="address" required>
              Address
            </Label>
            <Textarea
              id="address"
              value={companyData.address}
              onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
              placeholder="Enter complete address"
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* ✅ City */}
  <div className="space-y-2">
    <Label htmlFor="city" required>City</Label>
    <Input
      id="city"
      value={companyData.city}
      onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
      placeholder="Enter city"
    />
  </div>

  {/* ✅ State */}
  <div className="space-y-2">
    <Label htmlFor="state" required>State</Label>
    <Input
      id="state"
      value={companyData.state}
      onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
      placeholder="Enter state"
    />
  </div>

  {/* ✅ Pincode */}
  <div className="space-y-2">
    <Label htmlFor="pincode" required>Pincode</Label>
    <Input
      id="pincode"
      value={companyData.pincode}
      onChange={(e) => setCompanyData({ ...companyData, pincode: e.target.value })}
      placeholder="Enter pincode"
    />
  </div>
</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ✅ PHONE */}
            <div className="space-y-2">
              <Label htmlFor="phone" required>
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={companyData.phone}
                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            {/* ✅ WEBSITE */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={companyData.website}
                onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                placeholder="https://www.example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* ✅ GSTIN */}
  <div className="space-y-2">
    <Label htmlFor="gstin" required>GSTIN</Label>
    <Input
      id="gstin"
      value={companyData.gstin}
      onChange={(e) => setCompanyData({ ...companyData, gstin: e.target.value })}
      placeholder="Enter GSTIN"
    />
  </div>

  {/* ✅ PAN */}
  <div className="space-y-2">
    <Label htmlFor="pan" required>PAN</Label>
    <Input
      id="pan"
      value={companyData.pan}
      onChange={(e) => setCompanyData({ ...companyData, pan: e.target.value })}
      placeholder="Enter PAN"
    />
  </div>
    {/* ✅ TAN */}
  <div className="space-y-2">
    <Label htmlFor="tan" required>TAN</Label>
    <Input
      id="tan"
      value={companyData.tan}
      onChange={(e) => setCompanyData({ ...companyData, tan: e.target.value })}
      placeholder="Enter TAN"
    />
  </div>
</div>

        </CardContent>
      </Card>
    </div>
  )
}
