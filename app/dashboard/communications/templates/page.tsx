"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, FileText, ArrowLeft } from "lucide-react"
import { toast } from "@/lib/toast"
import Link from "next/link"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: "", subject: "", content: "" })

  const load = async () => {
    try { const r = await fetch("/api/message-templates"); const d = await r.json(); if (d.success) setTemplates(d.data || []) } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.name || !form.content) { toast.error("Name and content required"); return }
    const method = editing ? "PUT" : "POST"
    const body = editing ? { id: editing._id, ...form } : form
    const r = await fetch("/api/message-templates", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const d = await r.json()
    if (d.success) { toast.success(editing ? "Updated" : "Created"); setDialogOpen(false); setEditing(null); setForm({ name: "", subject: "", content: "" }); load() } else toast.error(d.error)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return
    const r = await fetch(`/api/message-templates?id=${id}`, { method: "DELETE" })
    if ((await r.json()).success) { toast.success("Deleted"); load() }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/communications"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
          <div><h1 className="text-2xl font-bold">Message Templates</h1><p className="text-muted-foreground text-sm">Create reusable templates. Use {"{{name}}"} for client name.</p></div>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: "", subject: "", content: "" }); setDialogOpen(true) }}><Plus className="h-4 w-4 mr-2" />New Template</Button>
      </div>
      {loading ? <p className="text-center py-12 text-muted-foreground">Loading...</p> : templates.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No templates yet.</p></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map(t => (
            <Card key={t._id}>
              <CardHeader className="pb-2"><CardTitle className="text-lg flex justify-between">{t.name}<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => { setEditing(t); setForm({ name: t.name, subject: t.subject, content: t.content }); setDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(t._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground line-clamp-3">{t.content?.replace(/<[^>]*>/g, "")}</p></CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Template</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Payment Reminder" /></div>
            <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} placeholder="Dear {{name}}, your payment is due..." /></div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
