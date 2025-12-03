"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Download,
  User,
  Loader2,
} from "lucide-react"

interface ActivityLog {
  _id: string
  timestamp: string
  userId: string
  userName: string
  userEmail: string
  action: string
  resource: string
  ipAddress?: string
  status: "success" | "failed" | "warning"
  details: string
  category: string
  planName?: string
  amount?: number
}

export default function SuperAdminActivityPage() {
  const { user, loading: userLoading } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Wait for user to load before fetching
    if (!userLoading && user) {
      fetchActivityLogs()
    }
  }, [user, userLoading])

  const fetchActivityLogs = async () => {
    try {
      setLoading(true)
      setError("")
      
      // Fetch only subscription category logs with credentials
      const response = await fetch("/api/activity-logs?category=subscription&limit=100", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch activity logs")
      }
      
      const result = await response.json()
      console.log("Activity log response data:::",result);
      setActivityLogs(result.data || [])
    } catch (err) {
      console.error("Error fetching activity logs:", err)
      setError("Failed to load activity logs")
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch =
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.planName?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return "Free"
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ["Timestamp", "User", "Email", "Action", "Plan", "Amount", "Details"]
    const rows = filteredLogs.map(log => [
      formatTimestamp(log.timestamp),
      log.userName || "N/A",
      log.userEmail || "N/A",
      log.action || "N/A",
      log.planName || "N/A",
      log.amount || 0,
      log.details || "N/A"
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Activity Logs</h1>
          <p className="text-gray-600">Monitor subscription purchase activities</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by user, email, action, or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>Detailed log of subscription purchase activities</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 text-center py-4">{error}</div>
          )}
          
          {!error && filteredLogs.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              No activity logs found
            </div>
          )}

          {!error && filteredLogs.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{log.userName || "Unknown"}</div>
                            <div className="text-xs text-gray-500 truncate">{log.userEmail || "N/A"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{log.action}</TableCell>
                      <TableCell className="font-medium">{log.planName || log.resource}</TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {formatAmount(log.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-md">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
