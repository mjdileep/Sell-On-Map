"use client";

import { Phone, MessageCircle } from "lucide-react";

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
  return (
    <div className="bg-indigo-50 rounded-xl p-4 md:p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
        <Phone className="h-5 w-5 text-indigo-600" />
        {title}
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={phone} onChange={(e) => onPhoneChange(e.target.value)} required={requiredPhone} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder={phonePlaceholder} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp <span className="text-gray-500">(optional)</span></label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={whatsapp} onChange={(e) => onWhatsappChange(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder={whatsappPlaceholder} />
          </div>
        </div>
      </div>
    </div>
  );
}


