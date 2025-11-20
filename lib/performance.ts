// Performance monitoring utilities for production

export function measurePerformance(name: string, fn: () => void): void {
  if (typeof window === "undefined") return

  const start = performance.now()
  fn()
  const end = performance.now()
  const duration = end - start

  if (duration > 1000) {
    console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`)
  }
}

export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  const duration = end - start

  if (duration > 2000) {
    console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`)
  }

  return result
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
