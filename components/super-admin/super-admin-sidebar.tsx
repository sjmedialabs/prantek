"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Globe,
  Activity,
} from "lucide-react"

const navigationItems = [
  { name: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard, permission: null },
  {
    name: "Subscription Plans",
    href: "/super-admin/subscriptions",
    icon: CreditCard,
    permission: "manage_subscriptions",
  },
  { name: "Sales Dashboard", href: "/super-admin/sales", icon: BarChart3, permission: "view_sales_dashboard" },
  { name: "Client Accounts", href: "/super-admin/clients", icon: Building2, permission: "manage_client_accounts" },
  { name: "Activity Log", href: "/super-admin/activity", icon: Activity, permission: null },
  { name: "Website CMS", href: "/super-admin/cms", icon: Globe, permission: null },
  { name: "Platform Settings", href: "/super-admin/settings", icon: Settings, permission: "platform_management" },
]

export function SuperAdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [brandLogo, setBrandLogo] = useState<string | null>(null)
  const [brandName, setBrandName] = useState("Admin Panel")
  const pathname = usePathname()

  useEffect(() => {
    // Load brand settings from localStorage or API
    const savedLogo = localStorage.getItem("brandLogo")
    const savedName = localStorage.getItem("brandName")
    
    if (savedLogo) setBrandLogo(savedLogo)
    if (savedName) setBrandName(savedName)
  }, [])

  const filteredNavigation = navigationItems

  return (
    <div
      className={`${
        collapsed ? "w-20" : "w-64"
      } fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}
    >
      {/* Header with Brand Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            {brandLogo ? (
              <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100">
                <Image 
                  src={brandLogo} 
                  alt="Brand Logo" 
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="bg-purple-600 p-2 rounded-lg h-10 w-10 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{brandName.charAt(0)}</span>
              </div>
            )}
            <div>
              <h2 className="font-bold text-gray-900">{brandName}</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="p-2"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${ isActive
                  ? "bg-purple-50 text-purple-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-purple-700" : "text-gray-500"}`} />
              {!collapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
