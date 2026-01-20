"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { FileSpreadsheet, Upload, Loader2, Download } from "lucide-react"
import { toast } from "@/lib/toast"

export function BulkUploadDialogClient({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleUpload = async () => {
    if (!file) {
      return toast.error("Error", "Please select a file")
    }

    setUploading(true)
    setUploadProgress(20)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/clients/bulk", {
        method: "POST",
        body: formData,
      })

      setUploadProgress(70)

      const result = await res.json()
      setUploadProgress(100)

      if (!res.ok) {
        toast.error("Upload Failed", result.error)
        setOpen(false)
        setFile(null)
        return
      }

      if (result.success > 0) {
        toast.success("Bulk Upload Complete", `${result.success} clients uploaded.`)
      }

      if (result.failed > 0) {
        console.warn("Skipped clients:", result.errors)
        toast.error("Some Failed", `${result.failed} skipped due to errors.`)
      }

      if (result.success > 0) {
        onSuccess()
        setOpen(false)
        setFile(null)
      }
    } catch (err: any) {
      toast.error("Upload Error", err.message || "Something went wrong")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const downloadTemplate = () => {
    const template = `type,name,companyName,contactName,email,phone,address,state,city,pincode,gst,pan
individual,Rajesh,,,"rajesh@example.com",9876543210,"Street 12","Maharashtra","Mumbai",400001,,
company,,ABC Enterprises,Mr. Karan,"info@abc.com",9988776655,"Road 5","Gujarat","Ahmedabad",380001,22AAAAA0000A1Z5,ABCDE1234F`

    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "client_bulk_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        Bulk Upload Clients
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Clients</DialogTitle>
            <DialogDescription>Upload client data using Excel or CSV.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button variant="outline" onClick={downloadTemplate} className="flex gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>

            <Input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {uploading && <Progress value={uploadProgress} />}

            <Button disabled={!file || uploading} onClick={handleUpload} className="w-full">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
