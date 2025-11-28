import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Collections } from "@/lib/db-config"

/**
 * Razorpay Refund API
 * Processes instant refund for ₹1 verification payment
 */
export async function POST(req: NextRequest) {
  try {
    const { paymentId, amount = 100, reason = "Payment verification completed" } = await req.json()

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      )
    }

    // Razorpay credentials (use environment variables in production)
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_RVhlVFbaKUJJDH"
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "your_test_secret_key"
    
    // Create Basic Auth header
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    // Call Razorpay Refund API
    const refundResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount, // Amount in paise (100 paise = ₹1)
          speed: "optimum", // Instant refund
          notes: {
            reason: reason,
            refund_type: "verification_payment"
          }
        }),
      }
    )

    const refundData = await refundResponse.json()

    if (!refundResponse.ok) {
      console.error("Razorpay refund failed:", refundData)
      return NextResponse.json(
        { 
          success: false, 
          error: refundData.error?.description || "Refund failed",
          details: refundData
        },
        { status: refundResponse.status }
      )
    }

    // Log refund in database
    const db = await connectDB()
    await db.collection("payment_refunds").insertOne({
      paymentId: paymentId,
      refundId: refundData.id,
      amount: amount,
      status: refundData.status,
      reason: reason,
      razorpayResponse: refundData,
      createdAt: new Date(),
    })

    console.log(`✅ Refund processed successfully: ${refundData.id}`)

    return NextResponse.json({
      success: true,
      message: "Refund processed successfully",
      refund: {
        id: refundData.id,
        amount: refundData.amount,
        status: refundData.status,
        paymentId: refundData.payment_id,
      }
    })

  } catch (error: any) {
    console.error("Refund API error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Get refund status
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const refundId = searchParams.get("refundId")
    const paymentId = searchParams.get("paymentId")

    if (!refundId && !paymentId) {
      return NextResponse.json(
        { success: false, error: "Refund ID or Payment ID is required" },
        { status: 400 }
      )
    }

    const db = await connectDB()
    
    const query = refundId 
      ? { refundId } 
      : { paymentId }
    
    const refund = await db.collection("payment_refunds").findOne(query)

    if (!refund) {
      return NextResponse.json(
        { success: false, error: "Refund not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.refundId,
        paymentId: refund.paymentId,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason,
        createdAt: refund.createdAt,
      }
    })

  } catch (error: any) {
    console.error("Get refund status error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
