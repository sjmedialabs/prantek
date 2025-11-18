import { UserProvider } from "@/components/auth/user-context"

export default function QuotationEmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  )
}
