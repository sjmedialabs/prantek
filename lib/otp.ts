/**
 * OTP utility for email/phone verification.
 */

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Returns a Date that is `minutes` from now (default 5).
 */
export function getExpiry(minutes = 5): Date {
  const date = new Date()
  date.setMinutes(date.getMinutes() + minutes)
  return date
}
