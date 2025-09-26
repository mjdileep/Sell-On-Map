"use client";

export interface ContactData {
  phone?: string | null;
  whatsapp?: string | null;
}

export interface AdContactInfoProps {
  contact?: string | ContactData | null;
  label?: string;
}

export default function AdContactInfo({ contact, label = "Contact:" }: AdContactInfoProps) {
  let text = "";
  if (typeof contact === "string") {
    text = contact;
  } else if (contact && (contact.phone || contact.whatsapp)) {
    text = `${contact.phone || ""}${contact.whatsapp ? ` (WhatsApp: ${contact.whatsapp})` : ""}`;
  }
  if (!text) return null;
  return (
    <div className="text-sm text-gray-700"><span className="text-gray-500">{label}</span> {text}</div>
  );
}


