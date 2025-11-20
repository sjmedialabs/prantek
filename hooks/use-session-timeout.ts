/**
 * Hook for tracking user activity and handling session timeout
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SessionTimeoutManager, updateLastActivity } from '@/lib/session-timeout'
import { tokenStorage } from '@/lib/token-storage'

interface UseSessionTimeoutOptions {
  enabled?: boolean
  isSuperAdmin?: boolean
  onTimeout?: () => void
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const { enabled = true, isSuperAdmin = false, onTimeout } = options
  const router = useRouter()
  const managerRef = useRef<SessionTimeoutManager | null>(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Update activity timestamp on mount
    updateLastActivity()

    // Handle session timeout
    const handleTimeout = () => {
      // Clear all tokens and user data
      tokenStorage.clearTokens(isSuperAdmin)
      localStorage.removeItem('last_activity')
      localStorage.removeItem('loginedUser')

      // Call custom timeout handler if provided
      onTimeout?.()

      // Redirect to appropriate signin page
      const signinPath = isSuperAdmin ? '/super-admin' : '/signin'
      router.replace(`${signinPath}?error=session_expired`)
    }

    // Create and start session timeout manager
    managerRef.current = new SessionTimeoutManager(handleTimeout)
    managerRef.current.start()

    // Update activity timestamp periodically
    const activityInterval = setInterval(() => {
      updateLastActivity()
    }, 60 * 1000) // Every minute

    // Cleanup on unmount
    return () => {
      managerRef.current?.stop()
      clearInterval(activityInterval)
    }
  }, [enabled, isSuperAdmin, onTimeout, router])

  return {
    getRemainingTime: () => managerRef.current?.getRemainingTime() ?? 0,
  }
}
