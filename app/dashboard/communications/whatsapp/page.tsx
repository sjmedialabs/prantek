"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function WhatsAppPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/communications"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <h1 className="text-2xl font-bold">WhatsApp Messaging</h1>
      </div>
      <Card>
        <CardContent className="py-16 text-center">
          <MessageSquare className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Bulk WhatsApp messaging is under development. You'll soon be able to send WhatsApp messages to your clients directly from here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
