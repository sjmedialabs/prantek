"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserPlus, Pencil, Trash2, Search, Shield, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
// import { toast } from "@/lib/toast"
import { Switch } from "@/components/ui/switch"

interface AdminUser {
  _id: string
  id?: string
  email: string
  name: string
  role: "admin" | "super-admin"
  roleId?: string
  roleName?: string
  permissions?: string[]
  phone?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

interface Role {
  _id: string
  name: string
  code: string
  permissions: string[]
  description?: string
}

const DESIGNATIONS = [
  "System Administrator",
  "HR Manager",
  "Finance Manager",
  "Operations Manager",
  "Accountant",
  "Data Entry Operator",
  "Viewer"
]

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "admin" as "admin" | "super-admin",
    roleId: "none",
    isActive: true,
  })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

const fetchUsers = async () => {
  try {
    const response = await fetch("/api/users?userType=admin-user")
    const data = await response.json()

    if (data.success) {
      setUsers(data.users || [])
    }
  } catch (error) {
    toast.error("Failed to fetch admin users")
  }
}


  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      const data = await response.json()
      if (data.roles) {
        setRoles(data.roles)
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    }
  }

const handleAddUser = async () => {
  if (!formData.name || !formData.email || !formData.password) {
    toast.error("Name, email, and password are required")
    return
  }

  try {
    const response = await fetch("/api/users?userType=admin-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        userType: "admin-user",
        roleId: formData.roleId === "none" ? null : formData.roleId
      }),
    })

    const data = await response.json()

    if (data.success) {
      toast.success("Admin user created successfully")
      setIsAddDialogOpen(false)
      resetForm()
      fetchUsers()
    } else {
      toast.error(data.error || "Failed to create user")
    }
  } catch (error) {
    toast.error("Failed to create user")
    console.error(error)
  }
}


  const handleEditUser = async () => {
    if (!editingUser) return

    try {
      const updateData = {
        _id: editingUser._id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        roleId: formData.roleId === "none" ? null : (formData.roleId || null),
        isActive: formData.isActive,
        userType: "admin-user",
      }

      // Only include password if it's been changed
      if (formData.password && formData.password.trim() !== "") {
        (updateData as any).password = formData.password
      }

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Admin user updated successfully")
        setIsEditDialogOpen(false)
        setEditingUser(null)
        resetForm()
        fetchUsers()
      } else {
        toast.error(data.error || "Failed to update user")
      }
    } catch (error) {
      toast.error("Failed to update user")
      console.error(error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Admin user deleted successfully")
        fetchUsers()
      } else {
        toast.error(data.error || "Failed to delete user")
      }
    } catch (error) {
      toast.error("Failed to delete user")
      console.error(error)
    }
  }

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password
      phone: user.phone || "",
      role: user.role,
      roleId: user.roleId || "none",
      isActive: user.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "admin",
      roleId: "none",
      isActive: true,
    })
    setShowPassword(false)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-muted-foreground">
            Manage admin users with dashboard access and roles
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                Users with login credentials and dashboard access
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-4.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No admin users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user,index) => (
                  <TableRow key={user._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "super-admin" ? "default" : "secondary"}>
                        {user.role === "super-admin" ? (
                          <><Shield className="mr-1 h-3 w-3" />Super Admin</>
                        ) : (
                          "Admin"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.roleName ? (
                        <Badge variant="outline">{user.roleName}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No role assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch className="mt-2"
                              checked={user.isActive}
                              onCheckedChange={async (checked) => {
                                try {
                                  const newStatus = checked ? true : false

                                  const response = await fetch("/api/users",{
                                    method:"PUT",
                                    headers:{"Content-Type":"application/json"},
                                    body:JSON.stringify({_id:user._id,isActive:newStatus,userType:"admin-user"})
                                  })
                                  if(response.ok){
                                    toast.success(`User ${newStatus ? "activated" : "deactivated"} successfully`);
                                    await fetchUsers(); 
                                  }
                                } catch (err) {
                                  toast.error("Failed to update user status");
                                   console.log(err)
                                }
                              }}
                            />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Create a new user with dashboard access and credentials
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-scroll max-h-[70vh]">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            {/* Hidden. Admin-user has fixed role */}
            <input type="hidden" value="admin-user" />
            <div className="grid gap-2">
              <Label htmlFor="roleId">Assign Role (Optional)</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No role</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
            <DialogDescription>
              Update user information and access settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-scroll max-h-[70vh]">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">New Password (Leave blank to keep current)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Access Level</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "super-admin") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-roleId">Assign Role</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No role</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
