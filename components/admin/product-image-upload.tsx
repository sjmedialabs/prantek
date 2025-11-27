"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function ProductImageUpload({ onSelect }: { onSelect: (file: File | null, folder: string, newFolder: string) => void }) {

  const [folders, setFolders] = useState<string[]>([])
  const [folder, setFolder] = useState("")
  const [newFolder, setNewFolder] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")

  useEffect(() => {
    fetch("/api/uploads/items/folders")
      .then(res => res.json())
      .then(d => setFolders(d.folders || []))
  }, [])

  const triggerChange = (file?: File | null, f?: string, nf?: string) => {
    onSelect(
      file ?? null,
      f !== undefined ? f : folder,
      nf !== undefined ? nf : newFolder
    )
  }

  return (
    <div className="space-y-4 flex gap-4 items-center">
      <div className="flex flex-col justify-center">
      <Label>Select Existing Folder</Label>
      <Select onValueChange={(val) => { setFolder(val); triggerChange(undefined, val, undefined) }}>
        <SelectTrigger>
          <SelectValue placeholder="Choose folder" />
        </SelectTrigger>
        <SelectContent>
          {folders.map(f => (
            <SelectItem key={f} value={f}>{f}</SelectItem>
          ))}
        </SelectContent>
      </Select>
        </div>
      <div className="flex flex-col justify-center">
        <Label>Create New Folder</Label>
        <Input
          placeholder="e.g. electronics"
          value={newFolder}
          onChange={(e) => { setNewFolder(e.target.value); triggerChange(undefined, undefined, e.target.value) }}
        />
      </div>
          <div className="flex gap-4">
      <div className="flex flex-col justify-center mb-4">
        <Label>Upload Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] || null
            setFile(f)
            if (f) setPreview(URL.createObjectURL(f))
            triggerChange(f)
          }}
        />
      </div>

      {preview && (
        <img src={preview} alt="preview" className="w-32 h-32 rounded-md object-cover" />
      )}
      </div>
    </div>
  )
}
