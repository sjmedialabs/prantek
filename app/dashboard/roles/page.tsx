"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"   // ✅ ADDED
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Search, Edit, Trash2, Plus, Shield, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api-client" // Fixed import path from dataStore to data-store


interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface Role {
  _id: any
  id: string
  name: string
  // description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
  isActive: boolean
  createdAt: string
}

const availablePermissions: Permission[] = [
  { id: "view_dashboard", name: "View Dashboard", description: "Access to main dashboard", category: "General" },
  {
    id: "view_financials",
    name: "View Financials",
    description: "View financial data and transactions",
    category: "Financial",
  },
  {
    id: "manage_financials",
    name: "Manage Financials",
    description: "Create and edit financial transactions",
    category: "Financial",
  },
  { id: "view_quotations", name: "View Quotations", description: "View quotations and proposals", category: "Sales" },
  { id: "manage_quotations", name: "Manage Quotations", description: "Create and edit quotations", category: "Sales" },
  {
    id: "manage_users",
    name: "Manage Users",
    description: "Create, edit, and delete users",
    category: "Administration",
  },
  { id: "manage_roles", name: "Manage Roles", description: "Create and edit user roles", category: "Administration" },
  { id: "manage_assets", name: "Manage Assets", description: "Asset management and tracking", category: "Assets" },
  { id: "view_reports", name: "View Reports", description: "Access to reports and analytics", category: "Reports" },
  {
    id: "audit_access",
    name: "Audit Access",
    description: "Access to audit logs and compliance",
    category: "Compliance",
  },
  {
    id: "tenant_settings",
    name: "Tenant Settings",
    description: "Manage organization settings",
    category: "Administration",
  },
]

