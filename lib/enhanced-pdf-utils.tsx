import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface CompanyInfo {
  name?: string
  email?: string
  phone?: string
  address?: string
  logo?: string
  website?: string
}

interface ExportOptions {
  title: string
  companyInfo?: CompanyInfo
  data: any[]
  columns: { header: string; dataKey: string }[]
  filename?: string
  orientation?: "portrait" | "landscape"
}

/**
 * Generate a well-formatted PDF with company logo and contact details
 */
export async function generateEnhancedPDF(options: ExportOptions): Promise<void> {
  const {
    title,
    companyInfo,
    data,
    columns,
    filename = `export-${new Date().toISOString().split("T")[0]}.pdf`,
    orientation = "portrait",
  } = options

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 20

  // Add company logo if available
  if (companyInfo?.logo) {
    try {
      pdf.addImage(companyInfo.logo, "PNG", 15, yPosition, 30, 30)
      yPosition += 35
    } catch (error) {
      console.error("Error adding logo:", error)
      yPosition += 10
    }
  }

  // Add company name and contact details
  if (companyInfo) {
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    if (companyInfo.name) {
      pdf.text(companyInfo.name, companyInfo.logo ? 50 : 15, yPosition)
    }
    
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    yPosition += 7
    
    if (companyInfo.email) {
      pdf.text(`Email: ${companyInfo.email}`, companyInfo.logo ? 50 : 15, yPosition)
      yPosition += 5
    }
    
    if (companyInfo.phone) {
      pdf.text(`Phone: ${companyInfo.phone}`, companyInfo.logo ? 50 : 15, yPosition)
      yPosition += 5
    }
    
    if (companyInfo.address) {
      pdf.text(`Address: ${companyInfo.address}`, companyInfo.logo ? 50 : 15, yPosition)
      yPosition += 5
    }
    
    if (companyInfo.website) {
      pdf.text(`Website: ${companyInfo.website}`, companyInfo.logo ? 50 : 15, yPosition)
      yPosition += 5
    }
  }

  yPosition += 10

  // Add title
  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.text(title, pageWidth / 2, yPosition, { align: "center" })
  yPosition += 10

  // Add date
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Generated on: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`, pageWidth / 2, yPosition, { align: "center" })
  yPosition += 10

  // Add table
  autoTable(pdf, {
    startY: yPosition,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] || "")),
    theme: "grid",
    headStyles: {
      fillColor: [139, 92, 246], // Purple
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 15, right: 15 },
  })

  // Add footer with page numbers
  const pageCount = (pdf as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "normal")
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    )
  }

  // Save the PDF
  pdf.save(filename)
}

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: any[],
  columns: { header: string; dataKey: string }[],
  filename = `export-${new Date().toISOString().split("T")[0]}.csv`
): void {
  const headers = columns.map(col => col.header).join(",")
  const rows = data.map(row =>
    columns
      .map(col => {
        const value = row[col.dataKey]
        // Escape commas and quotes
        const escaped = String(value || "").replace(/"/g, '""')
        return `"${escaped}"`
      })
      .join(",")
  )

  const csv = [headers, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
