/**
 * Score-based matching of bank statement rows to system transactions (receipts + payments).
 * Supports single and multiple transaction match (e.g. one bank debit = PAY-001 + PAY-002).
 */

const SCORE_AMOUNT = 50
const SCORE_DATE = 20
const SCORE_REFERENCE = 20
const SCORE_NAME = 10
const MIN_SCORE_SUGGESTED = 60

const DAYS_TOLERANCE = 3

export interface SysTransaction {
  _id: string
  type: "receipt" | "payment"
  transactionNumber: string
  date: string
  clientName?: string
  recipientName?: string
  referenceNumber?: string
  amount: number
  status: string
}

export interface BankRow {
  date: string
  description: string
  reference: string
  debit: number
  credit: number
  balance: number
}

function parseNum(v: any): number {
  if (v == null || v === "") return 0
  const n = Number(String(v).replace(/[^0-9.-]/g, ""))
  return Number.isFinite(n) ? n : 0
}

function norm(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase()
}

function dateWithinDays(d1: string, d2: string, days: number): boolean {
  try {
    const a = new Date(d1)
    const b = new Date(d2)
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return false
    const diff = Math.abs(a.getTime() - b.getTime())
    return diff <= days * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

/** Score a single bank row vs a single system transaction (1:1). */
export function scoreMatch(
  bank: BankRow,
  tx: SysTransaction
): { score: number; amountMatch: boolean; dateMatch: boolean; referenceMatch: boolean; nameMatch: boolean } {
  let score = 0
  const amountIn = tx.type === "receipt" ? tx.amount : 0
  const amountOut = tx.type === "payment" ? tx.amount : 0
  const amountMatch = bank.credit === amountIn || bank.debit === amountOut
  if (amountMatch) score += SCORE_AMOUNT

  const dateMatch = dateWithinDays(bank.date, tx.date, DAYS_TOLERANCE)
  if (dateMatch) score += SCORE_DATE

  const refBank = norm(bank.reference)
  const refTx = norm(tx.referenceNumber ?? "")
  const referenceMatch = refBank && refTx && (refBank.includes(refTx) || refTx.includes(refBank))
  if (referenceMatch) score += SCORE_REFERENCE

  const name = tx.type === "receipt" ? tx.clientName : tx.recipientName
  const nameStr = norm(name ?? "")
  const desc = norm(bank.description)
  const nameMatch = nameStr.length > 0 && desc.length > 0 && desc.includes(nameStr)
  if (nameMatch) score += SCORE_NAME

  return { score, amountMatch, dateMatch, referenceMatch, nameMatch }
}

/** Find best single-transaction matches for a bank row (score >= MIN_SCORE_SUGGESTED). */
export function suggestSingleMatches(
  bank: BankRow,
  transactions: SysTransaction[]
): { transactionId: string; type: "receipt" | "payment"; score: number }[] {
  const pending = transactions.filter(
    (t) => t.status !== "cleared" && t.status !== "completed"
  )
  const results: { transactionId: string; type: "receipt" | "payment"; score: number }[] = []
  for (const tx of pending) {
    const { score } = scoreMatch(bank, tx)
    if (score >= MIN_SCORE_SUGGESTED) {
      results.push({ transactionId: String(tx._id), type: tx.type, score })
    }
  }
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 10)
}

/** Find combinations of 2+ transactions that sum to bank debit or credit (for "Match Multiple"). */
export function suggestMultiMatches(
  bank: BankRow,
  transactions: SysTransaction[]
): { transactionIds: { id: string; type: "receipt" | "payment" }[]; totalAmount: number; score: number }[] {
  const isDebit = bank.debit > 0
  const target = isDebit ? bank.debit : bank.credit
  if (target <= 0) return []

  const pending = transactions.filter((t) => {
    const uncleared = t.status !== "cleared" && t.status !== "completed"
    if (isDebit && t.type === "payment") return uncleared
    if (!isDebit && t.type === "receipt") return uncleared
    return false
  })
  if (pending.length < 2) return []

  const results: { transactionIds: { id: string; type: "receipt" | "payment" }[]; totalAmount: number; score: number }[] = []

  function addCombos(start: number, sum: number, ids: { id: string; type: "receipt" | "payment" }[], depth: number) {
    if (depth >= 2 && Math.abs(sum - target) < 0.02) {
      const txs = ids.map((id) => pending.find((p) => String(p._id) === id.id)).filter(Boolean) as SysTransaction[]
      let score = SCORE_AMOUNT
      const datesMatch = txs.every((t) => dateWithinDays(bank.date, t.date, DAYS_TOLERANCE))
      if (datesMatch) score += SCORE_DATE
      const anyRef = txs.some((t) => {
        const refTx = norm(t.referenceNumber ?? "")
        return refTx && norm(bank.reference).includes(refTx)
      })
      if (anyRef) score += SCORE_REFERENCE
      const anyName = txs.some((t) => {
        const name = t.type === "receipt" ? t.clientName : t.recipientName
        return norm(name ?? "").length > 0 && norm(bank.description).includes(norm(name ?? ""))
      })
      if (anyName) score += SCORE_NAME
      if (score >= MIN_SCORE_SUGGESTED) results.push({ transactionIds: ids, totalAmount: sum, score })
    }
    if (depth >= 5 || sum >= target + 0.02) return
    for (let i = start; i < pending.length; i++) {
      const tx = pending[i]
      addCombos(i + 1, sum + tx.amount, [...ids, { id: String(tx._id), type: tx.type }], depth + 1)
    }
  }
  addCombos(0, 0, [], 0)

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 5)
}

export { MIN_SCORE_SUGGESTED, SCORE_AMOUNT, SCORE_DATE, SCORE_REFERENCE, SCORE_NAME }
