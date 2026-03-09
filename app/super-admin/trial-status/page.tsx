"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

type TrialUser = {
  id: string
  email: string
  name: string
  subscriptionPlanId: string | null
  subscriptionStatus: string | null
  trialEndDate: string | null
  trialPaymentProcessed: boolean
  razorpayCustomerId: string | null
  razorpayTokenId: string | null
  lastPaymentDate: string | null
  nextPaymentDate: string | null
  paymentFailedAt: string | null
  paymentFailureReason: string | null
}

export default function TrialStatusPage() {
  const [users, setUsers] = useState<TrialUser[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState("30")
  const [statusFilter, setStatusFilter] = useState<"all" | "trial" | "active" | "payment_failed">("all")
  const [showAll, setShowAll] = useState(true)

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll])

  async function loadData(customDays?: string) {
    try {
      setLoading(true)
      const params = new URLSearchParams({ days: customDays ?? days })
      if (showAll) params.set("showAll", "true")
      const res = await fetch(`/api/admin/trial-status?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setUsers(data.users || [])
      } else {
        console.error("Failed to load trial status:", data.error)
      }
    } catch (err) {
      console.error("Failed to load trial status:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((u: TrialUser) => {
    if (statusFilter === "all") return true
    if (!u.subscriptionStatus) return false
    return u.subscriptionStatus === statusFilter
  })

  function formatDate(value: string | null) {
    if (!value) return "-"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return "-"
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
  }

  function formatStatus(u: TrialUser) {
    if (u.subscriptionStatus === "payment_failed") return <Badge variant="destructive">Payment Failed</Badge>
    if (u.subscriptionStatus === "active") return <Badge>Active</Badge>
    if (u.subscriptionStatus === "trial") return <Badge variant="outline">Trial</Badge>
    if (!u.subscriptionStatus) return <Badge variant="secondary">Unknown</Badge>
    return <Badge variant="secondary">{u.subscriptionStatus}</Badge>
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trial & Auto-Debit Monitor</CardTitle>
          <CardDescription>
            Super admin view of users with upcoming trial end dates and their Razorpay auto-debit state.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="days">Window (days)</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={60}
                className="w-28"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                onBlur={() => void loadData(days)}
                disabled={showAll}
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Show all subscribers</span>
              </label>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="payment_failed">Payment Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Trial Ends</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auto-Debit</TableHead>
                  <TableHead>Last / Next Payment</TableHead>
                  <TableHead>Failure Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-sm text-gray-500">
                      Loading trial users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-sm text-gray-500">
                      No users found in this window.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{u.name || u.email}</span>
                          <span className="text-xs text-gray-500">{u.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(u.trialEndDate)}</TableCell>
                      <TableCell>{formatStatus(u)}</TableCell>
                      <TableCell>
                        {u.razorpayCustomerId && u.razorpayTokenId ? (
                          <Badge variant="outline">Token Ready</Badge>
                        ) : (
                          <Badge variant="destructive">No Token</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span>Last: {formatDate(u.lastPaymentDate)}</span>
                          <span>Next: {formatDate(u.nextPaymentDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-red-600">
                        {u.paymentFailureReason || (u.paymentFailedAt ? "Payment failed" : "-")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

