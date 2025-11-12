"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/components/auth/user-context"
import { toast } from "@/lib/toast"
import { tokenStorage } from "@/lib/token-storage"

export default function TestTrialPage() {
  const { user, refreshUser } = useUser()
  const [loading, setLoading] = useState(false)

  const activateTrial = async (days: number) => {
    setLoading(true)
    try {
      const token = tokenStorage.getAccessToken(false)
      
      const response = await fetch("/api/user/set-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ days })
      })

      const data = await response.json()

      if (data.success) {
        toast({ title: "Success", description: data.message })
        // Refresh user data
        await refreshUser()
        // Force reload to see changes
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast({ title: "Error", description: data.error || "Failed to activate trial", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error activating trial:", error)
      toast({ title: "Error", description: "Failed to activate trial", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trial Mode Test</h1>
        <p className="text-gray-600">Activate trial mode for testing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current User Status</CardTitle>
          <CardDescription>Your subscription information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Name:</strong> {user?.name}</div>
          <div><strong>Subscription Status:</strong> {user?.subscriptionStatus || "N/A"}</div>
          <div><strong>Trial Ends At:</strong> {user?.trialEndsAt ? new Date(user.trialEndsAt).toLocaleString() : "N/A"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activate Trial Period</CardTitle>
          <CardDescription>Set your account to trial mode for testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Button onClick={() => activateTrial(3)} disabled={loading} variant="outline">
              3 Days Trial
            </Button>
            <Button onClick={() => activateTrial(7)} disabled={loading} variant="outline">
              7 Days Trial
            </Button>
            <Button onClick={() => activateTrial(14)} disabled={loading}>
              14 Days Trial
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Click any button to activate trial mode. The page will reload to show the trial alerts.
          </p>
        </CardContent>
      </Card>

      <Card className="border-yellow-300 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-900">⚠️ Testing Only</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-800">
            This page is for testing purposes only. Use it to activate trial mode and test the trial expiry alerts on the dashboard and plans page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
