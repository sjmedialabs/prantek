"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Upload, FileSpreadsheet, Download, Loader2 } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { toast } from "@/lib/toast"
interface BulkUploadProps {
  onSuccess: () => void
}

export function BulkUploadDialogItem({ onSuccess }: BulkUploadProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [taxRates, setTaxRates] = useState<any[]>([])
  const [zip, setZip] = useState<File | null>(null)

  useEffect(() => {
    const loadTaxRates = async () => {
      try {
        const res = await fetch("/api/tax-rates")  // adjust if your route is different
        const json = await res.json()
        setTaxRates(json.data || [])
      } catch (err) {
        console.error("Failed to load tax rates:", err)
      }
    }

    loadTaxRates()
  }, [])


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0])
  }

  const handleUpload = async () => {
if (!file) {
  toast({
    variant: "destructive",
    title: "Excel Missing",
    description: "Please select an Excel or CSV file.",
  })
  return
}

if (!zip) {
  toast({
    variant: "destructive",
    title: "ZIP Missing",
    description: "Please upload a ZIP file that includes images.",
  })
  return
}


    setUploading(true)
    setUploadProgress(15)

    try {
      const formData = new FormData()
      formData.append("excel", file)
      formData.append("zip", zip)


      setUploadProgress(40)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minutes
      console.log("Starting bulk upload...", formData.get("file"))
      const response = await fetch("/api/items/bulk", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })
      console.log("Bulk upload response:", response)
      clearTimeout(timeoutId)
      setUploadProgress(75)

      const result = await response.json()
      console.log("Bulk upload result:", result)
      setUploadProgress(100)
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: result.error || "Server error while uploading.",
        })

        setOpen(false)
        setFile(null)
        setUploading(false)
        return
      }
      if (result.failed === 0) {
        toast({
          title: "Upload Successful!",
          description: `${result.success} items uploaded successfully.`,
        })
      }

      else if (result.success > 0 && result.failed > 0) {
        toast({
          title: "Upload Partially Completed",
          description: `${result.success} uploaded, ${result.failed} skipped.`,
        })

        if (result.errors?.length > 0) {
          console.warn("Skipped items:", result.errors)
        }
      }
      else {
        toast({
          variant: "destructive",
          title: "All Items Failed",
          description: `Nothing was uploaded. Check your file format.`,
        })

        if (result.errors?.length > 0) {
          console.warn("Errors:", result.errors)
        }

        setOpen(false)
        setFile(null)
        setUploading(false)
        return
      }

      // If successful → refresh list
      if (result.success > 0) {
        onSuccess()
        setOpen(false)
        setFile(null)
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast({
          variant: "destructive",
          title: "Timeout",
          description: "Upload took too long. Try a smaller file.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: err.message || "Unexpected upload failure.",
        })
      }

      setOpen(false)
      setFile(null)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }


  const downloadTemplate = () => {

    const cgstList = taxRates.filter(t => t.type === "CGST").map(t => t.rate)
    const sgstList = taxRates.filter(t => t.type === "SGST").map(t => t.rate)
    const igstList = taxRates.filter(t => t.type === "IGST").map(t => t.rate)

const template = 
`name,description,unitType,price,hsnCode,applyTax,cgst(supported:${cgstList.join("/")}),sgst(supported:${sgstList.join("/")}),igst(supported:${igstList.join("/")}),isActive,imagePath
Paracetamol Tablet,Used for fever,Box,100,3004,true,${cgstList[0] || 0},${sgstList[0] || 0},${igstList[0] || 0},true,folder1/mango.jpg`

    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "items_bulk_upload_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }


  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        Bulk Upload
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Upload Items</DialogTitle>
            <DialogDescription>Upload multiple items using an Excel or CSV file.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              onClick={downloadTemplate}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>

            {/* Excel Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Excel File (.xlsx / .csv)</label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>
          {file && <div className="text-sm text-gray-600">Excel: {file.name}</div>}

            {/* ZIP Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ZIP File (Images)</label>
              <Input
                type="file"
                accept=".zip"
                onChange={(e) => setZip(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>

            {zip && <div className="text-sm text-gray-600">ZIP: {zip.name}</div>}


            {file && <div className="text-sm text-gray-600">Selected: {file.name}</div>}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setOpen(false)} variant="outline" className="flex-1" disabled={uploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || !zip || uploading}
                className="flex-1 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
