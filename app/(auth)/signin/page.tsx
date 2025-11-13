"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, FileText, CheckCircle2, Info } from "lucide-react"
import { tokenStorage } from "@/lib/token-storage"
import { FeaturesSidebar } from "@/components/auth/features-sidebar"
import { useRouter } from "next/navigation"
import { isSessionValid } from "@/lib/session-timeout"

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Check for session expired error
  useEffect(() => {
    if (searchParams.get('error') === 'session_expired') {
      setSessionExpired(true)
    }
  }, [searchParams])

  // Redirect if already logged in and session is still valid
  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken(false)
    if (accessToken && isSessionValid()) {
      // Show UI alert and redirect
      setAlreadyLoggedIn(true)
      const timer = setTimeout(() => {
        router.replace("/dashboard")
      }, 2000)
      return () => clearTimeout(timer)
    } else if (accessToken && !isSessionValid()) {
      // Session expired, clear tokens
      tokenStorage.clearTokens(false)
      localStorage.removeItem('last_activity')
      localStorage.removeItem('loginedUser')
    }
  }, [router])

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setPaymentSuccess(true)
    }
    if (searchParams.get("registered") === "true") {
      setRegistrationSuccess(true)
    }
  }, [searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const authResult = await response.json()
        console.log("logined user details::",authResult.user);
        localStorage.setItem("loginedUser",JSON.stringify(authResult.user))
        
        // Store JWT tokens (context-aware for regular admin)
        tokenStorage.setAccessToken(authResult.accessToken, false)
        tokenStorage.setRefreshToken(authResult.refreshToken, false)

        // Set last activity timestamp for session tracking
        localStorage.setItem('last_activity', Date.now().toString())

        // Check if this is a new user (from registration redirect)
        if (searchParams.get("registered") === "true" || authResult.isNewUser) {
          localStorage.setItem(`new_user_${authResult.user.id}`, "true")
        }

        // Redirect with full page reload
        window.location.href = "/dashboard"
      } else {
        setError("Invalid email or password")
        setLoading(false)
      }
    } catch (err) {
      console.error("Sign in error:", err)
      setError("An error occurred during sign in")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <FeaturesSidebar />
      
      {/* Right Side - Sign In Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] overflow-y-auto bg-white">
        <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <FileText className="h-10 w-10 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Prantek Fin App</h1>
          </div>

          <h2 className="text-xl font-semibold text-center mb-6 text-gray-700">Sign In to Your Account</h2>

          <form onSubmit={handleSignIn} className="space-y-4">
            {sessionExpired && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Your session has expired due to inactivity. Please sign in again.
                </AlertDescription>
              </Alert>
            )}

            {alreadyLoggedIn && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  You are already logged in. Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}

            {registrationSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Account created successfully! Please sign in to continue.
                </AlertDescription>
              </Alert>
            )}

            {paymentSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Payment successful! Please sign in to access your account.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign Up
            </Link>
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  )
}
