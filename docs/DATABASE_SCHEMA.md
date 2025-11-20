# Database Schema Documentation

## Overview
This document provides a comprehensive overview of the MongoDB database schema for the SaaS Platform. The database is designed to support multi-tenant architecture with user isolation and scalability for 100,000+ subscribers.

## Database Information
- **Database Name**: `saas_platform`
- **Database Type**: MongoDB (NoSQL)
- **Connection**: MongoDB Atlas (recommended for production)

---

## Collections

### 1. Users Collection
**Collection Name**: `users`

Stores user account information, authentication details, and subscription status.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed with bcrypt),
  name: string,
  companyId?: string,
  role: "user" | "super-admin",
  subscriptionPlanId?: string,
  subscriptionStatus?: "active" | "inactive" | "trial" | "expired",
  subscriptionStartDate?: Date,
  subscriptionEndDate?: Date,
  stripeCustomerId?: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Indexes
- `email` (unique) - Fast user lookup and authentication
- `companyId` - Group users by company
- `subscriptionPlanId` - Filter by subscription plan
- `createdAt` (descending) - Sort by registration date

#### Relationships
- One-to-Many with Clients, Vendors, Items, Receipts, Quotations, Payments
- Many-to-One with SubscriptionPlans

---

### 2. Clients Collection
**Collection Name**: `clients`

Stores customer/client information for each user.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  name: string,
  email: string,
  phone?: string,
  address?: string,
  city?: string,
  state?: string,
  pincode?: string,
  gstin?: string (GST Identification Number),
  pan?: string (PAN Card Number),
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Indexes
- `userId` - Filter clients by user (multi-tenancy)
- `email` - Search by email
- `name` - Search by name
- `createdAt` (descending) - Sort by creation date

#### Relationships
- Many-to-One with Users
- One-to-Many with Receipts, Quotations

---

### 3. Vendors Collection
**Collection Name**: `vendors`

Stores vendor/supplier information for each user.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  name: string,
  email: string,
  phone?: string,
  address?: string,
  city?: string,
  state?: string,
  pincode?: string,
  gstin?: string,
  pan?: string,
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Indexes
- `userId` - Filter vendors by user
- `email` - Search by email
- `name` - Search by name
- `createdAt` (descending) - Sort by creation date

#### Relationships
- Many-to-One with Users
- One-to-Many with Payments

---

### 4. Items Collection
**Collection Name**: `items`

Stores product/service items that can be used in receipts and quotations.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  name: string,
  description?: string,
  category?: string,
  unit?: string (e.g., "pcs", "kg", "hours"),
  price: number,
  taxRate?: number (percentage),
  hsnCode?: string (HSN/SAC code for GST),
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Indexes
- `userId` - Filter items by user
- `name` - Search by name
- `category` - Filter by category
- `createdAt` (descending) - Sort by creation date

#### Relationships
- Many-to-One with Users
- Referenced in Receipt Items and Quotation Items

---

### 5. Receipts Collection
**Collection Name**: `receipts`

Stores receipt/invoice documents with line items.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  clientId: string (reference to Clients),
  receiptNumber: string (unique, auto-generated),
  date: Date,
  dueDate?: Date,
  items: [
    {
      itemId: string,
      name: string,
      description?: string,
      quantity: number,
      unit?: string,
      price: number,
      taxRate?: number,
      taxAmount?: number,
      total: number
    }
  ],
  subtotal: number,
  taxAmount: number,
  total: number,
  amountPaid?: number,
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled",
  notes?: string,
  terms?: string,
  cleared?: boolean,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Indexes
- `userId` - Filter receipts by user
- `clientId` - Filter receipts by client
- `receiptNumber` (unique) - Fast lookup by receipt number
- `status` - Filter by status
- `date` (descending) - Sort by date
- `createdAt` (descending) - Sort by creation date

#### Relationships
- Many-to-One with Users
- Many-to-One with Clients

---

### 6. Quotations Collection
**Collection Name**: `quotations`

