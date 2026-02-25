"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { Term } from "./terms-manager"
import dynamic from "next/dynamic"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })
import "react-quill/dist/quill.snow.css"

export default function TermDialog({
  open,
  onOpenChange,
  type,
  term,
  onSaved
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  type: "quotation" | "invoice" | "receipt"
  term: Term | null
  onSaved: () => void
}) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (term) {
      setTitle(term.title || "")
      setContent(term.content)
      setIsActive(term.isActive)
    }
  }, [term])

  async function handleSave() {
    await fetch("/api/terms", {
      method: term ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: term?._id,
        title,
        content,
        type,
        isActive
      })
    })

    onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {term ? "Edit Term" : "Add Term"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="[&_.ql-editor]:min-h-[200px]">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              placeholder="Term content"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span>Active</span>
          </div>

          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
