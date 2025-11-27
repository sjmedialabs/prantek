# SKC Mines Application - Features Document

**Application Overview**: Multi-tenant business management system with subscription-based access control, role-based permissions, and comprehensive financial management capabilities.

**Accessible Domains**:
- Website: beta.skcmines.com
- Admin Portal: admin.skcmines.com

---

## 1. WEBSITE (Public Portal) - beta.skcmines.com

### 1.1 Landing Page
**Purpose**: Public-facing marketing and information portal

**Features**:
- Hero Section - Main value proposition and CTA
- Trusted By Section - Client logos and social proof
- Features Section - Product capabilities showcase
- Industries Section - Target industry use cases
- Dashboard Showcase - Product screenshots and demos
- Testimonials Section - Customer reviews and feedback
- Pricing Section - Subscription plans display
- FAQ Section - Common questions and answers
- CTA Section - Call-to-action for sign-up
- Navigation Header - Main menu and branding
- Footer - Links, contact info, legal pages

### 1.2 Authentication Pages
**Registration Flow**:
- Sign Up (`/signup`) - New user registration with email verification
- Email Verification - Account activation via email link
- Trial Period Setup - 14-day free trial for new accounts
- Trial Payment Processing - Optional payment during trial

**Login Flow**:
- Sign In (`/signin`) - Email/password authentication
- Forgot Password (`/forgot-password`) - Password reset request
- Reset Password (`/reset-password`) - New password setup via email link

**Access Control**:
- Inactive/Expired Subscription Modal - Payment prompt for expired accounts
- Payment Page (`/payment`) - Subscription payment gateway
- Trial Payment Page (`/trial-payment`) - Trial-to-paid conversion

### 1.3 Quotation Embed
- Public Quotation View (`/quotation-embed`) - Shareable quotation preview for clients

---

## 2. ADMIN DASHBOARD (Authenticated Users) - beta.skcmines.com/dashboard

### 2.1 Core Financial Management

#### 2.1.1 Dashboard (`/dashboard`)
- Real-time business metrics overview
- Revenue analytics and charts
- Quick stats (users, quotations, receipts, payments)
- Monthly revenue trends
- Activity summary

#### 2.1.2 Cash Book (`/dashboard/cashBook`)
**Permission**: None (Available to all users)
**Features**:
- Cash flow tracking
- Transaction logging
- Balance reconciliation
- Income and expense records

#### 2.1.3 Clients Management (`/dashboard/clients`)
**Permission**: `view_clients`
**Features**:
- Client database management
- Client profile creation and editing
- Contact information storage
- Transaction history per client
- Client search and filtering
- Export client data

**Available Permissions**:
- `view_clients` - View client and vendor information
- `create_clients` - Add new clients and vendors
- `edit_clients` - Modify client and vendor information
- `delete_clients` - Remove clients and vendors

#### 2.1.4 Vendors Management (`/dashboard/vendor`)
**Permission**: `view_clients`
**Features**:
- Vendor database management
- Vendor profile creation and editing
- Supplier contact details
- Purchase history tracking
- Vendor search and filtering

#### 2.1.5 Quotations (`/dashboard/quotations`)
**Permission**: `view_quotations`
**Features**:
- Create new quotations (`/dashboard/quotations/new`)
- View quotation details (`/dashboard/quotations/[id]`)
- Edit existing quotations (`/dashboard/quotations/[id]/edit`)
- Auto-generated quotation numbers
- Line item management
- Tax calculations
- PDF generation and export
- Client quotation tracking
- Quotation status management

**Available Permissions**:
- `view_quotations` - View quotation records
- `create_quotations` - Create new quotations
- `edit_quotations` - Modify existing quotations
- `delete_quotations` - Remove quotations

#### 2.1.6 Receipts (`/dashboard/receipts`)
**Permission**: `view_receipts`
**Features**:
- Create new receipts (`/dashboard/receipts/new`)
- View receipt details (`/dashboard/receipts/[id]`)
- Edit existing receipts (`/dashboard/receipts/[id]/edit`)
- Auto-generated receipt numbers
- Payment tracking
- Receipt categorization
- Amount paid calculations
- PDF generation
- Receipt search and filtering