Stores quotation/estimate documents with line items.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  clientId: string (reference to Clients),
  quotationNumber: string (unique, auto-generated),
  date: Date,
  validUntil?: Date,
  items: [
    {
      itemId: string,
      name: string,
      description?: string,
      quantity: number,
      unit?: string,
      price: number,
      taxRate?: number,
      taxAmount?: number,
      total: number
    }
  ],
  subtotal: number,
  taxAmount: number,
  total: number,
  status: "draft" | "sent" | "accepted" | "rejected" | "expired",
  notes?: string,
  terms?: string,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Indexes
- `userId` - Filter quotations by user
- `clientId` - Filter quotations by client
- `quotationNumber` (unique) - Fast lookup by quotation number
- `status` - Filter by status
- `date` (descending) - Sort by date
- `createdAt` (descending) - Sort by creation date

#### Relationships
- Many-to-One with Users
- Many-to-One with Clients

---

### 7. Payments Collection
**Collection Name**: `payments`

Stores payment transactions to clients, vendors, or team members.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  recipientId: string (reference to Client/Vendor/TeamMember),
  recipientType: "client" | "vendor" | "team",
  paymentNumber: string (unique, auto-generated),
  date: Date,
  amount: number,
  paymentMethod: string,
  category?: string,
  status: "pending" | "completed" | "failed" | "cancelled",
  notes?: string,
  reference?: string,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Indexes
- `userId` - Filter payments by user
- `recipientId` - Filter payments by recipient
- `paymentNumber` (unique) - Fast lookup by payment number
- `status` - Filter by status
- `date` (descending) - Sort by date
- `createdAt` (descending) - Sort by creation date

#### Relationships
- Many-to-One with Users
- Many-to-One with Clients/Vendors/TeamMembers (polymorphic)

---

### 8. Subscription Plans Collection
**Collection Name**: `subscription_plans`

Stores available subscription plans for the SaaS platform.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  name: string (unique),
  price: number,
  duration: number (in days),
  features: string[],
  maxUsers: number,
  maxClients: number,
  maxReceipts: number,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Indexes
- `name` (unique) - Fast lookup by plan name
- `price` - Sort by price

#### Relationships
- One-to-Many with Users

---

### 9. Payment Methods Collection
**Collection Name**: `payment_methods`

Stores payment method configurations for each user.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  name: string,
  type: "bank" | "upi" | "card" | "cash",
  details: { [key: string]: string },
  isEnabled: boolean,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Relationships
- Many-to-One with Users

---

### 10. Receipt Categories Collection
**Collection Name**: `receipt_categories`

Stores custom categories for receipts.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  name: string,
  type: "receipt",
  isEnabled: boolean,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Relationships
- Many-to-One with Users

---

### 11. Payment Categories Collection
**Collection Name**: `payment_categories`

Stores custom categories for payments.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  name: string,
  type: "payment",
  isEnabled: boolean,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Relationships
- Many-to-One with Users

---

### 12. Tax Settings Collection
**Collection Name**: `tax_settings`

Stores tax rate configurations for each user.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  name: string,
  rate: number (percentage),
  isDefault: boolean,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Relationships
- Many-to-One with Users

---

### 13. Bank Details Collection
**Collection Name**: `bank_details`

Stores bank account information for each user.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  bankName: string,
  accountNumber: string,
  ifscCode: string,
  accountHolderName: string,
  branch?: string,
  isDefault: boolean,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Relationships
- Many-to-One with Users

---

### 14. Company Settings Collection
**Collection Name**: `company_settings`

Stores company profile information for each user.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  companyName: string,
  email: string,
  phone?: string,
  address?: string,
  city?: string,
  state?: string,
  pincode?: string,
  gstin?: string,
  pan?: string,
  logo?: string (URL),
  website?: string,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Relationships
- One-to-One with Users

---

### 15. Team Members Collection
**Collection Name**: `team_members`

Stores team member information for each user.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  name: string,
  email: string,
  phone?: string,
  role?: string,
  memberTypeId?: string (reference to MemberTypes),
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Indexes
- `userId` - Filter team members by user
- `email` - Search by email
- `createdAt` (descending) - Sort by creation date

