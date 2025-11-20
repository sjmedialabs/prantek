"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, DollarSign, Search, Key, Copy, Mail, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
  createdAt: string
}

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamPayments, setTeamPayments] = useState<TeamPayment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [selectedMemberForCredentials, setSelectedMemberForCredentials] = useState<TeamMember | null>(null)
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null)
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [memberTypes, setMemberTypes] = useState<any[]>([])
  const [paymentForm, setPaymentForm] = useState({ teamMemberId: "" })

  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    memberType: "employee" as "employee" | "contract" | "student" | "other",
    department: "",
    joiningDate: new Date().toISOString().split("T")[0],
    salary: "",
    status: "active" as "active" | "inactive",
  })

  const handleDeleteMember = async (id: string) => {
    const member = teamMembers.find((m) => m.id === id)
    if (member) {
      await api.teamMembers.delete(id)
      toast.success("Member Removed", `${member.name} has been removed from your team`)
      loadData()
    }
  }

  const getTotalPaid = (memberId: string): number => {
    const paymentsForMember = teamPayments.filter((payment) => payment.teamMemberId === memberId)
    return paymentsForMember.reduce((total, payment) => total + (payment.amount || 0), 0)
  }

  useEffect(() => {
    loadData()
    loadRoles()
    loadMemberTypes()
  }, [])

  const loadRoles = () => {
    const savedRoles = localStorage.getItem("saas_roles")
    if (savedRoles) {
      const roles: Role[] = JSON.parse(savedRoles)
      const filteredRoles = roles.filter((role) => role.name !== "Admin" && role.name !== "Super Admin")
      setAvailableRoles(filteredRoles)
    } else {
      const defaultRoles = [
        {
          id: "3",
          name: "Manager",
          description: "Management level access to core features",
          permissions: [],
          userCount: 0,
          isSystem: false,
          createdAt: "2024-01-05",
        },
        {
          id: "4",
          name: "Employee",
          description: "Standard employee access",
          permissions: [],
          userCount: 0,
          isSystem: false,
          createdAt: "2024-01-10",
        },
        {
          id: "5",
          name: "Viewer",
          description: "Read-only access to basic information",
          permissions: [],
          userCount: 0,
          isSystem: true,
          createdAt: "2024-01-01",
        },
      ]
      setAvailableRoles(defaultRoles)
    }
  }

  const loadData = async () => {
    const members = await api.teamMembers.getAll()
    const payments = await api.teamPayments.getAll()
    setTeamMembers(members)
    setTeamPayments(payments)
  }

  const loadMemberTypes = async () => {
    const allTypes = await api.memberTypes.getAll()
        const types = allTypes.filter((t: any) => t.isActive)
    setMemberTypes(types)
  }

  const handleAddMember = async () => {
    if (!memberForm.name || !memberForm.email || !memberForm.role) {
      toast.error("Missing Information", "Please fill in all required fields")
      return
    }

    const memberData: any = {
      ...memberForm,
      salary:
        memberForm.memberType === "employee" && memberForm.salary ? Number.parseFloat(memberForm.salary) : undefined,
    }

    if (editingMember) {
      await api.teamMembers.update( editingMember.id, memberData)
      toast.success("Member Updated", `${memberForm.name} has been updated successfully`)
    } else {
      await api.teamMembers.create( {
        ...memberData,
        assignedAssets: [],
      })
      toast.success("Member Added", `${memberForm.name} has been added to your team`)
    }
    loadData()
    resetMemberForm()
    setIsAddMemberOpen(false)
  }

  const resetMemberForm = () => {
    setMemberForm({
      name: "",
      email: "",
      phone: "",
      role: "",
      memberType: "employee",
      department: "",
      joiningDate: new Date().toISOString().split("T")[0],
      salary: "",
      status: "active",
    })
    setEditingMember(null)
  }

  const getMemberTypeBadge = (type: string) => {
    const colors = {
      employee: "bg-blue-100 text-blue-800",
      contract: "bg-purple-100 text-purple-800",
      student: "bg-green-100 text-green-800",
      other: "bg-gray-100 text-gray-800",
    }
    return colors[type as keyof typeof colors] || colors.other
  }

  const formatMemberType = (typeCode: string) => {
    const memberType = memberTypes.find((t) => t.code === typeCode)
    return memberType ? memberType.name : typeCode
  }

  const memberTypeRequiresSalary = (typeCode: string) => {
    const memberType = memberTypes.find((t) => t.code === typeCode)
    return memberType ? memberType.requiresSalary : false
  }

  const memberHasCredentials = async (member: TeamMember): Promise<boolean> => {
    const users = await api.users.getAll()
    return users.some((user) => user.email === member.email && user.role === "employee")
  }

  const handleGenerateCredentials = async (member: TeamMember) => {
    setSelectedMemberForCredentials(member)

    const existingUsers = await api.users.getAll()
    const existingUser = existingUsers.find((u) => u.email === member.email)

    if (existingUser) {
      toast.error("Credentials Exist", "This member already has login credentials")
      return
    }

    const password = generateRandomPassword()

    const newUser: Omit<User, "id" | "createdAt" | "updatedAt"> = {
      email: member.email,
      password: password,
      name: member.name,
      role: "employee",
      phone: member.phone,
      address: "",
    }

    await api.users.create( newUser)

    setGeneratedCredentials({
      email: member.email,
      password: password,
    })

    setIsCredentialsDialogOpen(true)
    toast.success("Credentials Created", "Login credentials have been generated successfully")
  }

  const generateRandomPassword = (): string => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied", "Copied to clipboard")
  }

  const sendCredentialsEmail = () => {
    toast.success("Email Sent", "Credentials have been sent to the member's email")
    setIsCredentialsDialogOpen(false)
    setGeneratedCredentials(null)
    setSelectedMemberForCredentials(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Member Management</h1>
          <p className="text-gray-600">Manage your members and track payments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member Payment</DialogTitle>
                <DialogDescription>Record a payment made to a member</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Member</Label>
                  <Select
                    value={paymentForm.teamMemberId}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, teamMemberId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} - {member.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isAddMemberOpen}
            onOpenChange={(open) => {
              setIsAddMemberOpen(open)
              if (!open) resetMemberForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="!w-[90vw] sm:max-w-[90vw] h-[95vh] flex flex-col p-0 gap-0">
              <div className="sticky top-0 bg-white border-b px-6 py-4 z-20">
                <DialogHeader>
                  <DialogTitle>{editingMember ? "Edit Member" : "Add Member"}</DialogTitle>
                  <DialogDescription>
                    {editingMember ? "Update member details" : "Add a new member to your organization"}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={memberForm.role}
                      onValueChange={(value) => setMemberForm({ ...memberForm, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Member Type</Label>
                    <Select
                      value={memberForm.memberType}
                      onValueChange={(value: any) => {
                        const requiresSalary = memberTypeRequiresSalary(value)
                        setMemberForm({
                          ...memberForm,
                          memberType: value,
                          salary: requiresSalary ? memberForm.salary : "",
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {memberTypes.map((type) => (
                          <SelectItem key={type.id} value={type.code}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={memberForm.department}
                      onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                      placeholder="e.g., Sales"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Joining Date</Label>
                    <Input
                      type="date"
                      value={memberForm.joiningDate}
                      onChange={(e) => setMemberForm({ ...memberForm, joiningDate: e.target.value })}
                    />
                  </div>
                  {memberTypeRequiresSalary(memberForm.memberType) && (
                    <div className="space-y-2">
                      <Label>Salary (₹)</Label>
                      <Input
                        type="number"
                        value={memberForm.salary}
                        onChange={(e) => setMemberForm({ ...memberForm, salary: e.target.value })}
                        placeholder="Monthly salary"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={memberForm.status}
                      onValueChange={(value: any) => setMemberForm({ ...memberForm, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-4 z-30 shadow-lg">
                <div className="flex justify-end max-w-[90vw] mx-auto">
                  <Button onClick={handleAddMember} className="w-full">
                    {editingMember ? "Update Member" : "Add Member"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Login Credentials Generated</DialogTitle>
            <DialogDescription>
              Login credentials have been created for {selectedMemberForCredentials?.name}
            </DialogDescription>
          </DialogHeader>
          {generatedCredentials && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Credentials created successfully! Please save these details securely.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Email / Username</Label>
                  <div className="flex items-center gap-2">
                    <Input value={generatedCredentials.email} readOnly className="bg-white" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedCredentials.email)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Password</Label>
                  <div className="flex items-center gap-2">
                    <Input value={generatedCredentials.password} readOnly className="bg-white font-mono" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedCredentials.password)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={sendCredentialsEmail} className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Send via Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCredentialsDialogOpen(false)
                    setGeneratedCredentials(null)
                    setSelectedMemberForCredentials(null)
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Make sure to save these credentials. The password cannot be retrieved later.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>Manage your members and their details</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>
                        <Badge className={getMemberTypeBadge(member.memberType || "other")}>
                          {formatMemberType(member.memberType || "other")}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.department || "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{member.email}</div>
                          <div className="text-gray-500">{member.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.memberType === "employee" && member.salary != null
                          ? `₹${member.salary.toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>₹{getTotalPaid(member.id).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {memberHasCredentials(member) ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateCredentials(member)}
                            className="text-xs"
                          >
                            <Key className="h-3 w-3 mr-1" />
                            Create
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMember(member)
                              setMemberForm({
                                name: member.name,
                                email: member.email,
                                phone: member.phone,
                                role: member.role,
                                memberType: member.memberType || "employee",
                                department: member.department || "",
                                joiningDate: member.joiningDate,
                                salary: member.salary?.toString() || "",
                                status: member.status,
                              })
                              setIsAddMemberOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(member.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Track all payments made to members</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{payment.teamMemberName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.paymentType}</Badge>
                      </TableCell>
                      <TableCell>₹{payment.amount != null ? payment.amount.toLocaleString() : "0"}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
