"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

export default function TrackingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [recipients, setRecipients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch("/api/campaigns").then(r => r.json()).then(d => { if (d.success) setCampaigns((d.data || []).filter((c: any) => c.status === "sent")) }).finally(() => setLoading(false)) }, [])

  const loadRecipients = async (campaignId: string) => {
    const r = await fetch(`/api/campaigns/${campaignId}/recipients`); const d = await r.json()
    if (d.success) { setRecipients(d.data || []); setSelected(campaigns.find(c => c._id === campaignId)) }
  }

  const statusColor = (s: string) => s === "sent" ? "bg-green-100 text-green-800" : s === "failed" ? "bg-red-100 text-red-800" : "bg-gray-100"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/communications"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <div><h1 className="text-2xl font-bold">Delivery Tracking</h1><p className="text-muted-foreground text-sm">Track email delivery for sent campaigns</p></div>
      </div>
      {loading ? <p className="text-center py-12 text-muted-foreground">Loading...</p> : !selected ? (
        campaigns.length === 0 ? <Card><CardContent className="py-12 text-center"><Mail className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No sent campaigns to track.</p></CardContent></Card> : (
          <div className="space-y-3">{campaigns.map(c => (
            <Card key={c._id} className="cursor-pointer hover:shadow" onClick={() => loadRecipients(c._id)}>
              <CardContent className="py-4 flex justify-between items-center"><div><p className="font-medium">{c.name}</p><p className="text-sm text-muted-foreground">{new Date(c.sentAt).toLocaleString()}</p></div><span className="text-sm">{c.sentCount} sent / {c.failedCount} failed</span></CardContent>
            </Card>
          ))}</div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => setSelected(null)}><ArrowLeft className="h-4 w-4 mr-1" />Back to campaigns</Button><h2 className="font-semibold">{selected.name}</h2></div>
          {recipients.length === 0 ? <p className="text-muted-foreground">No recipient data.</p> : (
            <div className="space-y-2">{recipients.map((r, i) => (
              <Card key={i}><CardContent className="py-3 flex justify-between items-center"><div><p className="text-sm font-medium">{r.recipientEmail}</p>{r.recipientName && <p className="text-xs text-muted-foreground">{r.recipientName}</p>}</div><div className="flex items-center gap-2">{r.failedReason && <span className="text-xs text-red-500">{r.failedReason}</span>}<Badge className={statusColor(r.status)}>{r.status}</Badge></div></CardContent></Card>
            ))}</div>
          )}
        </div>
      )}
    </div>
  )
}