#### Relationships
- Many-to-One with Users
- Many-to-One with MemberTypes

---

### 16. Member Types Collection
**Collection Name**: `member_types`

Stores custom member type definitions for team members.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  name: string,
  description?: string,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Relationships
- Many-to-One with Users
- One-to-Many with TeamMembers

---

### 17. Roles Collection
**Collection Name**: `roles`

Stores role definitions with permissions.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  name: string,
  permissions: string[],
  description?: string,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Relationships
- Referenced by Users and TeamMembers

---

### 18. Activity Logs Collection
**Collection Name**: `activity_logs`

Stores audit trail of user actions.

#### Schema
\`\`\`typescript
{
  _id: ObjectId,
  userId: string (reference to Users),
  action: string,
  entity: string,
  entityId?: string,
  details?: { [key: string]: any },
  timestamp: Date,
  ipAddress?: string,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Indexes
- `userId` - Filter logs by user
- `action` - Filter by action type
- `timestamp` (descending) - Sort by timestamp

#### Relationships
- Many-to-One with Users

---

## Data Isolation Strategy

### Multi-Tenancy
All user-specific collections include a `userId` field to ensure data isolation:
- Each query automatically filters by `userId`
- Prevents cross-user data access
- Supports horizontal scaling

### Security
- All passwords are hashed using bcrypt (10 rounds)
- JWT tokens for authentication (15min access, 7day refresh)
- Row-level security through userId filtering

---

## Performance Optimization

### Indexing Strategy
- **Compound Indexes**: Used for common query patterns
- **Unique Indexes**: Enforce data integrity (email, receipt numbers)
- **Descending Indexes**: Optimize date-based sorting

### Query Optimization
- Pagination implemented on all list endpoints (default: 20 items)
- Projection used to return only required fields
- Aggregation pipelines for complex reports

### Caching
- In-memory cache for frequently accessed data
- 5-minute TTL for user settings
- Cache invalidation on updates

---

## Scalability Considerations

### Current Capacity
- **Users**: 100,000+ concurrent users
- **Documents**: Millions of receipts, quotations, payments
- **Queries**: 1000+ requests per second

### Scaling Strategy
1. **Vertical Scaling**: Increase MongoDB instance size
2. **Horizontal Scaling**: Implement sharding by userId
3. **Read Replicas**: Distribute read operations
4. **Connection Pooling**: Reuse database connections (max 100)

---

## Backup and Recovery

### Backup Strategy
- **Frequency**: Daily automated backups
- **Retention**: 30 days
- **Location**: MongoDB Atlas automated backups

### Recovery
- Point-in-time recovery available
- Restore from any backup within retention period

---

## Migration Guide

### From localStorage to MongoDB
1. Export existing localStorage data
2. Transform to MongoDB schema format
3. Bulk insert using MongoDB API
4. Verify data integrity
5. Update application to use MongoDB

### Schema Updates
- Use migration scripts in `/scripts` folder
- Version control all schema changes
- Test migrations in staging environment first

---

## Environment Variables

Required environment variables for database connection:

\`\`\`env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saas_platform
JWT_SECRET=your-secret-key-min-32-characters
\`\`\`

---

## Monitoring

### Key Metrics
- Query response time
- Connection pool usage
- Index hit ratio
- Document count per collection
- Storage size

### Alerts
- Slow queries (>100ms)
- Connection pool exhaustion
- High error rate
- Storage threshold (80% capacity)

---

## Best Practices

1. **Always use indexes** for filtered queries
2. **Implement pagination** for large result sets
3. **Use projection** to limit returned fields
4. **Validate data** before insertion
5. **Log all mutations** to activity_logs
6. **Use transactions** for multi-document operations
7. **Monitor query performance** regularly
8. **Keep documents small** (<16MB limit)

---

## Support

For database-related issues:
- Check MongoDB Atlas logs
- Review slow query logs
- Contact database administrator
- Refer to MongoDB documentation
