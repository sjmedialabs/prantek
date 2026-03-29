"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Mail, CheckCircle, XCircle, Users } from "lucide-react"
import Link from "next/link"

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch("/api/communication-metrics").then(r => r.json()).then(d => { if (d.success) setMetrics(d.data) }).finally(() => setLoading(false)) }, [])

  const cards = metrics ? [
    { label: "Total Campaigns", value: metrics.totalCampaigns, icon: BarChart3, color: "text-indigo-600" },
    { label: "Emails Sent", value: metrics.totalEmailsSent, icon: Mail, color: "text-blue-600" },
    { label: "Delivery Rate", value: `${metrics.deliveryRate}%`, icon: CheckCircle, color: "text-green-600" },
    { label: "Failed", value: metrics.totalFailed, icon: XCircle, color: "text-red-600" },
    { label: "Total Recipients", value: metrics.totalRecipients, icon: Users, color: "text-purple-600" },
    { label: "Open Rate", value: metrics.openRate > 0 ? `${metrics.openRate}%` : "N/A", icon: Mail, color: "text-orange-600" },
  ] : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/communications"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <div><h1 className="text-2xl font-bold">Communication Metrics</h1><p className="text-muted-foreground text-sm">Analytics dashboard for your communication campaigns</p></div>
      </div>
      {loading ? <p className="text-center py-12 text-muted-foreground">Loading...</p> : !metrics ? <p>No data.</p> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map(c => (
            <Card key={c.label}>
              <CardContent className="pt-6 flex items-center gap-4">
                <c.icon className={`h-8 w-8 ${c.color}`} />
                <div><p className="text-2xl font-bold">{c.value}</p><p className="text-sm text-muted-foreground">{c.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
