"use client"

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

interface DocumentItem {
  id: string
  label: string
  url: string
  uploadedAt: string
}

interface Employee {
  id: string
  employeeNumber: string
  employeeName: string
  surname: string
  photo: string
  mobileNo: string
  email: string
  address: string
  aadharNo: string
  aadharUpload: string
  joiningDate: string
  relievingDate?: string
  description: string
  memberType: string
  role: string
  resume?: string
  panCard?: string
  bankAccountDetails?: string
  educationCertificates: DocumentItem[]
  experienceCertificates: DocumentItem[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function EmployeePage() {
  const { hasPermission } = useUser()
  const [saved, setSaved] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [memberTypes, setMemberTypes] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [formData, setFormData] = useState<Employee>({
    id: "",
    employeeNumber: "",
    employeeName: "",
    surname: "",
    photo: "",
    mobileNo: "",
    email: "",
    address: "",
    aadharNo: "",
    aadharUpload: "",
    joiningDate: "",
    relievingDate: "",
    description: "",
    memberType: "",
    role: "",
    resume: "",
    panCard: "",
    bankAccountDetails: "",
    educationCertificates: [],
    experienceCertificates: [],
    isActive: true,
    createdAt: "",
    updatedAt: "",
  })

  useEffect(() => {
    const loadData = async () => {
      const loadedEmployees = await api.employees.getAll()
      const loadedMemberTypes = await api.memberTypes.getAll()
      console.log("loadedMemberTypes", loadedMemberTypes)
      const loadedRoles = await api.roles.getAll()
      console.log("loadedRoles", loadedRoles)
        setRoles(loadedRoles)
      setEmployees(loadedEmployees)
      setMemberTypes(loadedMemberTypes)
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
    if (!formData.employeeName.trim()) {
      alert("Please enter employee name")
      return
    }
    if (!formData.surname.trim()) {
      alert("Please enter surname")
      return
    }
    if (!formData.photo) {
      alert("Please upload employee photo")
      return
    }
    if (!formData.memberType) {
      alert("Please select employment type")
      return
    }
    if (!formData.role) {
      alert("Please select role")
      return
    }
    if (!formData.mobileNo.trim()) {
      alert("Please enter mobile number")
      return
    }
    if (!formData.email.trim()) {
      alert("Please enter email address")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address")
      return
    }
    if (!formData.address.trim()) {
      alert("Please enter address")
      return
    }
    if (!formData.aadharNo.trim()) {
      alert("Please enter Aadhar number")
      return
    }
    if (!validateAadhar(formData.aadharNo)) {
      alert("Please enter a valid 12-digit Aadhar number")
      return
    }
    if (!formData.aadharUpload) {
      alert("Please upload Aadhar document")
      return
    }
    if (!formData.joiningDate) {
      alert("Please select joining date")
      return
    }

    if (editingEmployee) {
      const updated = await api.employees.update( editingEmployee.id, formData)
      if (updated) {
        setEmployees(employees.map((emp) => (emp.id === editingEmployee.id ? updated : emp)))
      }
    } else {
      const newEmployee = await api.employees.create( {
        ...formData,
        employeeNumber: generateEmployeeNumber(),
      })
      setEmployees([...employees, newEmployee])
    }

    setIsDialogOpen(false)
    setEditingEmployee(null)
    resetForm()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const resetForm = () => {
    setFormData({
      id: "",
      employeeNumber: "",
      employeeName: "",
      surname: "",
      photo: "",
      mobileNo: "",
      email: "",
      address: "",
      aadharNo: "",
      aadharUpload: "",
      joiningDate: "",
      relievingDate: "",
      description: "",
      memberType: "",
      role: "",
      resume: "",
      panCard: "",
      bankAccountDetails: "",
      educationCertificates: [],
      experienceCertificates: [],
      isActive: true,
      createdAt: "",
      updatedAt: "",
    })
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData(employee)
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (id: string) => {
    const employee = employees.find((emp) => emp.id === id)
    if (employee) {
      const updated = await api.employees.update( id, { isActive: !employee.isActive })
      if (updated) {
        setEmployees(employees.map((emp) => (emp.id === id ? updated : emp)))
      }
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDialogOpen(false)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
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
                        <Label className="text-sm font-medium">Employee Number *</Label>
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
                        <Label htmlFor="employeeName" className="text-sm font-medium">
                          Employee Name *
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
                        <Label htmlFor="surname" className="text-sm font-medium">
                          Surname *
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
                        <Label htmlFor="memberType" className="text-sm font-medium">
                          Employment Type *
                        </Label>
                        <Select
                          value={formData?.memberType}
                          onValueChange={(value) => setFormData({ ...formData, memberType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select employment type" />
                          </SelectTrigger>
                          <SelectContent>
                            {memberTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-medium">
                          Role *
                        </Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.length === 0 ? (
                              <SelectItem value="no-roles" disabled>
                                No roles available. Please create roles first.
                              </SelectItem>
                            ) : (
                              roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobileNo" className="text-sm font-medium">
                          Mobile No *
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
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email *
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
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Address *
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
                <Card>
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
                </Card>

                {/* Employment Dates Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Employment Dates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="joiningDate" className="text-sm font-medium">
                          Joining Date *
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
          {employees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No employees added yet. Click "Add Employee" to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    !employee.isActive ? "bg-gray-50 opacity-60" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">{employee.employeeNumber}</span>
                      <span className="font-medium">
                        {employee.employeeName} {employee.surname}
                      </span>
                      {employee.memberType && (
                        <Badge variant="secondary" className="text-xs">
                          {memberTypes.find((t) => t.id === employee.memberType)?.name || employee.memberType}
                        </Badge>
                      )}
                      {employee.role && (
                        <Badge variant="outline" className="text-xs">
                          {roles.find((r) => r.id === employee.role)?.name || employee.role}
                        </Badge>
                      )}
                      {!employee.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>{employee.email}</p>
                      <p>{employee.mobileNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`active-${employee.id}`} className="text-sm">
                        {employee.isActive ? "Active" : "Inactive"}
                      </Label>
                      <Switch
                        id={`active-${employee.id}`}
                        checked={employee.isActive}
                        onCheckedChange={() => handleToggleActive(employee.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
