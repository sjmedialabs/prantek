"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { api } from "@/lib/api-client" // Fixed import path from dataStore to data-store

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
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
  const [roles, setRoles] = useState<Role[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  useEffect(() => {
    const loadRoles = async () => {
      const loadedRoles = await api.roles.getAll()
      if (loadedRoles.length > 0) {
        setRoles(loadedRoles)
      } else {
        // Initialize with default roles if none exist
        const defaultRoles: Role[] = [
          {
            id: "1",
            name: "Super Admin",
            description: "Full system access with all permissions",
            permissions: availablePermissions.map((p) => p.id),
            userCount: 1,
            isSystem: true,
            createdAt: "2024-01-01",
          },
          {
            id: "2",
            name: "Admin",
            description: "Administrative access with most permissions",
            permissions: [
              "view_dashboard",
              "view_financials",
              "manage_financials",
              "view_quotations",
              "manage_quotations",
              "manage_users",
              "manage_assets",
              "view_reports",
              "tenant_settings",
            ],
            userCount: 2,
            isSystem: true,
            createdAt: "2024-01-01",
          },
          {
            id: "3",
            name: "Manager",
            description: "Management level access to core features",
            permissions: [
              "view_dashboard",
              "view_financials",
              "manage_financials",
              "view_quotations",
              "manage_quotations",
              "view_reports",
            ],
            userCount: 3,
            isSystem: false,
            createdAt: "2024-01-05",
          },
          {
            id: "4",
            name: "Employee",
            description: "Standard employee access",
            permissions: ["view_dashboard", "view_financials", "view_quotations", "view_reports"],
            userCount: 8,
            isSystem: false,
            createdAt: "2024-01-10",
          },
          {
            id: "5",
            name: "Viewer",
            description: "Read-only access to basic information",
            permissions: ["view_dashboard", "view_financials", "view_reports"],
            userCount: 5,
            isSystem: true,
            createdAt: "2024-01-01",
          },
        ]
        await dataStore.saveAll("roles", defaultRoles)
        setRoles(defaultRoles)
      }
    }
    loadRoles()
  }, [])

  useEffect(() => {
    const saveRoles = async () => {
      if (roles.length > 0) {
        await dataStore.saveAll("roles", roles)
      }
    }
    saveRoles()
  }, [roles])

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddRole = () => {
    const role: Role = {
      id: Date.now().toString(),
      ...newRole,
      userCount: 0,
      isSystem: false,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setRoles([...roles, role])
    setNewRole({ name: "", description: "", permissions: [] })
    setIsAddRoleOpen(false)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setNewRole({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    })
    setIsAddRoleOpen(true)
  }

  const handleUpdateRole = () => {
    if (!editingRole) return

    setRoles(roles.map((role) => (role.id === editingRole.id ? { ...role, ...newRole } : role)))
    setEditingRole(null)
    setNewRole({ name: "", description: "", permissions: [] })
    setIsAddRoleOpen(false)
  }

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId)
    if (role?.isSystem) {
      alert("Cannot delete system roles")
      return
    }
    if (role?.userCount > 0) {
      alert("Cannot delete roles that are assigned to users")
      return
    }
    setRoles(roles.filter((role) => role.id !== roleId))
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
              setNewRole({ name: "", description: "", permissions: [] })
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Role Name</Label>
                  <Input
                    id="roleName"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="Enter role name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Users with this role</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{editingRole ? editingRole.userCount : 0} users</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe this role and its purpose"
                  rows={2}
                />
              </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">{roles.filter((r) => !r.isSystem).length} custom roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.reduce((sum, role) => sum + role.userCount, 0)}</div>
            <p className="text-xs text-muted-foreground">Across all roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availablePermissions.length}</div>
            <p className="text-xs text-muted-foreground">Available permissions</p>
          </CardContent>
        </Card>
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
                <TableHead>Type</TableHead>
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
                      <div className="text-sm text-gray-500">{role.description}</div>
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
                  <TableCell>
                    <Badge variant={role.isSystem ? "default" : "secondary"}>
                      {role.isSystem ? "System" : "Custom"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)} disabled={role.isSystem}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={role.isSystem || role.userCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
