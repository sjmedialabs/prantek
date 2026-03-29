"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Mail, Loader2, CheckCircle } from "lucide-react"
import { toast } from "@/lib/toast"

interface SendEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentType: "salesInvoice" | "receipt" | "purchaseInvoice" | "payment"
  documentId: string
  defaultEmail?: string
  defaultName?: string
}

export function SendEmailDialog({
  open,
  onOpenChange,
  documentType,
  documentId,
  defaultEmail = "",
  defaultName = "",
}: SendEmailDialogProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/send-document-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          documentId,
          recipientEmail: email,
          recipientName: defaultName,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
        toast.success(data.message || "Email sent successfully!")
        setTimeout(() => {
          onOpenChange(false)
          setSent(false)
        }, 1500)
      } else {
        toast.error(data.error || "Failed to send email")
      }
    } catch {
      toast.error("Failed to send email")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSent(false) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send via Email
          </DialogTitle>
          <DialogDescription>
            Send this document to the recipient via email.
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-sm text-green-600 font-medium">Email sent successfully!</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending || !email}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
