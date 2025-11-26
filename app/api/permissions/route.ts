import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

// Define all available permissions in the system
const SYSTEM_PERMISSIONS = [
  // Clients & Vendors
  { 
    id: "view_clients", 
    label: "View Clients & Vendors",
    category: "Clients & Vendors",
    description: "View client and vendor information"
  },
  { 
    id: "create_clients", 
    label: "Create Clients & Vendors",
    category: "Clients & Vendors",
    description: "Add new clients and vendors"
  },
  { 
    id: "edit_clients", 
    label: "Edit Clients & Vendors",
    category: "Clients & Vendors",
    description: "Modify client and vendor information"
  },
  { 
    id: "delete_clients", 
    label: "Delete Clients & Vendors",
    category: "Clients & Vendors",
    description: "Remove clients and vendors"
  },
  
  // Quotations
  { 
    id: "view_quotations", 
    label: "View Quotations",
    category: "Quotations",
    description: "View quotation records"
  },
  { 
    id: "create_quotations", 
    label: "Create Quotations",
    category: "Quotations",
    description: "Create new quotations"
  },
  { 
    id: "edit_quotations", 
    label: "Edit Quotations",
    category: "Quotations",
    description: "Modify existing quotations"
  },
  { 
    id: "delete_quotations", 
    label: "Delete Quotations",
    category: "Quotations",
    description: "Remove quotations"
  },
  
  // Receipts
  { 
    id: "view_receipts", 
    label: "View Receipts",
    category: "Receipts",
    description: "View receipt records"
  },
  { 
    id: "create_receipts", 
    label: "Create Receipts",
    category: "Receipts",
    description: "Create new receipts"
  },
  { 
    id: "edit_receipts", 
    label: "Edit Receipts",
    category: "Receipts",
    description: "Modify existing receipts"
  },
  { 
    id: "delete_receipts", 
    label: "Delete Receipts",
    category: "Receipts",
    description: "Remove receipts"
  },
  
  // Payments
  { 
    id: "view_payments", 
    label: "View Payments",
    category: "Payments",
    description: "View payment records"
  },
  { 
    id: "create_payments", 
    label: "Create Payments",
    category: "Payments",
    description: "Create new payments"
  },
  { 
    id: "edit_payments", 
    label: "Edit Payments",
    category: "Payments",
    description: "Modify existing payments"
  },
  { 
    id: "delete_payments", 
    label: "Delete Payments",
    category: "Payments",
    description: "Remove payments"
  },
  
  // Reconciliation
  { 
    id: "view_reconciliation", 
    label: "View Reconciliation",
    category: "Reconciliation",
    description: "View reconciliation records"
  },
  { 
    id: "manage_reconciliation", 
    label: "Manage Reconciliation",
    category: "Reconciliation",
    description: "Perform reconciliation operations"
  },
  
  // Assets
  { 
    id: "view_assets", 
    label: "View Assets",
    category: "Assets",
    description: "View asset information"
  },
  { 
    id: "manage_assets", 
    label: "Manage Assets",
    category: "Assets",
    description: "Create, edit, and delete assets"
  },
  
  // Reports
  { 
    id: "view_reports", 
    label: "View Reports",
    category: "Reports",
    description: "Access and view reports"
  },
  { 
    id: "export_reports", 
    label: "Export Reports",
    category: "Reports",
    description: "Export reports to various formats"
  },
  
  // Settings & Administration
  { 
    id: "tenant_settings", 
    label: "Tenant Settings",
    category: "Settings & Administration",
    description: "Manage tenant configuration and settings"
  },
  { 
    id: "manage_users", 
    label: "Manage Users",
    category: "Settings & Administration",
    description: "Create, edit, and delete admin users"
  },
]

/**
 * GET /api/permissions
 * Fetch all available permissions in the system
 */
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Only admin users can access permissions list
    if (user.role !== "super-admin" && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Group permissions by category for easier UI rendering
    const groupedPermissions: Record<string, any[]> = {}
    
    SYSTEM_PERMISSIONS.forEach(permission => {
      if (!groupedPermissions[permission.category]) {
        groupedPermissions[permission.category] = []
      }
      groupedPermissions[permission.category].push(permission)
    })

    return NextResponse.json({
      success: true,
      permissions: SYSTEM_PERMISSIONS,
      groupedPermissions
    })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions" },
      { status: 500 }
    )
  }
})
