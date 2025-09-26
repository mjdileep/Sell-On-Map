"use client";

import type { ReactNode } from "react";
import ImageUploader from "@/components/ImageUploader";

export interface CreateAdImageSectionProps {
  adId?: string;
  photos: string[];
  onChange: (urls: string[]) => void;
  title?: string;
  helpText?: string;
  icon?: ReactNode;
}

export default function CreateAdImageSection({ adId, photos, onChange, title = "Photos", helpText = "Add high-quality photos to improve engagement.", icon }: CreateAdImageSectionProps) {
  return (
    <div className="bg-indigo-50 rounded-xl p-4 md:p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
        {icon}
        {title}
      </h3>
      {helpText ? (<p className="text-gray-600 mb-4">{helpText}</p>) : null}
      <ImageUploader adId={adId} value={photos} onChange={onChange} />
    </div>
  );
}


