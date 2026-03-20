"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type SubscriptionHistoryRow = {
  planName?: string
  startDate?: string | null
  endDate?: string | null
  status?: string
  amount?: number
  source?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  clientLabel?: string
}

export function ClientSubscriptionHistoryDialog({ open, onOpenChange, userId, clientLabel }: Props) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<SubscriptionHistoryRow[]>([])

  useEffect(() => {
    if (!open || !userId) {
      setRows([])
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/super-admin/clients/${userId}/subscription-history`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.success && Array.isArray(data.entries)) setRows(data.entries)
        else setRows([])
      })
      .catch(() => {
        if (!cancelled) setRows([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, userId])

  const fmt = (s: string | null | undefined) => {
    if (!s) return "—"
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscription history</DialogTitle>
          <DialogDescription>
            {clientLabel ? `${clientLabel} — ` : null}
            Plan periods and payments.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-gray-500 py-6">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500 py-6">No subscription history found.</p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={`${r.planName}-${r.startDate}-${idx}`}>
                    <TableCell className="font-medium">{r.planName || "—"}</TableCell>
                    <TableCell>{fmt(r.startDate)}</TableCell>
                    <TableCell>{fmt(r.endDate)}</TableCell>
                    <TableCell>
                      <span className="capitalize">{r.status || "—"}</span>
                      {r.source ? (
                        <span className="text-xs text-muted-foreground ml-1">({r.source})</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">{(r.amount ?? 0).toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
