import { useState, useEffect } from 'react'

export function useTrialPeriod() {
  const [trialDays, setTrialDays] = useState<number>(14) // Default
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrialPeriod = async () => {
      try {
        const response = await fetch('/api/system-settings')
        const data = await response.json()
        if (data.success && data.data.trialPeriodDays) {
          setTrialDays(data.data.trialPeriodDays)
        }
      } catch (error) {
        console.error('Error fetching trial period:', error)
        // Keep default value
      } finally {
        setLoading(false)
      }
    }

    fetchTrialPeriod()
  }, [])

  return { trialDays, loading }
}
