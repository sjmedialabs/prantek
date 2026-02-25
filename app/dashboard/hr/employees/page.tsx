"use client"
import { toast } from "@/lib/toast"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Save, Plus, Edit, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageUpload } from "@/components/ui/image-upload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { MultiDocumentUpload } from "@/components/multi-document-upload"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DocumentItem {
  id: string
  label: string
  url: string
  uploadedAt: string
}

interface Employee {
  userCount: number
  isSystem: boolean
  id: string
  _id: string
  employeeNumber: string
  employeeName: string
  surname: string
  photo: string
  mobileNo: string
  email: string
  address: string

  // Newly Added
  state: string
  city: string
  pincode: string
  emergencyName: string
  emergencyNo: string

  aadharNo: string
  aadharUpload: string
  joiningDate: string
  relievingDate?: string
  description: string
  memberType: string
  role: string
  resume?: string
  panCard?: string
  panCardNo: string

  // New Identity & Banking
  bankName?: string
  branchName?: string
  accountHolderName?: string
  accountNumber?: string
  ifscCode?: string

  educationCertificates: DocumentItem[]
  experienceCertificates: DocumentItem[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}
const STATIC_MEMBER_TYPES = [
  { _id: "1", name: "Full Time" },
  { _id: "2", name: "Part Time" },
  { _id: "3", name: "Contract Based" },
];

export default function EmployeePage() {
  const { hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [memberTypes, setMemberTypes] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [roleName, setRolesName] = useState<any[]>([])
  const [member, setMember] = useState<any[]>([])
  const itemsPerPage = 10
const [formData, setFormData] = useState<Employee>({
  id: "",
  _id: "",
  employeeNumber: "",
  employeeName: "",
  surname: "",
  photo: "",
  mobileNo: "",
  email: "",
  address: "",
  state: "",
  city: "",
  pincode: "",
  emergencyName: "",
  emergencyNo: "",
  aadharNo: "",
  aadharUpload: "",
  joiningDate: "",
  relievingDate: "",
  description: "",
  memberType: "",
  role: "",
  resume: "",
  panCard: "",
  panCardNo: "",
  bankName: "",
  branchName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  educationCertificates: [],
  experienceCertificates: [],
  isActive: true,
  isSystem: false,
  userCount: 0,
  createdAt: "",
  updatedAt: "",
})
const loadEmployees = async () => {
  const loadedEmployees = await api.employees.getAll()
  setEmployees(loadedEmployees)
}


  useEffect(() => {
    const loadData = async () => {
      await loadEmployees()
      console.log("loadedEmployees", employees)
      const loadedMemberTypes = await api.memberTypes.getAll()
      const memberTypes = loadedMemberTypes.filter((t: any) => t.isActive === true)
      console.log("loadedMemberTypes", loadedMemberTypes)
      const loadedRoles = await api.employeeRoles.getAll()
      const roles = loadedRoles.filter((t: any) => t.isActive === true)
      console.log("loadedRoles", loadedRoles)
      setRoles(roles)
 setMemberTypes(STATIC_MEMBER_TYPES);
      setRolesName(loadedRoles)
      setMember(loadedMemberTypes)
    }
    loadData()
  }, [])

  const generateEmployeeNumber = () => {
    const year = new Date().getFullYear()
    const number = (employees.length + 1).toString().padStart(4, "0")
    return `EMP-${year}-${number}`
  }

  const validateAadhar = (aadharNo: string): boolean => {
    const cleaned = aadharNo.replace(/[\s-]/g, "")
    return /^\d{12}$/.test(cleaned)
  }

  const handleSave = async () => {
    console.log("Saving employee:", formData)
    if (!formData.employeeName.trim()) {
      toast({ title: "Validation Error", description: "Please enter employee name", variant: "destructive" })
      return
    }
    if (!formData.surname.trim()) {
      toast({ title: "Validation Error", description: "Please enter surname", variant: "destructive" })
      return
    }
    if (!formData.photo) {
      toast({ title: "Validation Error", description: "Please upload employee photo", variant: "destructive" })
      return
    }
    if (!formData.memberType) {
      toast({ title: "Validation Error", description: "Please select employment type", variant: "destructive" })
      return
    }
    if (!formData.role) {
      toast({ title: "Validation Error", description: "Please select role", variant: "destructive" })
      return
    }
    if (!formData.mobileNo.trim()) {
      toast({ title: "Validation Error", description: "Please enter mobile number", variant: "destructive" })
      return
    }
    if (!formData.email.trim()) {
      toast({ title: "Validation Error", description: "Please enter email address", variant: "destructive" })
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Validation Error", description: "Please enter a valid email address", variant: "destructive" })
      return
    }
    if (!formData.address.trim()) {
      toast({ title: "Validation Error", description: "Please enter address", variant: "destructive" })
      return
    }
    if (!(formData.emergencyName).trim()) {
  toast({ title: "Validation Error", description: "Please enter emergency contact name", variant: "destructive" })
  return
}

if (!formData.emergencyNo.trim()) {
  toast({ title: "Validation Error", description: "Please enter emergency contact number", variant: "destructive" })
  return
}

if (!formData.state.trim()) {
  toast({ title: "Validation Error", description: "Please enter state", variant: "destructive" })
  return
}

if (!formData.city.trim()) {
  toast({ title: "Validation Error", description: "Please enter city", variant: "destructive" })
  return
}

if (!formData.pincode.trim()) {
  toast({ title: "Validation Error", description: "Please enter pincode", variant: "destructive" })
  return
}

if (formData.pincode.length !== 6) {
  toast({ title: "Validation Error", description: "Pincode must be 6 digits", variant: "destructive" })
  return
}

if (!formData.panCardNo.trim()) {
  toast({ title: "Validation Error", description: "Please enter PAN Card number", variant: "destructive" })
  return
}

    if (!formData.aadharNo.trim()) {
      toast({ title: "Validation Error", description: "Please enter Aadhar number", variant: "destructive" })
      return
    }
    if (!validateAadhar(formData.aadharNo)) {
      toast({ title: "Validation Error", description: "Please enter a valid 12-digit Aadhar number", variant: "destructive" })
      return
    }
    if (!formData.aadharUpload) {
      toast({ title: "Validation Error", description: "Please upload Aadhar document", variant: "destructive" })
      return
    }
    if (!formData.joiningDate) {
      toast({ title: "Validation Error", description: "Please select joining date", variant: "destructive" })
      return
    }
    console.log("Saving employee as editing employee:", editingEmployee)
    console.log("Saving employee:", formData)
if (editingEmployee?._id) {
  await api.employees.update(editingEmployee._id, formData)
} else {
  await api.employees.create({
    ...formData,
    employeeNumber: generateEmployeeNumber(),
  })
}

// REFRESH LIST
await loadEmployees()

// Reset pagination
setCurrentPage(1)

    console.log("Employee saved successfully", employees)
    setIsDialogOpen(false)
    setEditingEmployee(null)
    resetForm()
    setSaved(true)
    toast({ title: "Success", description: "Employee saved successfully!" })
    setTimeout(() => setSaved(false), 3000)
    // window.location.reload()
  }

const resetForm = () => {
  setFormData({
    id: "",
    _id: "",
    employeeNumber: "",
    employeeName: "",
    surname: "",
    photo: "",
    mobileNo: "",
    email: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    emergencyName: "",
    emergencyNo: "",
    aadharNo: "",
    aadharUpload: "",
    joiningDate: "",
    relievingDate: "",
    description: "",
    memberType: "",
    role: "",
    resume: "",
    panCard: "",
    panCardNo: "",
    bankName: "",
    branchName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    educationCertificates: [],
    experienceCertificates: [],
    isActive: true,
    isSystem: false,
    userCount: 0,
    createdAt: "",
    updatedAt: "",
  })
}


  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData(employee)
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    console.log("Toggling  for employee:", id)
    try {
      const updated = await api.employees.toggle(id, isActive)

      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === id ? { ...emp, isActive } : emp
        )
      )
      toast({ title: "Success", description: "Status updated successfully!" })   // ✅ ADDED
      // window.location.reload()
    } catch (err: any) {
      toast({ title: "Error", description: `Failed to update status: ${err.message || "Something went wrong"}`, variant: "destructive" })   // ✅ ADDED
    }
  }
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentEmployees = employees?.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(employees?.length / itemsPerPage)


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
          <h1 className="text-2xl font-bold text-gray-900">Employee</h1>
          <p className="text-gray-600">Manage employee information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
                setEditingEmployee(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-[90vw] !w-[90vw] h-[98vh] flex flex-col p-0 gap-0 sm:max-w-[90vw]"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-20">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {editingEmployee ? "Edit Employee" : "Add New Employee"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    {editingEmployee
                      ? "Update employee information below"
                      : "Enter employee details below. Fields marked with * are required."}
                  </DialogDescription>
                </div>
                {/* <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDialogOpen(false)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button> */}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Basic Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium" required>Employee Number</Label>
                        <Input
                          value={editingEmployee ? formData.employeeNumber : "Auto-generated on save"}
                          disabled
                          className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500">
                          {editingEmployee ? "Employee number cannot be changed" : "Will be generated automatically"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employeeName" className="text-sm font-medium" required>
                          Employee Name
                        </Label>
                        <Input
                          id="employeeName"
                          value={formData.employeeName}
                          onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                          placeholder="First name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="surname" className="text-sm font-medium" required>
                          Surname
                        </Label>
                        <Input
                          id="surname"
                          value={formData.surname}
                          onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                          placeholder="Last name"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="memberType" className="text-sm font-medium" required>
                          Employment Type
                        </Label>
                        <Select
                          value={formData.memberType ?? ""}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, memberType: value }))}
                        >
                          <SelectTrigger className="z-1000">
                            <SelectValue  placeholder="Employment type" />
                          </SelectTrigger>
                          <SelectContent>
                          {memberTypes.length === 0 ? (
                              <SelectItem value="no-member" disabled>
                                No Types available. Please create EmployeeType first.
                              </SelectItem>
                          ) :(
                             memberTypes.map((type) => (
                              <SelectItem key={type._id} value={String(type._id)}>
                                {type.name}
                              </SelectItem>
                            ))
                          )
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-medium" required>
                          Role
                        </Label>
                        <Select
                          value={formData.role ?? ""}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger className="z-1000">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.length === 0 ? (
                              <SelectItem value="no-roles" disabled>
                                No roles available. Please create roles first.
                              </SelectItem>
                            ) : (
                              roles.map((role) => (
                                <SelectItem key={role._id} value={String(role._id)}>
                                  {role.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Contact Information</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">

                    {/* Primary Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="space-y-2">
                        <Label htmlFor="mobileNo" className="text-sm font-medium" required>
                          Mobile No
                        </Label>
                        <Input
                          id="mobileNo"
                          type="tel"
                          value={formData.mobileNo}
                          onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                          placeholder="+91 12345 67890"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium" required>
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="employee@example.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="space-y-2">
                        <Label htmlFor="emergencyName" className="text-sm font-medium" required>
                          Emergency Contact Person
                        </Label>
                        <Input
                          id="emergencyName"
                          value={formData.emergencyName || ""}
                          onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                          placeholder="Person to contact in emergency"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyNo" className="text-sm font-medium" required>
                          Emergency Contact Number
                        </Label>
                        <Input
                          id="emergencyNo"
                          type="tel"
                          value={formData.emergencyNo || ""}
                          onChange={(e) => setFormData({ ...formData, emergencyNo: e.target.value })}
                          placeholder="+91 98765 43210"
                          required
                        />
                      </div>

                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium" required>
                        Address
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Complete address"
                        rows={3}
                        required
                      />
                    </div>

                    {/* State / City / Pincode */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium" required>
                          State
                        </Label>
                        <Input
                          id="state"
                          value={formData.state || ""}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="State"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium" required>
                          City
                        </Label>
                        <Input
                          id="city"
                          value={formData.city || ""}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="City"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pincode" className="text-sm font-medium" required>
                          Pincode
                        </Label>
                        <Input
                          id="pincode"
                          type="text"
                          maxLength={6}
                          value={formData.pincode || ""}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          placeholder="6-digit pincode"
                          required
                        />
                      </div>

                    </div>

                  </CardContent>
                </Card>

                {/* Documents & Media Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Documents & Media</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <ImageUpload
                          label="Employee Photo *"
                          value={formData.photo}
                          onChange={(value) => setFormData({ ...formData, photo: value })}
                          previewClassName="w-32 h-32 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <ImageUpload
                          label="Aadhar Document *"
                          value={formData.aadharUpload}
                          onChange={(value) => setFormData({ ...formData, aadharUpload: value })}
                          accept="image/*,application/pdf"
                          previewClassName="w-32 h-32 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <ImageUpload
                          label="Resume"
                          value={formData.resume || ""}
                          onChange={(value) => setFormData({ ...formData, resume: value })}
                          accept="application/pdf,.doc,.docx"
                          previewClassName="w-32 h-32 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <ImageUpload
                          label="PAN Card"
                          value={formData.panCard || ""}
                          onChange={(value) => setFormData({ ...formData, panCard: value })}
                          accept="image/*,application/pdf"
                          previewClassName="w-32 h-32 rounded-lg"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Education Certificates Section */}
                <MultiDocumentUpload
                  label="Education Certificates"
                  documents={formData.educationCertificates}
                  onChange={(docs) => setFormData({ ...formData, educationCertificates: docs })}
                  placeholder="e.g., Bachelor's Degree, Master's Degree, Diploma"
                />

                {/* Experience Certificates Section */}
                <MultiDocumentUpload
                  label="Experience Certificates"
                  documents={formData.experienceCertificates}
                  onChange={(docs) => setFormData({ ...formData, experienceCertificates: docs })}
                  placeholder="e.g., ABC Company - Offer Letter, XYZ Corp - Relieving Letter"
                />

                {/* Identity & Banking Section */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Identity & Banking Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aadharNo" className="text-sm font-medium">
                          Aadhar No * (12 digits)
                        </Label>
                        <Input
                          id="aadharNo"
                          value={formData.aadharNo}
                          onChange={(e) => setFormData({ ...formData, aadharNo: e.target.value })}
                          placeholder="XXXX XXXX XXXX"
                          maxLength={14}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountDetails" className="text-sm font-medium">
                          Bank Account Details
                        </Label>
                        <Textarea
                          id="bankAccountDetails"
                          value={formData.bankAccountDetails || ""}
                          onChange={(e) => setFormData({ ...formData, bankAccountDetails: e.target.value })}
                          placeholder="Account number, IFSC code, bank name"
                          rows={3}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card> */}
                {/* Identity Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Identity Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                    <div className="space-y-2 md:basis-1/2">
                      <Label htmlFor="aadharNo" className="text-sm font-medium" required>
                        Aadhar No (12 digits)
                      </Label>
                      <Input
                        id="aadharNo"
                        value={formData.aadharNo}
                        onChange={(e) => setFormData({ ...formData, aadharNo: e.target.value })}
                        placeholder="XXXX XXXX XXXX"
                        maxLength={14}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:basis-1/2">
                      <Label htmlFor="panCardNo" className="text-sm font-medium" required>
                        PAN Card No
                      </Label>
                      <Input
                        id="panCardNo"
                        value={formData.panCardNo || ""}
                        onChange={(e) => setFormData({ ...formData, panCardNo: e.target.value })}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        required
                      />
                    </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Banking Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Banking Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Bank Name</Label>
                        <Input
                          value={formData.bankName || ""}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="Bank Name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Branch Name</Label>
                        <Input
                          value={formData.branchName || ""}
                          onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                          placeholder="Branch Name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Account Holder Name</Label>
                        <Input
                          value={formData.accountHolderName || ""}
                          onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                          placeholder="As per bank record"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Account Number</Label>
                        <Input
                          value={formData.accountNumber || ""}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          placeholder="XXXXXXXXXXXX"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">IFSC Code</Label>
                        <Input
                          value={formData.ifscCode || ""}
                          onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                          placeholder="SBIN000000"
                        />
                      </div>

                    </div>

                  </CardContent>
                </Card>

                {/* Employment Dates Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Employment Dates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="joiningDate" className="text-sm font-medium" required>
                          Joining Date
                        </Label>
                        <Input
                          id="joiningDate"
                          type="date"
                          value={formData.joiningDate}
                          onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                          required
                        />
                      </div>
                      {editingEmployee && (
                        <div className="space-y-2">
                          <Label htmlFor="relievingDate" className="text-sm font-medium">
                            Relieving Date
                          </Label>
                          <Input
                            id="relievingDate"
                            type="date"
                            value={formData.relievingDate || ""}
                            onChange={(e) => setFormData({ ...formData, relievingDate: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Additional notes about the employee"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="h-20" />
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-4 z-50 shadow-lg">
              <div className="max-w-7xl mx-auto flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Employee
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {saved && (
        <Alert>
          <AlertDescription>Employee saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Employee List
          </CardTitle>
          <CardDescription>All employees in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {employees?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No employees added yet. Click "Add Employee" to get started.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-3 text-left font-medium">S.No</TableHead>
                      <TableHead className="p-3 text-left font-medium">Employee No</TableHead>
                      <TableHead className="p-3 text-left font-medium">Name</TableHead>
                      <TableHead className="p-3 text-left font-medium">Email</TableHead>
                      <TableHead className="p-3 text-left font-medium">Mobile</TableHead>
                      <TableHead className="p-3 text-left font-medium">Role</TableHead>
                      <TableHead className="p-3 text-left font-medium">Member Type</TableHead>
                      <TableHead className="p-3 text-left font-medium">Status</TableHead>
                      <TableHead className="p-3 font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentEmployees?.map((employee, index) => (
                      <TableRow
                        key={employee?._id || index}
                        className= ""
                      >
                        <TableCell className="p-3 font-medium">{indexOfFirstItem + index + 1}</TableCell>
                        <TableCell className="p-3">{employee?.employeeNumber}</TableCell>
                        <TableCell className="p-3 font-semibold">
                          {employee?.employeeName} {employee?.surname}
                        </TableCell>
                        <TableCell className="p-3">{employee?.email}</TableCell>
                        <TableCell className="p-3">{employee?.mobileNo}</TableCell>
                        <TableCell className="p-3">
                          {employee?.role ? (
                            <Badge variant="outline" className="text-xs">
                              {roleName.find((r) => String(r._id) === String(employee?.role))?.name ||
                                employee?.role}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="p-3">
                          {employee?.memberType ? (
                            <Badge variant="secondary" className="text-xs">
                              {member.find((t) => String(t._id) === String(employee?.memberType))
                                ?.name || employee?.memberType}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="p-3">
                          {employee?.isActive ? (
                            <Badge className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={!!employee?.isActive}
                                onCheckedChange={(checked) =>
                                  handleToggleActive(employee?._id, checked)
                                }
                                disabled={employee?.isSystem || employee?.userCount > 0}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} –{" "}
                  {Math.min(indexOfLastItem, employees?.length)} of {employees?.length}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>

                  <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>

      </Card>
    </div>
  )
}
