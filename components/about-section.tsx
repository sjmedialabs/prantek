import { Card, CardContent } from "@/components/ui/card"
import { FileText, Receipt, CreditCard, Users, BarChart3, Shield, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AboutSection() {
  const solutions = [
    {
      icon: FileText,
      title: "Quotation Management",
      description: "Create, send, and track professional quotations with automated follow-ups",
      features: ["Custom templates", "Digital signatures", "Version control"],
    },
    {
      icon: Receipt,
      title: "Receipt Tracking",
      description: "Manage all receipts in one place with smart categorization and search",
      features: ["OCR scanning", "Auto-categorization", "Cloud storage"],
    },
    {
      icon: CreditCard,
      title: "Payment Processing",
      description: "Accept and track payments with multiple payment methods and gateways",
      features: ["UPI integration", "Card payments", "Payment reminders"],
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Collaborate with your team using role-based access and permissions",
      features: ["Custom roles", "Activity logs", "Team analytics"],
    },
    {
      icon: BarChart3,
      title: "Financial Reports",
      description: "Generate comprehensive reports and insights for better decision making",
      features: ["Real-time dashboards", "Custom reports", "Export options"],
    },
    {
      icon: Shield,
      title: "Security & Compliance",
      description: "Enterprise-grade security with complete audit trails and compliance",
      features: ["Data encryption", "Audit logs", "GST compliance"],
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-balance">
            Complete Business Management Solution
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            Everything you need to run your business efficiently, from quotations to payments, all in one powerful
            platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {solutions.map((solution, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white group overflow-hidden"
            >
              <CardContent className="p-8">
                {/* Icon with gradient background */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <solution.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-20 h-20 bg-blue-100 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{solution.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed mb-6">{solution.description}</p>

                {/* Feature list */}
                <ul className="space-y-2">
                  {solution.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 lg:p-12 text-white shadow-2xl">
          <div className="text-center mb-8">
            <h3 className="text-3xl lg:text-4xl font-bold mb-4">Trusted by Businesses Worldwide</h3>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Join thousands of companies that trust our platform for their financial operations
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold">1,000+</div>
              <div className="text-blue-200 text-sm">Active Companies</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">50,000+</div>
              <div className="text-blue-200 text-sm">Users Managed</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">₹250Cr+</div>
              <div className="text-blue-200 text-sm">Transactions Processed</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">99.9%</div>
              <div className="text-blue-200 text-sm">Uptime SLA</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/signin">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 rounded-full px-8 shadow-lg font-semibold"
              >
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
