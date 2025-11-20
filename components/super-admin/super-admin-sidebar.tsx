"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/components/auth/user-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Crown,
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Shield,
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

export default function SuperAdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, hasPermission } = useUser()

  const filteredNavigation = navigationItems

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-700 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Super Admin</h2>
                <p className="text-xs text-slate-400">Platform Control</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-slate-400 hover:text-white"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">{user?.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <div className="flex items-center space-x-2">
                  <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    Super Admin
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-yellow-400/20 to-orange-500/20 text-yellow-400 border border-yellow-400/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Shield className="h-3 w-3" />
            {!collapsed && <span>Secure Access</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
