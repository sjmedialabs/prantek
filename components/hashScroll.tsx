"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function HashScrollHandler() {
  const pathname = usePathname()

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash
      if (!hash) return

      const el = document.querySelector(hash)

      if (el) {
        const yOffset = -80 // adjust for sticky header
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset

        window.scrollTo({ top: y, behavior: "smooth" })
        return true
      }

      return false
    }

    // 🔥 Retry until element exists
    let attempts = 0
    const interval = setInterval(() => {
      const success = scrollToHash()
      attempts++

      if (success || attempts > 10) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [pathname])

  return null
}