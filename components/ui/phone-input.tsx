"use client";

import { useState } from "react";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
  error?: boolean;
}

const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
];

export function PhoneInput({
  value,
  onChange,
  onBlur,
  className = "",
  required = false,
  placeholder = "Enter 10-digit number",
  error = false,
}: PhoneInputProps) {
  // Parse existing value to extract country code and number
  const parsePhoneNumber = (phoneValue: string) => {
    if (!phoneValue) return { countryCode: "+91", number: "" };

    // Check if value starts with a country code
    for (const country of COUNTRY_CODES) {
      if (phoneValue.startsWith(country.code)) {
        const number = phoneValue.slice(country.code.length).trim();
        return { countryCode: country.code, number };
      }
    }

    // If no country code found, assume it's just a number with default +91
    return { countryCode: "+91", number: phoneValue };
  };

  const { countryCode: initialCode, number: initialNumber } =
    parsePhoneNumber(value);
  const [countryCode, setCountryCode] = useState(initialCode);
  const [phoneNumber, setPhoneNumber] = useState(initialNumber);

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    onChange(`${newCode}${phoneNumber}`);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 10 digits
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(value);
    onChange(`${countryCode}${value}`);
  };

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={handleCountryCodeChange}>
        <SelectTrigger className={`w-[68px] ${error ? "border-red-500" : ""}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.flag} {country.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        className={`flex-1 ${error ? "border-red-500" : ""} ${className}`}
        maxLength={10}
      />
    </div>
  );
}

export function validatePhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove country code to check the number
  let number = phone;
  for (const country of COUNTRY_CODES) {
    if (phone.startsWith(country.code)) {
      number = phone.slice(country.code.length).trim();
      break;
    }
  }

  // Check if it's exactly 10 digits
  if (!/^\d{10}$/.test(number)) {
    return "Phone number must be exactly 10 digits";
  }

  return "";
}
