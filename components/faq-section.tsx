"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api-client"

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    api.websiteContent.getAll().then(data => data[0] || {}).then((websiteContent) => {
    setContent(websiteContent)
    })
  }, [])

  const faqs = content?.faqs || []

  if (faqs.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-4 py-2 rounded-full">
              Support
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">{content?.faqTitle || "FAQs"}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {content?.faqSubtitle || "Got questions? We've got answers"}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card
              key={faq.id || index}
              className="border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <button className="w-full text-left" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-gray-900 text-base">{faq.question}</h3>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {openIndex === index && <p className="text-gray-600 mt-3 leading-relaxed text-sm">{faq.answer}</p>}
                </CardContent>
              </button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
