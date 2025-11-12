import {
  Check,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Zap,
  Star,
  FileText,
  Receipt,
  Wallet,
  Package,
  BarChart3,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Building2,
} from "lucide-react";

interface FeaturesSidebarProps {
  selectedPlan?: {
    name: string;
    description?: string;
    price: number;
    billingCycle?: string;
    features: string[];
  } | null;
}

// Map feature keywords to icons
const getFeatureIcon = (feature: string) => {
  const lowerFeature = feature.toLowerCase();

  if (lowerFeature.includes("quotation") || lowerFeature.includes("quote"))
    return FileText;
  if (lowerFeature.includes("receipt") || lowerFeature.includes("invoice"))
    return Receipt;
  if (lowerFeature.includes("payment") || lowerFeature.includes("transaction"))
    return Wallet;
  if (lowerFeature.includes("expense") || lowerFeature.includes("cost"))
    return DollarSign;
  if (lowerFeature.includes("asset") || lowerFeature.includes("inventory"))
    return Package;
  if (lowerFeature.includes("report") || lowerFeature.includes("analytics"))
    return BarChart3;
  if (
    lowerFeature.includes("employee") ||
    lowerFeature.includes("team") ||
    lowerFeature.includes("user")
  )
    return Users;
  if (lowerFeature.includes("location") || lowerFeature.includes("branch"))
    return MapPin;
  if (lowerFeature.includes("financial") || lowerFeature.includes("control"))
    return TrendingUp;
  if (
    lowerFeature.includes("reconciliation") ||
    lowerFeature.includes("account")
  )
    return Building2;
  if (lowerFeature.includes("dashboard")) return BarChart3;
  if (lowerFeature.includes("role") || lowerFeature.includes("access"))
    return ShieldCheck;
  if (lowerFeature.includes("unlimited") || lowerFeature.includes("create"))
    return Sparkles;

  return Check;
};

export function FeaturesSidebar({ selectedPlan }: FeaturesSidebarProps = {}) {
  // Default features when no plan is selected
  const defaultFeatures = [
    {
      icon: Sparkles,
      color: "blue",
      title: "14-Day Free Trial",
      desc: "Get full access to all features. Billing starts only after trial ends.",
    },
    {
      icon: TrendingUp,
      color: "green",
      title: "Financial Management",
      desc: "Track income, expenses, quotations, receipts, and payments in one place.",
    },
    {
      icon: Receipt,
      color: "purple",
      title: "Invoice & Payment Tracking",
      desc: "Create professional invoices and track payments with automated reminders.",
    },
    {
      icon: Package,
      color: "orange",
      title: "Asset Management",
      desc: "Monitor and manage all your business assets with maintenance tracking.",
    },
    {
      icon: BarChart3,
      color: "indigo",
      title: "Real-time Reports",
      desc: "Generate detailed financial reports and insights instantly.",
    },
    {
      icon: MapPin,
      color: "pink",
      title: "Multi-location Support",
      desc: "Manage multiple business locations from a single dashboard.",
    },
    {
      icon: Users,
      color: "teal",
      title: "Team Collaboration",
      desc: "Role-based access control for your team members with custom permissions.",
    },
  ];

  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    green: { bg: "bg-green-100", text: "text-green-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    orange: { bg: "bg-orange-100", text: "text-orange-600" },
    indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
    pink: { bg: "bg-pink-100", text: "text-pink-600" },
    teal: { bg: "bg-teal-100", text: "text-teal-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
  };

  return (
    <div
      className="hidden lg:flex lg:w-1/2 bg-cover bg-center p-6 xl:p-8 flex-col fixed left-0 top-0 h-screen overflow-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop')",
      }}
    >
      {/* White Overlay with Blur */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm"></div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        <div>
          <div className="mb-6">
            <img
              src="/prantek-logo.png"
              alt="Prantek Academy"
              className="h-12 w-auto"
            />
          </div>

          <div className="space-y-3 flex-shrink-0">
            {selectedPlan ? (
              <div>
                <div
                  className="relative rounded-xl overflow-hidden p-3 mb-3 shadow-lg border-2 border-blue-200"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop')",
                  }}
                >
                  {/* Light overlay with blur */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/95 to-white/95 backdrop-blur-sm"></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
                          <Star className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide block">
                            Selected Plan
                          </span>
                          <h1 className="text-base font-extrabold text-gray-900">
                            {selectedPlan.name}
                          </h1>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-0.5 flex-shrink-0">
                        <span className="text-2xl font-bold text-gray-900">
                          ₹{selectedPlan.price.toLocaleString()}
                        </span>
                        <span className="text-gray-600 text-xs">
                          /{selectedPlan.billingCycle || "mo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <h2 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  What's Included
                </h2>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                  Complete Business Management Solution
                </h1>
                <p className="text-gray-700 text-sm">
                  Experience all premium features free for 14 days.
                </p>
              </div>
            )}
          </div>

          {/* Feature List - Scrollable */}
          <div className="flex-1 min-h-0 mt-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            {selectedPlan ? (
              // Show selected plan's features in responsive columns
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 pb-4">
                {selectedPlan.features.map((feature, index) => {
                  const colors = [
                    "blue",
                    "green",
                    "purple",
                    "orange",
                    "indigo",
                    "pink",
                    "teal",
                    "amber",
                  ];
                  const color = colors[
                    index % colors.length
                  ] as keyof typeof colorClasses;
                  const colorClass = colorClasses[color];
                  const FeatureIcon = getFeatureIcon(feature);

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg p-2.5 border border-gray-100 hover:bg-white/80 transition-all h-fit"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg ${colorClass.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}
                      >
                        <FeatureIcon className={`h-4 w-4 ${colorClass.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium text-xs leading-snug">
                          {feature}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show default features with compact design
              <div className="space-y-3 pb-4">
                {defaultFeatures.map((feature, index) => {
                  const colorClass =
                    colorClasses[feature.color as keyof typeof colorClasses];
                  const Icon = feature.icon;

                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${colorClass.bg} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className={`h-5 w-5 ${colorClass.text}`} />
                      </div>
                      <div className="pt-0.5">
                        <h3 className="text-gray-900 font-semibold text-sm mb-0.5">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 text-xs leading-snug">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
