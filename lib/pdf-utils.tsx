import jsPDF from "jspdf"
import html2canvas from "html2canvas"

/**
 * Generate a PDF from an HTML element
 * @param elementId - The ID of the HTML element to convert to PDF
 * @param filename - The name of the PDF file to download
 */
export async function generatePDF(elementId: string, filename: string) {
  try {
    const element = document.getElementById(elementId)
    if (!element) throw new Error(`Element '${elementId}' not found`)

    // apply pdf-safe on ROOT
    document.documentElement.classList.add("pdf-safe")
element.style.display = "block"
    // 🔥 Make element visible
    const oldOpacity = element.style.opacity
    element.style.opacity = "1"

    await new Promise((resolve) => setTimeout(resolve, 50))

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    })

    // restore opacity
    element.style.opacity = oldOpacity
    document.documentElement.classList.remove("pdf-safe")

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")

    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      pdf.addPage()
      position = heightLeft - imgHeight
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  } catch (error) {
    console.error("PDF error:", error)
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
    if (!element) throw new Error(`Element with ID "${elementId}" not found`)

    const printWindow = window.open("", "_blank")
    if (!printWindow) throw new Error("Failed to open print window")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print</title>

          <!-- 🌟 Load TailwindCSS in the print window -->
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 20px;
              background: white;
            }

            .print-container {
              max-width: 900px;
              margin: auto;
              padding: 20px;
              background: white;
            }

            @media print {
              body {
                margin: 0 !important;
                padding: 0 !important;
              }
              @page {
                margin: 12mm;
              }
            }
          </style>
        </head>

        <body>
          <div class="print-container">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  } catch (error) {
    console.error("Print error:", error)
    throw error
  }
}

