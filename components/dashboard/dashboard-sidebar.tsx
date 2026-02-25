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
  UserCog,
  FileText,
  Receipt,
  CreditCard,
  RefreshCw,
  Package,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ShoppingCart,
} from "lucide-react";

interface NavItem {
  name: string;
  href?: string;
  icon?: any;
  permission: string | null;
  submenu?: NavItem[];
}


// Helper function to check if user has an active subscription
function hasActiveSubscription(user: any): boolean {
  // Super admins always have access
  if (user?.role === "super-admin") {
    return true
  }

  // No subscription plan
  if (!user?.subscriptionPlanId) {
    return false
  }

  const status = user.subscriptionStatus

  // If cancelled, check if still within validity period
  if (status === "cancelled") {
    if (!user.subscriptionEndDate) {
      return false
    }
    const endDate = new Date(user.subscriptionEndDate)
    const now = new Date()
    return now <= endDate
  }

  // If expired or inactive, no access
  if (status === "expired" || status === "inactive") {
    return false
  }

  // Active or trial status
  return status === "active" || status === "trial"
}

const navigationItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Cash Book", href: "/dashboard/cashBook", icon: BookOpen, permission: "view_cash_book" },
  { name: "Clients", href: "/dashboard/clients", icon: Users, permission: "view_clients" },
  { name: "Vendors", href: "/dashboard/vendor", icon: Users, permission: "view_vendors" },
  { name: "Quotation", href: "/dashboard/quotations", icon: FileText, permission: "view_quotations" },
  { name: "Sales Invoices", href: "/dashboard/salesInvoices", icon: ClipboardList, permission: "view_sales_invoice" },
  { name: "Receipts", href: "/dashboard/receipts", icon: Receipt, permission: "view_receipts" },
  { name: "Purchase Invoices", href: "/dashboard/purchaseInvoices", icon: ShoppingCart, permission: "view_purchase_invoice" },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard, permission: "view_payments" },
  { name: "Reconciliation", href: "/dashboard/reconciliation", icon: RefreshCw, permission: "view_reconciliation" },
  { name: "Assets", href: "/dashboard/assets", icon: Package, permission: "view_assets" },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, permission: "view_reports" },
  {
    name: "Settings",
    icon: Settings,
    permission: "tenant_settings",
    submenu: [
      {
        name: "Company Settings",
        icon: Settings,
        permission: "tenant_settings",
        submenu:[
      {
        name: "Company Details",
        href: "/dashboard/settings/company",
        permission: "tenant_settings",
      },
      {
        name: "Bank Details",
        href: "/dashboard/settings/bank",
        permission: "tenant_settings",
      }
        ]
      },
      {
        name: "Product Settings",
        icon: Settings,
        permission: "tenant_settings",
        submenu:[
      {
        name: "Tax Rates",
        href: "/dashboard/settings/tax",
        permission: "tenant_settings",
      },
      {
        name: "Product Management",
        href: "/dashboard/settings/items",
        permission: "tenant_settings",
      }
        ]
      },
            {
        name: "Payment Settings",
        icon: Settings,
        permission: "tenant_settings",
        submenu:[
      // {
      //   name: "Party Type",
      //   href: "/dashboard/settings/recipient-types",
      //   permission: "tenant_settings",
      // },
      {
        name: "Ledger Head",
        href: "/dashboard/settings/payment-categories",
        permission: "tenant_settings",
      },
      // {
      //   name: "Payment Methods",
      //   href: "/dashboard/settings/payment-methods",
      //   permission: "tenant_settings",
      // },
        ]
      },
      {
        name: "Assets Settings",
        icon: Settings,
        permission: "tenant_settings",
        submenu:[
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
        ]
      },

      {
        name: "HR Settings",
        permission: "tenant_settings",
        icon: Settings,
        submenu: [
          {
            name: "Employee Management",
            permission: "tenant_settings",
            submenu: [
              // {
              //   name: "Employment Type",
              //   href: "/dashboard/hr/member-types",
              //   permission: "tenant_settings",
              // },
              {
                name: "Employee Roles",
                href: "/dashboard/hr/employee-roles",
                permission: "tenant_settings",
              },
              {
                name: "Employee List",
                href: "/dashboard/hr/employees",
                permission: "tenant_settings",
              },
            ],
          },
          {
            name: "User Management",
            permission: "manage_users",
            submenu: [
              {
                name: "User List",
                href: "/dashboard/hr/users",
                permission: "manage_users",
              },
            ],
          }
          
        ],
      },
      {
        name: "Security Settings",
        permission: "tenant_settings",
        icon: Settings,
        submenu: [
          {
            name: "Notifications",
            href: "/dashboard/settings/notifications",
            permission: "tenant_settings",
          },
          {
            name: "Security",
            href: "/dashboard/settings/security",
            permission: "tenant_settings",
          },
        ],
      },
      {
        name: "Plans",
        icon: Settings,
        href: "/dashboard/plans",
        permission: "tenant_settings",
      },
            {
        name: "Terms & Conditions",
        icon: Settings,
        href: "/dashboard/settings/terms",
        permission: "tenant_settings",
      },
            {
        name: "Backup",
        icon: Settings,
        href: "/dashboard/settings/backup",
        permission: "backup",
      },
    ],
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, hasPermission, loading } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [planFeatures, setPlanFeatures] = useState<any>(null);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  // Fetch user's plan features
  useEffect(() => {
    const fetchPlanFeatures = async () => {
      try {
        const response = await fetch('/api/user/plan-features');
        const data = await response.json();
        if (data.success) {
          setPlanFeatures(data.planFeatures);
        }
      } catch (error) {
        console.error('Error fetching plan features:', error);
      }
    };
    
    if (user) {
      fetchPlanFeatures();
    }
  }, [user]);

  // Check if a feature is available in user's plan
  const hasFeatureAccess = (featureName: string): boolean => {
    if (!planFeatures) return false;
    
    // Map menu items to plan features
    const featureMap: Record<string, string> = {
      'Dashboard': 'dashboard',
      'Cash Book': 'cashBook',
      'Clients': 'clients',
      'Vendors': 'vendors',
      'Quotation': 'quotations',
      'Sales Invoice': 'salesInvoice',
      'Receipts': 'receipts',
      'Purchase Invoice': 'purchaseInvoice',
      'Payments': 'payments',
      'Reconciliation': 'reconciliation',
      'Assets': 'assets',
      'Reports': 'reports',
      'Settings': 'settings',
      'HR Settings': 'hrSettings'
    };
    
    const featureKey = featureMap[featureName];
    if (!featureKey) return true; // If not in map, allow access
    
    return planFeatures[featureKey] === true;
  };

  const renderNavItem = (item: NavItem, level: number = 0, parentKey: string = "") => {
    // LEVEL 1: Check if user has active subscription
    // Only Dashboard and Cash Book are accessible without active subscription
    if (!hasActiveSubscription(user) && item.permission !== null) {
      return null;
    }


    // LEVEL 2: Check plan features - strictly gate based on subscription plan
    // Dashboard and Cash Book are always accessible
    if (item.name !== 'Dashboard') {
      // If planFeatures hasn't loaded yet, hide menu items to prevent showing restricted features
      if (!planFeatures) {
        return null;
      }
      // If planFeatures loaded, check if user has access to this feature
      if (!hasFeatureAccess(item.name)) {
        return null;
      }
    }

    // LEVEL 3: Check admin user's specific permission for this feature
    // Even if feature is in the plan, admin user must have the specific permission
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const menuKey = parentKey ? `${parentKey}.${item.name}` : item.name;
    const isExpanded = expandedMenus[menuKey];
    const isActive = item.href ? pathname === item.href : false;

    if (hasSubmenu) {
      return (
        <div key={menuKey} className={level > 0 ? "ml-2" : ""}>
          <button
            onClick={() => toggleMenu(menuKey)}
            className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors ${
              isActive ? "bg-accent text-accent-foreground" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              {item.icon && <item.icon className="h-4 w-4" />}
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
              {(item.submenu || []).map((subItem) => renderNavItem(subItem, level + 1, menuKey))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={menuKey}
        href={item.href || "#"}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors ${
          isActive ? "bg-accent text-accent-foreground" : ""
        } ${level > 0 ? "ml-2" : ""}`}
      >
        {item.icon && <item.icon className="h-4 w-4" />}
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full w-64 flex-col border-r bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col border-r bg-background transition-all duration-300 h-screen z-200 sticky top-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <h2 className="text-lg font-semibold">Dashboard</h2>}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigationItems.map((item) => renderNavItem(item))}
      </nav>
    </div>
  );
}
