"use client"

import { useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  Building2,
  Users,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ClientAccount {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  address: string
  plan: "standard" | "premium" | "enterprise"
  status: "active" | "suspended" | "trial" | "cancelled"
  userCount: number
  monthlyRevenue: number
  totalRevenue: number
  joinDate: string
  lastActivity: string
  paymentStatus: "current" | "overdue" | "failed"
  trialEndsAt?: string
}

export default function ClientAccountsPage() {
  const { hasPermission } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [clients, setClients] = useState<ClientAccount[]>([
    {
      id: "1",
      companyName: "Acme Corporation",
      contactName: "John Smith",
      email: "john@acme.com",
      phone: "+1 (555) 123-4567",
      address: "123 Business St, New York, NY 10001",
      plan: "premium",
      status: "active",
      userCount: 25,
      monthlyRevenue: 199,
      totalRevenue: 2388,
      joinDate: "2024-01-15",
      lastActivity: "2024-01-20",
      paymentStatus: "current",
    },
    {
      id: "2",
      companyName: "Tech Startup Inc",
      contactName: "Sarah Johnson",
      email: "sarah@techstartup.com",
      phone: "+1 (555) 987-6543",
      address: "456 Innovation Ave, San Francisco, CA 94105",
      plan: "standard",
      status: "active",
      userCount: 8,
      monthlyRevenue: 99,
      totalRevenue: 891,
      joinDate: "2024-01-10",
      lastActivity: "2024-01-19",
      paymentStatus: "current",
    },
    {
      id: "3",
      companyName: "Global Enterprises",
      contactName: "Michael Brown",
      email: "michael@globalent.com",
      phone: "+1 (555) 456-7890",
      address: "789 Corporate Blvd, Chicago, IL 60601",
      plan: "enterprise",
      status: "trial",
      userCount: 45,
      monthlyRevenue: 0,
      totalRevenue: 0,
      joinDate: "2024-01-18",
      lastActivity: "2024-01-20",
      paymentStatus: "current",
      trialEndsAt: "2024-02-18",
    },
    {
      id: "4",
      companyName: "Small Business Co",
      contactName: "Lisa Davis",
      email: "lisa@smallbiz.com",
      phone: "+1 (555) 321-0987",
      address: "321 Main St, Austin, TX 73301",
      plan: "standard",
      status: "suspended",
      userCount: 5,
      monthlyRevenue: 99,
      totalRevenue: 495,
      joinDate: "2024-01-05",
      lastActivity: "2024-01-15",
      paymentStatus: "overdue",
    },
    {
      id: "5",
      companyName: "Creative Agency",
      contactName: "David Wilson",
      email: "david@creative.com",
      phone: "+1 (555) 654-3210",
      address: "654 Design St, Los Angeles, CA 90210",
      plan: "premium",
      status: "cancelled",
      userCount: 0,
      monthlyRevenue: 0,
      totalRevenue: 1194,
      joinDate: "2023-12-01",
      lastActivity: "2024-01-10",
      paymentStatus: "failed",
    },
  ])

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.status === "active").length
  const suspendedClients = clients.filter((c) => c.status === "suspended").length
  const totalMRR = clients.filter((c) => c.status === "active").reduce((sum, c) => sum + c.monthlyRevenue, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "suspended":
        return (
          <Badge className="bg-red-100 text-red-800">
            <Pause className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        )
      case "trial":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Calendar className="h-3 w-3 mr-1" />
            Trial
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "current":
        return <Badge className="bg-green-100 text-green-800">Current</Badge>
      case "overdue":
        return <Badge className="bg-yellow-100 text-yellow-800">Overdue</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "standard":
        return <Badge variant="outline">Standard</Badge>
      case "premium":
        return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
      case "enterprise":
        return <Badge className="bg-orange-100 text-orange-800">Enterprise</Badge>
      default:
        return <Badge variant="secondary">{plan}</Badge>
    }
  }

  const handleSuspendAccount = async (clientId: string) => {
    setActionLoading(clientId)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setClients(clients.map((client) => (client.id === clientId ? { ...client, status: "suspended" as const } : client)))
    setActionLoading(null)
  }

  const handleReactivateAccount = async (clientId: string) => {
    setActionLoading(clientId)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setClients(clients.map((client) => (client.id === clientId ? { ...client, status: "active" as const } : client)))
    setActionLoading(null)
  }

  const handleViewDetails = (client: ClientAccount) => {
    setSelectedClient(client)
    setIsDetailsDialogOpen(true)
  }

  if (!hasPermission("manage_client_accounts")) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage client accounts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Account Management</h1>
          <p className="text-gray-600">Manage client accounts, subscriptions, and billing</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">Export Clients</Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalClients}</div>
            <p className="text-xs text-gray-600 mt-1">All client accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Active Clients</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeClients}</div>
            <p className="text-xs text-gray-600 mt-1">Currently paying</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Suspended</CardTitle>
            <Pause className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{suspendedClients}</div>
            <p className="text-xs text-gray-600 mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{totalMRR.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">From active clients</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
            All Clients
          </TabsTrigger>
          <TabsTrigger value="active" onClick={() => setStatusFilter("active")}>
            Active
          </TabsTrigger>
          <TabsTrigger value="suspended" onClick={() => setStatusFilter("suspended")}>
            Suspended
          </TabsTrigger>
          <TabsTrigger value="trial" onClick={() => setStatusFilter("trial")}>
            Trial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Accounts</CardTitle>
                  <CardDescription>Manage all client accounts and subscriptions</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search clients..."
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
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.companyName}</div>
                          <div className="text-sm text-gray-500">{client.contactName}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(client.plan)}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>{client.userCount}</TableCell>
                      <TableCell>
                        <div className="font-medium">₹{client.monthlyRevenue}/mo</div>
                        <div className="text-sm text-gray-500">₹{client.totalRevenue} total</div>
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(client.paymentStatus)}</TableCell>
                      <TableCell>{client.lastActivity}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {client.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => handleSuspendAccount(client.id)}
                                className="text-red-600"
                                disabled={actionLoading === client.id}
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                {actionLoading === client.id ? "Suspending..." : "Suspend Account"}
                              </DropdownMenuItem>
                            ) : client.status === "suspended" ? (
                              <DropdownMenuItem
                                onClick={() => handleReactivateAccount(client.id)}
                                className="text-green-600"
                                disabled={actionLoading === client.id}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                {actionLoading === client.id ? "Reactivating..." : "Reactivate Account"}
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Client Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Account Details</DialogTitle>
            <DialogDescription>Detailed information for {selectedClient?.companyName}</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Account Status Alert */}
              {selectedClient.status === "suspended" && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This account is currently suspended. Users cannot access the platform.
                  </AlertDescription>
                </Alert>
              )}

              {/* Company Information */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{selectedClient.companyName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{selectedClient.contactName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-sm">{selectedClient.address}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Subscription Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Plan:</span>
                      {getPlanBadge(selectedClient.plan)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      {getStatusBadge(selectedClient.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Users:</span>
                      <span className="font-medium">{selectedClient.userCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Monthly Revenue:</span>
                      <span className="font-medium">₹{selectedClient.monthlyRevenue}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Revenue:</span>
                      <span className="font-medium">₹{selectedClient.totalRevenue}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Payment Status:</span>
                      {getPaymentStatusBadge(selectedClient.paymentStatus)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Account Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Join Date:</span>
                      <span>{selectedClient.joinDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Activity:</span>
                      <span>{selectedClient.lastActivity}</span>
                    </div>
                    {selectedClient.trialEndsAt && (
                      <div className="flex items-center justify-between">
                        <span>Trial Ends:</span>
                        <Badge className="bg-blue-100 text-blue-800">{selectedClient.trialEndsAt}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
                {selectedClient.status === "active" ? (
                  <Button
                    variant="destructive"
                    onClick={() => handleSuspendAccount(selectedClient.id)}
                    disabled={actionLoading === selectedClient.id}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    {actionLoading === selectedClient.id ? "Suspending..." : "Suspend Account"}
                  </Button>
                ) : selectedClient.status === "suspended" ? (
                  <Button
                    onClick={() => handleReactivateAccount(selectedClient.id)}
                    disabled={actionLoading === selectedClient.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {actionLoading === selectedClient.id ? "Reactivating..." : "Reactivate Account"}
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
