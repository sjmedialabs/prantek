"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/ui/image-upload"
import { Plus, X, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentItem {
  id: string
  label: string
  url: string
  uploadedAt: string
}

interface MultiDocumentUploadProps {
  label: string
  documents: DocumentItem[]
  onChange: (documents: DocumentItem[]) => void
  placeholder?: string
}

export function MultiDocumentUpload({
  label,
  documents,
  onChange,
  placeholder = "e.g., Bachelor's Degree, Company Name - Offer Letter",
}: MultiDocumentUploadProps) {
  const { toast } = useToast()
  const [newDocLabel, setNewDocLabel] = useState("")
  const [newDocUrl, setNewDocUrl] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleAddDocument = () => {
    if (!newDocLabel.trim() || !newDocUrl.trim()) {
      toast({ title: "Validation Error", description: "Please provide both document label and file", variant: "destructive" })
      return
    }

    const newDoc: DocumentItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: newDocLabel,
      url: newDocUrl,
      uploadedAt: new Date().toISOString(),
    }

    onChange([...documents, newDoc])
    setNewDocLabel("")
    setNewDocUrl("")
    setIsAdding(false)
  }

  const handleRemoveDocument = (id: string) => {
    onChange(documents.filter((doc) => doc.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Documents */}
        {documents.length > 0 && (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.label}</p>
                    <p className="text-xs text-gray-500">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    View
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDocument(doc.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Document */}
        {!isAdding ? (
          <Button variant="outline" onClick={() => setIsAdding(true)} className="w-full border-dashed">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        ) : (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Document Name</Label>
              <Input value={newDocLabel} onChange={(e) => setNewDocLabel(e.target.value)} placeholder={placeholder} />
            </div>
            <div className="space-y-2">
              <ImageUpload
                label="Upload Document"
                value={newDocUrl}
                onChange={setNewDocUrl}
                allowedTypes={["image/*", "application/pdf", ".doc", ".docx"]}
                previewClassName="w-32 h-32 rounded-lg"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddDocument} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {documents.length === 0 && !isAdding && (
          <p className="text-sm text-gray-500 text-center py-4">No documents uploaded yet</p>
        )}
      </CardContent>
    </Card>
  )
}
