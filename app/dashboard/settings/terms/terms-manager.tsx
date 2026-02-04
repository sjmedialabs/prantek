"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import TermDialog from "./term-dialog"

export type Term = {
  _id: string
  title?: string
  content: string
  type: "quotation" | "invoice"
  isActive: boolean
  order: number
}

export default function TermsManager() {
  const [type, setType] = useState<"quotation" | "invoice">("quotation")
  const [terms, setTerms] = useState<Term[]>([])
  const [open, setOpen] = useState(false)
  const [editTerm, setEditTerm] = useState<Term | null>(null)

  useEffect(() => {
    fetch(`/api/terms?type=${type}`)
      .then(res => res.json())
      .then(setTerms)
  }, [type])

  return (
    <>
      <Tabs value={type} onValueChange={(v) => setType(v as any)}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="quotation">Quotation</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
          </TabsList>

          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2" size={16} />
            Add Term
          </Button>
        </div>
      </Tabs>

      <div className="space-y-3">
        {terms.map(term => (
          <div
            key={term._id}
            className="border rounded p-3 flex justify-between items-start"
          >
            <div>
              {term.title && (
                <p className="font-medium">{term.title}</p>
              )}
              <div 
                className="text-sm text-muted-foreground [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: term.content }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditTerm(term)
                  setOpen(true)
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      <TermDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditTerm(null)
        }}
        type={type}
        term={editTerm}
        onSaved={() => {
          fetch(`/api/terms?type=${type}`)
            .then(res => res.json())
            .then(setTerms)
        }}
      />
    </>
  )
}
