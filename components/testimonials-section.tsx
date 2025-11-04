"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"
import { dataStore, type WebsiteContent } from "@/lib/data-store"

export function TestimonialsSection() {
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    const websiteContent = dataStore.getWebsiteContent()
    setContent(websiteContent)
  }, [])

  const testimonials = content?.testimonials || []

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">
            {content?.testimonialsTitle || "Testimonials"}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            {content?.testimonialsSubtitle || "Don't just take our word for it - hear what our customers have to say"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {testimonial.logo}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.company}</div>
                    <div className="flex gap-1 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>

                <Quote className="h-8 w-8 text-blue-200 mb-3" />

                <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{testimonial.content}"</p>

                <div className="border-t border-gray-100 pt-4">
                  <div className="font-semibold text-gray-900 text-sm">{testimonial.author}</div>
                  <div className="text-xs text-gray-500">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
