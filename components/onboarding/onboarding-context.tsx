"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useUser } from "@/components/auth/user-context"

export interface OnboardingProgress {
  companyInfo: boolean
 
  basicSettings: boolean
  products: boolean
}

interface OnboardingContextType {
  showWelcome: boolean
  setShowWelcome: (show: boolean) => void
  currentStep: number
  setCurrentStep: (step: number) => void
  progress: OnboardingProgress
  updateProgress: (key: keyof OnboardingProgress, value: boolean) => void
  isOnboardingComplete: boolean
  skipOnboarding: () => void
  startOnboarding: () => void
  completeOnboarding: () => void
  getCompletionPercentage: () => number
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [showWelcome, setShowWelcome] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState<OnboardingProgress>({
    companyInfo: false,
  
    basicSettings: false,
    products: false,
  })

  // Check if user is new and hasn't completed onboarding
  useEffect(() => {
    if (user) {
      const onboardingData = localStorage.getItem(`onboarding_${user.id}`)
      if (onboardingData) {
        const data = JSON.parse(onboardingData)
        setProgress(data.progress || progress)
        setShowWelcome(data.showWelcome || false)
      } else {
        // New user - check if they just signed up
        const isNewUser = localStorage.getItem(`new_user_${user.id}`)
        if (isNewUser === "true") {
          setShowWelcome(false)
          localStorage.removeItem(`new_user_${user.id}`)
        }
      }
    }
  }, [user])

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      const onboardingData = {
        progress,
        showWelcome,
        completedAt: isOnboardingComplete ? new Date().toISOString() : null,
      }
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(onboardingData))
    }
  }, [progress, showWelcome, user])

  const updateProgress = (key: keyof OnboardingProgress, value: boolean) => {
    setProgress((prev) => ({ ...prev, [key]: value }))
  }

  const isOnboardingComplete = Object.values(progress).every((v) => v === true)

  const skipOnboarding = () => {
    setShowWelcome(false)
    setCurrentStep(0)
  }

  const startOnboarding = () => {
    setShowWelcome(false)
    setCurrentStep(1)
  }

  const completeOnboarding = () => {
    setCurrentStep(0)
    setShowWelcome(false)
  }

  const getCompletionPercentage = () => {
    const completed = Object.values(progress).filter((v) => v === true).length
    return Math.round((completed / Object.keys(progress).length) * 100)
  }

  return (
    <OnboardingContext.Provider
      value={{
        showWelcome,
        setShowWelcome,
        currentStep,
        setCurrentStep,
        progress,
        updateProgress,
        isOnboardingComplete,
        skipOnboarding,
        startOnboarding,
        completeOnboarding,
        getCompletionPercentage,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
