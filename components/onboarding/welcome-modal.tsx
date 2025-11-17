"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Building2, Users, Settings, Package } from "lucide-react";
import { useOnboarding } from "./onboarding-context";

export function WelcomeModal() {
  const { showWelcome, startOnboarding, skipOnboarding } = useOnboarding();

  return (
    <Dialog
      open={showWelcome}
      onOpenChange={(open) => !open && skipOnboarding()}
    >
      <DialogContent className="!min-w-[90%] !min-h-[90%] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-3">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-3xl text-center">
            Welcome to Your Business Management Platform! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Let's get you started with a quick setup to unlock the full
            potential of your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Why Setup is Important */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">
              Why is the basic setup important?
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Completing your setup ensures you get the most out of this
              platform. By adding your company information, clients, settings,
              and products/services, you'll be able to:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  Create professional invoices and quotations instantly
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Track payments and receivables accurately</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Generate detailed financial reports</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Manage your business operations efficiently</span>
              </li>
            </ul>
          </div>

          {/* Setup Steps Preview */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-4">
              What you'll set up (4 quick steps):
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Company Information
                  </h4>
                  <p className="text-sm text-gray-600">
                    Add your business details, logo, and contact information
                  </p>
                </div>
              </div>

              {/* <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-300 transition">
                <div className="rounded-lg bg-green-100 p-2">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Create Clients</h4>
                  <p className="text-sm text-gray-600">
                    Add your customers and vendors for easy billing
                  </p>
                </div>
              </div> */}

              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Basic Settings</h4>
                  <p className="text-sm text-gray-600">
                    Configure categories, taxes, and payment methods
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition">
                <div className="rounded-lg bg-orange-100 p-2">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Products/Services
                  </h4>
                  <p className="text-sm text-gray-600">
                    Add items you sell for quick invoice creation
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 text-center">
              ⏱️ This setup takes about <strong>5-10 minutes</strong> and you
              can complete it at your own pace. Don't worry, you can always come
              back to it later!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={skipOnboarding}
            className="flex-1 sm:flex-none"
          >
            Skip for Now
          </Button>
          <Button
            onClick={startOnboarding}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Start Setup
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
