"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react"
import { toast } from "sonner"
import { PLAN_FEATURE_KEYS, PLAN_FEATURE_LABELS, PLAN_FEATURE_DESCRIPTIONS, type PlanFeatures } from "@/lib/models/types"

interface Plan {
  _id: string
  id?: string
  name: string
  order?: number
  isActive: boolean
  planFeatures?: PlanFeatures
}

export default function PlanFeatureMatrix() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch("/api/subscription-plans")
      const data = await response.json()
      
      if (data.success) {
        const sortedPlans = (data.data || data.plans || []).filter((plan: Plan) => plan.isActive).sort((a: Plan, b: Plan) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order
          }
          return a.name.localeCompare(b.name)
        })
        setPlans(sortedPlans)
      } else {
        toast.error("Failed to load subscription plans")
      }
    } catch (error) {
      console.error("Error loading plans:", error)
      toast.error("Error loading subscription plans")
    } finally {
      setLoading(false)
    }
  }

  const isEnterprisePlan = (plan: Plan): boolean => {
    return plan.name?.toLowerCase().includes('enterprise') || false
  }

  const handleToggleFeature = async (planId: string, featureKey: keyof PlanFeatures, currentValue: boolean) => {
    const cellKey = `${planId}-${featureKey}`
    setUpdating(cellKey)

    try {
      const response = await fetch("/api/subscription-plans/features", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          featureKey,
          enabled: !currentValue,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPlans(plans.map(plan => {
          if ((plan._id || plan.id) === planId) {
            return {
              ...plan,
              planFeatures: {
                ...plan.planFeatures,
                [featureKey]: !currentValue,
              } as PlanFeatures,
            }
          }
          return plan
        }))
        
        toast.success(result.message || "Feature updated successfully")
      } else {
        toast.error(result.error || "Failed to update feature")
      }
    } catch (error) {
      console.error("Error updating feature:", error)
      toast.error("Error updating feature")
    } finally {
      setUpdating(null)
    }
  }

  const getFeatureValue = (plan: Plan, featureKey: keyof PlanFeatures): boolean => {
    // Always read from database - no hardcoded defaults
    return plan.planFeatures?.[featureKey] === true
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="py-12">
          <div className="text-center text-slate-400">
            No subscription plans found. Create plans first to manage features.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Plan Feature Configuration
        </CardTitle>
        <CardDescription className="text-slate-400">
          Control feature access for each subscription plan. Toggle features on/off for each plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-white font-semibold sticky left-0 bg-slate-800 z-10">
                  Feature
                </th>
                {plans.map((plan) => (
                  <th key={plan._id || plan.id} className="text-center p-4 min-w-[150px]">
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-white font-semibold">{plan.name}</span>
                      <Badge 
                        variant={plan.isActive ? "default" : "secondary"}
                        className={plan.isActive ? "bg-green-600" : "bg-slate-600"}
                      >
                        {plan.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURE_KEYS.map((featureKey) => (
                <tr key={featureKey} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 sticky left-0 bg-slate-800 z-10">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">
                        {PLAN_FEATURE_LABELS[featureKey]}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        {featureKey}
                      </span>
                    </div>
                  </td>
                  {plans.map((plan) => {
                    const planId = plan._id || plan.id || ""
                    const cellKey = `${planId}-${featureKey}`
                    const isUpdating = updating === cellKey
                    const isEnabled = getFeatureValue(plan, featureKey)
                                        return (
                      <td key={planId} className="p-4 text-center">
                        <div className="flex items-center justify-center">
                          {isUpdating ? (
                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                          ) : (
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => handleToggleFeature(planId, featureKey, isEnabled)}
                              disabled={!plan.isActive}
                              className="data-[state=checked]:bg-green-600"
                            />
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </CardContent>
    </Card>
  )
}
