"use client"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, CreditCard, Shield, Zap, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/lib/toast"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function TrialPaymentPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  useEffect(() => {
    if (!email) {
      router.push("/signup")
    }
  }, [email, router])

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => {
      console.log("[v0] Razorpay script loaded successfully")
      setScriptLoaded(true)
    }
    script.onerror = () => {
      console.error("[v0] Failed to load Razorpay script")
      setError("Failed to load payment gateway. Please refresh the page.")
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handlePayment = async () => {
    if (!scriptLoaded) {
      setError("Payment gateway is still loading. Please wait.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const options = {
        key: "rzp_test_RVhlVFbaKUJJDH", // Test Key ID
        amount: 100, // ₹1 in paise
        currency: "INR",
        name: "SaaS Platform",
        description: "Trial Verification Payment (Refunded Instantly)",
        image: "/images/prantek-logo.png",
        prefill: {
          email: email || "",
        },
        theme: {
          color: "#3b82f6",
        },

        handler: (response: any) => {
          console.log("[v0] Trial payment successful:", response)
          handlePaymentSuccess(response)
        },

        modal: {
          ondismiss: () => {
            console.log("[v0] Payment modal closed")
            setLoading(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on("payment.failed", (response: any) => {
        console.error("[v0] Payment failed:", response.error)
        setError(`Payment failed: ${response.error.description}`)
        toast.error("Payment verification failed. Please try again.")
        setLoading(false)
      })

      razorpay.open()
    } catch (err) {
      console.error("[v0] Payment error:", err)
      setError("Failed to initiate payment. Please try again.")
      toast.error("Failed to initiate payment. Please try again.")
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (response: any) => {
    console.log("[v0] Processing trial payment success...")

    localStorage.setItem(
      "trialPaymentDetails",
      JSON.stringify({
        paymentId: response.razorpay_payment_id,
        email,
        amount: 1,
        timestamp: new Date().toISOString(),
      })
    )

    toast.success("Payment verified! Redirecting...")

    setTimeout(() => {
      // ✅ ADDED — proper flow
      router.push("/signup?payment=success&trial=true")
    }, 1000)
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Account</CardTitle>
          <CardDescription>₹1 verification payment (Refunded instantly)</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              This ₹1 payment verifies your payment method and enables auto-pay after your 14-day free trial.
              The amount is refunded instantly.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">14-Day Free Trial</p>
                <p className="text-sm text-gray-600">Full access to all features</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium">Instant Refund</p>
                <p className="text-sm text-gray-600">₹1 returned immediately</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Verification Amount</span>
              <span className="font-bold">₹1.00</span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span>Instant Refund</span>
              <span className="font-bold">-₹1.00</span>
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between items-center">
              <span className="font-bold">Total Charge</span>
              <span className="font-bold text-lg">₹0.00</span>
            </div>
          </div>

          <Button onClick={handlePayment} className="w-full" size="lg" disabled={loading || !scriptLoaded}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : !scriptLoaded ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Payment Gateway...
              </>
            ) : (
              "Verify & Start Free Trial"
            )}
          </Button>

          <div className="text-center text-xs text-gray-500">
            <p>🔒 Secure payment powered by Razorpay</p>
            <p className="mt-1">Test Mode: Use test cards for payment</p>
          </div>

          <p className="text-xs text-center text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Cancel anytime during the trial period.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