**Available Permissions**:
- `view_receipts` - View receipt records
- `create_receipts` - Create new receipts
- `edit_receipts` - Modify existing receipts
- `delete_receipts` - Remove receipts

#### 2.1.7 Payments (`/dashboard/payments`)
**Permission**: `view_payments`
**Features**:
- Create new payments (`/dashboard/payments/new`)
- View payment details (`/dashboard/payments/[id]`)
- Edit existing payments (`/dashboard/payments/[id]/edit`)
- Auto-generated payment numbers
- Payment method tracking
- Payment categorization
- Vendor payment records
- Payment history
- Payment search and filtering

**Available Permissions**:
- `view_payments` - View payment records
- `create_payments` - Create new payments
- `edit_payments` - Modify existing payments
- `delete_payments` - Remove payments

#### 2.1.8 Reconciliation (`/dashboard/reconciliation`)
**Permission**: `view_reconciliation`
**Features**:
- Bank reconciliation
- Transaction matching
- Discrepancy identification
- Balance verification
- Reconciliation reports

**Available Permissions**:
- `view_reconciliation` - View reconciliation records
- `manage_reconciliation` - Perform reconciliation operations

#### 2.1.9 Assets Management (`/dashboard/assets`)
**Permission**: `manage_assets`
**Features**:
- Asset registry
- Asset categorization
- Asset condition tracking
- Depreciation calculations
- Asset assignment
- Asset search and filtering

**Available Permissions**:
- `view_assets` - View asset information
- `manage_assets` - Create, edit, and delete assets

#### 2.1.10 Reports (`/dashboard/reports`)
**Permission**: `view_reports`
**Features**:
- Financial reports generation
- Revenue reports
- Expense reports
- Client/Vendor reports
- Custom report filters
- Report export functionality

**Available Permissions**:
- `view_reports` - Access and view reports
- `export_reports` - Export reports to various formats

#### 2.1.11 Financials (`/dashboard/financials`)
**Permission**: Based on feature permissions
**Features**:
- Comprehensive financial overview
- Profit/Loss statements
- Balance sheet view
- Financial analytics

### 2.2 Settings & Configuration

**Base Permission**: `tenant_settings` (Required for all settings access)

#### 2.2.1 Company Settings
**Company Details** (`/dashboard/settings/company`)
- Company name and registration
- Business address
- Contact information
- Logo upload
- Business type
- Tax identification

**Bank Details** (`/dashboard/settings/bank`)
- Bank account management
- Multiple bank accounts
- Account numbers
- IFSC/routing codes
- Default account selection

#### 2.2.2 Product Settings
**Tax Configuration** (`/dashboard/settings/tax`)
- Tax rates management (`/dashboard/settings/tax-rates`)
- Tax settings configuration (`/dashboard/settings/tax-settings`)
- GST/VAT setup
- Tax calculation rules
- Tax exemptions

**Product Management** (`/dashboard/settings/items`)
- Product catalog
- Service items
- SKU management
- Pricing configuration
- Product categories

#### 2.2.3 Payment Settings
**Party Type** (`/dashboard/settings/recipient-types`)
- Define recipient categories
- Customer types
- Vendor types
- Payment recipient classification

**Ledger Head** (`/dashboard/settings/payment-categories`)
- Payment category management
- Receipt category management (`/dashboard/settings/receipt-categories`)
- Income categories
- Expense categories
- Accounting ledger mapping

**Payment Methods** (`/dashboard/settings/payment-methods`)
- Cash, check, bank transfer
- Credit/debit card
- Digital wallets
- Payment gateway configuration

#### 2.2.4 Assets Settings
**Asset Categories** (`/dashboard/settings/asset-categories`)
- Asset type definitions
- Category hierarchy
- Asset classification

**Asset Conditions** (`/dashboard/settings/asset-conditions`)
- Condition status (New, Good, Fair, Poor)
- Condition tracking
- Maintenance status

