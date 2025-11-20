"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Shield,
  Zap,
  BarChart3,
  FileText,
  Users,
  Clock,
  Lock,
  Globe,
  Smartphone,
  Star,
  CreditCard,
  Package,
  Receipt,
} from "lucide-react"
import { api } from "@/lib/api-client"

const iconMap: Record<string, any> = {
  Shield,
  Zap,
  BarChart3,
  BarChart: BarChart3,
  FileText,
  Users,
  Clock,
  Lock,
  Globe,
  Smartphone,
  Star,
  CreditCard,
  Package,
  Receipt,
}

export function FeaturesSection() {
  const [content, setContent] = useState<WebsiteContent | null>(null)

  useEffect(() => {
    api.websiteContent.getAll().then(data => data[0] || {}).then((websiteContent) => {
    setContent(websiteContent)
    })
  }, [])

  const features = content?.features || [
    {
      id: 1,
      icon: "Shield",
      title: "Secure & Certified",
      description:
        "Bank-grade security with 256-bit encryption. Your financial data is protected with industry-leading security standards.",
    },
    {
      id: 2,
      icon: "Zap",
      title: "Universal Acceptance",
      description:
        "Accept payments from all major payment methods. Seamlessly integrate with UPI, cards, and digital wallets.",
    },
    {
      id: 3,
      icon: "BarChart3",
      title: "Real-time Analytics",
      description:
        "Get instant insights into your cash flow, expenses, and revenue with powerful dashboards and reports.",
    },
    {
      id: 4,
      icon: "FileText",
      title: "Smart Invoicing",
      description:
        "Create professional quotations and invoices in seconds. Automated reminders and payment tracking included.",
    },
    {
      id: 5,
      icon: "Users",
      title: "Team Collaboration",
      description:
        "Invite team members with custom roles and permissions. Work together seamlessly on financial operations.",
    },
    {
      id: 6,
      icon: "Clock",
      title: "Save Time",
      description:
        "Automate repetitive tasks and reduce manual data entry. Focus on growing your business, not paperwork.",
    },
    {
      id: 7,
      icon: "Lock",
      title: "Audit & Compliance",
      description:
        "Complete audit trails and compliance features. Stay tax-ready with automated GST calculations and reports.",
    },
    {
      id: 8,
      icon: "Globe",
      title: "Multi-location Support",
      description:
        "Manage multiple branches or locations from a single dashboard. Centralized control with local flexibility.",
    },
    {
      id: 9,
      icon: "Smartphone",
      title: "Mobile Ready",
      description: "Access your financial data anywhere, anytime. Native mobile apps for iOS and Android coming soon.",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-4 py-2 rounded-full">
              Features
            </span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
            Built for Success
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to manage your business finances efficiently and grow with confidence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || Star
            const colors = [
              "from-blue-500 to-cyan-500",
              "from-purple-500 to-pink-500",
              "from-orange-500 to-red-500",
              "from-green-500 to-emerald-500",
              "from-indigo-500 to-blue-500",
              "from-yellow-500 to-orange-500",
              "from-red-500 to-pink-500",
              "from-teal-500 to-green-500",
              "from-pink-500 to-rose-500",
            ]
            const gradient = colors[index % colors.length]

            return (
              <Card
                key={feature.id}
                className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                ></div>

                <CardContent className="p-8 relative z-10">
                  {/* Icon with gradient background */}
                  <div className="relative mb-6">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 rounded-2xl blur-xl group-hover:blur-2xl transition-all`}
                    ></div>
                    <div
                      className={`relative w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">{feature.description}</p>

                  {/* Decorative element */}
                  <div className="mt-6 flex items-center text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm">Learn more</span>
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
