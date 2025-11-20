import Razorpay from 'razorpay'

let razorpayInstance: Razorpay | null = null

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.')
  }
  return razorpayInstance
}

export { getRazorpayInstance as razorpayInstance }

/**
 * Create a Razorpay order for a payment
 */
export async function createOrder(amount: number, currency: string = 'INR', receipt?: string) {
  try {
    const instance = getRazorpayInstance()
    const order = await instance.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `order_${Date.now()}`,
    })
    return order
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    throw error
  }
}

/**
 * Verify a Razorpay payment signature
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    hmac.update(`${orderId}|${paymentId}`)
    const generatedSignature = hmac.digest('hex')
    return generatedSignature === signature
  } catch (error) {
    console.error('Error verifying payment signature:', error)
    return false
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function getPaymentDetails(paymentId: string) {
  try {
    const instance = getRazorpayInstance()
    const payment = await instance.payments.fetch(paymentId)
    return payment
  } catch (error) {
    console.error('Error fetching payment details:', error)
    throw error
  }
}

/**
 * Create a recurring payment (subscription) for a customer
 * This is used to charge saved payment methods
 */
export async function createRecurringPayment(
  customerId: string,
  amount: number,
  currency: string = 'INR',
  description?: string
) {
  try {
    const instance = getRazorpayInstance()
    // For recurring payments with saved tokens, we use the transfer API
    // First, we need to get a token for the customer's saved payment method
    const payment = await instance.payments.create({
      customer_id: customerId,
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      recurring: 'true',
      description: description || 'Subscription renewal payment',
      email: '', // Will be fetched from customer details
      contact: '', // Will be fetched from customer details
    })
    return payment
  } catch (error) {
    console.error('Error creating recurring payment:', error)
    throw error
  }
}

/**
 * Charge a saved payment method for a customer
 * This uses the token stored for the customer
 */
export async function chargeCustomerToken(
  customerId: string,
  tokenId: string,
  amount: number,
  currency: string = 'INR',
  description?: string
) {
  try {
    const instance = getRazorpayInstance()
    const payment = await instance.payments.create({
      customer_id: customerId,
      token: tokenId,
      recurring: 'true',
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      description: description || 'Subscription renewal payment',
      email: '', // Can be provided or fetched from DB
      contact: '', // Can be provided or fetched from DB
    })
    return payment
  } catch (error) {
    console.error('Error charging customer token:', error)
    throw error
  }
}

/**
 * Fetch customer details from Razorpay
 */
export async function getCustomerDetails(customerId: string) {
  try {
    const instance = getRazorpayInstance()
    const customer = await instance.customers.fetch(customerId)
    return customer
  } catch (error) {
    console.error('Error fetching customer details:', error)
    throw error
  }
}

/**
 * Fetch tokens for a customer (saved payment methods)
 */
export async function getCustomerTokens(customerId: string) {
  try {
    const instance = getRazorpayInstance()
    const tokens = await instance.tokens.all({ customer_id: customerId })
    return tokens
  } catch (error) {
    console.error('Error fetching customer tokens:', error)
    throw error
  }
}
