"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

interface SubscriptionPromptProps {
  title?: string
  message?: string
}

export function SubscriptionPrompt({
  title = "Subscription Required",
  message = "This feature requires an active subscription plan. Please subscribe to continue using this feature."
}: SubscriptionPromptProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button 
            onClick={() => router.push("/dashboard/plans")}
            className="w-full"
          >
            View Subscription Plans
          </Button>
          <Button 
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
