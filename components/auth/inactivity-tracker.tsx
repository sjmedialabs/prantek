"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { dataStore } from "@/lib/data-store"
import { toast } from "@/lib/toast"

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000 // Show warning 2 minutes before logout

export function InactivityTracker() {
  const router = useRouter()
  const pathname = usePathname()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const warningTimeoutRef = useRef<NodeJS.Timeout>()
  const lastActivityRef = useRef<number>(Date.now())

  const isSuperAdmin = pathname?.startsWith("/super-admin")

  const resetTimer = () => {
    lastActivityRef.current = Date.now()

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

    // Set warning timer (2 minutes before logout)
    warningTimeoutRef.current = setTimeout(() => {
      toast.warning("You will be logged out in 2 minutes due to inactivity")
    }, INACTIVITY_TIMEOUT - WARNING_TIME)

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout()
    }, INACTIVITY_TIMEOUT)
  }

  const handleLogout = () => {
    const userType = isSuperAdmin ? "super-admin" : "admin"
    const user = dataStore.getCurrentUser(userType)

    if (user) {
      dataStore.logActivity({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "auto_logout",
        description: `${user.name} was automatically logged out due to inactivity`,
      })
    }

    dataStore.logout(userType)
    toast.error("You have been logged out due to inactivity")

    if (isSuperAdmin) {
      router.push("/super-admin")
    } else {
      router.push("/signin")
    }
  }

  useEffect(() => {
    // Events that indicate user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"]

    const handleActivity = () => {
      resetTimer()
    }

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    // Initialize timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [isSuperAdmin])

  return null // This component doesn't render anything
}
