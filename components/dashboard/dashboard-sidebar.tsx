"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/components/auth/user-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
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
} from "lucide-react";

interface NavItem {
  name: string;
  href?: string;
  icon?: any;
  permission: string | null;
  submenu?: NavItem[];
}

const navigationItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  { name: "Client", href: "/dashboard/clients", icon: Users, permission: "view_clients" },
  { name: "Quotation", href: "/dashboard/quotations", icon: FileText, permission: "view_quotations" },
  { name: "Receipts", href: "/dashboard/receipts", icon: Receipt, permission: "view_receipts" },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard, permission: "view_payments" },
  { name: "Reconciliation", href: "/dashboard/reconciliation", icon: RefreshCw, permission: "view_reconciliation" },
  { name: "Assets", href: "/dashboard/assets", icon: Package, permission: "manage_assets" },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, permission: "view_reports" },
  {
    name: "Settings",
    icon: Settings,
    permission: "tenant_settings",
    submenu: [
      {
        name: "Company Settings",
        permission: "tenant_settings",
        submenu: [
          {
            name: "Company Details",
            href: "/dashboard/settings/company",
            permission: "tenant_settings",
          },
          {
            name: "Bank Details",
            href: "/dashboard/settings/bank",
            permission: "tenant_settings",
          },
        ],
      },
      {
        name: "Product Settings",
        permission: "tenant_settings",
        submenu: [
          { name: "Tax Settings", href: "/dashboard/settings/tax", permission: "tenant_settings" },
          { name: "Product Management", href: "/dashboard/settings/items", permission: "tenant_settings" },
         
          
        ],
      },
      {
        name: "Payment Settings",
        permission: "tenant_settings",
        submenu: [
          {
            name: "Ledger Heads",
            href: "/dashboard/settings/payment-categories",
            permission: "tenant_settings",
          },
          {
            name: "Payment Methods",
            href: "/dashboard/settings/payment-methods",
            permission: "tenant_settings",
          },
          {
            name: "Receipt Categories",
            href: "/dashboard/settings/receipt-categories",
            permission: "tenant_settings",
          },
          {
            name: "Recipient Types",
            href: "/dashboard/settings/recipient-types",
            permission: "tenant_settings",
          },
        ],
      },
      {
        name: "Asset Settings",
        permission: "tenant_settings",
        submenu: [
          {
            name: "Asset Categories",
            href: "/dashboard/settings/asset-categories",
            permission: "tenant_settings",
          },
          {
            name: "Asset Conditions",
            href: "/dashboard/settings/asset-conditions",
            permission: "tenant_settings",
          },
        ],
      },
      {
        name: "HR Settings",
        permission: "tenant_settings",
        submenu: [
          {
            name: "Roles",
            href: "/dashboard/roles",
            permission: "manage_roles",
          },
          {
            name: "Employment Type",
            href: "/dashboard/settings/member-types",
            permission: "tenant_settings",
          },
          {
            name: "Employee Management",
            href: "/dashboard/settings/employee",
            permission: "tenant_settings",
          },
        ],
      },
      {
        name: "Security Settings",
        permission: "tenant_settings",
        submenu: [
          {
            name: "Notifications",
            href: "/dashboard/settings/notifications",
            permission: "tenant_settings",
          },
          {
            name: "Activity Log",
            href: "/dashboard/settings/activity-log",
            permission: "tenant_settings",
          },
          {
            name: "Security",
            href: "/dashboard/settings/security",
            permission: "tenant_settings",
          },
        ],
      },
      { name: "Plans", href: "/dashboard/plans", permission: null },
    ],
  },

  
  
 

 
];

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();
  const { user, tenant, hasPermission } = useUser();
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const loginedUserLocalStorageString = localStorage.getItem("loginedUser");

  const loginedUserLocalStorage = loginedUserLocalStorageString
    ? JSON.parse(loginedUserLocalStorageString)
    : null;

  // ✅ Helper to check if a menu (or any of its children) is active
  const isMenuActive = (item: NavItem): boolean => {
    if (item.href && pathname === item.href) return true;
    if (item.submenu) return item.submenu.some((sub) => isMenuActive(sub));
    return false;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedPlans = await api.subscriptionPlans.getById(
          loginedUserLocalStorage.subscriptionPlanId
        );
        setCurrentPlan(loadedPlans);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };
    
    if (loginedUserLocalStorage?.subscriptionPlanId) {
      loadData();
    }
  }, []);

  // ✅ Auto-expand parents of active route
  useEffect(() => {
    const openParents: string[] = [];

    const findActiveParents = (items: NavItem[]) => {
      items.forEach((item) => {
        if (item.submenu && item.submenu.length > 0) {
          if (item.submenu.some((sub) => isMenuActive(sub))) {
            openParents.push(item.name);
          }
          findActiveParents(item.submenu);
        }
      });
    };

    findActiveParents(navigationItems);
    setExpandedMenus(openParents);
  }, [pathname]);

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus((prev) => {
      // If clicking on an already open menu, close it
      if (prev.includes(menuName)) {
        return prev.filter((name) => name !== menuName);
      }
      // Otherwise, close all at this level and open the clicked one
      // Keep only parent menus and add the new one
      const item = findMenuByName(navigationItems, menuName);
      const level = getMenuLevel(navigationItems, menuName);
      const filtered = prev.filter((name) => {
        const existingLevel = getMenuLevel(navigationItems, name);
        return existingLevel < level; // Keep parent levels open
      });
      return [...filtered, menuName];
    });
  };

  // Helper to find menu item by name
  const findMenuByName = (items: NavItem[], name: string): NavItem | null => {
    for (const item of items) {
      if (item.name === name) return item;
      if (item.submenu) {
        const found = findMenuByName(item.submenu, name);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to get menu depth level
  const getMenuLevel = (items: NavItem[], name: string, level = 0): number => {
    for (const item of items) {
      if (item.name === name) return level;
      if (item.submenu) {
        const found = getMenuLevel(item.submenu, name, level + 1);
        if (found !== -1) return found;
      }
    }
    return -1;
  };

  const closeAllSubmenus = () => setExpandedMenus([]);

  const filteredNavigation = navigationItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  // ✅ Recursive menu renderer
  const renderMenuItems = (items: NavItem[], level = 0) => {
    return items.map((item) => {
      const Icon = item.icon;
      const hasSubmenu = item.submenu && item.submenu.length > 0;
      const isExpanded = expandedMenus.includes(item.name);
      const isActive = isMenuActive(item);

      if (hasSubmenu) {
        return (
          <div key={item.name} className={`${level > 0 ? "ml-4" : ""}`}>
            <button
              onClick={() => toggleSubmenu(item.name)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                {!collapsed && <span>{item.name}</span>}
              </div>
              {!collapsed && (
                <span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </span>
              )}
            </button>
            {!collapsed && isExpanded && (
              <div className="mt-1 space-y-1">
                {renderMenuItems(item.submenu!, level + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={item.name}
          href={item.href!}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-purple-50 text-purple-700 font-medium"
              : "text-gray-600 hover:bg-gray-50"
          } ${level > 0 ? "ml-4" : ""}`}
        >
          {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
          {!collapsed && <span>{item.name}</span>}
        </Link>
      );
    });
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Info */}
        {/* {!collapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {user?.role.replace("_", " ")}
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-900 font-medium">
              {currentPlan ? `${currentPlan.name}${user?.subscriptionStatus === 'trial' ? ' (Trial)' : ''}` : user?.subscriptionStatus === 'trial' ? 'Trial Plan' : 'No Active Plan'}
            </Badge>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {renderMenuItems(filteredNavigation)}
        </nav>
      </div>
    </div>
  );
}
