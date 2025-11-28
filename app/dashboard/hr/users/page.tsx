"use client"

import { useEffect, useState } from "react"
import { Trash2, Edit, Plus, Eye, EyeOff, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { Switch } from "@/components/ui/switch"
import { toast } from "@/lib/toast"

interface Employee {
  _id: string
  employeeNumber: string
  employeeName: string
  surname?: string
  email: string
  designation?: string
}

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: string
  roleId?: string
  roleName?: string
  employeeId?: string
  employee?: {
    employeeNumber: string
    employeeName: string
    surname?: string
    designation?: string
  }
  permissions?: string[]
  isActive: boolean
  lastLogin?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Form states
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    fetchEmployees()
    fetchRoles()
    fetchPermissions()
  }, [])


  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/permissions", { credentials: "include" })
      const data = await response.json()
      if (data.success) {
        setAvailablePermissions(data.permissions || [])
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users?userType=admin-user", { credentials: "include" })
      const data = await response.json()

      if (data.success) {
        setUsers(data.users || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch admin users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch admin users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees", { credentials: "include" })
      const data = await response.json()
      setEmployees(data || [])
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles", { credentials: "include" })
      const data = await response.json()
      setRoles(data.roles || [])
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  // Filter employees who don't have admin access yet
  const availableEmployees = employees.filter(emp => 
    !users.some(user => user.employeeId === emp._id)
  )

  const handleAddUser = async () => {
    if (!selectedEmployee || !password) {
      toast({
        title: "Error",
        description: "Please select an employee and enter a password",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/users?userType=admin-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          employeeId: selectedEmployee,
          password,
          permissions: selectedPermissions,
          userType: "admin-user",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Admin user created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const updateData: any = {
        _id: selectedUser._id,
        isActive: selectedUser.isActive,
        permissions: selectedPermissions,
        userType: "admin-user",
      }

      if (password) {
        updateData.password = password
      }

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Admin user updated successfully",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users?id=${selectedUser._id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin user deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        resetForm()
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setSelectedEmployee("")
    setPassword("")
    setShowPassword(false)
    setSelectedPermissions([])
    setSelectedUser(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setSelectedPermissions(user.permissions || [])
    setPassword("")
    setShowPassword(false)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    )
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground">
            Manage admin users and their permissions
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Sr.No</th>
                  <th className="p-4 text-left font-medium">Name</th>
                  <th className="p-4 text-left font-medium">Email</th>
                  <th className="p-4 text-left font-medium">Employee</th>
                  <th className="p-4 text-left font-medium">Permissions</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Last Login</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user,index) => (
                    <tr key={user._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4 font-medium">{user.name}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        {user.employee ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {user.employee.employeeName} {user.employee.surname || ''}
                            </div>
                            <div className="text-muted-foreground">
                              {user.employee.employeeNumber}
                              {user.employee.designation && ` • ${user.employee.designation}`}
                            </div>
                          </div>
                        ) : user.roleName ? (
                          <Badge variant="outline">{user.roleName}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {user.permissions && user.permissions.length > 0 ? (
                            user.permissions.slice(0, 2).map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {availablePermissions.find(p => p.id === perm)?.label || perm}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No permissions</span>
                          )}
                          {user.permissions && user.permissions.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{user.permissions.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Switch className="mt-2"
                              checked={user.isActive}
                              onCheckedChange={async (checked) => {
                                try {
                                  const newStatus = checked ? true : false
                                  const response = await fetch("/api/users", {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({isActive: newStatus, _id: user._id, userType: "admin-user"})
                                  })
                                  if(response.ok){
                                    setUsers((prevUsers)=>prevUsers.map((u)=>
                                      u._id === user._id ? {...u, isActive: newStatus} : u
                                    ))
                                    // await fetchUsers()
                                    
                                  }
                                  
                                } catch (err) {
                                  console.log(err)
                                }
                              }}
                            />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-6xl flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Select an employee and assign permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No employees available
                    </div>
                  ) : (
                    availableEmployees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.employeeName} {emp.surname || ''} ({emp.email}) - {emp.employeeNumber}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(
                    availablePermissions.reduce((acc: any, perm: any) => {
                      if (!acc[perm.category]) acc[perm.category] = []
                      acc[perm.category].push(perm)
                      return acc
                    }, {})
                  ).map(([category, perms]: [string, any]) => (
                    <div key={category} className="border-b last:border-b-0 pb-4 last:pb-0">
                      <h4 className="font-medium text-sm mb-3">{category}</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {perms.map((permission: any) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`add-${permission.id}`}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <Label
                              htmlFor={`add-${permission.id}`}
                              className="text-xs font-normal cursor-pointer"
                            >
                              {permission.label.replace(category, '').trim()}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
        <DialogContent className="max-w-6xl flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
            <DialogDescription>
              Update user permissions and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {selectedUser && (
              <>
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <div className="font-medium">{selectedUser.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-password">Change Password (leave blank to keep current)</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-active"
                    checked={selectedUser.isActive}
                    onCheckedChange={(checked) =>
                      setSelectedUser({ ...selectedUser, isActive: !!checked })
                    }
                  />
                  <Label htmlFor="edit-active" className="cursor-pointer">
                    Active
                  </Label>
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(
                        availablePermissions.reduce((acc: any, perm: any) => {
                          if (!acc[perm.category]) acc[perm.category] = []
                          acc[perm.category].push(perm)
                          return acc
                        }, {})
                      ).map(([category, perms]: [string, any]) => (
                        <div key={category} className="border-b last:border-b-0 pb-4 last:pb-0">
                          <h4 className="font-medium text-sm mb-3">{category}</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {perms.map((permission: any) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`edit-${permission.id}`}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                />
                                <Label
                                  htmlFor={`edit-${permission.id}`}
                                  className="text-xs font-normal cursor-pointer"
                                >
                                  {permission.label.replace(category, '').trim()}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Admin User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Name:</strong> {selectedUser.name}
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {selectedUser.email}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
