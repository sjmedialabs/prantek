"use client"

import { Card } from "@/components/ui/card"
import api from "@/lib/api-client"
import { Truck, ShoppingBag, Building2, Utensils, Briefcase, Store } from "lucide-react"
import { useState, useEffect } from "react"
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

export function IndustriesSection() {
    const [content, setContent] = useState<any | null>(null)
  
    useEffect(() => {
      api.websiteContent.getAll().then(data => data[0] || {}).then((websiteContent) => {
      setContent(websiteContent)
      })
    }, [])
  console.log(content, "website content")
  const industries = content?.industries || [
    {
      icon: Truck,
      title: "Logistics",
      description: "Manage fleet expenses, driver payments, and fuel costs efficiently",
      gradient: "from-blue-500 via-blue-600 to-blue-700",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: ShoppingBag,
      title: "Retail & E-Commerce",
      description: "Track inventory, sales, and vendor payments in real-time",
      gradient: "from-purple-500 via-purple-600 to-purple-700",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Utensils,
      title: "Food & Beverage",
      description: "Streamline restaurant operations, supplier payments, and cash management",
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: Building2,
      title: "Real Estate",
      description: "Manage property transactions, tenant payments, and maintenance costs",
      gradient: "from-green-500 via-green-600 to-green-700",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Briefcase,
      title: "Professional Services",
      description: "Handle client billing, project expenses, and team reimbursements",
      gradient: "from-indigo-500 via-indigo-600 to-indigo-700",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      icon: Store,
      title: "Manufacturing",
      description: "Control production costs, supplier invoices, and inventory expenses",
      gradient: "from-red-500 via-red-600 to-red-700",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  ]

  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden" id="industries">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
              Industries
            </span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-white">{content?.industriesTitle || "Industries We Serve"}</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {content?.industriesSubtitle || "Trusted by businesses across industries to streamline their financial operations"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry: any, index: number) => {
             const IconComponent = iconMap[industry.icon] || Star
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
            return(
            <Card
              key={index}
              className="group relative border-0 bg-white/5 backdrop-blur-sm overflow-hidden hover:bg-white/10 transition-all duration-500 hover:-translate-y-2"
            >
              {/* Gradient border effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
              ></div>
              <div className="absolute inset-[1px] bg-gray-900 rounded-lg"></div>

              <div className="relative z-10 p-8">
                {/* Icon */}
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <IconComponent className="h-8 w-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">
                  {industry?.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-base group-hover:text-gray-300 transition-colors">
                  {industry?.description}
                </p>

                {/* Arrow indicator */}
                <div className="mt-6 flex items-center text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm">Explore solutions</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Card>
          )})}
        </div>
      </div>
    </section>
  )
}
