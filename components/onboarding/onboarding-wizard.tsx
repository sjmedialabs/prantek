"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
  Users,
  Settings,
  Package,
  Sparkles,
  PartyPopper,
  Trophy,
} from "lucide-react";
import { useOnboarding } from "./onboarding-context";
import { useUser } from "@/components/auth/user-context";
import { api } from "@/lib/api-client";
import { toast } from "@/lib/toast";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { ImageUpload } from "@/components/ui/image-upload";
import { PhoneInput, validatePhoneNumber } from "@/components/ui/phone-input";

const STEPS = [
  {
    id: 1,
    title: "Company Information",
    icon: Building2,
    description: "Add your business details",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    educationalContent: {
      title: "Why Company Information Matters",
      benefits: [
        {
          icon: "✓",
          text: "Professional invoices and quotations with your business logo",
        },
        {
          icon: "✓",
          text: "Legally compliant documentation with GSTIN and PAN details",
        },
        {
          icon: "✓",
          text: "Build trust and credibility with clients",
        },
        {
          icon: "✓",
          text: "Streamline tax filing and compliance reporting",
        },
      ],
      description:
        "Complete company profile ensures all your business documents are professional, compliant, and ready for clients. This is the foundation of your business identity in the system.",
    },
  },
  // {
  //   id: 2,
  //   title: "Create Clients",
  //   icon: Users,
  //   description: "Add your first customer",
  //   image:
  //     "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80",
  //   educationalContent: {
  //     title: "Why Client Management is Important",
  //     benefits: [
  //       {
  //         icon: "✓",
  //         text: "Quick access to client details when creating invoices",
  //       },
  //       {
  //         icon: "✓",
  //         text: "Track payment history and outstanding balances",
  //       },
  //       {
  //         icon: "✓",
  //         text: "Generate client-specific reports and insights",
  //       },
  //       {
  //         icon: "✓",
  //         text: "Improve customer relationships with organized data",
  //       },
  //     ],
  //     description:
  //       "A well-maintained client database helps you create invoices faster, track receivables, and provide better customer service. Start by adding your first client.",
  //   },
  // },
  {
    id: 3,
    title: "Basic Settings",
    icon: Settings,
    description: "Configure categories and taxes",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    educationalContent: {
      title: "Why Settings Configuration Matters",
      benefits: [
        {
          icon: "✓",
          text: "Automatic tax calculations on invoices and quotations",
        },
        {
          icon: "✓",
          text: "Organize expenses and income by categories",
        },
        {
          icon: "✓",
          text: "Track payments through preferred methods",
        },
        {
          icon: "✓",
          text: "Ensure GST compliance with proper tax rates",
        },
      ],
      description:
        "Setting up tax rates, payment categories, and payment methods saves time and reduces errors. Configure these once and reuse them across all transactions.",
    },
  },
  {
    id: 4,
    title: "Products/Services",
    icon: Package,
    description: "Add items you sell",
    image:
      "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&q=80",
    educationalContent: {
      title: "Why Product Catalog is Essential",
      benefits: [
        {
          icon: "✓",
          text: "Create invoices in seconds with pre-defined items",
        },
        {
          icon: "✓",
          text: "Consistent pricing across all documents",
        },
        {
          icon: "✓",
          text: "Track inventory and sales performance",
        },
        {
          icon: "✓",
          text: "Include HSN codes for GST compliance",
        },
      ],
      description:
        "A product/service catalog eliminates repetitive data entry and ensures accuracy. Add your items once and use them across unlimited invoices and quotations.",
    },
  },
];

