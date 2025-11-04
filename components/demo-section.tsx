import { Card, CardContent } from "@/components/ui/card"
import { Play, Monitor, Smartphone, Users } from "lucide-react"

export function DemoSection() {
  return (
    <section className="py-20 bg-gray-50" id="demo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">See Prantek in Action</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            Watch how Prantek transforms business operations with intuitive dashboards, powerful reporting, and seamless
            multi-tenant management.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Demo Video Placeholder */}
          <div className="relative">
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative z-10 text-center text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/30 transition-colors">
                      <Play className="h-8 w-8 ml-1" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Product Demo</h3>
                    <p className="text-purple-100">5 minutes overview</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demo Features */}
          <div className="space-y-6">
            <div className="space-y-4">
              {[
                {
                  icon: Monitor,
                  title: "Dashboard Overview",
                  description: "See how the main dashboard provides real-time insights into your business operations.",
                },
                {
                  icon: Users,
                  title: "Multi-Tenant Management",
                  description: "Learn how to manage multiple tenants with secure data isolation and role-based access.",
                },
                {
                  icon: Smartphone,
                  title: "Mobile Experience",
                  description: "Discover how Prantek works seamlessly across all devices with responsive design.",
                },
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
