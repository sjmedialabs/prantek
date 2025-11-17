import jsPDF from "jspdf"
import html2canvas from "html2canvas"

/**
 * Generate a PDF from an HTML element
 * @param elementId - The ID of the HTML element to convert to PDF
 * @param filename - The name of the PDF file to download
 */
export async function generatePDF(elementId: string, filename: string): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`)
    }

    // Show the element temporarily for rendering
    const originalDisplay = element.style.display
    element.style.display = "block"

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    })

    // Restore original display
    element.style.display = originalDisplay

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  } catch (error) {
    throw error
  }
}

/**
 * Print an HTML element
 * @param elementId - The ID of the HTML element to print
 */
export function printDocument(elementId: string): void {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`)
    }

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      throw new Error("Failed to open print window")
    }

    // Write the content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print</title>
          <style>
            body {
              margin: 20px;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              @page {
                margin: 50px;
              }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  } catch (error) {
    throw error
  }
}
