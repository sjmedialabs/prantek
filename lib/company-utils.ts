// Utility to fetch company details from settings
export interface CompanyDetails {
  logo?: string
  companyName: string
  address: string
  mobileNo1: string
  mobileNo2?: string
  email: string
  website?: string
  description?: string
}

export async function getCompanyDetails(): Promise<CompanyDetails> {
  // In production, this would fetch from your database/API
  // For now, we'll check localStorage for saved company details
  if (typeof window !== "undefined") {
    const savedData = localStorage.getItem("companyDetails")
    if (savedData) {
      return JSON.parse(savedData)
    }
  }

  // Return default/placeholder data if nothing is saved
  return {
    companyName: "Your Company Name",
    address: "123 Business Street, City, State 12345",
    mobileNo1: "+1 (555) 123-4567",
    email: "info@company.com",
  }
}

export function saveCompanyDetails(details: CompanyDetails): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("companyDetails", JSON.stringify(details))
  }
}
