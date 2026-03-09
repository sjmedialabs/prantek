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

/**
 * Create a Razorpay customer
 */
export async function createCustomer(params: { name: string; email: string; contact?: string }) {
  try {
    const instance = getRazorpayInstance()
    const customer = await instance.customers.create(params)
    return customer
  } catch (error) {
    console.error('Error creating Razorpay customer:', error)
    throw error
  }
}

/**
 * Create a Razorpay plan (for Subscriptions API)
 */
export async function createPlan(params: {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  amount: number // in paise
  currency?: string
  name: string
}) {
  try {
    const instance = getRazorpayInstance()
    const plan = await instance.plans.create({
      period: params.period,
      interval: params.interval,
      amount: params.amount,
      currency: params.currency ?? 'INR',
      name: params.name,
    })
    return plan
  } catch (error) {
    console.error('Error creating Razorpay plan:', error)
    throw error
  }
}

/**
 * Create a Razorpay subscription
 */
export async function createSubscription(params: {
  planId: string
  customerId: string
  totalCount: number
  startAt?: number
  customerNotify?: 0 | 1
  notes?: Record<string, string>
}) {
  try {
    const instance = getRazorpayInstance()
    const sub = await instance.subscriptions.create({
      plan_id: params.planId,
      customer_id: params.customerId,
      total_count: params.totalCount,
      start_at: params.startAt,
      customer_notify: params.customerNotify ?? 1,
      notes: params.notes,
    })
    return sub
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error)
    throw error
  }
}

/**
 * Fetch a Razorpay subscription by id
 */
export async function fetchSubscription(subscriptionId: string) {
  try {
    const instance = getRazorpayInstance()
    const sub = await instance.subscriptions.fetch(subscriptionId)
    return sub
  } catch (error) {
    console.error('Error fetching Razorpay subscription:', error)
    throw error
  }
}

/**
 * Cancel a Razorpay subscription
 */
export async function cancelRazorpaySubscription(subscriptionId: string, cancelAtCycleEnd = false) {
  try {
    const instance = getRazorpayInstance()
    const sub = await instance.subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: cancelAtCycleEnd,
    })
    return sub
  } catch (error) {
    console.error('Error cancelling Razorpay subscription:', error)
    throw error
  }
}

/**
 * Verify Razorpay webhook signature (body as string, x-razorpay-signature header)
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const digest = hmac.digest('hex')
    return digest === signature
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}
