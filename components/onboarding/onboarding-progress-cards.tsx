"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Building2, Users, Settings, Package, CheckCircle2, ArrowRight, Loader2, Sparkles, Lock } from "lucide-react"
import { useOnboarding } from "./onboarding-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"

export function OnboardingProgressCards() {
  const { progress, getCompletionPercentage, setCurrentStep, isOnboardingComplete, updateProgress } = useOnboarding()
  const router = useRouter()
  const [realData, setRealData] = useState({
    hasCompany: false,
    clientsCount: 0,
    categoriesCount: 0,
    taxRatesCount: 0,
    paymentMethodsCount: 0,
    itemsCount: 0,
  })
  const [loading, setLoading] = useState(true)

  // Fetch real data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [company, clients, categories, taxRates, paymentMethods, items] = await Promise.all([
          api.company.get().catch(() => null),
          api.clients.getAll().catch(() => []),
          api.paymentCategories.getAll().catch(() => []),
          api.taxRates.getAll().catch(() => []),
          api.paymentMethods.getAll().catch(() => []),
          api.items.getAll().catch(() => []),
        ])

        const newData = {
          hasCompany: !!company?.companyName,
          clientsCount: clients?.length || 0,
          categoriesCount: categories?.length || 0,
          taxRatesCount: taxRates?.length || 0,
          paymentMethodsCount: paymentMethods?.length || 0,
          itemsCount: items?.length || 0,
        }

        setRealData(newData)

        // Auto-update progress based on real data
        if (newData.hasCompany) updateProgress("companyInfo", true)
        if (newData.clientsCount > 0) updateProgress("clients", true)
        if (newData.categoriesCount > 0 || newData.taxRatesCount > 0 || newData.paymentMethodsCount > 0) {
          updateProgress("basicSettings", true)
        }
        if (newData.itemsCount > 0) updateProgress("products", true)

        setLoading(false)
      } catch (error) {
        console.error("Error fetching onboarding data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Show cards if any step is incomplete based on real data
  const hasIncompleteSteps = !realData.hasCompany || 
                             realData.clientsCount === 0 || 
                             (realData.categoriesCount === 0 && realData.taxRatesCount === 0 && realData.paymentMethodsCount === 0) || 
                             realData.itemsCount === 0

  console.log('[Onboarding] Real data:', realData)
  console.log('[Onboarding] Has incomplete steps:', hasIncompleteSteps)
  console.log('[Onboarding] Progress:', progress)
  console.log('[Onboarding] Is complete:', isOnboardingComplete)

  // Always show during loading or if there are incomplete steps
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-12 w-12 bg-gray-200 rounded-xl mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Don't show if all data exists and onboarding is complete
  if (!hasIncompleteSteps && isOnboardingComplete) return null

  const completionPercentage = getCompletionPercentage()
  const completedCount = Object.values(progress).filter((v) => v).length

  // Sequential access control
  const canAccessCard = (card: any) => {
    if (card.title === "Company Profile") return true
    if (card.title === "Basic Settings") return progress.companyInfo
    if (card.title === "Clients") return progress.companyInfo && progress.basicSettings
    if (card.title === "Products/Services") return progress.companyInfo && progress.basicSettings && progress.clients
    return false
  }

  const cards = [
    {
      title: "Company Profile",
      icon: Building2,
      completed: progress.companyInfo,
      action: () => setCurrentStep(1),
      link: "/dashboard/settings/company",
      color: "blue",
      data: realData.hasCompany ? "✓ Profile Complete" : "Profile Missing",
      count: realData.hasCompany ? 1 : 0,
      total: 1,
      buttonText: "Complete Setup",
    },
    {
      title: "Basic Settings",
      icon: Settings,
      completed: progress.basicSettings,
      action: () => setCurrentStep(3),
      link: "/dashboard/settings/tax",
      color: "purple",
      data: [
        realData.categoriesCount > 0 && `${realData.categoriesCount} category`,
        realData.taxRatesCount > 0 && `${realData.taxRatesCount} tax`,
        realData.paymentMethodsCount > 0 && `${realData.paymentMethodsCount} method`,
      ].filter(Boolean).join(', ') || 'Not configured',
      count: realData.categoriesCount + realData.taxRatesCount + realData.paymentMethodsCount,
      total: null,
      buttonText: "Complete Setup",
    },
    {
      title: "Clients",
      icon: Users,
      completed: progress.clients,
      action: () => setCurrentStep(2),
      link: "/dashboard/clients",
      color: "green",
      data: `${realData.clientsCount} client${realData.clientsCount !== 1 ? 's' : ''}`,
      count: realData.clientsCount,
      total: null,
      buttonText: "Create Client",
    },
    {
      title: "Products/Services",
      icon: Package,
      completed: progress.products,
      action: () => setCurrentStep(4),
      link: "/dashboard/settings/items",
      color: "orange",
      data: `${realData.itemsCount} item${realData.itemsCount !== 1 ? 's' : ''}`,
      count: realData.itemsCount,
      total: null,
      buttonText: "Create Product",
    },
  ]

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      progress: "bg-blue-600",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "text-green-600",
      progress: "bg-green-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "text-purple-600",
      progress: "bg-purple-600",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "text-orange-600",
      progress: "bg-orange-600",
    },
  }

  return (
    <div className="space-y-4">
      {/* Individual Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          const colors = colorClasses[card.color as keyof typeof colorClasses]

          const isLocked = !canAccessCard(card)

          return (
            <Card
              key={card.title}
              className={`relative overflow-hidden transition-all duration-300 ${
                card.completed 
                  ? "border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 animate-in fade-in zoom-in duration-500 hover:shadow-lg" 
                  : isLocked
                  ? "border border-gray-200 bg-gray-50 opacity-60"
                  : `border ${colors.border} ${colors.bg} hover:shadow-lg`
              }`}
            >
              {/* Locked Overlay */}
              {isLocked && !card.completed && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-gray-500 text-white p-1.5 rounded-full shadow-md">
                    <Lock className="h-3 w-3" />
                  </div>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className={`rounded-xl ${card.completed ? "bg-green-500 shadow-lg shadow-green-500/50" : "bg-white shadow-sm"} p-3 transition-all duration-300`}>
                    <Icon className={`h-5 w-5 ${card.completed ? "text-white" : colors.icon}`} />
                  </div>
                  
                  {/* Status Indicator */}
                  {card.completed ? (
                    <div className="flex items-center gap-1 animate-in slide-in-from-right duration-500">
                      <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  ) : isLocked ? (
                    <div className="flex items-center gap-1">
                      <Lock className="h-4 w-4 text-gray-400" />
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Locked</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">In Progress</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-sm font-semibold text-gray-900">
                  {card.title}
                </CardTitle>
                <p className="text-xs text-gray-600 mt-1">{card.data}</p>
              </CardHeader>
              <CardContent className="pt-0">
                {card.completed ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Achievement Unlocked!
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 border-green-300 hover:bg-green-50"
                      onClick={() => router.push(card.link)}
                    >
                      View Details
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {loading ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <>
                        {isLocked && (
                          <p className="text-[10px] text-gray-500 text-center mb-2">
                            Complete previous steps to unlock
                          </p>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          className={`w-full text-xs h-8 bg-gradient-to-r ${colors.progress} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                          onClick={card.action}
                          disabled={isLocked}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </>
                          ) : (
                            <>
                              {card.buttonText}
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
