"use client";

import { Phone, MessageCircle } from "lucide-react";
import PhoneField from "./PhoneField";
import { useConfig } from "@/app/config-context";
import { country_codes } from "@/lib/currencyUtils";

export interface ContactInfoSectionProps {
  phone: string;
  whatsapp: string;
  onPhoneChange: (v: string) => void;
  onWhatsappChange: (v: string) => void;
  requiredPhone?: boolean;
  phonePlaceholder?: string;
  whatsappPlaceholder?: string;
  title?: string;
}

export default function ContactInfoSection({ phone, whatsapp, onPhoneChange, onWhatsappChange, requiredPhone = true, phonePlaceholder = "+94 77 123 4567", whatsappPlaceholder = "+94 77 123 4567", title = "Contact Information" }: ContactInfoSectionProps) {
  const { country } = useConfig();
  const countryCode = country_codes[country as keyof typeof country_codes];
  return (
    <div className="bg-indigo-50 rounded-xl p-4 md:p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
        <Phone className="h-5 w-5 text-indigo-600" />
        {title}
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PhoneField
          label="Contact Phone"
          value={phone}
          onChange={onPhoneChange}
          placeholder={phonePlaceholder}
          required={requiredPhone}
          leftIcon={<Phone className="h-4 w-4" />}
          defaultCountry={countryCode}
        />
        <PhoneField
          label="WhatsApp"
          value={whatsapp}
          onChange={onWhatsappChange}
          placeholder={whatsappPlaceholder}
          required={false}
          leftIcon={<MessageCircle className="h-4 w-4" />}
          defaultCountry={countryCode}
        />
      </div>
    </div>
  );
}


