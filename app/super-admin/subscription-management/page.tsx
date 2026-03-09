"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, XCircle, ExternalLink } from "lucide-react"
import { toast } from "@/lib/toast"

type SubRow = {
  id: string | null
  userId: string
  userEmail: string
  userName: string
  planName: string
  razorpaySubscriptionId: string | null
  status: string
  autoDebitEnabled: boolean
  nextBillingDate: string | null
  lastPaymentDate: string | null
}

export default function SubscriptionManagementPage() {
  const [list, setList] = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/subscriptions", { credentials: "include" })
      const data = await res.json()
      if (data.success) setList(data.subscriptions || [])
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Failed to load subscriptions", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/subscriptions/sync", {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: data.message || "Sync completed" })
        load()
      } else {
        toast({ title: "Sync failed", description: data.error || "Unauthorized or error", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Sync request failed", variant: "destructive" })
    } finally {
      setSyncing(false)
    }
  }

  async function handleCancel(row: SubRow) {
    if (!confirm(`Cancel subscription for ${row.userEmail}?`)) return
    setCancellingId(row.userId)
    try {
      const res = await fetch("/api/admin/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: row.userId,
          razorpaySubscriptionId: row.razorpaySubscriptionId,
          cancelAtCycleEnd: true,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: data.message })
        load()
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Request failed", variant: "destructive" })
    } finally {
      setCancellingId(null)
    }
  }

  function formatDate(v: string | null) {
    if (!v) return "—"
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>
                View and manage user subscriptions. Cancel or sync with Razorpay.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              Sync with Razorpay
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Subscription ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto Debit</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No subscriptions found.
                  </TableCell>
                </TableRow>
              ) : (
                list.map((row) => (
                  <TableRow key={row.userId + (row.razorpaySubscriptionId || "")}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{row.userName}</p>
                        <p className="text-xs text-muted-foreground">{row.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{row.planName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.razorpaySubscriptionId ? (
                        <a
                          href={`https://dashboard.razorpay.com/app/subscriptions/${row.razorpaySubscriptionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {row.razorpaySubscriptionId.slice(0, 20)}…
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>{row.autoDebitEnabled ? "Yes" : "No"}</TableCell>
                    <TableCell>{formatDate(row.nextBillingDate)}</TableCell>
                    <TableCell>{formatDate(row.lastPaymentDate)}</TableCell>
                    <TableCell className="text-right">
                      {(row.status === "active" || row.status === "trial") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(row)}
                          disabled={cancellingId === row.userId}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
