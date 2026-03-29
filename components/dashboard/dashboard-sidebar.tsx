"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/components/auth/user-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { tokenStorage } from "@/lib/token-storage";
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
  Settings,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ShoppingCart,
  X,
  Send,
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

  // No user or no status, no access
  if (!user || !user.subscriptionStatus) {
    return false
  }

  const status = user.subscriptionStatus
  const now = new Date()

  // If trial, check if it's still valid
  if (status === "trial") {
    // Support both trialEndsAt and legacy trialEndDate; if missing, be lenient
    const rawTrialEnd = user.trialEndsAt || user.trialEndDate
    if (!rawTrialEnd) {
      return true
    }
    const trialEndDate = new Date(rawTrialEnd)
    return now <= trialEndDate
  }

  // For active or cancelled, check the subscription end date (with grace for missing dates)
  if (status === "active" || status === "cancelled") {
    if (!user.subscriptionEndDate) {
      // If we don't have an end date but status is active/cancelled, be lenient and allow access
      return true
    }
    const endDate = new Date(user.subscriptionEndDate)
    return now <= endDate
  }

  // Grace period: if status is expired but subscriptionEndDate is within the last 7 days, still allow access
  if (status === "expired" && user.subscriptionEndDate) {
    const endDate = new Date(user.subscriptionEndDate)
    const graceEnd = new Date(endDate)
    graceEnd.setDate(graceEnd.getDate() + 7)
    return now <= graceEnd
  }

  // Any other status (inactive, expired, payment_failed, etc.) means no access
  return false
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
  { name: "Clearing", href: "/dashboard/reconciliation", icon: RefreshCw, permission: "view_reconciliation" },
  { name: "Assets", href: "/dashboard/assets", icon: Package, permission: "view_assets" },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, permission: "view_reports" },
  { name: "Communications", href: "/dashboard/communications", icon: Send, permission: "view_communications" },
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
      }
    ],
  },
              {
        name: "Backup",
        icon: Settings,
        href: "/dashboard/settings/backup",
        permission: "backup",
      },
];

type DashboardSidebarProps = {
  isMobile?: boolean
  onClose?: () => void
}

export default function DashboardSidebar({ isMobile, onClose }: DashboardSidebarProps = {}) {
  const pathname = usePathname();
  const { user, hasPermission, loading } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [planFeatures, setPlanFeatures] = useState<any>(null);

  // Close mobile drawer when route changes
  useEffect(() => {
    if (isMobile && onClose) onClose();
  }, [pathname, isMobile, onClose]);

  const effectiveCollapsed = isMobile ? false : collapsed;

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  // Fetch user's plan features (with auth token so 401 doesn't break menu open)
  useEffect(() => {
    const fetchPlanFeatures = async () => {
      try {
        const token = tokenStorage.getAccessToken();
        if (!token) {
          setPlanFeatures({});
          return;
        }
        const response = await fetch("/api/user/plan-features", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          setPlanFeatures({});
          return;
        }
        const data = await response.json();
        if (data.success && data.planFeatures != null) {
          setPlanFeatures(data.planFeatures);
        } else {
          setPlanFeatures({});
        }
      } catch {
        setPlanFeatures({});
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
      'Sales Invoices': 'salesInvoice',
      'Receipts': 'receipts',
      'Purchase Invoices': 'purchaseInvoice',
      'Payments': 'payments',
      'Reconciliation': 'reconciliation',
      'Assets': 'assets',
      'Reports': 'reports',
      'Communications': 'bulkEmail',
      'Settings': 'settings',
      'HR Settings': 'hrSettings',
      'Backup': 'backup'
    };
    
    const featureKey = featureMap[featureName];
    if (!featureKey) return true; // If not in map, allow access
    // console.log("Checking feature:", featureName, "->", featureKey, planFeatures[featureKey]);
    return planFeatures[featureKey] === true;
  };
  const isChildActive = (item: NavItem): boolean => {
  if (item.href && pathname === item.href) return true;

  if (item.submenu) {
    return item.submenu.some((sub) => isChildActive(sub));
  }

  return false;
};

  const renderNavItem = (item: NavItem, level: number = 0, parentKey: string = "") => {
    // LEVEL 1: Check if user has active subscription
    // Only Dashboard is accessible without an active subscription
    if (!hasActiveSubscription(user) && item.name !== "Dashboard") {
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
const isExpanded =
  expandedMenus[menuKey] || isChildActive(item);
    const isActive = item.href ? pathname === item.href : false;
    
    if (hasSubmenu) {
      return (
        <div key={menuKey} className={level > 0 ? "ml-2" : ""}>
          <button
            onClick={() => toggleMenu(menuKey)}
            className={`flex items-center justify-between w-full px-3 py-2 min-h-[48px] sm:min-h-0 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation ${
              isActive ? "bg-accent text-accent-foreground" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
              {!effectiveCollapsed && <span>{item.name}</span>}
            </div>
            {!effectiveCollapsed && (
              <span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            )}
          </button>
          {!effectiveCollapsed && isExpanded && (
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
        className={`flex items-center gap-2 px-3 py-2 min-h-[48px] sm:min-h-0 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation ${
          isActive ? "bg-accent text-accent-foreground" : ""
        } ${level > 0 ? "ml-2" : ""}`}
      >
        {item.icon && <item.icon className="h-4 w-4" />}
        {!effectiveCollapsed && <span>{item.name}</span>}
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

  const header = (
    <div className="flex items-center justify-between border-b bg-background p-3 sm:p-4 shrink-0">
      {(isMobile || !effectiveCollapsed) && <h2 className="text-lg font-semibold truncate">Dashboard</h2>}
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
          onClick={() => setCollapsed(!collapsed)}
          className="min-h-[44px] min-w-[44px] shrink-0 p-0 rounded-lg"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );

  return (
    <div
      className={
        isMobile
          ? "flex flex-col h-full bg-background w-full"
          : `flex flex-col border-r bg-background transition-all duration-300 h-screen sticky top-0 ${effectiveCollapsed ? "w-16" : "w-64"}`
      }
    >
      {header}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-1 min-h-0">
        {navigationItems.map((item) => renderNavItem(item))}
      </nav>
    </div>
  );
}
