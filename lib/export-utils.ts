/**
 * Export utility functions for generating CSV and JSON exports
 */

export interface ExportColumn {
  key: string
  label: string
  format?: (value: any) => string
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], columns: ExportColumn[]): string {
  // Create header row
  const headers = columns.map((col) => col.label).join(",")

  // Create data rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const value = item[col.key]
        const formattedValue = col.format ? col.format(value) : value
        // Escape commas and quotes in CSV
        const escaped = String(formattedValue || "").replace(/"/g, '""')
        return `"${escaped}"`
      })
      .join(",")
  })

  return [headers, ...rows].join("\n")
}

/**
 * Download data as CSV file
 */
export function downloadCSV(filename: string, data: any[], columns: ExportColumn[]): void {
  const csv = convertToCSV(data, columns)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, filename)
}

/**
 * Download data as JSON file
 */
export function downloadJSON(filename: string, data: any): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" })
  downloadBlob(blob, filename)
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number, currency = "₹"): string {
  return `${currency}${amount.toLocaleString()}`
}