#### 2.2.5 Security & Notifications
**Security Settings** (`/dashboard/settings/security`)
- Password management
- Session timeout
- Two-factor authentication (if available)
- Login history

**Notifications** (`/dashboard/settings/notifications`)
- Notification preferences
- Email alerts
- System notifications
- Activity updates

**Activity Log** (`/dashboard/settings/activity-log`)
- User activity tracking
- System audit trail
- Change history
- Security events

### 2.3 HR Management Module

**Base Permission**: `tenant_settings`

#### 2.3.1 User Management (`/dashboard/hr/users`)
**Additional Permission**: `manage_users` (for full access)

**Features**:
- Create admin users with granular permissions
- Link admin users to existing employees
- Direct permission assignment (no role dependency)
- Custom permission selection per user
- User activation/deactivation
- Password management
- Employee-linked admin creation

**User Creation Flow** (New Design):
1. Select existing employee to grant admin access
2. Create password (email auto-filled from employee)
3. Select individual permissions from checklist
4. Save to create admin user with selected permissions

#### 2.3.2 Employee Management
**Employee Roles** (`/dashboard/hr/employee-roles`)
**Permission**: `manage_roles`
**Features**:
- Define employee role types
- Role-based access templates
- Role hierarchy
- Permission bundling

**Employment Type** (`/dashboard/hr/member-types`)
**Features**:
- Full-time, Part-time, Contract
- Internship, Consultant
- Employment status categories

**Employee List** (`/dashboard/hr/employees`)
**Features**:
- Employee database
- Employee profiles
- Contact information
- Employment history
- Department assignment
- Salary information
- Send employee credentials via email
- Employee status management

### 2.4 Additional Features

#### 2.4.1 Profile Management (`/dashboard/profile`)
- User profile editing
- Avatar upload
- Contact information update
- Password change

#### 2.4.2 Team Management (`/dashboard/team`)
- Team member overview
- Collaboration tools
- Team assignments

#### 2.4.3 Subscription Plans (`/dashboard/plans`)
- View current subscription
- Plan upgrade/downgrade
- Feature comparison
- Billing history
- Payment methods

#### 2.4.4 Checkout (`/dashboard/checkout`)
- Subscription payment processing
- Invoice generation
- Payment confirmation

---

## 3. ADMIN USER ROLE

**User Type**: `userType: "admin"`
**Role**: `role: "admin"`

### 3.1 Access Control
- **Permission-Based Access**: Access determined by individual permissions assigned
- **No Direct Role Dependency**: Permissions stored directly in user document
- **Employee Linkage**: Admin users linked to employee records via `employeeId`
- **Granular Control**: Each feature requires specific permission

### 3.2 Permission Categories

#### 3.2.1 Clients & Vendors
- `view_clients` - View client and vendor information
- `create_clients` - Add new clients and vendors
- `edit_clients` - Modify client and vendor information
- `delete_clients` - Remove clients and vendors

#### 3.2.2 Quotations
- `view_quotations` - View quotation records
- `create_quotations` - Create new quotations
- `edit_quotations` - Modify existing quotations
- `delete_quotations` - Remove quotations

#### 3.2.3 Receipts
- `view_receipts` - View receipt records
- `create_receipts` - Create new receipts
- `edit_receipts` - Modify existing receipts
- `delete_receipts` - Remove receipts

#### 3.2.4 Payments
- `view_payments` - View payment records
- `create_payments` - Create new payments
- `edit_payments` - Modify existing payments
- `delete_payments` - Remove payments

#### 3.2.5 Reconciliation
- `view_reconciliation` - View reconciliation records
- `manage_reconciliation` - Perform reconciliation operations

#### 3.2.6 Assets
- `view_assets` - View asset information
- `manage_assets` - Create, edit, and delete assets

#### 3.2.7 Reports
- `view_reports` - Access and view reports
- `export_reports` - Export reports to various formats

