import { api } from "@/lib/api-client"
import bcrypt from "bcryptjs"

export async function testAuth(email: string, password: string) {
  console.log('[AUTH DEBUG] Starting auth test for:', email)
  
  const users = await api.users.getAll()
  console.log('[AUTH DEBUG] Total users fetched:', users.length)
  
  users.forEach((u: any) => {
    console.log('[AUTH DEBUG] User:', u.email, 'Role:', u.role)
  })
  
  const admin = users.find((u: any) => u.email === email && (u.role === "superadmin" || u.role === "super-admin"))
  
  if (!admin) {
    console.log('[AUTH DEBUG] No admin found with email:', email)
    return null
  }
  
  console.log('[AUTH DEBUG] Admin found:', admin.email, 'Role:', admin.role)
  console.log('[AUTH DEBUG] Testing password...')
  
  const isPasswordValid = await bcrypt.compare(password, admin.password)
  console.log('[AUTH DEBUG] Password valid:', isPasswordValid)
  
  return isPasswordValid
}
