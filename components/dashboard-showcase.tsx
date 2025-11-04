import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function DashboardShowcase() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-4">
                Financial & Operations SAAS Application
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">
                Complete Business Management Solution
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed text-pretty">
                Manage every aspect of your business from financial transactions to asset tracking, with powerful
                reporting and compliance features built for modern enterprises.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "Multi-tenant architecture with secure data isolation",
                "Role-based access control with custom permissions",
                "Real-time financial tracking and reporting",
                "Asset management with condition monitoring",
                "Automated compliance and audit trails",
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <Card className="shadow-2xl border-0">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-primary to-purple-600 p-6 text-white">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Prantek Dashboard</h3>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      Live Data
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-purple-200">Total Revenue</div>
                      <div className="text-xl font-bold">₹24,56,800</div>
                    </div>
                    <div>
                      <div className="text-purple-200">Active Clients</div>
                      <div className="text-xl font-bold">1,247</div>
                    </div>
                    <div>
                      <div className="text-purple-200">Assets Tracked</div>
                      <div className="text-xl font-bold">3,456</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Financial Overview */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Financial Overview</h4>
                    <div className="space-y-3">
                      {[
                        { label: "Accounts Receivable", value: "₹45,230", trend: "+12%" },
                        { label: "Accounts Payable", value: "₹23,450", trend: "-5%" },
                        { label: "Cash Flow", value: "₹21,780", trend: "+8%" },
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{item.label}</span>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                            <div
                              className={`text-xs ${item.trend.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                            >
                              {item.trend}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      {[
                        "New client onboarded - TechCorp Inc.",
                        "Asset #A-1234 assigned to John Doe",
                        "Invoice #INV-5678 approved",
                      ].map((activity, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>{activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
