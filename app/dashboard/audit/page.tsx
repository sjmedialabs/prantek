"use client"

import { useState } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Search, Download, AlertCircle, CheckCircle, Clock, User, FileText, Activity, Eye } from "lucide-react"
import { downloadCSV, formatDateForExport } from "@/lib/export-utils"

// Mock audit data
const auditLogs = [
  {
    id: "1",
    timestamp: "2024-01-15 14:30:22",
    user: "John Smith",
    action: "Financial Record Updated",
    resource: "Transaction #TR-2024-001",
    ipAddress: "192.168.1.100",
    status: "success",
    details: "Updated transaction amount from $1,200 to $1,250",
  },
  {
    id: "2",
    timestamp: "2024-01-15 13:45:18",
    user: "Sarah Johnson",
    action: "User Role Modified",
    resource: "User: mike@company.com",
    ipAddress: "192.168.1.105",
    status: "success",
    details: "Changed role from viewer to user",
  },
  {
    id: "3",
    timestamp: "2024-01-15 12:20:45",
    user: "Admin System",
    action: "Failed Login Attempt",
    resource: "Authentication",
    ipAddress: "203.0.113.45",
    status: "failed",
    details: "Multiple failed login attempts detected",
  },
  {
    id: "4",
    timestamp: "2024-01-15 11:15:30",
    user: "John Smith",
    action: "Asset Created",
    resource: "Asset #AS-2024-015",
    ipAddress: "192.168.1.100",
    status: "success",
    details: "Created new equipment asset: Dell Laptop",
  },
  {
    id: "5",
    timestamp: "2024-01-15 10:30:12",
    user: "Sarah Johnson",
    action: "Report Generated",
    resource: "Financial Report Q1-2024",
    ipAddress: "192.168.1.105",
    status: "success",
    details: "Generated quarterly financial report",
  },
]

const complianceChecks = [
  {
    category: "Data Protection",
    checks: [
      { name: "Data Encryption", status: "compliant", lastCheck: "2024-01-15" },
      { name: "Access Controls", status: "compliant", lastCheck: "2024-01-15" },
      { name: "Data Retention Policy", status: "review", lastCheck: "2024-01-10" },
      { name: "Backup Procedures", status: "compliant", lastCheck: "2024-01-14" },
    ],
  },
  {
    category: "Financial Controls",
    checks: [
      { name: "Transaction Logging", status: "compliant", lastCheck: "2024-01-15" },
      { name: "Approval Workflows", status: "compliant", lastCheck: "2024-01-15" },
      { name: "Reconciliation Process", status: "compliant", lastCheck: "2024-01-13" },
      { name: "Audit Trail Integrity", status: "compliant", lastCheck: "2024-01-15" },
    ],
  },
  {
    category: "User Management",
    checks: [
      { name: "Role-Based Access", status: "compliant", lastCheck: "2024-01-15" },
      { name: "Password Policies", status: "compliant", lastCheck: "2024-01-12" },
      { name: "Session Management", status: "compliant", lastCheck: "2024-01-15" },
      { name: "User Activity Monitoring", status: "compliant", lastCheck: "2024-01-15" },
    ],
  },
]

export default function AuditPage() {
  const { user, tenant, hasPermission } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")

  if (!hasPermission("audit_access")) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access audit logs.</p>
        </div>
      </div>
    )
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    const matchesAction = actionFilter === "all" || log.action.toLowerCase().includes(actionFilter.toLowerCase())

    return matchesSearch && matchesStatus && matchesAction
  })

  const handleExportAuditLogs = () => {
    downloadCSV(`audit-logs-${new Date().toISOString().split("T")[0]}.csv`, filteredLogs, [
      { key: "timestamp", label: "Timestamp" },
      { key: "user", label: "User" },
      { key: "action", label: "Action" },
      { key: "resource", label: "Resource" },
      { key: "status", label: "Status" },
      { key: "ipAddress", label: "IP Address" },
      { key: "details", label: "Details" },
    ])
  }

  const handleExportComplianceReport = () => {
    const complianceData = complianceChecks.flatMap((category) =>
      category.checks.map((check) => ({
        category: category.category,
        checkName: check.name,
        status: check.status,
        lastCheck: check.lastCheck,
      })),
    )

    downloadCSV(`compliance-report-${new Date().toISOString().split("T")[0]}.csv`, complianceData, [
      { key: "category", label: "Category" },
      { key: "checkName", label: "Check Name" },
      { key: "status", label: "Status" },
      { key: "lastCheck", label: "Last Check", format: formatDateForExport },
    ])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "review":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Success
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            Failed
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            Warning
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit & Compliance</h1>
          <p className="text-gray-600">Monitor system activities and ensure compliance standards</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleExportAuditLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportComplianceReport}>
            <FileText className="h-4 w-4 mr-2" />
            Compliance Report
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold text-green-600">94%</p>
                <p className="text-sm text-gray-500">23/24 checks passed</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Audits</p>
                <p className="text-2xl font-bold text-blue-600">3</p>
                <p className="text-sm text-gray-500">In progress</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Audit</p>
                <p className="text-2xl font-bold text-gray-900">Jan 15</p>
                <p className="text-sm text-gray-500">2024</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Checks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search logs by user, action, or resource..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="login">Login/Logout</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="user">User Management</SelectItem>
                    <SelectItem value="asset">Asset Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Audit Logs</CardTitle>
              <CardDescription>Detailed log of all system activities and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{log.user}</span>
                        </div>
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className="font-mono text-sm">{log.resource}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {complianceChecks.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{category.category}</CardTitle>
                <CardDescription>Compliance status for {category.category.toLowerCase()} requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.checks.map((check, checkIndex) => (
                    <div key={checkIndex} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <p className="font-medium">{check.name}</p>
                          <p className="text-sm text-gray-500">Last checked: {check.lastCheck}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {check.status === "compliant" && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Compliant
                          </Badge>
                        )}
                        {check.status === "review" && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                            Review Required
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Reports</CardTitle>
                <CardDescription>Generate comprehensive compliance reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Monthly Compliance Report
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  Security Audit Report
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  Financial Controls Report
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  User Activity Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Schedules</CardTitle>
                <CardDescription>Upcoming and scheduled audit activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Quarterly Financial Audit</p>
                    <p className="text-sm text-gray-600">Due: March 31, 2024</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Upcoming
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Security Review</p>
                    <p className="text-sm text-gray-600">Due: February 15, 2024</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Completed
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">Data Protection Assessment</p>
                    <p className="text-sm text-gray-600">Due: January 20, 2024</p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    In Progress
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
