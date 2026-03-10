# Razorpay Subscription Management

This document describes the subscription management system added to the Next.js app.

## Environment Variables

Add to `.env.local` (and production):

```env
# Existing
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# Webhook signature verification (create in Razorpay Dashboard → Webhooks)
RAZORPAY_WEBHOOK_SECRET=xxx

# Optional: for cron sync (scheduled job)
CRON_SECRET=xxx
```

## 1. Database

- **Collection `subscriptions`**: One document per Razorpay subscription.
  - Fields: `userId`, `planId`, `razorpayCustomerId`, `razorpaySubscriptionId`, `status`, `currentPeriodStart`, `currentPeriodEnd`, `nextBillingDate`, `autoDebitEnabled`, `createdAt`, `updatedAt`.
  - Status: `created` | `active` | `pending` | `past_due` | `cancelled` | `expired`.
- **Collection `payment_history`**: Used for subscription payments (webhook and cron write here).
- **User document**: Optional `razorpaySubscriptionId`; existing `subscriptionStatus`, `subscriptionEndDate`, etc. are kept in sync by webhooks and sync job.

## 2. API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/razorpay/webhook` | POST | Razorpay webhook; verifies signature; handles `subscription.activated`, `invoice.paid`, `invoice.payment_failed`, `subscription.cancelled`, `subscription.completed`. |
| `/api/user/subscription` | GET | Current user’s subscription (plan, status, autoDebit, nextBillingDate, daysRemaining, paymentHistory). |
| `/api/user/subscription/cancel` | POST | Cancel current user’s subscription (at cycle end). |
| `/api/razorpay/create-subscription` | POST | Create Razorpay customer + plan + subscription; returns `subscriptionId` and `shortUrl` for subscription Checkout. |
| `/api/admin/subscriptions` | GET | Super admin: list all subscriptions (DB + users with plans). |
| `/api/admin/subscriptions/cancel` | POST | Super admin: cancel by `userId` or `razorpaySubscriptionId`. |
| `/api/admin/subscriptions/sync` | POST | Super admin: sync all subscription statuses from Razorpay. |
| `/api/cron/sync-subscriptions` | GET | Cron: same sync; secured with `Authorization: Bearer CRON_SECRET`. |

## 3. Subscription Middleware

- **File**: `lib/check-subscription.ts`
- **Usage**: In any API route after `withAuth`, call `hasActiveSubscription(user.userId)`. If `false`, return `subscriptionRequiredResponse()` (403 with message "Subscription required").
- **Logic**: Super-admin always allowed; otherwise checks user `subscriptionStatus` and `subscriptionEndDate`, and optional `subscriptions` document.

## 4. User Dashboard

- **Profile** (`/dashboard/profile`): Subscription section shows:
  - Current plan, status, billing type (Auto Debit / Manual), next billing date, days remaining.
  - Payment history table (last 10).
  - “Cancel subscription” when status is active and auto-debit is on.

## 5. Super Admin Panel

- **Subscription Management** (`/super-admin/subscription-management`): Table of users with plan/subscription: User, Plan, Subscription ID, Status, Auto Debit, Next Billing, Last Payment; actions: View (link to Razorpay), Cancel, “Sync with Razorpay” (calls sync job).
- **Trial Status** (`/super-admin/trial-status`): Trial end dates and auto-debit readiness (existing).

## 6. Webhook Setup

1. Razorpay Dashboard → Webhooks → Add endpoint: `https://your-domain.com/api/razorpay/webhook`.
2. Select events: `subscription.activated`, `invoice.paid`, `invoice.payment_failed`, `subscription.cancelled`, `subscription.completed`.
3. Copy the signing secret into `RAZORPAY_WEBHOOK_SECRET`.

## 7. Auto-Debit (Saved Card) in Real Payments

For auto-debit to work after the first payment:

1. **Tokenisation on Razorpay**: Request Razorpay Support to enable **Saved Cards / Tokenisation** on your account (and enable **Flash Checkout** in Dashboard if needed). Without this, payments may not return `token_id`/`customer_id`.
2. **Checkout with customer + order**: The signup payment page calls `POST /api/razorpay/create-checkout` with `amount`, `name`, `email` to create a Razorpay customer and order, then opens Checkout with `order_id` and `customer_id`. That lets the customer choose “Save card securely for future payments”; the payment then includes `token_id` and `customer_id`, which the backend stores for trial-end auto-debit.
3. **Backend**: `register` and `verify-and-create-account` already fetch payment details and store `razorpayCustomerId` and `razorpayTokenId` when present.

## 8. Registration Flow

- **Existing flow**: One-time payment → register with `paymentId` → backend stores `razorpayCustomerId` and `razorpayTokenId`; optional `razorpaySubscriptionId` and subscription record.
- **Subscription flow**: Call `POST /api/razorpay/create-subscription` with `planId`, `name`, `email` (and optional `userId`); use returned `subscriptionId` or `shortUrl` to open Razorpay Subscription Checkout. After payment, register (or verify-and-create-account) with `razorpaySubscriptionId` in the body; backend creates a subscription document with status `created`. Webhook `subscription.activated` sets status to `active` and updates user.

## 9. Testing (Razorpay Test Mode)

1. Register a new user (with or without subscription flow).
2. If using subscription flow: create subscription via API, complete authorization payment in Checkout.
3. In Dashboard, configure webhook URL (use ngrok for local: `https://xxx.ngrok.io/api/razorpay/webhook`).
4. Trigger `subscription.activated` (or complete first payment); confirm dashboard shows active plan and next billing date.
5. Trigger `invoice.paid` (e.g. next cycle or test trigger); confirm next billing date and payment history update.
6. Super admin: open Subscription Management, run “Sync with Razorpay”, cancel a test subscription.

## 10. Cron (Optional)

Schedule `GET /api/cron/sync-subscriptions` with header `Authorization: Bearer YOUR_CRON_SECRET` (e.g. daily) to reconcile DB with Razorpay and handle missed webhooks.
