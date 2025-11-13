/**
 * Session timeout utility
 * Handles 30-minute idle timeout on client side
 */

const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']

export class SessionTimeoutManager {
  private timeoutId: NodeJS.Timeout | null = null
  private lastActivityTime: number = Date.now()
  private onTimeoutCallback: (() => void) | null = null

  constructor(onTimeout: () => void) {
    this.onTimeoutCallback = onTimeout
    this.lastActivityTime = Date.now()
  }

  /**
   * Start monitoring user activity
   */
  start(): void {
    if (typeof window === 'undefined') return

    // Set initial timeout
    this.resetTimeout()

    // Add event listeners for user activity
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, this.handleActivity, true)
    })

    // Check for activity every minute
    this.checkActivity()
  }

  /**
   * Stop monitoring user activity
   */
  stop(): void {
    if (typeof window === 'undefined') return

    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    // Remove event listeners
    ACTIVITY_EVENTS.forEach(event => {
      window.removeEventListener(event, this.handleActivity, true)
    })
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    this.lastActivityTime = Date.now()
    this.resetTimeout()
  }

  /**
   * Reset the idle timeout
   */
  private resetTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }

    this.timeoutId = setTimeout(() => {
      this.onTimeoutCallback?.()
    }, IDLE_TIMEOUT)
  }

  /**
   * Check if session has been idle for too long
   */
  private checkActivity = (): void => {
    const timeSinceLastActivity = Date.now() - this.lastActivityTime
    
    if (timeSinceLastActivity >= IDLE_TIMEOUT) {
      this.onTimeoutCallback?.()
    } else {
      // Check again in 1 minute
      setTimeout(this.checkActivity, 60 * 1000)
    }
  }

  /**
   * Get remaining time before timeout (in seconds)
   */
  getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActivityTime
    const remaining = Math.max(0, IDLE_TIMEOUT - elapsed)
    return Math.floor(remaining / 1000)
  }
}

/**
 * Check if a token timestamp is expired (more than 30 minutes old)
 */
export function isSessionExpired(timestamp: number): boolean {
  const elapsed = Date.now() - timestamp
  return elapsed >= IDLE_TIMEOUT
}

/**
 * Store last activity timestamp
 */
export function updateLastActivity(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('last_activity', Date.now().toString())
  }
}

/**
 * Get last activity timestamp
 */
export function getLastActivity(): number | null {
  if (typeof window !== 'undefined') {
    const timestamp = localStorage.getItem('last_activity')
    return timestamp ? parseInt(timestamp, 10) : null
  }
  return null
}

/**
 * Check if session is still valid based on last activity
 */
export function isSessionValid(): boolean {
  const lastActivity = getLastActivity()
  if (!lastActivity) return false
  return !isSessionExpired(lastActivity)
}
