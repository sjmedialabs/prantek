"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Mail, Clock, FileText, BarChart3, MessageSquare, Send } from "lucide-react"

const modules = [
  { title: "Client Groups", description: "Create groups and segments for targeted messaging", href: "/dashboard/communications/groups", icon: Users, color: "bg-blue-500" },
  { title: "Email Campaigns", description: "Send bulk email campaigns to clients", href: "/dashboard/communications/campaigns", icon: Send, color: "bg-green-500" },
  { title: "Message Templates", description: "Create reusable message templates", href: "/dashboard/communications/templates", icon: FileText, color: "bg-purple-500" },
  { title: "Delivery Tracking", description: "Track email delivery status", href: "/dashboard/communications/tracking", icon: Mail, color: "bg-orange-500" },
  { title: "Metrics", description: "Communication analytics dashboard", href: "/dashboard/communications/metrics", icon: BarChart3, color: "bg-indigo-500" },
  { title: "Scheduled Messages", description: "View and manage scheduled campaigns", href: "/dashboard/communications/campaigns?filter=scheduled", icon: Clock, color: "bg-teal-500" },
  { title: "WhatsApp", description: "Bulk WhatsApp messaging", href: "/dashboard/communications/whatsapp", icon: MessageSquare, color: "bg-emerald-500", badge: "Coming Soon" },
]

export default function CommunicationsPage() {
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    fetch("/api/communication-metrics").then(r => r.json()).then(d => { if (d.success) setMetrics(d.data) }).catch(() => {})
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Communications</h1>
        <p className="text-muted-foreground">Manage client communications, campaigns, and messaging</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{metrics.totalCampaigns}</p><p className="text-sm text-muted-foreground">Total Campaigns</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{metrics.totalEmailsSent}</p><p className="text-sm text-muted-foreground">Emails Sent</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{metrics.deliveryRate}%</p><p className="text-sm text-muted-foreground">Delivery Rate</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{metrics.totalFailed}</p><p className="text-sm text-muted-foreground">Failed</p></CardContent></Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => (
          <Link key={m.title} href={m.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full relative">
              {m.badge && <span className="absolute top-3 right-3 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">{m.badge}</span>}
              <CardHeader className="pb-3">
                <div className={`w-10 h-10 rounded-lg ${m.color} flex items-center justify-center mb-2`}>
                  <m.icon className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg">{m.title}</CardTitle>
                <CardDescription>{m.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
