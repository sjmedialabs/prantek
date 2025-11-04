# SaaS Platform - Low-Level Technical Document
## For Developers

---

## 1. System Architecture

### Overview
The platform follows a modern **serverless architecture** using Next.js 16 with the App Router, deployed on Vercel with MongoDB Atlas as the database.

### Architecture Diagram
\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  (Next.js Frontend - React 19, TypeScript, Tailwind CSS)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Routes  │  │ CRUD Routes  │  │ Utility APIs │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │ Data Models  │  │  Utilities   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  MongoDB     │  │ Vercel Blob  │  │    Cache     │     │
│  │   Atlas      │  │  (Storage)   │  │  (In-Memory) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19.2
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context API, SWR for data fetching
- **Forms**: React Hook Form with Zod validation
- **PDF Generation**: jsPDF, html2canvas

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Next.js API Routes
- **Language**: TypeScript 5.x
- **Authentication**: JWT (jose library)
- **Password Hashing**: bcryptjs
- **Validation**: Zod schemas

### Database
- **Primary Database**: MongoDB Atlas
- **Driver**: mongodb (official Node.js driver)
- **ODM**: Custom models (no Mongoose)
- **Connection Pooling**: Built-in (max 100 connections)

### Infrastructure
- **Hosting**: Vercel (serverless)
- **CDN**: Vercel Edge Network
- **File Storage**: Vercel Blob
- **Environment**: Node.js serverless functions
- **Deployment**: Git-based (automatic)

### Third-Party Services
- **Payments**: Stripe
- **Email**: (To be integrated - SendGrid/Resend)
- **Monitoring**: Built-in logging system
- **Analytics**: (To be integrated)

---

## 3. Project Structure

