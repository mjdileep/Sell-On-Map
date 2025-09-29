"use client";

import { ReactNode, useMemo } from "react";
import PhoneInput from "react-phone-number-input";

export interface PhoneFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  defaultCountry?: string;
  id?: string;
}

export default function PhoneField({ label, value, onChange, placeholder, required, leftIcon, defaultCountry, id }: PhoneFieldProps) {
  const inputId = useMemo(() => id || `pf_${Math.random().toString(36).slice(2, 8)}`, [id]);

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required ? null : <span className="text-gray-500">(optional)</span>}
      </label>
      <div className="relative">
        {leftIcon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400">
            {leftIcon}
          </span>
        ) : null}
        <PhoneInput
          id={inputId}
          value={value as any}
          onChange={(v) => onChange((v as string) || "")}
          placeholder={placeholder}
          defaultCountry={defaultCountry as any}
          international
          countryCallingCodeEditable={false}
          className={`w-full ${leftIcon ? "pl-10" : "pl-3"} pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white`}
        />
      </div>
    </div>
  );
}


