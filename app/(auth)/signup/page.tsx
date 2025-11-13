"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PhoneInput, validatePhoneNumber } from "@/components/ui/phone-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  Check,
  Zap,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { SubscriptionPlan } from "@/lib/data-store";
import { FeaturesSidebar } from "@/components/auth/features-sidebar";
import { tokenStorage } from "@/lib/token-storage";

export default function SignUpPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [emailDebounceTimer, setEmailDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [phoneDebounceTimer, setPhoneDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [checkedEmails, setCheckedEmails] = useState<Map<string, boolean>>(new Map());
  const [checkedPhones, setCheckedPhones] = useState<Map<string, boolean>>(new Map());
  const router = useRouter();

  // Clear any existing sessions when signup page loads
  useEffect(() => {
    // Clear tokens and storage on initial load
    const clearExistingSessions = async () => {
      try {
        // Only clear if not coming back from payment
        const params = new URLSearchParams(window.location.search);
        const paymentStatus = params.get("payment");
        
        if (paymentStatus !== "success") {
          // Clear tokens
          tokenStorage.clearTokens();
          
          // Call logout API to clear cookies
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Error clearing sessions:", err);
      }
    };
    
    clearExistingSessions();
  }, []);

  // Restore signup state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem("signup_state");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.step) setStep(state.step);
        if (state.formData) setFormData(state.formData);
        if (state.selectedPlan) setSelectedPlan(state.selectedPlan);
        if (state.billingCycle) setBillingCycle(state.billingCycle);
      } catch (err) {
        console.error("Failed to restore signup state:", err);
      }
    }
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await api.subscriptionPlans
          .getAll()
          .then((plans) => plans.filter((p: { isActive: any }) => p.isActive));
        setAvailablePlans(plans);
        if (plans.length > 0) {
          setSelectedPlan(plans[0]._id || plans[0].id);
        }
      } catch (error) {
        console.error("Failed to load plans:", error);
      }
    };
    loadPlans();
  }, []);

  // Real-time validation functions
  const validateName = (value: string) => {
    if (!value.trim()) {
      return "Name is required";
    }
    if (value.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  // Using validatePhoneNumber from phone-input component

  // Async validation for email availability with caching
  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    if (!email || validateEmail(email)) return false;

    const normalizedEmail = email.toLowerCase().trim();
    
    // Check cache first
    if (checkedEmails.has(normalizedEmail)) {
      const exists = checkedEmails.get(normalizedEmail)!;
      if (exists) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "This email is already registered. Would you like to login instead?",
        }));
        setError(
          <div className="flex items-center justify-between">
            <span>Email already registered</span>
            <Link href="/signin" className="text-blue-600 hover:underline font-medium">
              Go to Login
            </Link>
          </div> as any
        );
      } else {
        setFieldErrors((prev) => ({ ...prev, email: "" }));
        setError("");
      }
      return exists;
    }

    setCheckingEmail(true);
    try {
      const response = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json();

      // Cache the result
      setCheckedEmails((prev) => new Map(prev).set(normalizedEmail, data.emailExists));

      if (data.emailExists) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "This email is already registered. Would you like to login instead?",
        }));
        setError(
          <div className="flex items-center justify-between">
            <span>Email already registered</span>
            <Link href="/signin" className="text-blue-600 hover:underline font-medium">
              Go to Login
            </Link>
          </div> as any
        );
        return true; // Email exists
      } else {
        setFieldErrors((prev) => ({ ...prev, email: "" }));
        setError("");
        return false; // Email available
      }
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  // Async validation for phone availability with caching
  const checkPhoneAvailability = async (phone: string): Promise<boolean> => {
    if (!phone || validatePhoneNumber(phone)) return false;

    const normalizedPhone = phone.trim();
    
    // Check cache first
    if (checkedPhones.has(normalizedPhone)) {
      const exists = checkedPhones.get(normalizedPhone)!;
      if (exists) {
        setFieldErrors((prev) => ({
          ...prev,
          phone: "This phone number is already registered. Would you like to login instead?",
        }));
        setError(
          <div className="flex items-center justify-between">
            <span>Phone already registered</span>
            <Link href="/signin" className="text-blue-600 hover:underline font-medium">
              Go to Login
            </Link>
          </div> as any
        );
      } else {
        setFieldErrors((prev) => ({ ...prev, phone: "" }));
        setError("");
      }
      return exists;
    }

    setCheckingPhone(true);
    try {
      const response = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await response.json();

      // Cache the result
      setCheckedPhones((prev) => new Map(prev).set(normalizedPhone, data.phoneExists));

      if (data.phoneExists) {
        setFieldErrors((prev) => ({
          ...prev,
          phone: "This phone number is already registered. Would you like to login instead?",
        }));
        setError(
          <div className="flex items-center justify-between">
            <span>Phone already registered</span>
            <Link href="/signin" className="text-blue-600 hover:underline font-medium">
              Go to Login
            </Link>
          </div> as any
        );
        return true; // Phone exists
      } else {
        setFieldErrors((prev) => ({ ...prev, phone: "" }));
        setError("");
        return false; // Phone available
      }
    } catch (error) {
      console.error("Error checking phone:", error);
      return false;
    } finally {
      setCheckingPhone(false);
    }
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      return "Please confirm your password";
    }
    if (value !== formData.password) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleContinueToPlans = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate all fields
      const errors = {
        name: validateName(formData.name),
        email: validateEmail(formData.email),
        phone: validatePhoneNumber(formData.phone),
        password: validatePassword(formData.password),
        confirmPassword: validateConfirmPassword(formData.confirmPassword),
      };

      setFieldErrors(errors);

      // Check if there are any basic validation errors
      if (Object.values(errors).some((error) => error !== "")) {
        setError("Please fix the errors above");
        return;
      }

      // Check email and phone availability
      const emailExists = await checkEmailAvailability(formData.email);
      const phoneExists = formData.phone
        ? await checkPhoneAvailability(formData.phone)
        : false;

      if (emailExists || phoneExists) {
        setError("Please fix the errors above");
        return;
      }

      // Save state to sessionStorage before moving to step 2
      sessionStorage.setItem(
        "signup_state",
        JSON.stringify({
          step: 2,
          formData,
          selectedPlan,
          billingCycle,
        })
      );

      // Move to step 2
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!selectedPlan) {
        setError("Please select a subscription plan");
        return;
      }

      // Find selected plan
      const plan = availablePlans.find((p) => (p._id || p.id) === selectedPlan);
      if (!plan) {
        setError("Selected plan not found");
        return;
      }

      // Store signup data in localStorage for use after payment
      const signupData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || "",
        address: formData.address || "",
        subscriptionPlanId: selectedPlan,
      };
      localStorage.setItem("pending_signup", JSON.stringify(signupData));

      // Calculate the final amount based on billing cycle
      const finalAmount =
        billingCycle === "yearly" ? plan.price * 12 : plan.price;

      // Save current state to sessionStorage so we can return to step 2
      sessionStorage.setItem(
        "signup_state",
        JSON.stringify({
          step: 2,
          formData,
          selectedPlan,
          billingCycle,
        })
      );

      // Redirect to payment page with selected plan
      router.push(
        `/payment?plan=${plan.name.toLowerCase()}&planId=${selectedPlan}&email=${encodeURIComponent(
          formData.email
        )}&company=${encodeURIComponent(
          formData.name
        )}&amount=${finalAmount}&billingCycle=${billingCycle}`
      );
    } catch (err: any) {
      setError(err?.message || "Failed to process signup. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };
  // ✅ Trigger auto signup after payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");

    if (paymentStatus === "success") {
      completeSignup();
    }
  }, []);

  const completeSignup = async () => {
    const stored = localStorage.getItem("pending_signup");

    if (!stored) {
      setError("Signup data missing. Please signup again.");
      return;
    }

    const signupData = JSON.parse(stored);

    try {
      // Clear any existing sessions and cookies before signup
      tokenStorage.clearTokens();
      
      // Clear all localStorage except pending_signup
      const pendingSignup = localStorage.getItem("pending_signup");
      localStorage.clear();
      if (pendingSignup) {
        localStorage.setItem("pending_signup", pendingSignup);
      }
      
      // Clear all sessionStorage
      sessionStorage.clear();
      
      // Clear cookies by calling logout API
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (logoutErr) {
        console.error("Error clearing session:", logoutErr);
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Signup failed");
        return;
      }

      // Clean up signup data and session storage
      localStorage.removeItem("pending_signup");
      sessionStorage.removeItem("signup_state");
      
      // Redirect to signin with registered flag
      window.location.href = "/signin?registered=true";
    } catch (err) {
      console.error("Signup error:", err);
      setError("Signup failed. Try again.");
    }
  };

  // Step 1: Account Details
  if (step === 1) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Features (Fixed) */}
        <div
          className="hidden lg:flex lg:w-1/2 bg-cover bg-center p-10 flex-col justify-between fixed left-0 top-0 h-screen"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop')",
          }}
        >
          {/* White Overlay with Blur */}
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="mb-8">
                <img
                  src="/prantek-logo.png"
                  alt="Prantek Academy"
                  className="h-16 w-auto"
                />
              </div>

              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
                    Complete Business Management Solution
                  </h1>
                  <p className="text-gray-700 text-base">
                    Experience all premium features free for 14 days.
                  </p>
                </div>

                {/* Feature List */}
                <div className="space-y-3 mt-8">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold text-base mb-0.5">
                        14-Day Free Trial
                      </h3>
                      <p className="text-gray-600 text-xs">
                        Get full access to all features. Billing starts only
                        after trial ends.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold text-base mb-0.5">
                        Financial Management
                      </h3>
                      <p className="text-gray-600 text-xs">
                        Track income, expenses, quotations, receipts, and
                        payments in one place.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold text-base mb-0.5">
                        Invoice & Payment Tracking
                      </h3>
                      <p className="text-gray-600 text-xs">
                        Create professional invoices and track payments with
                        automated reminders.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold text-base mb-0.5">
                        Asset Management
                      </h3>
                      <p className="text-gray-600 text-xs">
                        Monitor and manage all your business assets with
                        maintenance tracking.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold text-base mb-0.5">
                        Real-time Reports
                      </h3>
                      <p className="text-gray-600 text-xs">
                        Generate detailed financial reports and insights
                        instantly.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold text-base mb-0.5">
                        Multi-location Support
                      </h3>
                      <p className="text-gray-600 text-xs">
                        Manage multiple business locations from a single
                        dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold text-base mb-0.5">
                        Team Collaboration
                      </h3>
                      <p className="text-gray-600 text-xs">
                        Role-based access control for your team members with
                        custom permissions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form (Scrollable) */}
        <div className="w-full lg:w-1/2 lg:ml-[50%] overflow-y-auto bg-white">
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md py-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                    Step 1 of 2
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Create Your Account
                </h2>
                <p className="text-sm text-gray-600">
                  Fill in your details to start your free 14-day trial
                </p>
              </div>
              <form onSubmit={handleContinueToPlans} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-xs font-medium text-gray-700"
                  >
                    Company Name / Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, name: value });
                      setFieldErrors({
                        ...fieldErrors,
                        name: validateName(value),
                      });
                    }}
                    onBlur={(e) => {
                      setFieldErrors({
                        ...fieldErrors,
                        name: validateName(e.target.value),
                      });
                    }}
                    required
                    className={`h-10 ${
                      fieldErrors.name
                        ? "border-red-500 focus-visible:ring-red-500/20"
                        : ""
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium text-gray-700"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, email: value });
                        const error = validateEmail(value);
                        setFieldErrors({ ...fieldErrors, email: error });

                        // Clear existing timer
                        if (emailDebounceTimer)
                          clearTimeout(emailDebounceTimer);

                        // Only check availability if basic validation passes
                        if (!error && value) {
                          const timer = setTimeout(() => {
                            checkEmailAvailability(value);
                          }, 500); // 500ms debounce - faster response
                          setEmailDebounceTimer(timer);
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const error = validateEmail(value);
                        setFieldErrors({ ...fieldErrors, email: error });
                        if (!error && value) {
                          checkEmailAvailability(value);
                        }
                      }}
                      required
                      className={`h-10 ${
                        fieldErrors.email || checkingEmail
                          ? "border-red-500 focus-visible:ring-red-500/20"
                          : ""
                      }`}
                    />
                    {checkingEmail && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        Checking...
                      </span>
                    )}
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="phone"
                    className="text-xs font-medium text-gray-700"
                  >
                    Phone (Optional)
                  </Label>
                  <div className="relative">
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => {
                        setFormData({ ...formData, phone: value });
                        const error = validatePhoneNumber(value);
                        setFieldErrors({ ...fieldErrors, phone: error });

                        // Clear existing timer
                        if (phoneDebounceTimer)
                          clearTimeout(phoneDebounceTimer);

                        // Only check availability if basic validation passes
                        if (!error && value) {
                          const timer = setTimeout(() => {
                            checkPhoneAvailability(value);
                          }, 500); // 500ms debounce - faster response
                          setPhoneDebounceTimer(timer);
                        }
                      }}
                      onBlur={() => {
                        const error = validatePhoneNumber(formData.phone);
                        setFieldErrors({ ...fieldErrors, phone: error });
                        if (!error && formData.phone) {
                          checkPhoneAvailability(formData.phone);
                        }
                      }}
                      error={!!fieldErrors.phone || checkingPhone}
                      placeholder="Enter 10-digit number"
                    />
                    {checkingPhone && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        Checking...
                      </span>
                    )}
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium text-gray-700"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, password: value });
                        setFieldErrors({
                          ...fieldErrors,
                          password: validatePassword(value),
                          confirmPassword: formData.confirmPassword
                            ? validateConfirmPassword(formData.confirmPassword)
                            : "",
                        });
                      }}
                      onBlur={(e) => {
                        setFieldErrors({
                          ...fieldErrors,
                          password: validatePassword(e.target.value),
                        });
                      }}
                      required
                      minLength={6}
                      className={`pr-10 h-10 ${
                        fieldErrors.password
                          ? "border-red-500 focus-visible:ring-red-500/20"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs font-medium text-gray-700"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          confirmPassword: value,
                        });
                        setFieldErrors({
                          ...fieldErrors,
                          confirmPassword: validateConfirmPassword(value),
                        });
                      }}
                      onBlur={(e) => {
                        setFieldErrors({
                          ...fieldErrors,
                          confirmPassword: validateConfirmPassword(
                            e.target.value
                          ),
                        });
                      }}
                      required
                      className={`pr-10 h-10 ${
                        fieldErrors.confirmPassword
                          ? "border-red-500 focus-visible:ring-red-500/20"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || checkingEmail || checkingPhone}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold mt-5"
                >
                  {loading ? "Validating..." : "Continue to Plan Selection"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                <div className="text-center text-xs text-gray-600 mt-3">
                  Already have an account?{" "}
                  <Link
                    href="/signin"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Plan Selection
  // Find the selected plan details
  const currentSelectedPlan = availablePlans.find(
    (p) => (p._id || p.id) === selectedPlan
  );

  return (
    <div className="min-h-screen flex">
      <FeaturesSidebar
        selectedPlan={
          currentSelectedPlan
            ? {
                name: currentSelectedPlan.name,
                price: currentSelectedPlan.price,
                billingCycle: currentSelectedPlan.billingCycle,
                features: currentSelectedPlan.features,
              }
            : null
        }
      />

      {/* Right Side - Plan Selection (Scrollable) */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] overflow-y-auto bg-gray-50">
        <div className="min-h-screen p-6 lg:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => setStep(1)}
                className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
              >
                ← Back
              </button>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  Step 2 of 2
                </Badge>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Choose Your Plan
              </h2>
              <p className="text-gray-600 mb-4">
                Start with a <strong>14-day free trial</strong>. After the
                trial, billing will automatically start based on your selected
                plan.
              </p>

              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl p-1 w-fit mx-auto">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    billingCycle === "monthly"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all relative ${
                    billingCycle === "yearly"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {availablePlans.map((plan) => {
                  const isSelected = selectedPlan === (plan._id || plan.id);
                  const isPopular = plan.name === "Premium";

                  // Calculate price based on billing cycle
                  const displayPrice =
                    billingCycle === "yearly" ? plan.price * 12 : plan.price;
                  const savingsAmount =
                    billingCycle === "yearly"
                      ? Math.round(plan.price * 12 * 0.17) // 17% savings
                      : 0;
                  const discountedYearlyPrice =
                    billingCycle === "yearly"
                      ? plan.price * 12 - savingsAmount
                      : displayPrice;

                  return (
                    <Card
                      key={plan.id}
                      className={`relative cursor-pointer overflow-hidden transition-all duration-300 flex flex-col max-h-[200px] md:max-h-[260px] xl:max-h-[270px] ${
                        isSelected
                          ? "border-2 border-blue-600 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50"
                          : isPopular
                          ? "border-2 border-amber-400 shadow-lg bg-gradient-to-br from-amber-50 to-white hover:shadow-xl"
                          : "border border-gray-300 bg-white hover:border-blue-300 hover:shadow-lg"
                      }`}
                      onClick={() => setSelectedPlan(plan._id || plan.id)}
                    >
                      {/* Corner Trial Badge */}
                      <div className="absolute top-0 right-0">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl shadow-md">
                          14-DAY TRIAL
                        </div>
                      </div>

                      {/* Popular Ribbon */}
                      {isPopular && (
                        <div className="absolute top-3 -left-1">
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-4 py-0.5 shadow-md">
                            POPULAR
                          </div>
                        </div>
                      )}

                      <CardContent className="p-6 md:p-8 flex flex-col justify-center items-center h-full">
                        {/* Plan Name with Selection Indicator */}
                        <div className="text-center mb-4 md:mb-6 pt-6">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <h3
                              className={`text-lg md:text-xl font-bold ${
                                isSelected
                                  ? "text-blue-600"
                                  : isPopular
                                  ? "text-amber-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {plan.name}
                            </h3>
                          </div>
                        </div>

                        {/* Price - Responsive sizing */}
                        <div className="text-center mb-6">
                          {billingCycle === "yearly" && (
                            <div className="mb-2">
                              <span className="text-sm line-through text-gray-400">
                                ₹{displayPrice.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline justify-center gap-1 mb-2">
                            <span className="text-lg md:text-xl font-semibold text-gray-600">
                              ₹
                            </span>
                            <span
                              className={`text-4xl md:text-5xl font-bold ${
                                isSelected
                                  ? "text-blue-600"
                                  : isPopular
                                  ? "text-amber-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {(billingCycle === "yearly"
                                ? discountedYearlyPrice
                                : plan.price
                              ).toLocaleString()}
                            </span>
                          </div>
                          {billingCycle === "yearly" ? (
                            <>
                              <p className="text-sm text-gray-500 mb-1">
                                per year
                              </p>
                              <p className="text-sm text-green-600 font-semibold">
                                ₹{Math.round(discountedYearlyPrice / 12)}/month
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">per month</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                disabled={loading || !selectedPlan}
              >
                {loading ? "Processing..." : "Start My Free Trial"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-center text-xs text-gray-500 mt-4">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
