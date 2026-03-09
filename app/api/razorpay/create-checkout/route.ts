import { NextRequest, NextResponse } from "next/server"
import { createCustomer, createOrder } from "@/lib/razorpay"

/**
 * Creates a Razorpay customer and order for Standard Checkout.
 * Pass the returned order_id and customer_id to Checkout so that
 * "Save card" is enabled and the payment returns token_id + customer_id for auto-debit.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = "INR", receipt, name, email, contact } = body as {
      amount: number
      currency?: string
      receipt?: string
      name: string
      email: string
      contact?: string
    }

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "name and email are required" },
        { status: 400 }
      )
    }

    // amount: in rupees (createOrder converts to paise)
    const amountRupees = typeof amount === "number" ? amount : Number(amount) || 0
    if (amountRupees <= 0) {
      return NextResponse.json(
        { success: false, error: "amount must be a positive number" },
        { status: 400 }
      )
    }

    const customer = await createCustomer({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      contact: contact ? String(contact).trim() : undefined,
    })

    const order = await createOrder(
      amountRupees,
      currency,
      receipt || `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    )

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

    return NextResponse.json({
      success: true,
      orderId: order.id,
      customerId: customer.id,
      key: keyId,
    })
  } catch (error) {
    console.error("[Razorpay create-checkout] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create checkout session",
      },
      { status: 500 }
    )
  }
}
