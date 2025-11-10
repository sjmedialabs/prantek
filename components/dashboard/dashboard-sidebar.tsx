"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/components/auth/user-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  RefreshCw,
  Package,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react"

interface NavItem {
  name: string
  href?: string
  icon: any
  permission: string | null
  submenu?: {
    name: string
    href: string
    permission: string | null
  }[]
}

const navigationItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  {
    name: "Settings",
    icon: Settings,
    permission: "tenant_settings",
    submenu: [
      { name: "Company Details", href: "/dashboard/settings/company", permission: "tenant_settings" },
      { name: "Roles", href: "/dashboard/roles", permission: "manage_roles" },
      { name: "Employment Type", href: "/dashboard/settings/member-types", permission: "tenant_settings" },
      { name: "Employee Management", href: "/dashboard/settings/employee", permission: "tenant_settings" },
      { name: "Product Management", href: "/dashboard/settings/items", permission: "tenant_settings" },
      { name: "Plans", href: "/dashboard/plans", permission: null },
      { name: "Security", href: "/dashboard/settings/security", permission: "tenant_settings" },
      { name: "Notifications", href: "/dashboard/settings/notifications", permission: "tenant_settings" },
      { name: "Bank Details", href: "/dashboard/settings/bank", permission: "tenant_settings" },
      { name: "Tax Settings", href: "/dashboard/settings/tax", permission: "tenant_settings" },
      { name: "Payment Categories", href: "/dashboard/settings/payment-categories", permission: "tenant_settings" },
      { name: "Payment Methods", href: "/dashboard/settings/payment-methods", permission: "tenant_settings" },
      { name: "Receipt Categories", href: "/dashboard/settings/receipt-categories", permission: "tenant_settings" },
      { name: "Recipient Types", href: "/dashboard/settings/recipient-types", permission: "tenant_settings" },
      { name: "Activity Log", href: "/dashboard/settings/activity-log", permission: "tenant_settings" },
    ],
  },
  { name: "Client", href: "/dashboard/clients", icon: Users, permission: "view_clients" },
  { name: "Quotation", href: "/dashboard/quotations", icon: FileText, permission: "view_quotations" },
  { name: "Receipts", href: "/dashboard/receipts", icon: Receipt, permission: "view_receipts" },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard, permission: "view_payments" },
  { name: "Reconciliation", href: "/dashboard/reconciliation", icon: RefreshCw, permission: "view_reconciliation" },
  { name: "Assets", href: "/dashboard/assets", icon: Package, permission: "manage_assets" },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, permission: "view_reports" },
]

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const pathname = usePathname()
  const { user, tenant, hasPermission } = useUser()

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus((prev) => {
      // If the menu is already expanded, collapse it
      if (prev.includes(menuName)) {
        return prev.filter((name) => name !== menuName)
      }
      // Otherwise, close all other menus and open this one
      return [menuName]
    })
  }

  const closeAllSubmenus = () => {
    setExpandedMenus([])
  }

  const filteredNavigation = navigationItems.filter((item) => !item.permission || hasPermission(item.permission))

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Prantek</h2>
                <p className="text-xs text-gray-500">{tenant?.name}</p>
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="p-1">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">{user?.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {user?.role.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {tenant?.plan}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const isExpanded = expandedMenus.includes(item.name)
            const isActive = item.href
              ? pathname === item.href
              : pathname.startsWith(`/dashboard/${item.name.toLowerCase()}`)

            if (hasSubmenu) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                    {!collapsed && (
                      <span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </button>
                  {!collapsed && isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.submenu?.map((subitem) => {
                        if (subitem.permission && !hasPermission(subitem.permission)) return null
                        const isSubActive = pathname === subitem.href
                        return (
                          <Link
                            key={subitem.name}
                            href={subitem.href}
                            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSubActive
                                ? "bg-purple-50 text-purple-700 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {subitem.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                onClick={closeAllSubmenus}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
