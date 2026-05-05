"use client"
import { useMemo, useRef, useState, useEffect } from "react"
import Papa from "papaparse"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Plus, Pencil, Trash2, Users, ArrowLeft, Mail, Upload, X,
} from "lucide-react"
import { toast } from "@/lib/toast"
import Link from "next/link"

type GroupEmail = { email: string; name?: string }
type GroupForm = {
  name: string
  description: string
  filters: { location: string; minRevenue: string; activity: string }
  emails: GroupEmail[]
}

const EMPTY_FORM: GroupForm = {
  name: "",
  description: "",
  filters: { location: "", minRevenue: "", activity: "" },
  emails: [],
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Normalize + dedupe a list of GroupEmail objects (case-insensitive). */
function mergeEmails(existing: GroupEmail[], incoming: GroupEmail[]): {
  merged: GroupEmail[]
  added: number
  invalid: number
  duplicates: number
} {
  const map = new Map<string, GroupEmail>()
  for (const e of existing) {
    const key = e.email.trim().toLowerCase()
    if (key) map.set(key, { email: key, ...(e.name ? { name: e.name } : {}) })
  }
  let added = 0, invalid = 0, duplicates = 0
  for (const raw of incoming) {
    const email = (raw.email || "").trim().toLowerCase()
    const name = raw.name?.trim()
    if (!email || !EMAIL_RE.test(email)) { invalid++; continue }
    if (map.has(email)) { duplicates++; continue }
    map.set(email, name ? { email, name } : { email })
    added++
  }
  return { merged: Array.from(map.values()), added, invalid, duplicates }
}

/** Parse a free-form textarea of emails — newlines, commas, semicolons, or whitespace. */
function parseEmailBlob(blob: string): GroupEmail[] {
  if (!blob) return []
  return blob
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((email) => ({ email }))
}

/** Pick email/name columns from parsed CSV rows in a forgiving way. */
function rowsToEmails(rows: Record<string, unknown>[]): GroupEmail[] {
  if (!rows.length) return []
  const first = rows[0]
  const keys = Object.keys(first)
  const emailKey =
    keys.find((k) => /^(email|e-mail|mail)$/i.test(k.trim())) ||
    keys.find((k) => /email/i.test(k)) ||
    keys[0]
  const nameKey =
    keys.find((k) => /^(name|full.?name|client.?name)$/i.test(k.trim())) ||
    keys.find((k) => /name/i.test(k))
  const out: GroupEmail[] = []
  for (const r of rows) {
    const email = String(r[emailKey] ?? "").trim()
    if (!email) continue
    const name = nameKey ? String(r[nameKey] ?? "").trim() : ""
    out.push(name ? { email, name } : { email })
  }
  return out
}

export default function ClientGroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<GroupForm>(EMPTY_FORM)

  // Email-management working state inside the dialog
  const [newEmail, setNewEmail] = useState("")
  const [newName, setNewName] = useState("")
  const [bulkText, setBulkText] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadGroups = async () => {
    try {
      const r = await fetch("/api/client-groups")
      const d = await r.json()
      if (d.success) setGroups(d.data || [])
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { loadGroups() }, [])

  const resetDialog = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setNewEmail("")
    setNewName("")
    setBulkText("")
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return }
    const method = editing ? "PUT" : "POST"
    const body = editing ? { id: editing._id, ...form } : form
    const r = await fetch("/api/client-groups", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const d = await r.json()
    if (d.success) {
      toast.success(editing ? "Group updated" : "Group created")
      setDialogOpen(false)
      resetDialog()
      loadGroups()
    } else {
      toast.error(d.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this group?")) return
    const r = await fetch(`/api/client-groups?id=${id}`, { method: "DELETE" })
    const d = await r.json()
    if (d.success) { toast.success("Group deleted"); loadGroups() }
  }

  const openEdit = (g: any) => {
    setEditing(g)
    setForm({
      name: g.name || "",
      description: g.description || "",
      filters: {
        location: g.filters?.location || "",
        minRevenue: g.filters?.minRevenue || "",
        activity: g.filters?.activity || "",
      },
      emails: Array.isArray(g.emails) ? g.emails : [],
    })
    setNewEmail("")
    setNewName("")
    setBulkText("")
    setDialogOpen(true)
  }

  const addOneEmail = () => {
    const incoming: GroupEmail[] = [{ email: newEmail, name: newName || undefined }]
    const { merged, added, invalid, duplicates } = mergeEmails(form.emails, incoming)
    if (added === 0) {
      if (invalid) toast.error("Invalid email address")
      else if (duplicates) toast.error("That email is already in the group")
      return
    }
    setForm({ ...form, emails: merged })
    setNewEmail("")
    setNewName("")
  }

  const removeEmail = (email: string) => {
    setForm({ ...form, emails: form.emails.filter((e) => e.email !== email) })
  }

  const addBulkFromText = () => {
    const parsed = parseEmailBlob(bulkText)
    if (parsed.length === 0) { toast.error("No emails found in text"); return }
    const { merged, added, invalid, duplicates } = mergeEmails(form.emails, parsed)
    setForm({ ...form, emails: merged })
    setBulkText("")
    toast.success(
      `Added ${added}${duplicates ? `, skipped ${duplicates} duplicate(s)` : ""}${invalid ? `, ${invalid} invalid` : ""}`
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const text = await file.text()
      const isCsv = /\.csv$/i.test(file.name) || /,/.test(text.split("\n")[0] || "")
      let parsed: GroupEmail[] = []
      if (isCsv) {
        const res = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        })
        parsed = rowsToEmails(res.data || [])
      }
      // Fallback: treat as plain text list of emails (works for .txt or header-less files)
      if (parsed.length === 0) parsed = parseEmailBlob(text)
      if (parsed.length === 0) { toast.error("No emails found in file"); return }
      const { merged, added, invalid, duplicates } = mergeEmails(form.emails, parsed)
      setForm({ ...form, emails: merged })
      toast.success(
        `Imported ${added}${duplicates ? `, skipped ${duplicates} duplicate(s)` : ""}${invalid ? `, ${invalid} invalid` : ""}`
      )
    } catch (err) {
      toast.error("Failed to parse file")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const emailCount = useMemo(() => form.emails.length, [form.emails])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/communications">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Client Groups & Segmentation</h1>
            <p className="text-muted-foreground text-sm">Create groups for targeted messaging</p>
          </div>
        </div>
        <Button onClick={() => { resetDialog(); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />Create Group
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">Loading...</p>
      ) : groups.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No groups yet. Create your first client group.</p>
        </CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Card key={g._id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  {g.name}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(g._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{g.description || "No description"}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {Array.isArray(g.emails) ? g.emails.length : 0} email{(Array.isArray(g.emails) ? g.emails.length : 0) === 1 ? "" : "s"}
                  </span>
                  {g.filters?.location && <span>• Location: {g.filters.location}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetDialog() }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Group" : "Create Group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Premium Clients"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Filter: Location</Label>
              <Input
                value={form.filters.location}
                onChange={(e) => setForm({ ...form, filters: { ...form.filters, location: e.target.value } })}
                placeholder="e.g. Mumbai"
              />
            </div>

            {/* --- Email management --- */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email recipients
                </Label>
                <span className="text-xs text-muted-foreground">{emailCount} in group</span>
              </div>

              {/* Add single */}
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOneEmail() } }}
                />
                <Input
                  placeholder="Name (optional)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Button type="button" onClick={addOneEmail}>Add</Button>
              </div>

              {/* Bulk paste */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Bulk paste (comma, semicolon, or newline separated)</Label>
                <Textarea
                  rows={3}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="a@x.com, b@x.com&#10;c@x.com"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={addBulkFromText}>Add From Text</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploading ? "Uploading..." : "Upload CSV"}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt,text/csv,text/plain"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  CSV: a header row with an <code>email</code> column (plus optional <code>name</code>).
                  Plain text files are accepted too.
                </p>
              </div>

              {/* List */}
              {form.emails.length > 0 && (
                <div className="border rounded-md max-h-52 overflow-y-auto divide-y">
                  {form.emails.map((e) => (
                    <div key={e.email} className="flex items-center justify-between px-3 py-1.5 text-sm">
                      <div>
                        <div className="font-medium">{e.email}</div>
                        {e.name && <div className="text-xs text-muted-foreground">{e.name}</div>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmail(e.email)}
                        aria-label={`Remove ${e.email}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleSave} className="w-full">
              {editing ? "Update" : "Create"} Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
