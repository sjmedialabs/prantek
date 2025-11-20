export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCurrencyShort(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`
}

export const CURRENCY_SYMBOL = "₹"
export const CURRENCY_CODE = "INR"
