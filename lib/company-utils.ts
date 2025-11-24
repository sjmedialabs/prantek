// Utility to fetch company details from settings
import { api } from "@/lib/api-client"
export interface CompanyDetails {
  logo?: string
  companyName: string
  address: string
  mobileNo1: string
  mobileNo2?: string
  email: string
  website?: string
  description?: string
  state?:string
  city?:string
  pincode?:string
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

  const fetchedCompanyDetails=await api.company.get();
  // console.log("Fetched Company Details:",fetchedCompanyDetails);
  // Return default/placeholder data if nothing is saved
  return { 
    companyName: fetchedCompanyDetails.companyName || "My Company",
    address: fetchedCompanyDetails.address || "123 Main St, City, Country",
    state: fetchedCompanyDetails.state || "State",
    city:fetchedCompanyDetails.city || "City",
    pincode:fetchedCompanyDetails.pincode || "000000",
    logo: fetchedCompanyDetails.logo || "",
    mobileNo1: fetchedCompanyDetails.phone || "123-456-7890",
    email:fetchedCompanyDetails.email || "",
  }
}

export function saveCompanyDetails(details: CompanyDetails): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("companyDetails", JSON.stringify(details))
  }
}