export function OnboardingWizard() {
  const {
    currentStep,
    setCurrentStep,
    updateProgress,
    completeOnboarding,
    progress,
  } = useOnboarding();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [completedStepTitle, setCompletedStepTitle] = useState("");

  // Step 1: Company Information
  const [companyData, setCompanyData] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
    logo: "",
    website: "",
  });

  // Step 2: Client
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Step 3: Basic Settings
  const [settingsData, setSettingsData] = useState({
    category: "",
    taxType: "CGST" as "CGST" | "SGST" | "IGST",
    taxRate: "",
    taxDescription: "",
    paymentMethod: "",
  });

  // Step 4: Product/Service
  const [productData, setProductData] = useState({
    type: "" as "product" | "service",
    name: "",
    description: "",
    price: "",
    unitType: "",
    hsnCode: "",
    applyTax: false,
  });

  const [taxRates, setTaxRates] = useState<any[]>([]);

  // Load existing data when component mounts or step changes
  useEffect(() => {
    loadExistingData();
  }, [currentStep]);

  // Validate progress against real data on mount
  useEffect(() => {
    validateProgressWithRealData();
  }, []);

  const validateProgressWithRealData = async () => {
    try {
      const [company, clients, categories, taxRates, paymentMethods, items] =
        await Promise.all([
          api.company.get().catch(() => null),
          api.clients.getAll().catch(() => []),
          api.paymentCategories.getAll().catch(() => []),
          api.taxRates.getAll().catch(() => []),
          api.paymentMethods.getAll().catch(() => []),
          api.items.getAll().catch(() => []),
        ]);

      // Update progress based on real data
      if (company?.companyName) updateProgress("companyInfo", true);
      // if (clients?.length > 0) updateProgress("clients", true);
      if (
        categories?.length > 0 ||
        taxRates?.length > 0 ||
        paymentMethods?.length > 0
      ) {
        updateProgress("basicSettings", true);
      }
      if (items?.length > 0) updateProgress("products", true);
    } catch (err) {
      console.error("Failed to validate progress:", err);
    }
  };

  const loadExistingData = async () => {
    try {
      switch (currentStep) {
        case 1:
          // Load company data
          const companyInfo = await api.company.get();
          if (companyInfo) {
            setCompanyData({
              companyName: companyInfo.companyName || "",
              email: companyInfo.email || "",
              phone: companyInfo.phone || "",
              address: companyInfo.address || "",
              city: companyInfo.city || "",
              state: companyInfo.state || "",
              pincode: companyInfo.pincode || "",
              gstin: companyInfo.gstin || "",
              pan: companyInfo.pan || "",
              logo: companyInfo.logo || "",
              website: companyInfo.website || "",
            });
          }
          break;
        case 3:
          // Load tax rates for reference
          const rates = await api.taxRates.getAll();
          setTaxRates(Array.isArray(rates) ? rates : []);
          break;
      }
    } catch (err) {
      console.error("Failed to load existing data:", err);
    }
  };

  const loadTaxRates = async () => {
    try {
      const rates = await api.taxRates.getAll();
      setTaxRates(Array.isArray(rates) ? rates : []);
    } catch (err) {
      console.error("Failed to load tax rates:", err);
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      switch (currentStep) {
        case 1:
          await saveCompanyInfo();
          break;
        // case 2:
        //   await saveClient();
        //   break;
        case 2:
          await saveSettings();
          break;
        case 3:
          await saveProduct();
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyInfo = async () => {
    if (!companyData.companyName || !companyData.email) {
      toast({
        title: "Required",
        description: "Company name and email are required",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format if provided
    if (companyData.phone) {
      const phoneError = validatePhoneNumber(companyData.phone);
      if (phoneError) {
        toast({
          title: "Invalid Phone",
          description: phoneError,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const existing = await api.company.get();
      if (existing) {
        await api.company.update(companyData);
      } else {
        await api.company.create({ ...companyData, userId: user?.id });
      }
      updateProgress("companyInfo", true);
      setCompletedStepTitle("Company Information");
      setShowCongrats(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save company information",
        variant: "destructive",
      });
    }
  };

  const saveClient = async () => {
    if (!clientData.name || !clientData.email || !clientData.phone) {
      toast({
        title: "Required",
        description: "Name, email, and phone are required",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    const phoneError = validatePhoneNumber(clientData.phone);
    if (phoneError) {
      toast({
        title: "Invalid Phone",
        description: phoneError,
        variant: "destructive",
      });
      return;
    }

    try {
      // Check for duplicate email and phone
      const allClients = await api.clients.getAll();
      const duplicateEmail = allClients.find(
        (c: any) =>
          c.email.toLowerCase() === clientData.email.toLowerCase() &&
          c.userId === user?.id
      );
      const duplicatePhone = allClients.find(
        (c: any) => c.phone === clientData.phone && c.userId === user?.id
      );

      if (duplicateEmail) {
        toast({
          title: "Duplicate Email",
          description: "A client with this email already exists",
          variant: "destructive",
        });
        return;
      }

      if (duplicatePhone) {
        toast({
          title: "Duplicate Phone",
          description: "A client with this phone number already exists",
          variant: "destructive",
        });
        return;
      }

      await api.clients.create({
        ...clientData,
        userId: user?.id,
        status: "active",
      });
      updateProgress("clients", true);
      setCompletedStepTitle("Client Creation");
      setShowCongrats(true);
      // Clear form
      setClientData({ name: "", email: "", phone: "", address: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive",
      });
    }
  };

  const saveSettings = async () => {
    let anythingSaved = false;

    try {
      // Save category
      if (settingsData.category) {
        await api.paymentCategories.create({
          userId: user?.id,
          name: settingsData.category,
          isEnabled: true,
        });
        anythingSaved = true;
      }

      // Save tax rate
      if (settingsData.taxRate) {
        await api.taxRates.create({
          userId: user?.id,
          type: settingsData.taxType,
          rate: parseFloat(settingsData.taxRate),
          description:
            settingsData.taxDescription || `${settingsData.taxType} Rate`,
          isActive: true,
        });
        anythingSaved = true;
      }

      // Save payment method
      if (settingsData.paymentMethod) {
        await api.paymentMethods.create({
          userId: user?.id,
          name: settingsData.paymentMethod,
          isEnabled: true,
        });
        anythingSaved = true;
      }

      if (anythingSaved) {
        updateProgress("basicSettings", true);
        setCompletedStepTitle("Basic Settings");
        setShowCongrats(true);
        // Clear form
        setSettingsData({
          category: "",
          taxType: "CGST",
          taxRate: "",
          taxDescription: "",
          paymentMethod: "",
        });
      } else {
        toast({
          title: "No Data Entered",
          description: "Please enter at least one setting to continue",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const saveProduct = async () => {
    if (!productData.type || !productData.name || !productData.price) {
      toast({
        title: "Required",
        description: "Type, name, and price are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.items.create({
        ...productData,
        userId: user?.id,
        price: parseFloat(productData.price),
        cgst: 0,
        sgst: 0,
        igst: 0,
        isActive: true,
      });
      updateProgress("products", true);
      setCompletedStepTitle("Products/Services Setup");
      setShowCongrats(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product/service",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    // Allow going back to previous step
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleContinue = () => {
    setShowCongrats(false);
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkipStep = () => {
    // Don't mark as complete when skipping - just move to next step
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  if (currentStep === 0) return null;

  const currentStepData = STEPS[currentStep - 1];
  const StepIcon = currentStepData.icon;
  // Calculate progress based on actual completed steps, not current step number
  const completedCount = Object.values(progress).filter(
    (v) => v === true
  ).length;
  const progressPercent = (completedCount / Object.keys(progress).length) * 100;

  // Check if user can access current step (must complete previous steps)
  const canAccessStep = (step: number): boolean => {
    if (step === 1) return true;
    if (step === 2) return progress.companyInfo;
    if (step === 3) return progress.companyInfo && progress.clients;
    if (step === 4)
      return progress.companyInfo && progress.clients && progress.basicSettings;
    return false;
  };

  return (
    <Dialog open={currentStep > 0} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-[90vw] !w-[90vw] !min-w-[80vw] !h-[90vh] !min-h-[90vh] !max-h-[90vh] !p-0 !gap-0 overflow-hidden flex flex-col rounded-xl"
      >
        <DialogTitle className="sr-only">
          Onboarding Setup - Step {currentStep} of {STEPS.length}:{" "}
          {currentStepData.title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {currentStepData.description}
        </DialogDescription>
        {/* Progress Bar */}
        <div className="px-6 pt-6 pb-3 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <StepIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {STEPS.length}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {Math.round(progressPercent)}% Complete
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Side - Educational Content (45%) - Fixed, No Scroll */}
          <div className="hidden lg:block lg:w-[45%] bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative flex-shrink-0 overflow-y-auto">
            <div className="p-8 lg:p-10 text-white h-full flex flex-col">
              {/* Icon and Title */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
                  <StepIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  {currentStepData.educationalContent?.title}
                </h2>
                <div className="flex gap-2 mt-4">
                  {STEPS.map((step, idx) => (
                    <div
                      key={step.id}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        idx + 1 === currentStep
                          ? "bg-white shadow-lg"
                          : idx + 1 < currentStep
                          ? "bg-white/70"
                          : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <p className="text-white/90 leading-relaxed text-base">
                  {currentStepData.educationalContent?.description}
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-4 flex-1">
                <h3 className="text-lg font-semibold mb-4 text-white/95">
                  Key Benefits:
                </h3>
                {currentStepData.educationalContent?.benefits.map(
                  (benefit, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-start bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/15 transition-all duration-200"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center text-green-900 font-bold text-sm mt-0.5">
                        {benefit.icon}
                      </div>
                      <p className="text-white/95 text-sm leading-relaxed">
                        {benefit.text}
                      </p>
                    </div>
                  )
                )}
              </div>

              {/* Progress Indicator at Bottom */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/80 font-medium">
                    Setup Progress
                  </span>
                  <span className="text-white font-semibold">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-white/70 text-xs mt-2">
                  Step {currentStep} of {STEPS.length} • {4 - currentStep} steps
                  remaining
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form (55%) - Scrollable */}
          <div className="flex-1 overflow-y-auto flex flex-col bg-white">
            <div className="p-6 lg:p-10 max-w-3xl mx-auto w-full flex-1">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600 text-base">
                  {currentStepData.description}
                </p>
              </div>

              <div className="space-y-5">
                {currentStep === 1 && (
                  <>
                    <ImageUpload
                      label="Company Logo"
                      value={companyData.logo}
                      onChange={(value) =>
                        setCompanyData({ ...companyData, logo: value })
                      }
                      description="Upload your company logo"
                      previewClassName="w-24 h-24"
                    />

                    <div>
                      <Label htmlFor="companyName">
                        Company Name <span className="text-red-500">*</span>
                        <InfoTooltip content="Your registered business or company name" />
                      </Label>
                      <Input
                        id="companyName"
                        value={companyData.companyName}
                        onChange={(e) =>
                          setCompanyData({
                            ...companyData,
                            companyName: e.target.value,
                          })
                        }
                        placeholder="Enter company name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">
                          Email <span className="text-red-500">*</span>
                          <InfoTooltip content="Primary email for business communication" />
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={companyData.email}
                          onChange={(e) =>
                            setCompanyData({
                              ...companyData,
                              email: e.target.value,
                            })
                          }
                          placeholder="company@example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">
                          Phone
                          <InfoTooltip content="Contact number for your business" />
                        </Label>
                        <PhoneInput
                          value={companyData.phone}
                          onChange={(value) =>
                            setCompanyData({ ...companyData, phone: value })
                          }
                          placeholder="Enter 10-digit number"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">
                        Address
                        <InfoTooltip content="Complete business address" />
                      </Label>
                      <Textarea
                        id="address"
                        value={companyData.address}
                        onChange={(e) =>
                          setCompanyData({
                            ...companyData,
                            address: e.target.value,
                          })
                        }
                        placeholder="Enter complete address"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={companyData.city}
                          onChange={(e) =>
                            setCompanyData({
                              ...companyData,
                              city: e.target.value,
                            })
                          }
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={companyData.state}
                          onChange={(e) =>
                            setCompanyData({
                              ...companyData,
                              state: e.target.value,
                            })
                          }
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          value={companyData.pincode}
                          onChange={(e) =>
                            setCompanyData({
                              ...companyData,
                              pincode: e.target.value,
                            })
                          }
                          placeholder="123456"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="gstin">
                          GSTIN
                          <InfoTooltip content="GST Identification Number (15 characters)" />
                        </Label>
                        <Input
                          id="gstin"
                          value={companyData.gstin}
                          onChange={(e) =>
                            setCompanyData({
                              ...companyData,
                              gstin: e.target.value,
                            })
                          }
                          placeholder="22ABCDE1234F1Z5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pan">
                          PAN
                          <InfoTooltip content="Permanent Account Number (10 characters)" />
                        </Label>
                        <Input
                          id="pan"
                          value={companyData.pan}
                          onChange={(e) =>
                            setCompanyData({
                              ...companyData,
                              pan: e.target.value,
                            })
                          }
                          placeholder="ABCDE1234F"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={companyData.website}
                        onChange={(e) =>
                          setCompanyData({
                            ...companyData,
                            website: e.target.value,
                          })
                        }
                        placeholder="https://www.example.com"
                      />
                    </div>
                  </>
                )}

                {/* {currentStep === 2 && (
                  <>
                    <div>
                      <Label htmlFor="clientName">
                        Client Name <span className="text-red-500">*</span>
                        <InfoTooltip content="Full name of your customer or vendor" />
                      </Label>
                      <Input
                        id="clientName"
                        value={clientData.name}
                        onChange={(e) =>
                          setClientData({ ...clientData, name: e.target.value })
                        }
                        placeholder="Enter client name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientEmail">
                        Email <span className="text-red-500">*</span>
                        <InfoTooltip content="Client's email address for invoicing" />
                      </Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={clientData.email}
                        onChange={(e) =>
                          setClientData({
                            ...clientData,
                            email: e.target.value,
                          })
                        }
                        placeholder="client@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientPhone">
                        Phone <span className="text-red-500">*</span>
                        <InfoTooltip content="Contact number (10 digits)" />
                      </Label>
                      <PhoneInput
                        value={clientData.phone}
                        onChange={(value) =>
                          setClientData({ ...clientData, phone: value })
                        }
                        placeholder="Enter 10-digit number"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientAddress">
                        Address
                        <InfoTooltip content="Client's billing address" />
                      </Label>
                      <Textarea
                        id="clientAddress"
                        value={clientData.address}
                        onChange={(e) =>
                          setClientData({
                            ...clientData,
                            address: e.target.value,
                          })
                        }
                        placeholder="Enter client address"
                        rows={3}
                      />
                    </div>
                  </>
                )} */}

                {currentStep === 2 && (
                  <>
                    <div>
                      <Label htmlFor="category">
                        Payment Category
                        <InfoTooltip content="E.g., Salary, Rent, Utilities" />
                      </Label>
                      <Input
                        id="category"
                        value={settingsData.category}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            category: e.target.value,
                          })
                        }
                        placeholder="Enter category name"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Tax Configuration</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="taxType">Tax Type</Label>
                          <Select
                            value={settingsData.taxType}
                            onValueChange={(value: any) =>
                              setSettingsData({
                                ...settingsData,
                                taxType: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CGST">CGST</SelectItem>
                              <SelectItem value="SGST">SGST</SelectItem>
                              <SelectItem value="IGST">IGST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="taxRate">
                            Tax Rate (%)
                            <InfoTooltip content="E.g., 5, 12, 18, 28" />
                          </Label>
                          <Input
                            id="taxRate"
                            type="number"
                            step="0.01"
                            value={settingsData.taxRate}
                            onChange={(e) =>
                              setSettingsData({
                                ...settingsData,
                                taxRate: e.target.value,
                              })
                            }
                            placeholder="18"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <Label htmlFor="taxDescription">Description</Label>
                        <Input
                          id="taxDescription"
                          value={settingsData.taxDescription}
                          onChange={(e) =>
                            setSettingsData({
                              ...settingsData,
                              taxDescription: e.target.value,
                            })
                          }
                          placeholder="E.g., Standard rate for goods"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label htmlFor="paymentMethod">
                        Payment Method
                        <InfoTooltip content="E.g., Cash, UPI, Bank Transfer" />
                      </Label>
                      <Input
                        id="paymentMethod"
                        value={settingsData.paymentMethod}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            paymentMethod: e.target.value,
                          })
                        }
                        placeholder="Enter payment method"
                      />
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <div>
                      <Label htmlFor="productType">
                        Type <span className="text-red-500">*</span>
                        <InfoTooltip content="Choose Product for physical items, Service for offerings" />
                      </Label>
                      <Select
                        value={productData.type}
                        onValueChange={(value: any) =>
                          setProductData({ ...productData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {productData.type === "product" && (
                      <div>
                        <Label htmlFor="unitType">Unit Type</Label>
                        <Select
                          value={productData.unitType}
                          onValueChange={(value) =>
                            setProductData({ ...productData, unitType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gm">Grams (gm)</SelectItem>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="liters">Liters</SelectItem>
                            <SelectItem value="qty">Quantity (qty)</SelectItem>
                            <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="productName">
                        Name <span className="text-red-500">*</span>
                        <InfoTooltip content="Product or service name" />
                      </Label>
                      <Input
                        id="productName"
                        value={productData.name}
                        onChange={(e) =>
                          setProductData({
                            ...productData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="productDescription">Description</Label>
                      <Textarea
                        id="productDescription"
                        value={productData.description}
                        onChange={(e) =>
                          setProductData({
                            ...productData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter description"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">
                          Price (₹) <span className="text-red-500">*</span>
                          <InfoTooltip content="Selling price per unit" />
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={productData.price}
                          onChange={(e) =>
                            setProductData({
                              ...productData,
                              price: e.target.value,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label htmlFor="hsnCode">
                          HSN Code
                          <InfoTooltip content="Harmonized System of Nomenclature code for tax" />
                        </Label>
                        <Input
                          id="hsnCode"
                          value={productData.hsnCode}
                          onChange={(e) =>
                            setProductData({
                              ...productData,
                              hsnCode: e.target.value,
                            })
                          }
                          placeholder="Enter HSN code"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="applyTax"
                        checked={productData.applyTax}
                        onCheckedChange={(checked) =>
                          setProductData({
                            ...productData,
                            applyTax: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="applyTax" className="cursor-pointer">
                        Apply Tax
                      </Label>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-white px-6 lg:px-10 py-2 flex items-center justify-between flex-shrink-0 shadow-lg">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="text-gray-700 border-gray-300 hover:bg-gray-50 px-6"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleSkipStep}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-6"
            >
              Skip This Step
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  {currentStep === 4 ? "Complete Setup" : "Continue"}
                  {currentStep === 4 ? (
                    <Check className="h-5 w-5 ml-2" />
                  ) : (
                    <ChevronRight className="h-5 w-5 ml-2" />
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Congratulations Modal */}
      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">
            Congratulations - {completedStepTitle} Complete
          </DialogTitle>
          <DialogDescription className="sr-only">
            You have successfully completed {completedStepTitle}.{" "}
            {currentStep < 3
              ? "Continue to the next step."
              : "Your setup is complete!"}
          </DialogDescription>
          <div className="relative">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 opacity-10 animate-pulse"></div>

            <div className="relative p-8 text-center">
              {/* Trophy Animation */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4 animate-bounce shadow-lg">
                <Trophy className="h-10 w-10 text-white" />
              </div>

              {/* Sparkles */}
              <div className="flex justify-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
                <PartyPopper
                  className="h-6 w-6 text-purple-500 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <Sparkles
                  className="h-6 w-6 text-pink-500 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>

              {/* Congratulations Text */}
              <h2 className="text-3xl font-bold text-gray-900 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                Congratulations! 🎉
              </h2>

              <p
                className="text-lg text-gray-700 mb-1 font-medium animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: "0.1s" }}
              >
                {completedStepTitle} Complete!
              </p>

              <p
                className="text-sm text-gray-600 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: "0.2s" }}
              >
                {currentStep < 3
                  ? "Great job! You're making excellent progress. Let's continue to the next step."
                  : "Amazing! You've completed the entire setup process. Your account is ready to go!"}
              </p>

              {/* Progress Info */}
              <div
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 animate-in fade-in zoom-in duration-500"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                  <Check className="h-5 w-5 text-green-600" />
                  Step {currentStep} of {STEPS.length} Completed
                </div>
                <div className="mt-2">
                  <Progress value={progressPercent} className="h-2" />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {Math.round(progressPercent)}% of setup complete
                </p>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-6 text-lg shadow-lg animate-in fade-in zoom-in duration-500"
                style={{ animationDelay: "0.4s" }}
              >
                {currentStep < 3 ? (
                  <>
                    Continue to Next Step
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                ) : (
                  <>
                    Finish & Start Using App
                    <Sparkles className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