#### 3.2.8 Settings & Administration
- `tenant_settings` - Manage tenant configuration and settings
- `manage_roles` - Create and manage employee roles
- `manage_users` - Create, edit, and delete admin users

### 3.3 Subscription-Based Access Control
**Three-Level Access Control System**:

1. **Level 1: Subscription Status**
   - Must have active subscription or be in trial period
   - Expired/inactive subscriptions blocked (except payment page)
   - Modal popup prompts payment for expired subscriptions

2. **Level 2: Plan Features**
   - Subscription plan defines available features:
     - `cashBook` - Cash book access
     - `clients` - Client management
     - `vendors` - Vendor management
     - `quotations` - Quotation management
     - `receipts` - Receipt management
     - `payments` - Payment management
     - `reconciliation` - Reconciliation tools
     - `assets` - Asset management
     - `reports` - Reporting features
     - `settings` - Settings access

3. **Level 3: User Permissions**
   - Even if feature is in plan, admin user needs specific permission
   - Permission must be explicitly assigned to access feature

**Access Hierarchy**: Subscription Status → Plan Features → User Permissions

### 3.4 Restrictions
- Cannot access super admin panel
- Cannot manage subscription plans
- Cannot view system-wide metrics
- Cannot manage tenant accounts
- Cannot modify company subscription
- Limited to assigned company/tenant data only

---

## 4. SUPER ADMIN ROLE

**User Type**: `userType: "subscriber"`
**Role**: `role: "super-admin"`
**Access**: admin.skcmines.com

### 4.1 Full System Access
- **Unrestricted Access**: All features and modules
- **No Permission Checks**: Bypasses all permission requirements
- **No Subscription Validation**: Always has active access
- **Multi-Tenant Management**: Can access all tenant data

### 4.2 Super Admin Dashboard (`/dashboard/admin`)
**Exclusive Features**:
- System-wide analytics
- All tenants overview
- Total users across all companies
- Revenue across all tenants
- Quotations aggregate data
- Receipts aggregate data
- Cross-tenant reporting
- Platform health metrics

### 4.3 Tenant Management
**Subscription Management**:
- Create/edit subscription plans (`/api/subscription-plans`)
- Manage plan features
- Set plan pricing
- Configure plan limits
- View all subscriptions

**Plan Feature Management** (`/api/subscription-plans/features`):
- Enable/disable features per plan:
  - User creation rights
  - Advanced analytics
  - Export reports capability
  - API access
  - Custom branding
  - RBAC (Role-Based Access Control)
  - Individual module access

**Tenant Administration**:
- View all tenant accounts
- Access any tenant data
- Modify tenant subscriptions
- Activate/deactivate tenants
- Process trial conversions
- Manual subscription adjustments

### 4.4 System Configuration
**System Settings** (`/api/system-settings`):
- Global system configuration
- Default trial period settings
- Payment gateway configuration
- Email service settings
- System-wide defaults

**Website Content Management** (`/api/website-content`):
- Landing page content
- Features section editing
- Testimonials management
- FAQ content
- Pricing display

**Cron Job Management**:
- Process trial expirations (`/api/cron/process-trials`)
- Process trial payments (`/api/cron/process-trial-payments`)
- System maintenance tasks
- Automated subscription updates

### 4.5 Advanced Capabilities
**API Access**:
- Full API access to all endpoints
- Database initialization (`/api/init-db`)
- Health check monitoring (`/api/health`)
- Metrics dashboard (`/api/metrics`)

**Activity Monitoring**:
- System-wide activity logs
- User behavior analytics
- Security audit trails
- Performance metrics
- Error tracking

**User Management**:
- Manage admin users across all tenants
- Reset passwords for any user
- View user count per tenant (`/api/admin-users/count`)
- User activity monitoring

### 4.6 Super Admin Authentication
**Login**: Separate super admin login (`/super-admin`, `/api/auth/super-admin`)
**Security**: Enhanced authentication and authorization

---

## 5. PERMISSION MATRIX