export default function RolesPage() {
  const { hasPermission } = useUser()
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [newRole, setNewRole] = useState({
    name: "",
    // description: "",
    permissions: [] as string[],
  })

  // ✅ Load from DB — NO DATASTORE
  useEffect(() => {
    const loadRoles = async () => {
      const loadedRoles = await api.roles.getAll()
      setRoles(loadedRoles)   // ✅ Always use DB roles
      console.log("Loaded roles from DB:", loadedRoles)
    }
    loadRoles()
  }, [])
  const filteredRoles = (roles || [])
    .filter((role) => role?.name)
    .filter((role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase())
      // (role.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    )

const validateRole = (role: { name: string; permissions: string[] }, roles: Role[], editingId?: string) => {
  if (!role.name || role.name.trim().length < 3) {
    return "Role name must be at least 3 characters."
  }

  // ✅ DUPLICATE CHECK → exclude current editing role
  const duplicate = roles.some(
    (r) => r.name.trim().toLowerCase() === role.name.trim().toLowerCase() && r._id !== editingId
  )
  if (duplicate) {
    return "Duplicate role name is not allowed."
  }

  if (!role.permissions || role.permissions.length === 0) {
    return "Select at least 1 permission."
  }

  return null
}
const handleAddRole = async () => {
  const error = validateRole(newRole, roles)
  if (error) {
    toast({ title: "Notification", description: error, variant: "destructive" })
    return
  }

  try {
    const payload = {
      name: newRole.name.trim(),
      permissions: newRole.permissions,
      isSystem: false,
      userCount: 0,
    }

    const saved = await api.roles.create(payload)

    setRoles((prev) => [...prev, saved])
    setNewRole({ name: "", permissions: [] })
    setIsAddRoleOpen(false)

    toast({ title: "Success", description: "Role created successfully!" })
    window.location.reload()
  } catch (err: any) {
    toast({
      title: "Notification",
      description: "Failed to create role: " + (err.message || "Something went wrong"),
      variant: "destructive",
    })
  }
}
const handleEditRole = (role: Role) => {
  setEditingRole(role)
  setNewRole({
    name: role.name,
    permissions: [...role.permissions],
  })
  setIsAddRoleOpen(true)
}
const handleUpdateRole = async () => {
  if (!editingRole || !editingRole._id) return

  const error = validateRole(newRole, roles, editingRole._id)
  if (error) {
    toast({ title: "Notification", description: error, variant: "destructive" })
    return
  }

  try {
    const updated = await api.roles.update(editingRole._id, newRole)

    setRoles((prev) =>
      prev.map((r) => (r._id === editingRole._id ? updated : r))
    )

    toast({ title: "Success", description: "Role updated successfully!" })
    window.location.reload()

    setEditingRole(null)
    setNewRole({ name: "", permissions: [] })
    setIsAddRoleOpen(false)

  } catch (err: any) {
    toast({
      title: "Notification",
      description: "Failed to update role: " + (err.message || "Something went wrong"),
      variant: "destructive",
    })
  }
}

  const handleToggleRoleActive = async (id: string, isActive: boolean) => {
    try {
      const updated = await api.roles.toggle(id, isActive)

      setRoles((prev) =>
        prev.map((role) =>
          role.id === id ? { ...role, isActive } : role
        )
      )
      toast({ title: "Success", description: "Role status updated successfully!" })   // ✅ ADDED
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Notification", description: "Failed to update status: " + (err.message || "Something went wrong"), variant: "default" })   // ✅ ADDED
    }
  }



  const handlePermissionToggle = (permissionId: string) => {
    setNewRole((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }))
  }

  const getPermissionsByCategory = () => {
    const categories: { [key: string]: Permission[] } = {}
    availablePermissions.forEach((permission) => {
      if (!categories[permission.category]) {
        categories[permission.category] = []
      }
      categories[permission.category].push(permission)
    })
    return categories
  }


  if (!hasPermission("manage_roles")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage roles.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Create and manage user roles and permissions</p>
        </div>
        <Dialog
          open={isAddRoleOpen}
          onOpenChange={(open) => {
            setIsAddRoleOpen(open)
            if (!open) {
              setEditingRole(null)
              setNewRole({ name: "", permissions: [] })
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
              <DialogDescription>
                {editingRole ? "Update role details and permissions" : "Define a new role with specific permissions"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Role Name</Label>
                  <Input
                    id="roleName"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="Enter role name"
                  />
                </div>
                {/* <div className="space-y-2">
                  <Label>Users with this role</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{editingRole ? editingRole.userCount : 0} users</span>
                  </div>
                </div> */}
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe this role and its purpose"
                  rows={2}
                />
              </div> */}

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <Label className="text-base font-semibold">Permissions</Label>
                  <Badge variant="outline">{newRole.permissions.length} selected</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="font-medium text-gray-900 border-b pb-1">{category}</h4>
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={permission.id}
                              checked={newRole.permissions.includes(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                {permission.name}
                              </Label>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingRole ? handleUpdateRole : handleAddRole}>
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            {/* <p className="text-xs text-muted-foreground">{roles.filter((r) => !r.isSystem).length} custom roles</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* <div className="text-2xl font-bold">{roles.reduce((sum, role) => sum + role.userCount, 0)}</div> */}
            <p className="text-xs text-muted-foreground">Across all roles</p>
          </CardContent>
        </Card>
{/* 
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availablePermissions.length}</div>
            <p className="text-xs text-muted-foreground">Available permissions</p>
          </CardContent>
        </Card> */}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Roles ({roles.length})</CardTitle>
              <CardDescription>Manage user roles and their permissions</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                {/* <TableHead>Type</TableHead> */}
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{role.name}</div>
                      {/* <div className="text-sm text-gray-500">{role.description}</div> */}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{role.userCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.permissions.length} permissions</Badge>
                  </TableCell>
                  {/* <TableCell>
                    <Badge variant={role.isSystem ? "default" : "secondary"}>
                      {role.isSystem ? "System" : "Custom"}
                    </Badge>
                  </TableCell> */}
                  <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)} disabled={role.isSystem}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={!!role.isActive}   // ✅ ensures boolean
                        onCheckedChange={(checked) => handleToggleRoleActive(role._id, checked)}
                        disabled={role.userCount > 0}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