\`\`\`
saas-platform/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── signin/
│   │   ├── signup/
│   │   ├── super-admin/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── clients/
│   │   ├── vendors/
│   │   ├── receipts/
│   │   ├── quotations/
│   │   ├── payments/
│   │   ├── reports/
│   │   ├── reconciliation/
│   │   ├── team/
│   │   ├── settings/
│   │   └── ...
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── receipts/
│   │   ├── quotations/
│   │   ├── payments/
│   │   ├── health/
│   │   └── ...
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── auth/                     # Auth-related components
│   ├── dashboard/                # Dashboard components
│   ├── ui/                       # shadcn/ui components
│   └── ...
├── lib/                          # Utility libraries
│   ├── mongodb.ts                # MongoDB connection
│   ├── jwt.ts                    # JWT utilities
│   ├── auth.ts                   # Auth functions
│   ├── models/                   # Database models
│   ├── cache.ts                  # Caching layer
│   ├── logger.ts                 # Logging system
│   └── ...
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
├── docs/                         # Documentation
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
\`\`\`

---

## 4. Authentication System

### JWT Implementation

#### Token Structure
\`\`\`typescript
// Access Token (15 minutes)
{
  userId: string,
  email: string,
  role: "user" | "super-admin",
  iat: number,
  exp: number
}

// Refresh Token (7 days)
{
  userId: string,
  type: "refresh",
  iat: number,
  exp: number
}
\`\`\`

#### Authentication Flow
1. User submits credentials to `/api/auth/signin`
2. Server validates credentials against MongoDB
3. Server generates access token (15min) and refresh token (7 days)
4. Tokens stored in localStorage on client
5. Access token sent in Authorization header for API requests
6. Middleware validates token on protected routes
7. Client refreshes token before expiry using `/api/auth/refresh`

#### Files
- `lib/jwt.ts` - Token generation and verification
- `lib/auth.ts` - Authentication logic
- `lib/token-storage.ts` - Client-side token management
- `lib/token-refresh.ts` - Automatic token refresh
- `middleware.ts` - Route protection
- `components/auth/user-context.tsx` - Auth state management

### Password Security
- **Hashing**: bcryptjs with 10 salt rounds
- **Validation**: Minimum 8 characters, complexity requirements
- **Reset**: Token-based password reset (to be implemented)

---

## 5. Database Design

### Connection Management
\`\`\`typescript
// lib/mongodb.ts
import { MongoClient } from 'mongodb'

let client: MongoClient
let clientPromise: Promise<MongoClient>

export async function connectToDatabase() {
  if (client) return client
  
  client = new MongoClient(process.env.MONGODB_URI!, {
    maxPoolSize: 100,
    minPoolSize: 10,
    maxIdleTimeMS: 30000,
  })
  
  clientPromise = client.connect()
  return clientPromise
}
\`\`\`

### Data Models
All models extend `BaseModel` class:

\`\`\`typescript
// lib/models/base.model.ts
export class BaseModel<T> {
  constructor(private collectionName: string) {}
  
  async findAll(filter = {}, options = {}) { }
  async findById(id: string) { }
  async create(data: Partial<T>) { }
  async update(id: string, data: Partial<T>) { }
  async delete(id: string) { }
  async count(filter = {}) { }
}
\`\`\`

### Multi-Tenancy
All user-specific queries automatically filter by `userId`:

\`\`\`typescript
// Example: Get all clients for a user
const clients = await clientModel.findAll({ userId: user.userId })
\`\`\`

---

## 6. API Routes

### Standard Response Format
\`\`\`typescript
// Success
{
  success: true,
  data: { ... },
  message?: string
}

// Error
{
  success: false,
  error: string,
  code?: string
}
\`\`\`

### Authentication Middleware
\`\`\`typescript
// lib/api-auth.ts
export function withAuth(handler: Function) {
  return async (req: Request) => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const payload = await verifyToken(token)
    return handler(req, payload)
  }
}
\`\`\`

### Example API Route
\`\`\`typescript
// app/api/clients/route.ts
export const GET = withAuth(async (req: Request, user: JWTPayload) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  
  const clients = await clientModel.findAll(
    { userId: user.userId },
    { page, limit }
  )
  
  return NextResponse.json({ success: true, data: clients })
})
\`\`\`

### Rate Limiting
\`\`\`typescript
// lib/rate-limiter.ts
const limiter = new Map()

export function rateLimit(identifier: string, limit = 100, window = 60000) {
  const now = Date.now()
  const userRequests = limiter.get(identifier) || []
  
  const recentRequests = userRequests.filter(
    (time: number) => now - time < window
  )
  
  if (recentRequests.length >= limit) {
    return false
  }
  
  recentRequests.push(now)
  limiter.set(identifier, recentRequests)
  return true
}
\`\`\`

---

## 7. Frontend Architecture

### Component Structure
\`\`\`
components/
├── ui/                    # Reusable UI components (shadcn)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── dashboard/             # Dashboard-specific components
│   ├── dashboard-header.tsx
│   ├── dashboard-sidebar.tsx
│   └── ...
├── auth/                  # Authentication components
│   ├── user-context.tsx
│   └── ...
└── [feature]/             # Feature-specific components
    ├── client-list.tsx
    ├── client-form.tsx
    └── ...
\`\`\`

### State Management

#### User Context
\`\`\`typescript
// components/auth/user-context.tsx
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      const payload = decodeToken(token)
      setUser(payload)
    }
    setLoading(false)
  }, [])
  
  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}
\`\`\`

#### Data Fetching with SWR
\`\`\`typescript
import useSWR from 'swr'

const fetcher = async (url: string) => {
  const token = getAccessToken()
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export function useClients() {
  const { data, error, mutate } = useSWR('/api/clients', fetcher)
  
  return {
    clients: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  }
}
\`\`\`

### Form Handling
\`\`\`typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
})

export function ClientForm() {
  const form = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', email: '', phone: '' }
  })
  
  const onSubmit = async (data) => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(data)
    })
    // Handle response
  }
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
\`\`\`

---

## 8. Performance Optimization

### Caching Strategy
\`\`\`typescript
// lib/cache.ts
class Cache {
  private cache = new Map()
  
  set(key: string, value: any, ttl = 300000) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    })
  }
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }
}
\`\`\`

### Pagination
All list endpoints support pagination:
\`\`\`typescript
GET /api/clients?page=1&limit=20
\`\`\`

### Database Indexes
Indexes are automatically created on:
- `userId` (all collections)
- `email` (users, clients, vendors)
- `receiptNumber`, `quotationNumber`, `paymentNumber` (unique)
- `date`, `createdAt` (descending for sorting)

### Image Optimization
- Next.js Image component for automatic optimization
- Vercel Blob for file storage with CDN
- Lazy loading for images below the fold

---

## 9. Error Handling

### Error Classes
\`\`\`typescript
// lib/error-handler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}
\`\`\`

### Global Error Handler
\`\`\`typescript
export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }
  
  logger.error('Unhandled error:', error)
  
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}
\`\`\`

---

## 10. Logging & Monitoring

### Logger Implementation
\`\`\`typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      meta,
      timestamp: new Date().toISOString()
    }))
  },
  
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    }))
  }
}
\`\`\`

### Activity Logging
All mutations are logged to `activity_logs` collection:
\`\`\`typescript
await logActivity({
  userId: user.userId,
  action: 'CREATE_CLIENT',
  entity: 'client',
  entityId: client._id,
  details: { name: client.name }
})
\`\`\`

### Health Check
\`\`\`typescript
// app/api/health/route.ts
export async function GET() {
  const dbStatus = await checkDatabaseConnection()
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected'
  })
}
\`\`\`

---

## 11. Testing Strategy

### Unit Tests
\`\`\`typescript
// __tests__/lib/jwt.test.ts
import { generateToken, verifyToken } from '@/lib/jwt'

describe('JWT', () => {
  it('should generate and verify token', async () => {
    const payload = { userId: '123', email: 'test@example.com' }
    const token = await generateToken(payload)
    const decoded = await verifyToken(token)
    
    expect(decoded.userId).toBe('123')
  })
})
\`\`\`

### Integration Tests
\`\`\`typescript
// __tests__/api/clients.test.ts
import { POST } from '@/app/api/clients/route'

describe('POST /api/clients', () => {
  it('should create a client', async () => {
    const req = new Request('http://localhost/api/clients', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token' },
      body: JSON.stringify({ name: 'Test Client', email: 'test@example.com' })
    })
    
    const res = await POST(req)
    const data = await res.json()
    
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('Test Client')
  })
})
\`\`\`

### E2E Tests
Use Playwright for end-to-end testing:
\`\`\`typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can sign in', async ({ page }) => {
  await page.goto('/signin')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
})
\`\`\`

---

## 12. Deployment

### Environment Variables
\`\`\`env
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your-secret-key-min-32-characters

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
\`\`\`

### Build Process
\`\`\`bash
# Install dependencies
npm install

# Build application
npm run build

# Start production server
npm start
\`\`\`

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push to main branch
4. Preview deployments for pull requests

### Database Initialization
\`\`\`bash
# Initialize database (create indexes, seed data)
POST /api/init-db
\`\`\`

---

## 13. Security Best Practices

### Input Validation
- All inputs validated with Zod schemas
- SQL injection prevention (MongoDB parameterized queries)
- XSS prevention (React auto-escaping)

### Authentication
- JWT tokens with short expiry (15 minutes)
- Refresh tokens for extended sessions
- Password hashing with bcrypt (10 rounds)

### Authorization
- Middleware checks on all protected routes
- User ID filtering on all queries (multi-tenancy)
- Role-based access control (RBAC)

### Data Protection
- HTTPS only (enforced by Vercel)
- Environment variables for secrets
- No sensitive data in logs

---

## 14. Development Workflow

### Local Development
\`\`\`bash
# Clone repository
git clone <repo-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Open http://localhost:3000
\`\`\`

### Git Workflow
1. Create feature branch from `main`
2. Make changes and commit
3. Push branch and create pull request
4. Code review and approval
5. Merge to `main`
6. Automatic deployment to production

### Code Style
- ESLint for linting
- Prettier for formatting
- TypeScript strict mode
- Conventional commits

---

## 15. API Documentation

### Authentication Endpoints

#### POST /api/auth/signin
Sign in with email and password.

**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "user": {
      "userId": "123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
\`\`\`

#### POST /api/auth/signup
Create a new user account.

**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
\`\`\`

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request:**
\`\`\`json
{
  "refreshToken": "eyJhbGc..."
}
\`\`\`

### Client Endpoints

#### GET /api/clients
Get all clients for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by name or email

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "clients": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
\`\`\`

#### POST /api/clients
Create a new client.

**Request:**
\`\`\`json
{
  "name": "Client Name",
  "email": "client@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "city": "City",
  "state": "State",
  "pincode": "123456",
  "gstin": "GST123",
  "pan": "PAN123"
}
\`\`\`

#### GET /api/clients/[id]
Get a specific client by ID.

#### PUT /api/clients/[id]
Update a client.

#### DELETE /api/clients/[id]
Delete a client.

### Receipt Endpoints

#### GET /api/receipts
Get all receipts for the authenticated user.

#### POST /api/receipts
Create a new receipt.

**Request:**
\`\`\`json
{
  "clientId": "client-id",
  "date": "2024-01-01",
  "dueDate": "2024-01-31",
  "items": [
    {
      "itemId": "item-id",
      "name": "Item Name",
      "quantity": 2,
      "price": 100,
      "taxRate": 18
    }
  ],
  "notes": "Thank you for your business",
  "terms": "Payment due within 30 days"
}
\`\`\`

#### GET /api/receipts/[id]
Get a specific receipt by ID.

#### PUT /api/receipts/[id]
Update a receipt.

#### DELETE /api/receipts/[id]
Delete a receipt.

### Similar patterns for:
- Quotations (`/api/quotations`)
- Payments (`/api/payments`)
- Vendors (`/api/vendors`)
- Items (`/api/items`)

---

## 16. Troubleshooting

### Common Issues

#### Database Connection Errors
\`\`\`
Error: MongoServerError: Authentication failed
\`\`\`
**Solution**: Check `MONGODB_URI` environment variable

#### JWT Verification Errors
\`\`\`
Error: Invalid token
\`\`\`
**Solution**: Token expired or invalid. Refresh token or re-authenticate.

#### CORS Errors
**Solution**: Ensure API routes return proper CORS headers (handled by Next.js)

### Debug Mode
Enable debug logging:
\`\`\`typescript
// Set in environment
DEBUG=true

// Use in code
if (process.env.DEBUG) {
  console.log('[DEBUG]', data)
}
\`\`\`

---

## 17. Performance Benchmarks

### Target Metrics
- **API Response Time**: < 200ms (p95)
- **Page Load Time**: < 2s (p95)
- **Database Query Time**: < 50ms (p95)
- **Concurrent Users**: 10,000+
- **Requests per Second**: 1,000+

### Monitoring
- Use `/api/health` for health checks
- Use `/api/metrics` for performance metrics
- Monitor Vercel Analytics dashboard
- Set up alerts for slow queries

---

## 18. Future Enhancements

### Planned Features
1. **Email Integration**: SendGrid/Resend for transactional emails
2. **PDF Templates**: Customizable receipt/quotation templates
3. **Multi-Currency**: Support for multiple currencies
4. **Recurring Receipts**: Automatic recurring invoices
5. **Payment Gateway**: Direct payment collection
6. **Mobile App**: React Native mobile application
7. **API Access**: Public API for integrations
8. **Webhooks**: Real-time event notifications
9. **Advanced Analytics**: AI-powered insights
10. **White-Labeling**: Custom branding for enterprise

### Technical Debt
- Add comprehensive test coverage (target: 80%)
- Implement Redis for distributed caching
- Add database migration system
- Improve error messages and user feedback
- Add request/response logging
- Implement feature flags

---

## 19. Contributing

### Code Review Checklist
- [ ] Code follows TypeScript best practices
- [ ] All functions have proper type definitions
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] Performance considered

### Pull Request Template
\`\`\`markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
\`\`\`

---

## 20. Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [MongoDB Docs](https://docs.mongodb.com)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Internal Resources
- Architecture diagrams: `/docs/architecture/`
- API documentation: `/docs/api/`
- Database schema: `/docs/DATABASE_SCHEMA.md`
- Deployment guide: `/DEPLOYMENT.md`

### Contact
- **Technical Lead**: tech@platform.com
- **DevOps**: devops@platform.com
- **Support**: support@platform.com

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
\`\`\`

I'll continue with the remaining documentation files in the next message.