| Feature/Module | Admin User Permission Required | Super Admin Access |
|---|---|---|
| Dashboard | None | ✓ Full |
| Cash Book | None | ✓ Full |
| Clients (View) | `view_clients` | ✓ Full |
| Clients (Create) | `create_clients` | ✓ Full |
| Clients (Edit) | `edit_clients` | ✓ Full |
| Clients (Delete) | `delete_clients` | ✓ Full |
| Vendors | `view_clients` | ✓ Full |
| Quotations (View) | `view_quotations` | ✓ Full |
| Quotations (Create) | `create_quotations` | ✓ Full |
| Quotations (Edit) | `edit_quotations` | ✓ Full |
| Quotations (Delete) | `delete_quotations` | ✓ Full |
| Receipts (View) | `view_receipts` | ✓ Full |
| Receipts (Create) | `create_receipts` | ✓ Full |
| Receipts (Edit) | `edit_receipts` | ✓ Full |
| Receipts (Delete) | `delete_receipts` | ✓ Full |
| Payments (View) | `view_payments` | ✓ Full |
| Payments (Create) | `create_payments` | ✓ Full |
| Payments (Edit) | `edit_payments` | ✓ Full |
| Payments (Delete) | `delete_payments` | ✓ Full |
| Reconciliation (View) | `view_reconciliation` | ✓ Full |
| Reconciliation (Manage) | `manage_reconciliation` | ✓ Full |
| Assets (View) | `view_assets` | ✓ Full |
| Assets (Manage) | `manage_assets` | ✓ Full |
| Reports (View) | `view_reports` | ✓ Full |
| Reports (Export) | `export_reports` | ✓ Full |
| All Settings | `tenant_settings` | ✓ Full |
| Employee Roles | `manage_roles` | ✓ Full |
| User Management | `manage_users` | ✓ Full |
| Subscription Plans | ✗ No Access | ✓ Full |
| System Settings | ✗ No Access | ✓ Full |
| Website Content | ✗ No Access | ✓ Full |
| Cross-Tenant Access | ✗ No Access | ✓ Full |

---

## 6. SUBSCRIPTION PLANS & FEATURES

### 6.1 Plan-Based Feature Access
Each subscription plan can enable/disable modules:
- Cash Book
- Clients Management
- Vendors Management
- Quotations
- Receipts
- Payments
- Reconciliation
- Assets Management
- Reports
- Settings Access

### 6.2 Additional Plan Features
- `userCreation` - Ability to create admin users
- `advancedAnalytics` - Enhanced reporting and analytics
- `exportReports` - Report export capabilities
- `apiAccess` - API access for integrations
- `customBranding` - Company logo and branding
- `rbac` - Role-based access control

### 6.3 Trial Period
- 14-day free trial for new accounts
- Full feature access during trial
- Optional payment during trial
- Auto-conversion to paid or expired status
- Trial status tracked in user account

---

## 7. DATA MODELS & COLLECTIONS

### 7.1 Database Collections
- `USERS` - Admin users and subscribers
- `EMPLOYEES` - Employee records without dashboard access
- `ROLES` - Role definitions (backward compatibility)
- `CLIENTS` - Customer database
- `VENDORS` - Supplier database
- `QUOTATIONS` - Sales quotations
- `RECEIPTS` - Income receipts
- `PAYMENTS` - Expense payments
- `ASSETS` - Company assets
- `ASSET_CATEGORIES` - Asset classifications
- `ASSET_CONDITIONS` - Asset condition statuses
- `BANK_ACCOUNTS` - Company bank accounts
- `PAYMENT_METHODS` - Payment method definitions
- `PAYMENT_CATEGORIES` - Payment categorization
- `RECEIPT_CATEGORIES` - Receipt categorization
- `RECIPIENT_TYPES` - Party type definitions
- `TAX_RATES` - Tax configuration
- `ITEMS` - Product/service catalog
- `EMPLOYEE_ROLES` - Employee role definitions
- `MEMBER_TYPES` - Employment type categories
- `SUBSCRIPTION_PLANS` - Subscription plan definitions
- `TEAM_MEMBERS` - Team collaboration
- `NOTIFICATIONS` - System notifications
- `ACTIVITY_LOGS` - Audit trail

