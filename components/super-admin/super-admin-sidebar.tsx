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
  Video,
  Inbox,
  X,
} from "lucide-react"
import { useSuperAdminSidebarCollapsed } from "@/components/super-admin/super-admin-sidebar-collapsed-context"

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
  { name: "Videos", href: "/super-admin/videos", icon: Video, permission: null },
  { name: "Leads", href: "/super-admin/leads", icon: Inbox, permission: null },
  { name: "Platform Settings", href: "/super-admin/settings", icon: Settings, permission: "platform_management" },
]

type SuperAdminSidebarProps = {
  isMobile?: boolean
  onClose?: () => void
}

export function SuperAdminSidebar({ isMobile, onClose }: SuperAdminSidebarProps = {}) {
  const { collapsed, toggleCollapsed } = useSuperAdminSidebarCollapsed()
  const [brandLogo, setBrandLogo] = useState<string | null>(null)
  const [brandName, setBrandName] = useState("Admin Panel")
  const pathname = usePathname()

  useEffect(() => {
    const savedLogo = localStorage.getItem("brandLogo")
    const savedName = localStorage.getItem("brandName")
    if (savedLogo) setBrandLogo(savedLogo)
    if (savedName) setBrandName(savedName)
  }, [])

  useEffect(() => {
    if (isMobile && onClose) onClose()
  }, [pathname, isMobile, onClose])

  const effectiveCollapsed = isMobile ? false : collapsed
  const filteredNavigation = navigationItems

  const wrapperClass = isMobile
    ? "flex flex-col h-full w-full bg-white"
    : `${effectiveCollapsed ? "w-20" : "w-64"} fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`

  return (
    <div className={wrapperClass}>
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        {(isMobile || !effectiveCollapsed) && (
          <div className="flex items-center space-x-3 min-w-0">
            {brandLogo ? (
              <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <Image src={brandLogo} alt="Brand Logo" fill className="object-contain" />
              </div>
            ) : (
              <div className="bg-purple-600 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">{brandName.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">{brandName}</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        )}
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="min-h-[48px] min-w-[48px] shrink-0 rounded-lg touch-manipulation"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleCollapsed()}
            className="min-h-[44px] min-w-[44px] shrink-0 p-2 rounded-lg"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 min-h-0">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 min-h-[48px] sm:min-h-0 rounded-lg transition-colors touch-manipulation ${
                isActive ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-purple-700" : "text-gray-500"}`} />
              {!effectiveCollapsed && <span className="text-sm truncate">{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
