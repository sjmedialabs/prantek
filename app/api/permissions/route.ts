import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

// Define all available permissions in the system
const SYSTEM_PERMISSIONS = [
  // Clients
  { id: "view_clients", label: "View Clients", category: "Clients", description: "View client information" },
  { id: "add_clients", label: "Add Clients", category: "Clients", description: "Create new clients" },
  { id: "edit_clients", label: "Edit Clients", category: "Clients", description: "Modify client information" },

  // Vendors
  { id: "view_vendors", label: "View Vendors", category: "Vendors", description: "View vendor information" },
  { id: "add_vendors", label: "Add Vendors", category: "Vendors", description: "Create new vendors" },
  { id: "edit_vendors", label: "Edit Vendors", category: "Vendors", description: "Modify vendor information" },

  // Quotations
  { id: "view_quotations", label: "View Quotations", category: "Quotations", description: "View quotation records" },
  { id: "add_quotations", label: "Add Quotations", category: "Quotations", description: "Create new quotations" },
  { id: "edit_quotations", label: "Edit Quotations", category: "Quotations", description: "Modify quotations" },

  // Receipts
  { id: "view_receipts", label: "View Receipts", category: "Receipts", description: "View receipt records" },
  { id: "add_receipts", label: "Add Receipts", category: "Receipts", description: "Create new receipts" },
  { id: "edit_receipts", label: "Edit Receipts", category: "Receipts", description: "Modify receipts" },

  // Payments
  { id: "view_payments", label: "View Payments", category: "Payments", description: "View payment records" },
  { id: "add_payments", label: "Add Payments", category: "Payments", description: "Create new payments" },
  { id: "edit_payments", label: "Edit Payments", category: "Payments", description: "Modify payments" },

  // Reconciliation
  { id: "view_reconciliation", label: "View Reconciliation", category: "Reconciliation", description: "View reconciliation data" },
  { id: "manage_reconciliation", label: "Manage Reconciliation", category: "Reconciliation", description: "Perform reconciliation operations" },

  // Assets
  { id: "view_assets", label: "View Assets", category: "Assets", description: "View asset information" },
  { id: "add_assets", label: "Add Assets", category: "Assets", description: "Create new assets" },
  { id: "edit_assets", label: "Edit Assets", category: "Assets", description: "Modify assets" },

  // Reports
  { id: "view_reports", label: "View Reports", category: "Reports", description: "View generated reports" },
  { id: "export_reports", label: "Export Reports", category: "Reports", description: "Export reports to various formats" },

  // Settings & Administration
  { id: "tenant_settings", label: "Tenant Settings", category: "Settings & Administration", description: "Manage tenant settings and configurations" },
  { id: "manage_users", label: "Manage Users", category: "Settings & Administration", description: "Create and manage admin users" },
]

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    if (user.role !== "super-admin" && user.role !== "admin" && user.role !== "admin-user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const groupedPermissions = SYSTEM_PERMISSIONS.reduce((acc: any, perm) => {
      if (!acc[perm.category]) acc[perm.category] = []
      acc[perm.category].push(perm)
      return acc
    }, {})

    return NextResponse.json({ success: true, permissions: SYSTEM_PERMISSIONS, groupedPermissions })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
})
