"use client";

import { useState } from "react";
import { logEvent } from '@/lib/analytics';
import { Phone, MessageCircle, Copy, Check, ExternalLink } from "lucide-react";
import { slugify } from '@/lib/slug';

export interface ContactData {
  phone?: string | null;
  whatsapp?: string | null;
}

export interface AdContactInfoProps {
  contact?: string | ContactData | null;
  adId?: string;
  adTitle?: string;
  shortCode?: string | null;
  label?: string;
  showIcons?: boolean;
  clickable?: boolean;
  compact?: boolean;
  className?: string;
}

export default function AdContactInfo({
  contact,
  adId,
  adTitle,
  shortCode,
  label = "Contact:",
  showIcons = true,
  clickable = true,
  compact = true,
  className = ""
}: AdContactInfoProps) {
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<string | null>(null);

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Format as +XX XXX XXX XXXX or similar
    if (cleaned.length >= 10) {
      const countryCode = cleaned.slice(0, 2);
      const areaCode = cleaned.slice(2, 5);
      const exchange = cleaned.slice(5, 8);
      const number = cleaned.slice(8, 12);

      if (cleaned.length === 12) {
        return `+${countryCode} ${areaCode} ${exchange} ${number}`;
      } else if (cleaned.length === 10) {
        return `+${countryCode} ${areaCode} ${exchange} ${number}`;
      }
    }

    // Return original if we can't format it
    return phone;
  };

  // Extract contact information
  const getContactInfo = () => {
    if (typeof contact === "string") {
      return { phone: contact, whatsapp: null };
    }
    if (contact && typeof contact === "object") {
      return {
        phone: contact.phone || null,
        whatsapp: contact.whatsapp || null
      };
    }
    return { phone: null, whatsapp: null };
  };

  const { phone, whatsapp } = getContactInfo();

  // Don't render if no contact info
  if (!phone && !whatsapp) return null;

  const copyToClipboard = async (text: string, type: 'phone' | 'whatsapp') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'phone') {
        setCopiedPhone(text);
        setTimeout(() => setCopiedPhone(null), 2000);
      } else {
        setCopiedWhatsApp(text);
        setTimeout(() => setCopiedWhatsApp(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const makeCall = (number: string) => {
    if (clickable) {
      try { logEvent({ eventType: 'contact_click_phone', adId, metadata: { numberMasked: number.slice(0, 4) + '****' } }); } catch {}
      window.open(`tel:${number}`, '_self');
    }
  };

  const openWhatsApp = (number: string) => {
    if (clickable) {
      // Remove any non-digit characters for WhatsApp URL
      const cleanNumber = number.replace(/\D/g, '');
      try { logEvent({ eventType: 'contact_click_whatsapp', adId, metadata: { numberMasked: cleanNumber.slice(0, 4) + '****' } }); } catch {}
      const codePart = (shortCode && String(shortCode).trim()) ? ` (Code: ${String(shortCode).trim()})` : (adId ? ` (Code: #${String(adId).slice(0, 6)})` : '');
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const slug = adTitle ? slugify(adTitle) : '';
      const pageUrl = (origin && adId) ? `${origin}/ad/${adId}/${slug}` : (typeof window !== 'undefined' ? window.location.href : '');
      const title = (adTitle && adTitle.trim()) ? `"${adTitle.trim()}"` : 'your property listing';
      const message = `Hi! I'm interested in ${title}${codePart}. Is it still available?\n\nLink: ${pageUrl}`;
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank');
    }
  };

  const ContactButton = ({
    number,
    type,
    icon: Icon,
    label: buttonLabel,
    color,
    action,
    copied
  }: {
    number: string;
    type: 'phone' | 'whatsapp';
    icon: any;
    label: string;
    color: string;
    action: () => void;
    copied: boolean;
  }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={action}
        className={`
          ${compact ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base'}
          ${color}
          ${clickable ? 'hover:scale-105 active:scale-95' : ''}
          transition-all duration-200
          rounded-lg border border-gray-200
          flex items-center gap-2
          ${clickable ? 'cursor-pointer' : 'cursor-default'}
          ${!clickable ? 'opacity-60' : 'hover:shadow-md'}
          group
        `}
        title={clickable ? `${buttonLabel}: ${number}` : number}
      >
        {showIcons && (
          <Icon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} ${clickable ? 'group-hover:scale-110' : ''} transition-transform duration-200`} />
        )}
        <span className="font-medium">{formatPhoneNumber(number)}</span>
      </button>

      {clickable && (
        <button
          onClick={() => copyToClipboard(number, type)}
          className={`
            ${compact ? 'p-1.5' : 'p-2'}
            rounded-md border border-gray-200
            hover:bg-gray-50 active:bg-gray-100
            transition-colors duration-200
            ${copied ? 'bg-green-50 border-green-200' : ''}
          `}
          title={`Copy ${buttonLabel.toLowerCase()}`}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 text-gray-500 hover:text-gray-700" />
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className={`pt-3 space-y-3 ${className}`}>
      {label && (
        <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          {label}
        </div>
      )}

      <div className={`flex flex-col md:flex-row gap-2`}>
        {phone && (
          <ContactButton
            number={phone}
            type="phone"
            icon={Phone}
            label="Phone"
            color="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
            action={() => makeCall(phone)}
            copied={copiedPhone === phone}
          />
        )}

        {whatsapp && (
          <ContactButton
            number={whatsapp}
            type="whatsapp"
            icon={MessageCircle}
            label="WhatsApp"
            color="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            action={() => openWhatsApp(whatsapp)}
            copied={copiedWhatsApp === whatsapp}
          />
        )}
      </div>

    </div>
  );
}


