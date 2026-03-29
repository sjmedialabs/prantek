"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Users, ArrowLeft } from "lucide-react"
import { toast } from "@/lib/toast"
import Link from "next/link"

export default function ClientGroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: "", description: "", filters: { location: "", minRevenue: "", activity: "" } })

  const loadGroups = async () => {
    try {
      const r = await fetch("/api/client-groups")
      const d = await r.json()
      if (d.success) setGroups(d.data || [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { loadGroups() }, [])

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return }
    const method = editing ? "PUT" : "POST"
    const body = editing ? { id: editing._id, ...form } : form
    const r = await fetch("/api/client-groups", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const d = await r.json()
    if (d.success) { toast.success(editing ? "Group updated" : "Group created"); setDialogOpen(false); setEditing(null); setForm({ name: "", description: "", filters: { location: "", minRevenue: "", activity: "" } }); loadGroups() }
    else toast.error(d.error)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this group?")) return
    const r = await fetch(`/api/client-groups?id=${id}`, { method: "DELETE" })
    const d = await r.json()
    if (d.success) { toast.success("Group deleted"); loadGroups() }
  }

  const openEdit = (g: any) => {
    setEditing(g); setForm({ name: g.name, description: g.description, filters: g.filters || {} }); setDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/communications"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
          <div><h1 className="text-2xl font-bold">Client Groups & Segmentation</h1><p className="text-muted-foreground text-sm">Create groups for targeted messaging</p></div>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: "", description: "", filters: { location: "", minRevenue: "", activity: "" } }); setDialogOpen(true) }}><Plus className="h-4 w-4 mr-2" />Create Group</Button>
      </div>
      {loading ? <p className="text-center py-12 text-muted-foreground">Loading...</p> : groups.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No groups yet. Create your first client group.</p></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Card key={g._id}>
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center justify-between">{g.name}<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(g._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{g.description || "No description"}</p>{g.filters?.location && <p className="text-xs mt-2">Location: {g.filters.location}</p>}</CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Group" : "Create Group"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Group Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premium Clients" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Filter: Location</Label><Input value={form.filters.location} onChange={e => setForm({ ...form, filters: { ...form.filters, location: e.target.value } })} placeholder="e.g. Mumbai" /></div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"} Group</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
