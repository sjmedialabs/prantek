"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function HashScrollHandler() {
  const pathname = usePathname()

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash
      if (!hash) return
      // console.log("hash url ", hash)
      const el = document.querySelector(hash)
      // console.log("el", el)
      if (el) {
        const yOffset = -80 // adjust for sticky header
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset
        console.log("y", y)
        window.scrollTo({ top: y, behavior: "smooth" })
        // console.log("scrolling to", y)
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