import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"
import { verifyWebhookSignature } from "@/lib/razorpay"
import { ObjectId } from "mongodb"

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get("x-razorpay-signature") ?? ""

  if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
    console.warn("[Razorpay Webhook] Invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: { event: string; payload: any }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const db = await connectDB()
  const subscriptionsCol = db.collection(Collections.SUBSCRIPTIONS)
  const usersCol = db.collection(Collections.USERS)
  const paymentHistoryCol = db.collection(Collections.PAYMENT_HISTORY)

  try {
    switch (event.event) {
      case "subscription.activated": {
        const sub = event.payload?.subscription?.entity
        if (!sub?.id) break
        const notes = sub.notes || {}
        const userId = notes.user_id || notes.userId
        const planId = notes.plan_id || notes.planId

        const now = new Date()
        await subscriptionsCol.updateOne(
          { razorpaySubscriptionId: sub.id },
          {
            $set: {
              status: "active",
              autoDebitEnabled: true,
              currentPeriodStart: sub.current_start ? new Date(sub.current_start * 1000) : undefined,
              currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : undefined,
              nextBillingDate: sub.current_end ? new Date(sub.current_end * 1000) : undefined,
              updatedAt: now,
            },
            $setOnInsert: {
              userId: userId ?? "",
              planId: planId ?? "",
              razorpayCustomerId: sub.customer_id ?? "",
              razorpaySubscriptionId: sub.id,
              createdAt: now,
              autoDebitEnabled: true,
            },
          },
          { upsert: true }
        )

        if (userId) {
          await usersCol.updateOne(
            { _id: new ObjectId(userId) },
            {
              $set: {
                subscriptionStatus: "active",
                subscriptionStartDate: sub.current_start ? new Date(sub.current_start * 1000) : new Date(),
                subscriptionEndDate: sub.current_end ? new Date(sub.current_end * 1000) : undefined,
                updatedAt: new Date(),
              },
            }
          )
        }
        break
      }

      case "invoice.paid": {
        const invoice = event.payload?.invoice?.entity
        const payment = event.payload?.payment?.entity
        const subEntity = event.payload?.subscription?.entity
        if (!invoice?.id || !payment?.id) break

        const subId = invoice.subscription_id || subEntity?.id
        if (subId) {
          await subscriptionsCol.updateOne(
            { razorpaySubscriptionId: subId },
            {
              $set: {
                status: "active",
                razorpayPaymentId: payment.id,
                currentPeriodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
                currentPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
                nextBillingDate: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
                updatedAt: new Date(),
              },
            }
          )
        }

        const subDoc = subId ? await subscriptionsCol.findOne({ razorpaySubscriptionId: subId }) : null
        if (subDoc?.userId) {
          await usersCol.updateOne(
            { _id: new ObjectId(subDoc.userId) },
            {
              $set: {
                subscriptionStatus: "active",
                lastPaymentDate: new Date((payment as any).created_at * 1000),
                nextPaymentDate: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
                subscriptionEndDate: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
                updatedAt: new Date(),
              },
            }
          )
          await paymentHistoryCol.insertOne({
            userId: subDoc.userId,
            razorpayPaymentId: payment.id,
            razorpaySubscriptionId: subId,
            razorpayInvoiceId: invoice.id,
            amount: (payment as any).amount / 100,
            currency: (payment as any).currency || "INR",
            status: "success",
            paymentDate: new Date((payment as any).created_at * 1000),
            createdAt: new Date(),
          })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.payload?.invoice?.entity
        const subEntity = event.payload?.subscription?.entity
        const subId = invoice?.subscription_id || subEntity?.id
        if (!subId) break

        await subscriptionsCol.updateOne(
          { razorpaySubscriptionId: subId },
          { $set: { status: "past_due", updatedAt: new Date() } }
        )

        const subDoc = await subscriptionsCol.findOne({ razorpaySubscriptionId: subId })
        if (subDoc?.userId) {
          await usersCol.updateOne(
            { _id: new ObjectId(subDoc.userId) },
            {
              $set: {
                subscriptionStatus: "payment_failed",
                paymentFailedAt: new Date(),
                paymentFailureReason: (event.payload?.payment?.entity as any)?.error_description || "Invoice payment failed",
                updatedAt: new Date(),
              },
            }
          )
        }
        break
      }

      case "subscription.cancelled": {
        const sub = event.payload?.subscription?.entity
        if (!sub?.id) break

        await subscriptionsCol.updateOne(
          { razorpaySubscriptionId: sub.id },
          { $set: { status: "cancelled", autoDebitEnabled: false, updatedAt: new Date() } }
        )

        const subDoc = await subscriptionsCol.findOne({ razorpaySubscriptionId: sub.id })
        if (subDoc?.userId) {
          await usersCol.updateOne(
            { _id: new ObjectId(subDoc.userId) },
            { $set: { subscriptionStatus: "cancelled", updatedAt: new Date() } }
          )
        }
        break
      }

      case "subscription.completed": {
        const sub = event.payload?.subscription?.entity
        if (!sub?.id) break

        await subscriptionsCol.updateOne(
          { razorpaySubscriptionId: sub.id },
          { $set: { status: "expired", autoDebitEnabled: false, updatedAt: new Date() } }
        )

        const subDoc = await subscriptionsCol.findOne({ razorpaySubscriptionId: sub.id })
        if (subDoc?.userId) {
          await usersCol.updateOne(
            { _id: new ObjectId(subDoc.userId) },
            { $set: { subscriptionStatus: "expired", updatedAt: new Date() } }
          )
        }
        break
      }

      default:
        // Ignore unhandled events
        break
    }
  } catch (err) {
    console.error("[Razorpay Webhook] Handler error:", err)
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
