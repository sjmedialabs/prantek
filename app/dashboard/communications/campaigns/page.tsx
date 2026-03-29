"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Send, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "@/lib/toast"
import Link from "next/link"

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: "", subject: "", content: "", audience: "all", groupId: "", scheduledAt: "" })

  useEffect(() => {
    Promise.all([
      fetch("/api/campaigns").then(r => r.json()),
      fetch("/api/client-groups").then(r => r.json()),
      fetch("/api/message-templates").then(r => r.json()),
    ]).then(([c, g, t]) => {
      if (c.success) setCampaigns(c.data || [])
      if (g.success) setGroups(g.data || [])
      if (t.success) setTemplates(t.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleSend = async (action: "send" | "schedule") => {
    if (!form.name || !form.content) { toast.error("Name and content required"); return }
    setSending(true)
    try {
      const r = await fetch("/api/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, action, type: "email" }),
      })
      const d = await r.json()
      if (d.success) {
        toast.success(action === "send" ? `Campaign sent! ${d.data.sentCount} emails delivered, ${d.data.failedCount} failed` : "Campaign scheduled!")
        setDialogOpen(false); setForm({ name: "", subject: "", content: "", audience: "all", groupId: "", scheduledAt: "" })
        const refresh = await fetch("/api/campaigns").then(r => r.json())
        if (refresh.success) setCampaigns(refresh.data || [])
      } else toast.error(d.error)
    } catch { toast.error("Failed") } finally { setSending(false) }
  }

  const applyTemplate = (templateId: string) => {
    const t = templates.find(t => t._id === templateId)
    if (t) setForm({ ...form, subject: t.subject || t.name, content: t.content })
  }

  const statusColors: Record<string, string> = { sent: "bg-green-100 text-green-800", draft: "bg-gray-100 text-gray-800", scheduled: "bg-blue-100 text-blue-800", sending: "bg-yellow-100 text-yellow-800", failed: "bg-red-100 text-red-800" }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/communications"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
          <div><h1 className="text-2xl font-bold">Email Campaigns</h1><p className="text-muted-foreground text-sm">Send bulk emails to clients</p></div>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />New Campaign</Button>
      </div>
      {loading ? <p className="text-center py-12 text-muted-foreground">Loading...</p> : campaigns.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Send className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No campaigns yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c._id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.sentAt ? new Date(c.sentAt).toLocaleString() : c.scheduledAt ? `Scheduled: ${new Date(c.scheduledAt).toLocaleString()}` : "Draft"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{c.sentCount || 0} sent / {c.failedCount || 0} failed</span>
                  <Badge className={statusColors[c.status] || "bg-gray-100"}>{c.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>New Email Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Campaign Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. March Newsletter" /></div>
            {templates.length > 0 && (
              <div className="space-y-2"><Label>Use Template</Label>
                <Select onValueChange={applyTemplate}><SelectTrigger><SelectValue placeholder="Select a template" /></SelectTrigger>
                  <SelectContent>{templates.map(t => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}</SelectContent>
                </Select></div>
            )}
            <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="space-y-2"><Label>Content (HTML supported, use {"{{name}}"} for personalization)</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Audience</Label>
                <Select value={form.audience} onValueChange={v => setForm({ ...form, audience: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Clients</SelectItem><SelectItem value="group">Client Group</SelectItem></SelectContent>
                </Select></div>
              {form.audience === "group" && (
                <div className="space-y-2"><Label>Group</Label>
                  <Select value={form.groupId} onValueChange={v => setForm({ ...form, groupId: v })}><SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                    <SelectContent>{groups.map(g => <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>)}</SelectContent>
                  </Select></div>
              )}
            </div>
            <div className="space-y-2"><Label>Schedule (leave empty to send now)</Label><Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} /></div>
            <div className="flex gap-2">
              <Button onClick={() => handleSend("send")} disabled={sending} className="flex-1">{sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : <><Send className="h-4 w-4 mr-2" />Send Now</>}</Button>
              {form.scheduledAt && <Button variant="outline" onClick={() => handleSend("schedule")} disabled={sending} className="flex-1">Schedule</Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
