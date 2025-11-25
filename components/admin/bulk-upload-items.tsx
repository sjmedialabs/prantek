"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Upload, FileSpreadsheet, Download, Loader2 } from "lucide-react"
import { useToastContext } from "@/components/providers/toast-provider"
import { Progress } from "@/components/ui/progress"

interface BulkUploadProps {
    onSuccess: () => void
}
export function BulkUploadDialogItem({ onSuccess }: BulkUploadProps) {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const { success, error } = useToastContext()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0])
    }

    const handleUpload = async () => {
        if (!file) {
            error("Please select a file")
            return
        }

        setUploading(true)
        setUploadProgress(10)

        try {
            const formData = new FormData()
            formData.append("file", file)


            setUploadProgress(30)


            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minutes


            const response = await fetch("/api/admin/items/bulk", {
                method: "POST",
                body: formData,
                signal: controller.signal,
            })


            clearTimeout(timeoutId)
            setUploadProgress(80)


            const result = await response.json()
            setUploadProgress(100)


            if (!response.ok) {
                throw new Error(result.error || "Upload failed")
            }


            if (result.success > 0 && result.failed === 0) {
                success(`Successfully uploaded ${result.success} items!`)
            } else if (result.success > 0 && result.failed > 0) {
                success(`Upload completed: ${result.success} items created, ${result.failed} failed.`)
                if (result.errors && result.errors.length > 0) console.log("Upload errors:", result.errors)
            } else {
                error(`Upload failed: ${result.failed} items failed. ${result.errors?.[0] || 'Check the file format.'}`)
                console.log("Upload errors:", result.errors)
            }


            if (result.success > 0) {
                setOpen(false)
                setFile(null)
                onSuccess()
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                error("Upload timeout. The file is too large or server is taking too long. Please try with a smaller file or contact support.")
            } else {
                error(err.message || "Upload failed")
            }
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }

    const downloadTemplate = () => {
        const template = `name,description,category,type,unitType,unit,price,hsnCode,applyTax,cgst,sgst,igst,isActive,taxRate\nParacetamol Tablet,Used for fever,Medicines,product,Box,10,100,3004,true,6,6,0,true,12\nService Charge,NA,Services,service,NA,NA,5000,9985,true,9,9,0,true,18`
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
                        <DialogDescription>Upload multiple items using Excel or CSV file. Large files may take several minutes.</DialogDescription>
                    </DialogHeader>


                    <div className="space-y-4">
                        <Button onClick={downloadTemplate} variant="outline" size="sm" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Download Template
                        </Button>


                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select File</label>
                            <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} disabled={uploading} className="cursor-pointer" />
                        </div>


                        {file && <div className="text-sm text-gray-600">Selected: {file.name}</div>}


                        {uploading && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Uploading... This may take several minutes for large files.</span>
                                </div>
                                <Progress value={uploadProgress} className="w-full" />
                            </div>
                        )}


                        <div className="flex gap-2 pt-4">
                            <Button onClick={() => setOpen(false)} variant="outline" className="flex-1" disabled={uploading}>Cancel</Button>
                            <Button onClick={handleUpload} disabled={!file || uploading} className="flex-1 flex items-center gap-2">
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