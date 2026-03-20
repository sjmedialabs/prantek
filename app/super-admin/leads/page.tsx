"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Inbox } from "lucide-react"

type LeadRow = {
  id: string
  name: string
  email: string
  phone: string
  message: string
  source?: string
  createdAt: string
}

const fetchOptions = { credentials: "include" as const }

function formatWhen(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

export default function SuperAdminLeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/contact-leads", fetchOptions)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to load leads")
        setLeads([])
        return
      }
      if (data.success && Array.isArray(data.data)) {
        setLeads(data.data)
      } else {
        setLeads([])
      }
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to load leads", variant: "destructive" })
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <Inbox className="h-7 w-7 text-purple-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-500">Contact form submissions from the public site</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact inquiries</CardTitle>
          <CardDescription>Newest first. Sourced from /contact.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>
          ) : leads.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No leads yet.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="min-w-[200px]">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                        {formatWhen(row.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${row.email}`} className="text-purple-700 hover:underline">
                          {row.email}
                        </a>
                      </TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell className="max-w-md text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {row.message}
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