---

## 8. API ENDPOINTS SUMMARY

### 8.1 Authentication APIs
- `/api/auth/login` - User login
- `/api/auth/register` - New user registration
- `/api/auth/logout` - User logout
- `/api/auth/super-admin` - Super admin login
- `/api/auth/verify` - Email verification
- `/api/auth/forgot-password` - Password reset request
- `/api/auth/reset-password` - Password reset completion
- `/api/auth/update-password` - Change password
- `/api/auth/me` - Current user info
- `/api/auth/refresh` - Token refresh
- `/api/auth/check-availability` - Username/email availability

### 8.2 Resource Management APIs
- `/api/clients` - Client CRUD operations
- `/api/vendors` - Vendor CRUD operations
- `/api/quotations` - Quotation management
- `/api/receipts` - Receipt management
- `/api/payments` - Payment management
- `/api/reconciliation` - Reconciliation operations
- `/api/assets` - Asset management
- `/api/employees` - Employee management
- `/api/users` - Admin user management
- `/api/roles` - Role management
- `/api/employee-roles` - Employee role management
- `/api/member-types` - Member type management

### 8.3 Configuration APIs
- `/api/bank-accounts` - Bank account management
- `/api/payment-methods` - Payment method config
- `/api/payment-categories` - Payment category config
- `/api/receipt-categories` - Receipt category config
- `/api/recipient-types` - Recipient type config
- `/api/tax-rates` - Tax rate management
- `/api/tax-settings` - Tax configuration
- `/api/items` - Product/service management
- `/api/asset-categories` - Asset category config
- `/api/asset-conditions` - Asset condition config

### 8.4 System & Admin APIs
- `/api/company` - Company profile management
- `/api/permissions` - Permission definitions
- `/api/subscription-plans` - Plan management (Super Admin)
- `/api/subscription-plans/features` - Feature toggles (Super Admin)
- `/api/subscription/check-permissions` - Permission validation
- `/api/user/plan-features` - User plan features
- `/api/user/set-trial` - Trial activation
- `/api/payment/verify-and-create-account` - Payment processing
- `/api/system-settings` - System configuration (Super Admin)
- `/api/website-content` - Website CMS (Super Admin)
- `/api/activity-logs` - Activity tracking
- `/api/notifications` - Notification management
- `/api/metrics` - System metrics (Super Admin)
- `/api/health` - Health check
- `/api/cron/process-trials` - Trial processing
- `/api/cron/process-trial-payments` - Payment processing
- `/api/upload` - File upload
- `/api/files/[id]` - File management

---

## 9. FILE UPLOAD & MANAGEMENT
- Document upload for receipts/payments
- Image upload for company logo
- Avatar upload for users
- File storage and retrieval
- Secure file access control

---

## 10. NOTIFICATION SYSTEM
- Real-time notifications
- Email notifications
- Activity alerts
- System messages
- User-specific notifications
- Notification preferences

---

## 11. SECURITY FEATURES
- JWT-based authentication
- Token refresh mechanism
- Password hashing
- Email verification
- Password reset flow
- Session management
- Activity logging
- Audit trails
- Role-based access control
- Permission-based authorization
- Multi-level access control
- Secure file handling

---

## 12. TECHNICAL ARCHITECTURE
**Framework**: Next.js (React)
**Database**: MongoDB
**Authentication**: JWT tokens
**File Storage**: Local/Cloud storage
**Payment Gateway**: Integrated payment processing
**Email Service**: Transactional emails
**Deployment**: PM2 process manager

---

## NOTES:
1. All features respect the three-level access control (Subscription → Plan → Permission)
2. Inactive/expired subscriptions only allow access to payment page
3. Super admin bypasses all access controls
4. Admin users require explicit permission assignment
5. New admin user flow links to existing employees
6. Backward compatibility maintained for roleId-based users
7. All dates and times tracked for audit purposes
8. Multi-tenant architecture with data isolation
9. Scalable permission system for future expansion
