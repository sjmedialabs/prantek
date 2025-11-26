"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { VideoModal } from "@/components/video-modal";
import { useTrialPeriod } from "@/lib/hooks/useTrialPeriod";
import { WebsiteContent } from "@/lib/models/types";

export function HeroSection() {
  const { trialDays } = useTrialPeriod();
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    api.websiteContent
      .getAll()
      .then((data) => data[0] || {})
      .then((websiteContent) => {
        console.log("[v0] Hero section loaded content:", {
          heroRightImage: websiteContent.heroRightImage,
          heroBackgroundImage: websiteContent.heroBackgroundImage,
          heroDemoVideoUrl: websiteContent.heroDemoVideoUrl,
        });
        setContent(websiteContent);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !content) {
    return (
      <section className="relative bg-white py-16 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse space-y-4 w-full max-w-2xl">
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const heroTitle =
    content.heroTitle || "Smart Financial Management for Modern Businesses";
  const heroSubtitle =
    content.heroSubtitle ||
    "Streamline quotations, receipts, payments, and expenses with powerful automation and real-time insights";
  const heroCtaText = content.heroCtaText || "Get Started Free";
  const heroCtaLink = content.heroCtaLink || "/signin";
  const heroRightImage =
    content.heroRightImage || "/financial-dashboard-mobile-app.jpg";
  const heroBackgroundImage = content.heroBackgroundImage || "";
  const heroDemoVideoUrl =
    content.heroDemoVideoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ";

  return (
    <>
      <section
        className="relative bg-white py-16 lg:py-0 lg:min-h-screen lg:flex lg:items-center overflow-hidden"
        style={
          heroBackgroundImage
            ? {
                backgroundImage: `url(${heroBackgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }
            : undefined
        }
      >
        {heroBackgroundImage && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight text-balance lg:text-4xl xl:text-5xl">
                  {heroTitle}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed text-pretty">
                  {heroSubtitle}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={heroCtaLink}>
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full h-12"
                  >
                    {heroCtaText}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full h-12 bg-transparent"
                  onClick={() => setIsVideoModalOpen(true)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>{trialDays}-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right Content - Phone Mockup or Custom Image */}
            <div className="relative lg:pl-12 lg:pr-[50px] lg:h-[calc(100vh-8rem)] lg:flex lg:items-center">
              {heroRightImage && heroRightImage.includes("placeholder.svg") ? (
                <div className="relative">
                  <div className="relative mx-auto w-full max-w-sm">
                    <div className="relative bg-white rounded-[3rem] shadow-2xl border-8 border-gray-900 overflow-hidden">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10"></div>

                      <div className="relative bg-gradient-to-br from-blue-50 to-white p-6 pt-10 pb-8 min-h-[600px]">
                        <div className="bg-blue-600 rounded-2xl p-4 mb-4 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-semibold">
                              Dashboard
                            </h3>
                            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                              <div className="text-blue-100 text-xs mb-1">
                                Cash in Hand
                              </div>
                              <div className="text-white text-xl font-bold">
                                ₹45,230
                              </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                              <div className="text-blue-100 text-xs mb-1">
                                Revenue
                              </div>
                              <div className="text-white text-xl font-bold">
                                ₹1.28L
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              Recent Activity
                            </h4>
                            <span className="text-xs text-blue-600">
                              View All
                            </span>
                          </div>
                          <div className="space-y-3">
                            {[
                              {
                                name: "Client Payment",
                                amount: "+₹5,200",
                                color: "text-green-600",
                              },
                              {
                                name: "Office Supplies",
                                amount: "-₹340",
                                color: "text-red-600",
                              },
                              {
                                name: "Software License",
                                amount: "-₹1,200",
                                color: "text-red-600",
                              },
                            ].map((transaction, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                                  <span className="text-sm text-gray-900">
                                    {transaction.name}
                                  </span>
                                </div>
                                <span
                                  className={`text-sm font-semibold ${transaction.color}`}
                                >
                                  {transaction.amount}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2"></div>
                            <span className="text-xs text-gray-600">
                              New Receipt
                            </span>
                          </div>
                          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                            <div className="w-10 h-10 bg-green-100 rounded-full mx-auto mb-2"></div>
                            <span className="text-xs text-gray-600">
                              New Payment
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    ✓ Secure
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full lg:flex lg:items-center">
                  <img
                    src={heroRightImage || "/placeholder.svg"}
                    alt="Hero showcase"
                    className="w-full h-auto lg:h-full lg:w-auto lg:max-w-full lg:object-contain rounded-2xl shadow-2xl"
                    onError={(e) => {
                      console.error(
                        "[v0] Hero image failed to load:",
                        heroRightImage
                      );
                      e.currentTarget.src = "/financial-dashboard.png";
                    }}
                  />
                  <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    ✓ Secure
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={heroDemoVideoUrl}
      />
    </>
  );
}
