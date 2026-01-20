 import { MongoClient } from 'mongodb';
// import { useTrialPeriod } from './hooks/useTrialPeriod';

const DEFAULT_TRIAL_DAYS = 14;

let cachedTrialDays: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Get the trial period duration in days from system settings
 * Returns cached value if available and fresh, otherwise fetches from database
 */
export async function getTrialPeriodDays(): Promise<number> {
  const now = Date.now();
  
  // Return cached value if available and not expired
  if (cachedTrialDays !== null && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedTrialDays;
  }

  try {
    const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUrl) {
      console.warn('MongoDB URI not found, using default trial period:', DEFAULT_TRIAL_DAYS);
      return DEFAULT_TRIAL_DAYS;
    }

    const client = new MongoClient(mongoUrl);
    await client.connect();
    
    const db = client.db();
    const settings = await db.collection('system_settings').findOne({ _id: 'global_config' });
    
    await client.close();

    if (settings && typeof settings.trialPeriodDays === 'number' && settings.trialPeriodDays > 0) {
      cachedTrialDays = settings.trialPeriodDays;
      lastFetchTime = now;
      return settings.trialPeriodDays;
    }

    // Fallback to default if not found or invalid
    console.warn('Trial period not found in settings, using default:', DEFAULT_TRIAL_DAYS);
    return DEFAULT_TRIAL_DAYS;
  } catch (error) {
    console.error('Error fetching trial period from database:', error);
    return DEFAULT_TRIAL_DAYS;
  }
}

/**
 * Calculate trial end date based on the configured trial period
 */
export async function calculateTrialEndDate(): Promise<Date> {
  // const{trialDays}=useTrialPeriod();
   const trialDays = await getTrialPeriodDays();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + trialDays);
  return endDate;
}

/**
 * Invalidate the trial period cache to force a fresh fetch
 */
export function invalidateTrialCache(): void {
  cachedTrialDays = null;
  lastFetchTime = 0;
}
